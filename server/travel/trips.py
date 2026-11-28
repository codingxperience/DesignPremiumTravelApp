import hashlib
import json
import re
from datetime import date, timedelta
from io import BytesIO
from uuid import UUID

from django.db import transaction
from django.utils import timezone
from PIL import Image, ImageOps, UnidentifiedImageError

from .api import Invalid, endpoint, fields, text
from .models import (
    ApprovalCountry,
    Attachment,
    Confirmation,
    FlightTicket,
    Message,
    Trip,
)
from .search import flight_search
from .security import allowance


def owned(request, trip_id, lock=False):
    rows = Trip.objects.select_for_update() if lock else Trip.objects
    trip = rows.filter(pk=trip_id, owner=request.actor).first()
    if not trip:
        raise Invalid("Request unavailable.", 404)
    return trip


def summary(trip):
    return {
        "id": str(trip.id),
        "service": trip.service,
        "destination": trip.destination,
        "departure": trip.departure.isoformat(),
        "travellers": trip.travellers,
        "rooms": trip.rooms,
        "preferredCurrency": trip.preferred_currency,
        "flightSearch": trip.flight_search,
        "created": trip.created.isoformat(),
    }


@endpoint("GET", private=True)
def list_trips(request, data):
    try:
        page = int(request.GET.get("page", "1"))
    except ValueError:
        raise Invalid("Invalid page.")
    if not 1 <= page <= 10000:
        raise Invalid("Invalid page.")
    start = (page - 1) * 20
    trips = Trip.objects.filter(owner=request.actor)
    period = request.GET.get("period")
    if period == "upcoming":
        trips = trips.filter(departure__gte=timezone.localdate()).order_by("departure", "id")
    elif period == "past":
        trips = trips.filter(departure__lt=timezone.localdate()).order_by("-departure", "id")
    elif period:
        raise Invalid("Choose upcoming or past trips.")
    rows = list(trips[start : start + 21])
    return {"trips": [summary(t) for t in rows[:20]], "more": len(rows) > 20}


@endpoint("POST", private=True)
def create_trip(request, data):
    if data.get("service") == "approval":
        raise Invalid(
            "Select an eligible passport country and attach your flight ticket."
        )
    return save_trip(request, data)


def save_trip(request, data, ticket=None):
    required = {"clientId", "service", "destination", "departure", "travellers"}
    optional = {"phone", "preferredCurrency", "rooms", "flightSearch"}
    if not required <= set(data) <= required | optional:
        raise Invalid("Check the request fields.")
    try:
        key = UUID(str(data["clientId"]))
        departure = date.fromisoformat(data["departure"])
    except (TypeError, ValueError):
        raise Invalid("Check the departure date and try again.")
    service = data["service"]
    if (
        not isinstance(service, str)
        or service not in dict(Trip.SERVICES)
        or type(data["travellers"]) is not int
        or not 1 <= data["travellers"] <= 9
    ):
        raise Invalid("Choose a service and one to nine travellers.")
    values = dict(
        service=service,
        destination=text(data["destination"], 2, 120),
        departure=departure,
        travellers=data["travellers"],
    )
    phone = data.get("phone", "")
    currency = data.get("preferredCurrency", "")
    rooms = data.get("rooms")
    itinerary = data.get("flightSearch", {})
    if (
        not isinstance(phone, str)
        or phone
        and not re.fullmatch(r"\+[1-9][0-9]{1,14}", phone)
    ):
        raise Invalid("Enter an international phone number.")
    if currency not in ("", "GBP", "USD"):
        raise Invalid("Choose GBP or USD.")
    if rooms is not None and (
        service != "hotel"
        or type(rooms) is not int
        or not 1 <= rooms <= data["travellers"]
    ):
        raise Invalid("Choose one or more rooms, up to the number of travellers.")
    if itinerary != {}:
        if service != "flight":
            raise Invalid("Choose the flight service.")
        flight_search(itinerary)
        if (
            itinerary["legs"][0]["date"] != departure.isoformat()
            or sum(itinerary[k] for k in ("adults", "children", "infants"))
            != data["travellers"]
        ):
            raise Invalid(
                "Passenger count and first flight date must match the itinerary."
            )
    values.update(
        phone=phone, preferred_currency=currency, rooms=rooms, flight_search=itinerary
    )
    with transaction.atomic():
        trip = Trip.objects.filter(owner=request.actor, client_id=key).first()
        if not trip:
            if (
                not timezone.localdate()
                <= departure
                <= timezone.localdate() + timedelta(days=730)
            ):
                raise Invalid("Choose a date in the next two years.")
            if not allowance("trip-create", str(request.actor.pk), 20, 3600):
                raise Invalid("Request limit reached. Try again later.", 429)
            trip, created = Trip.objects.get_or_create(
                owner=request.actor, client_id=key, defaults=values
            )
            if created and ticket:
                if (
                    not ApprovalCountry.objects.select_for_update()
                    .filter(pk=ticket["nationality"])
                    .exists()
                ):
                    raise Invalid(
                        "This passport country is unavailable for Egypt security approval."
                    )
                FlightTicket.objects.create(trip=trip, **ticket)
        if (
            ticket
            and not FlightTicket.objects.filter(
                trip=trip, nationality=ticket["nationality"], digest=ticket["digest"]
            ).exists()
        ):
            raise Invalid(
                "This request was already submitted with different details.", 409
            )
        if any(getattr(trip, k) != v for k, v in values.items()):
            raise Invalid(
                "This request was already submitted with different details.", 409
            )
    return summary(trip)


@endpoint("GET", private=True)
def detail(request, data, trip_id):
    trip = owned(request, trip_id)
    quote = trip.quotes.order_by("-created", "-pk").first()
    return {
        **summary(trip),
        "confirmation": Confirmation.objects.filter(trip=trip)
        .values("supplier", "reference", "itinerary", "created")
        .first(),
        "attachmentRequested": trip.attachment_requested,
        "attached": Attachment.objects.filter(trip=trip).exists(),
        "quote": {
            "id": str(quote.pk),
            "amount": str(quote.amount),
            "currency": quote.currency,
            "details": quote.details,
            "until": quote.valid_until.isoformat(),
            "accepted": bool(quote.accepted),
            "expired": quote.valid_until < timezone.localdate(),
        }
        if quote
        else None,
        "messages": list(
            reversed(
                list(
                    trip.messages.order_by("-created", "-id").values(
                        "id", "body", "staff", "created"
                    )[:100]
                )
            )
        ),
    }


@endpoint("POST", private=True)
def accept(request, data, trip_id):
    fields(data, ["quoteId"])
    with transaction.atomic():
        trip = owned(request, trip_id, True)
        quote = trip.quotes.order_by("-created", "-pk").first()
        if not quote or str(quote.pk) != data["quoteId"]:
            raise Invalid("The quote has changed. Refresh to see the current one.", 409)
        if not quote.accepted:
            if quote.valid_until < timezone.localdate():
                raise Invalid("The quote has expired.", 409)
            quote.accepted = timezone.now()
            quote.save(update_fields=["accepted"])
    return {"accepted": True}


@endpoint("POST", private=True)
def message(request, data, trip_id):
    fields(data, ["body"])
    trip = owned(request, trip_id)
    if not allowance("messages", str(request.actor.pk), 30, 600):
        raise Invalid("Message limit reached. Try again later.", 429)
    Message.objects.create(trip=trip, body=text(data["body"], 1, 1000))
    return {}


@endpoint("POST", private=True, upload=True)
def attach(request, data, trip_id):
    trip = owned(request, trip_id)
    if not trip.attachment_requested:
        raise Invalid("The travel desk has not requested an attachment.", 403)
    if not allowance("upload", str(request.actor.pk), 6, 600):
        raise Invalid("Upload limit reached. Try again later.", 429)
    if int(request.META.get("CONTENT_LENGTH") or 0) > 2 * 1024 * 1024 + 8192:
        raise Invalid("Choose an image under 2 MB.", 413)
    source = request.FILES.get("image")
    if (
        not source
        or request.POST
        or set(request.FILES) != {"image"}
        or source.size > 2 * 1024 * 1024
    ):
        raise Invalid("Choose one JPEG or PNG under 2 MB.")
    image = clean_image(source)
    with transaction.atomic():
        trip = owned(request, trip_id, True)
        if not trip.attachment_requested:
            raise Invalid("Attachment is no longer required.", 409)
        Attachment.objects.update_or_create(trip=trip, defaults={"image": image})
    return {}


@endpoint("GET", private=True)
def history(request, data, trip_id):
    trip = owned(request, trip_id)
    try:
        before = int(request.GET.get("before", "0"))
    except ValueError:
        raise Invalid("Invalid message cursor.")
    if not 0 < before < 2**63:
        raise Invalid("Invalid message cursor.")
    rows = list(
        trip.messages.filter(id__lt=before)
        .order_by("-id")
        .values("id", "body", "staff", "created")[:101]
    )
    return {"messages": list(reversed(rows[:100])), "more": len(rows) > 100}


def clean_image(source):
    try:
        with Image.open(source, formats=["JPEG", "PNG"]) as image:
            if (
                image.width * image.height > 12_000_000
                or getattr(image, "n_frames", 1) != 1
            ):
                raise Invalid("Choose a single image of up to 12 megapixels.")
            image.load()
            cleaned = ImageOps.exif_transpose(image).convert("RGB")
            cleaned.thumbnail((2000, 2000))
            target = BytesIO()
            cleaned.save(target, "JPEG", quality=82)
    except (OSError, ValueError, Image.DecompressionBombError, UnidentifiedImageError):
        raise Invalid("Choose a valid JPEG or PNG.")
    return target.getvalue()


@endpoint("POST", private=True, upload=True)
def create_approval(request, data):
    if not allowance("approval-upload", str(request.actor.pk), 10, 600):
        raise Invalid("Upload limit reached. Try again later.", 429)
    if (
        set(request.POST) != {"details", "nationality"}
        or set(request.FILES) != {"ticket"}
        or len(request.FILES.getlist("ticket")) != 1
    ):
        raise Invalid("A flight ticket and passport country are required.")
    file = request.FILES["ticket"]
    if file.size > 2 * 1024 * 1024:
        raise Invalid("Choose an image under 2 MB.", 413)
    country = request.POST["nationality"]
    if not ApprovalCountry.objects.filter(pk=country).exists():
        raise Invalid(
            "This passport country is unavailable for Egypt security approval."
        )
    try:
        record = json.loads(request.POST["details"])
    except (ValueError, TypeError):
        raise Invalid("Invalid approval request.")
    if not isinstance(record, dict) or record.get("service") != "approval":
        raise Invalid("Choose Egypt security approval.")
    if (
        len(request.POST.getlist("details")) != 1
        or len(request.POST.getlist("nationality")) != 1
    ):
        raise Invalid("Choose one nationality and one ticket.")
    image = clean_image(file)
    return save_trip(
        request,
        record,
        {
            "nationality": country,
            "image": image,
            "digest": hashlib.sha256(image).hexdigest(),
        },
    )
