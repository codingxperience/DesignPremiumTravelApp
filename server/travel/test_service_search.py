import json
from datetime import timedelta
from io import BytesIO
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from django.utils import timezone
from PIL import Image

from .models import ApprovalCountry, FlightTicket, PublishedFlight, Trip


class ServiceSearchTests(TestCase):
    def setUp(self):
        self.day = timezone.localdate() + timedelta(days=10)
        self.user = get_user_model().objects.create_user(username="traveller")
        self.details = {
            "clientId": str(uuid4()),
            "service": "approval",
            "destination": "Egypt",
            "departure": self.day.isoformat(),
            "travellers": 2,
            "preferredCurrency": "USD",
            "phone": "+256772123456",
        }
        self.query = {
            "mode": "multi",
            "legs": [
                {"from": "LHR", "to": "CAI", "date": str(self.day)},
                {"from": "CAI", "to": "IST", "date": str(self.day + timedelta(days=3))},
            ],
            "cabin": "economy",
            "adults": 2,
            "children": 0,
            "infants": 0,
            "stops": "any",
            "window": "any",
        }

    def post(self, path, data):
        return self.client.post("/api/" + path, data, content_type="application/json")

    def test_guest_search_filters_and_itinerary(self):
        for carrier, hour, stops, published in [
            ("A", "09:00", 0, True),
            ("B", "19:00", 1, True),
            ("C", "08:30", 0, False),
        ]:
            PublishedFlight.objects.create(
                origin="LHR",
                destination="CAI",
                date=self.day,
                departure=hour,
                cabin="economy",
                number=carrier,
                airline=carrier,
                stops=stops,
                duration=120,
                published=published,
            )

        def numbers(**filters):
            result = self.post("flight-search", self.query | filters)
            self.assertEqual(result.status_code, 200)
            outbound, second = result.json()["results"]
            self.assertEqual(second, [])
            return [row["number"] for row in outbound]

        self.assertEqual(numbers(), ["A", "B"])
        self.assertEqual(numbers(window="evening"), ["B"])
        self.assertEqual(numbers(stops="direct", window="evening"), [])
        self.assertEqual(numbers(cabin="first"), [])
        self.assertEqual(self.client.get("/api/trips").status_code, 401)
        self.assertEqual(
            self.post(
                "flight-search", self.query | {"legs": self.query["legs"][::-1]}
            ).status_code,
            400,
        )
        self.client.force_login(self.user)
        result = self.post(
            "trips/create",
            self.details | {"service": "flight", "flightSearch": self.query},
        )
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["flightSearch"], self.query)

    def test_explicit_rooms_and_currency(self):
        self.client.force_login(self.user)
        payload = self.details | {"service": "hotel", "rooms": 2}
        self.assertEqual(
            self.post("trips/create", payload | {"rooms": 3}).status_code, 400
        )
        self.assertEqual(
            self.post("trips/create", payload | {"phone": "0772123456"}).status_code,
            400,
        )
        trip = self.post("trips/create", payload)
        self.assertEqual(trip.json()["rooms"], 2)
        self.assertEqual(trip.json()["preferredCurrency"], "USD")
        self.assertEqual(Trip.objects.get(pk=trip.json()["id"]).phone, "+256772123456")

    def test_approval_eligibility_and_mandatory_ticket(self):
        self.assertEqual(
            self.client.get("/api/approval-countries").json(), {"countries": []}
        )
        self.client.force_login(self.user)
        self.assertEqual(self.post("trips/create", self.details).status_code, 400)
        raw = BytesIO()
        Image.new("RGB", (10, 10)).save(raw, "PNG")

        def apply(code, file=None):
            data = {"details": json.dumps(self.details), "nationality": code}
            if file is not None:
                data["ticket"] = SimpleUploadedFile(
                    "ticket.png", file, content_type="image/png"
                )
            return self.client.post("/api/approval", data)

        self.assertEqual(apply("UG", raw.getvalue()).status_code, 400)
        ApprovalCountry.objects.create(code="UG")
        self.assertEqual(apply("UG").status_code, 400)
        self.assertEqual(apply("UG", b"not an image").status_code, 400)
        self.assertEqual(Trip.objects.count(), 0)
        accepted = apply("UG", raw.getvalue())
        self.assertEqual(accepted.status_code, 200)
        self.assertEqual(
            apply("UG", raw.getvalue()).json()["id"], accepted.json()["id"]
        )
        self.assertEqual(FlightTicket.objects.count(), 1)
        self.assertEqual(
            Client().get("/api/trips/" + accepted.json()["id"]).status_code, 401
        )
        self.assertFalse(
            self.client.get("/staff/travel/trip/" + accepted.json()["id"] + "/ticket/")
            .get("Content-Type", "")
            .startswith("image")
        )
