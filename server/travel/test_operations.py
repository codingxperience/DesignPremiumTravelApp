import secrets
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from unittest.mock import patch
from uuid import uuid4

from django.contrib.admin.models import LogEntry
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.sessions.models import Session
from django.core import mail
from django.core.management import call_command
from django.db import close_old_connections, connections
from django.test import (
    Client,
    TestCase,
    TransactionTestCase,
    override_settings,
    skipUnlessDBFeature,
)
from django.utils import timezone

from .models import DeviceSession, EmailDelivery, EmailLink, Quote, Trip, Window
from .security import allowance


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class OperationsTests(TestCase):
    def test_operator_quote_and_traveller_acceptance(self):
        operator = get_user_model().objects.create_user("desk", is_staff=True)
        guest = get_user_model().objects.create_user("guest")
        trip = Trip.objects.create(
            owner=guest,
            client_id=uuid4(),
            service="flight",
            destination="Giza",
            departure=timezone.localdate(),
            travellers=2,
        )
        self.client.force_login(operator)
        values = {
            "trip": str(trip.pk),
            "amount": "890.00",
            "currency": "USD",
            "details": "Two return fares including taxes",
            "valid_until": str(timezone.localdate() + timedelta(days=2)),
            "_save": "Save",
        }
        self.assertEqual(
            self.client.post("/staff/travel/quote/add/", values).status_code, 403
        )
        call_command("setup_desk")
        operator.groups.add(Group.objects.get(name="Travel desk"))
        self.assertEqual(
            self.client.post("/staff/travel/quote/add/", values).status_code, 302
        )
        quote = Quote.objects.get(trip=trip)
        client = Client()
        client.force_login(guest)
        r = client.get(f"/api/trips/{trip.pk}").json()
        self.assertEqual(r["quote"]["amount"], "890.00")
        client.post(
            f"/api/trips/{trip.pk}/accept",
            {"quoteId": str(quote.pk)},
            content_type="application/json",
        )
        quote.refresh_from_db()
        self.assertIsNotNone(quote.accepted)
        self.assertEqual(
            self.client.post("/staff/travel/quote/add/", values).status_code, 200
        )
        self.assertEqual(trip.quotes.count(), 1)
        issued = {
            "trip": str(trip.pk),
            "supplier": "Test supplier",
            "reference": "QA-001",
            "itinerary": "Customer approved itinerary.",
            "_save": "Save",
        }
        self.assertEqual(
            self.client.post("/staff/travel/confirmation/add/", issued).status_code, 302
        )
        detail = client.get(f"/api/trips/{trip.pk}").json()
        self.assertEqual(detail["confirmation"]["reference"], "QA-001")
        self.assertEqual(self.client.get("/staff/auth/user/").status_code, 403)
        self.assertTrue(LogEntry.objects.filter(object_id=str(quote.pk)).exists())
        password = secrets.token_urlsafe(24)
        guest.set_password(password)
        guest.save()
        client.force_login(guest)
        self.assertEqual(
            client.post(
                "/api/delete", {"password": password}, content_type="application/json"
            ).status_code,
            200,
        )
        self.assertFalse(LogEntry.objects.filter(object_id=str(quote.pk)).exists())

    def test_failed_mail_retries_without_storing_raw_link(self):
        row = EmailDelivery.objects.create(
            email="mail@example.test", purpose="register", due=timezone.now()
        )
        with patch(
            "travel.management.commands.deliver_mail.send_mail", side_effect=OSError
        ):
            call_command("deliver_mail")
        row.refresh_from_db()
        self.assertEqual(row.attempts, 1)
        self.assertGreater(row.due, timezone.now())
        self.assertEqual(EmailLink.objects.count(), 0)
        row.due = timezone.now()
        row.save()
        call_command("deliver_mail")
        self.assertEqual(EmailDelivery.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 1)


class MailCronTests(TestCase):
    @override_settings(CRON_SECRET="c" * 48)
    def test_cron_rejects_missing_and_incorrect_bearer_credentials(self):
        job = EmailDelivery.objects.create(
            email="mail@example.test", purpose="register", due=timezone.now()
        )

        for authorization in ("", "Bearer incorrect"):
            with self.subTest(authorization=authorization):
                response = self.client.get(
                    "/internal/cron/mail", HTTP_AUTHORIZATION=authorization
                )
                self.assertEqual(response.status_code, 404)

        job.refresh_from_db()
        self.assertEqual(job.attempts, 0)

    @override_settings(CRON_SECRET="c" * 48)
    def test_authorized_cron_processes_at_most_five_mail_jobs(self):
        due = timezone.now()
        EmailDelivery.objects.bulk_create(
            [
                EmailDelivery(
                    email=f"mail-{index}@example.test",
                    purpose="register",
                    due=due,
                )
                for index in range(7)
            ]
        )

        with patch("travel.management.commands.deliver_mail.deliver") as deliver:
            response = self.client.get(
                "/internal/cron/mail",
                HTTP_AUTHORIZATION=f"Bearer {'c' * 48}",
            )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(deliver.call_count, 5)
        self.assertEqual(EmailDelivery.objects.filter(attempts=1).count(), 5)
        self.assertEqual(EmailDelivery.objects.filter(attempts=0).count(), 2)

    @override_settings(CRON_SECRET="c" * 48)
    def test_authorized_prune_cron_removes_expired_security_records(self):
        expired = timezone.now() - timedelta(seconds=1)
        user = get_user_model().objects.create_user("expired-session")
        DeviceSession.objects.create(
            digest="d" * 64,
            user=user,
            auth_hash="old-auth-hash",
            expires=expired,
        )
        EmailLink.objects.create(
            digest="e" * 64,
            email="expired@example.test",
            purpose="register",
            expires=expired,
        )
        Window.objects.create(key="w" * 64, expires=expired)
        Session.objects.create(
            session_key="expired-session-key",
            session_data="",
            expire_date=expired,
        )

        response = self.client.get(
            "/internal/cron/prune",
            HTTP_AUTHORIZATION=f"Bearer {'c' * 48}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(DeviceSession.objects.count(), 0)
        self.assertEqual(EmailLink.objects.count(), 0)
        self.assertEqual(Window.objects.count(), 0)
        self.assertEqual(Session.objects.count(), 0)


class ConcurrentWrites(TransactionTestCase):
    @skipUnlessDBFeature("has_select_for_update")
    def test_shared_window_is_atomic(self):
        def worker(_):
            close_old_connections()
            try:
                return allowance("concurrent", "one", 4, 86400)
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=8) as executor:
            self.assertEqual(sum(executor.map(worker, range(12))), 4)

    @skipUnlessDBFeature("has_select_for_update")
    def test_concurrent_submission_uses_one_trip(self):
        user = get_user_model().objects.create_user("traveller")
        payload = {
            "clientId": str(uuid4()),
            "service": "flight",
            "departure": str(timezone.localdate()),
            "destination": "Nairobi",
            "travellers": 1,
        }

        def submit(_):
            close_old_connections()
            try:
                c = Client()
                c.force_login(user)
                r = c.post(
                    "/api/trips/create", payload, content_type="application/json"
                )
                return r.json()["id"]
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=4) as executor:
            self.assertEqual(len(set(executor.map(submit, range(4)))), 1)
        self.assertEqual(Trip.objects.count(), 1)
