import re
from datetime import date, timedelta

from django.utils import timezone

from .api import Invalid, endpoint, fields
from .models import ApprovalCountry, PublishedFlight
from .security import allowance, remote

CABINS = ("economy", "premium", "business", "first")
WINDOWS = {
    "any": (0, 24),
    "morning": (0, 12),
    "afternoon": (12, 18),
    "evening": (18, 24),
}


def travel_date(value):
    try:
        day = date.fromisoformat(value)
    except (ValueError, TypeError):
        raise Invalid("Choose a valid travel date.")
    if not timezone.localdate() <= day <= timezone.localdate() + timedelta(days=730):
        raise Invalid("Choose a date in the next two years.")
    return day


def flight_search(value):
    if not isinstance(value, dict):
        raise Invalid("Check your flight search.")
    fields(
        value,
        ["mode", "legs", "cabin", "stops", "window", "adults", "children", "infants"],
    )
    mode, legs = value["mode"], value["legs"]
    if mode not in ("oneway", "return", "multi") or not isinstance(legs, list):
        raise Invalid("Choose a trip type and route.")
    if not (
        len(legs) == 1
        if mode == "oneway"
        else len(legs) == 2
        if mode == "return"
        else 2 <= len(legs) <= 6
    ):
        raise Invalid("Check the number of flight legs.")
    if (
        value["cabin"] not in CABINS
        or value["stops"] not in ("any", "direct", "one")
        or value["window"] not in tuple(WINDOWS)
    ):
        raise Invalid("Check the flight filters.")
    counts = [value[key] for key in ("adults", "children", "infants")]
    if (
        any(type(n) is not int or n < 0 for n in counts)
        or not counts[0]
        or sum(counts) > 9
        or counts[2] > counts[0]
    ):
        raise Invalid("Check the passenger counts.")
    previous = None
    for leg in legs:
        if not isinstance(leg, dict):
            raise Invalid("Check each flight leg.")
        fields(leg, ["from", "to", "date"])
        if (
            any(
                not isinstance(leg[k], str) or not re.fullmatch(r"[A-Z]{3}", leg[k])
                for k in ("from", "to")
            )
            or leg["from"] == leg["to"]
        ):
            raise Invalid("Choose different origin and destination airports.")
        day = travel_date(leg["date"])
        if previous and day < previous:
            raise Invalid("Flight legs must be in date order.")
        previous = day
    if mode == "return" and (legs[0]["from"], legs[0]["to"]) != (
        legs[1]["to"],
        legs[1]["from"],
    ):
        raise Invalid("Check the return route.")
    return value


@endpoint("POST")
def flights(request, data):
    if not allowance("flight-search", remote(request), 90, 60):
        raise Invalid("Search limit reached. Try again shortly.", 429)
    query = flight_search(data)
    start, end = WINDOWS[query["window"]]
    results = []
    for leg in query["legs"]:
        rows = PublishedFlight.objects.filter(
            published=True,
            origin=leg["from"],
            destination=leg["to"],
            date=leg["date"],
            cabin=query["cabin"],
            departure__hour__gte=start,
            departure__hour__lt=end,
        )
        if query["stops"] != "any":
            rows = rows.filter(stops__lte=0 if query["stops"] == "direct" else 1)
        results.append(
            list(
                rows.values("airline", "number", "departure", "duration", "stops")[:50]
            )
        )
    return {"results": results}


@endpoint("GET")
def approval_countries(request, data):
    return {
        "countries": list(
            ApprovalCountry.objects.order_by("code").values_list("code", flat=True)
        )
    }
