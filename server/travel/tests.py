import re
import secrets
from datetime import timedelta
from io import BytesIO
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import Client, RequestFactory, SimpleTestCase, TestCase, override_settings
from django.utils import timezone
from PIL import Image

from .deployment import deployment_security_settings, validate_smtp_settings
from .models import (
    Attachment,
    DeviceSession,
    EmailDelivery,
    EmailLink,
    Message,
    Quote,
    Trip,
    Window,
)
from .security import digest, remote


class DeploymentBoundaryTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    @override_settings(VERCEL=True)
    def test_vercel_rate_limits_use_the_platform_forwarded_client_ip(self):
        request = self.factory.get(
            "/api/session", HTTP_X_VERCEL_FORWARDED_FOR="203.0.113.7"
        )

        self.assertEqual(remote(request), "203.0.113.7")

    @override_settings(VERCEL=True)
    def test_missing_or_malformed_vercel_client_ip_fails_closed(self):
        requests = (
            self.factory.get("/api/session"),
            self.factory.get(
                "/api/session",
                HTTP_X_VERCEL_FORWARDED_FOR="203.0.113.7, 10.0.0.2",
            ),
        )

        for request in requests:
            with self.subTest(headers=request.META):
                self.assertEqual(remote(request), "unknown")

    @override_settings(VERCEL=False)
    def test_local_rate_limits_use_remote_addr(self):
        request = self.factory.get(
            "/api/session",
            REMOTE_ADDR="198.51.100.4",
            HTTP_X_VERCEL_FORWARDED_FOR="203.0.113.7",
        )

        self.assertEqual(remote(request), "198.51.100.4")

    def test_vercel_preview_host_and_https_origin_are_allowed_explicitly(self):
        config = deployment_security_settings(
            "https://cross-world-travel.vercel.app",
            "cross-world-travel-git-preview-branch.vercel.app",
            vercel=True,
        )

        self.assertEqual(
            config["ALLOWED_HOSTS"],
            [
                "cross-world-travel.vercel.app",
                "cross-world-travel-git-preview-branch.vercel.app",
            ],
        )
        self.assertEqual(
            config["CSRF_TRUSTED_ORIGINS"],
            [
                "https://cross-world-travel.vercel.app",
                "https://cross-world-travel-git-preview-branch.vercel.app",
            ],
        )
        self.assertEqual(
            config["SECURE_PROXY_SSL_HEADER"],
            ("HTTP_X_FORWARDED_PROTO", "https"),
        )

    def test_non_vercel_settings_do_not_trust_forwarded_headers(self):
        config = deployment_security_settings(
            "https://travel.example.com",
            "attacker.vercel.app",
            vercel=False,
        )

        self.assertEqual(config["ALLOWED_HOSTS"], ["travel.example.com"])
        self.assertEqual(config["CSRF_TRUSTED_ORIGINS"], ["https://travel.example.com"])
        self.assertIsNone(config["SECURE_PROXY_SSL_HEADER"])

    def test_vercel_deployment_url_rejects_paths_and_credentials(self):
        for deployment_url in (
            "travel.vercel.app/other-path",
            "user@travel.vercel.app",
            "travel.vercel.app?other=host",
        ):
            with self.subTest(deployment_url=deployment_url):
                with self.assertRaisesRegex(ValueError, "deployment URL"):
                    deployment_security_settings(
                        "https://travel.vercel.app",
                        deployment_url,
                        vercel=True,
                    )

    def test_production_mail_requires_authenticated_sender_credentials(self):
        with self.assertRaisesRegex(ValueError, "SMTP_HOST.*SMTP_USER.*SMTP_PASSWORD.*MAIL_FROM"):
            validate_smtp_settings("smtp.example.test", "", "", "desk@example.test")

        validate_smtp_settings(
            "smtp.example.test", "desk@example.test", "smtp-token", "desk@example.test"
        )


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class TravelTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.secret = secrets.token_urlsafe(24)
        cls.user = get_user_model().objects.create_user(
            username="guest@example.test",
            email="guest@example.test",
            password=cls.secret,
        )
        cls.other = get_user_model().objects.create_user(
            username="other@example.test",
            email="other@example.test",
            password=cls.secret,
        )

    def setUp(self):
        self.client.force_login(self.user)
        self.today = timezone.localdate()
        self.values = {
            "clientId": str(uuid4()),
            "service": "egypt",
            "destination": "Giza",
            "travellers": 2,
            "departure": str(self.today + timedelta(days=7)),
        }

    def post(self, route, values, client=None, **kw):
        return (client or self.client).post(
            route, values, content_type="application/json", **kw
        )

    def trip(self):
        response = self.post("/api/trips/create", self.values)
        self.assertEqual(response.status_code, 200, response.content)
        return Trip.objects.get(pk=response.json()["id"])

    def quote(self, trip, **kw):
        values = {
            "amount": "425.00",
            "currency": "USD",
            "details": "Two travellers",
            "valid_until": self.today + timedelta(days=2),
        }
        return Quote.objects.create(trip=trip, **(values | kw))

    def test_registration_reset_expiry_and_single_use(self):
        browser = Client()
        email = "fresh@example.test"
        password = secrets.token_urlsafe(24)
        self.post("/api/email", {"purpose": "register", "email": email}, browser)
        call_command("deliver_mail")
        self.assertFalse(get_user_model().objects.filter(username=email).exists())
        token = re.search(r"#setup=([\w-]+)", mail.outbox[-1].body)[1]
        self.assertTrue(EmailLink.objects.filter(digest=digest(token)).exists())
        self.assertEqual(
            self.post(
                "/api/password", {"token": token, "password": "short"}, browser
            ).status_code,
            400,
        )
        self.assertEqual(
            self.post(
                "/api/password", {"token": token, "password": password}, browser
            ).status_code,
            200,
        )
        u = get_user_model().objects.get(username=email)
        self.assertTrue(u.check_password(password))
        self.assertTrue(u.password.startswith("argon2$"))
        self.assertEqual(
            self.post(
                "/api/password", {"token": token, "password": password}, browser
            ).status_code,
            400,
        )
        self.post("/api/email", {"purpose": "reset", "email": email}, browser)
        call_command("deliver_mail")
        reset = re.search(r"#setup=([\w-]+)", mail.outbox[-1].body)[1]
        EmailLink.objects.update(expires=timezone.now() - timedelta(seconds=1))
        self.assertEqual(
            self.post(
                "/api/password", {"token": reset, "password": password}, browser
            ).status_code,
            400,
        )

    def test_reset_revokes_web_and_device_sessions(self):
        device = Client()
        token = self.post(
            "/mobile/login", {"email": self.user.email, "password": self.secret}, device
        ).json()["token"]
        self.post("/api/email", {"email": self.user.email, "purpose": "reset"})
        call_command("deliver_mail")
        key = re.search(r"#setup=([\w-]+)", mail.outbox[-1].body)[1]
        self.post(
            "/api/password", {"token": key, "password": secrets.token_urlsafe(32)}
        )
        self.assertEqual(self.client.get("/api/trips").status_code, 401)
        self.assertEqual(
            device.get(
                "/mobile/trips", HTTP_AUTHORIZATION="Bearer " + token
            ).status_code,
            401,
        )

    def test_web_csrf_login_logout(self):
        c = Client(enforce_csrf_checks=True)
        creds = {"email": self.user.email, "password": self.secret}
        self.assertEqual(self.post("/api/login", creds, c).status_code, 403)
        csrf = c.get("/api/session").json()["csrf"]
        result = self.post("/api/login", creds, c, HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(result.status_code, 200)
        self.assertTrue(c.cookies["sessionid"]["httponly"])
        self.assertEqual(
            self.post(
                "/api/logout", {}, c, HTTP_X_CSRFTOKEN=result.json()["csrf"]
            ).status_code,
            200,
        )
        self.assertEqual(c.get("/api/trips").status_code, 401)

    @override_settings(INVITE_ONLY=True)
    def test_invite_only_allows_password_login_and_blocks_email_links(self):
        existing_token = secrets.token_urlsafe(24)
        EmailLink.objects.create(
            digest=digest(existing_token),
            email=self.user.email,
            purpose="reset",
            expires=timezone.now() + timedelta(minutes=30),
        )
        for prefix in ("/api", "/mobile"):
            with self.subTest(prefix=prefix):
                client = Client()
                self.assertTrue(client.get(f"{prefix}/session").json()["inviteOnly"])
                for purpose in ("register", "reset"):
                    response = self.post(
                        f"{prefix}/email",
                        {"purpose": purpose, "email": self.user.email},
                        client,
                    )
                    self.assertEqual(response.status_code, 503)
                self.assertEqual(
                    self.post(
                        f"{prefix}/password",
                        {"token": existing_token, "password": secrets.token_urlsafe(24)},
                        client,
                    ).status_code,
                    503,
                )
                self.assertEqual(
                    self.post(
                        f"{prefix}/login",
                        {"email": self.user.email, "password": self.secret},
                        client,
                    ).status_code,
                    200,
                )
        self.assertFalse(EmailDelivery.objects.exists())

    def test_device_channel_ignores_browser_credentials(self):
        self.assertEqual(self.client.get("/mobile/trips").status_code, 403)
        c = Client(enforce_csrf_checks=True)
        self.assertEqual(
            c.get("/mobile/session", HTTP_ORIGIN="https://example.test").status_code,
            403,
        )
        pre = c.options("/mobile/session", HTTP_ORIGIN="capacitor://localhost")
        self.assertEqual(pre["Access-Control-Allow-Origin"], "capacitor://localhost")
        self.assertNotIn("Access-Control-Allow-Credentials", pre)
        data = self.post(
            "/mobile/login", {"email": self.user.email, "password": self.secret}, c
        ).json()
        headers = {"HTTP_AUTHORIZATION": "Bearer " + data["token"]}
        self.assertNotIn("sessionid", c.cookies)
        self.assertTrue(DeviceSession.objects.filter(pk=digest(data["token"])).exists())
        self.assertEqual(c.get("/mobile/trips", **headers).status_code, 200)
        self.post("/mobile/logout", {}, c, **headers)
        self.assertEqual(c.get("/mobile/trips", **headers).status_code, 401)

    def test_shared_login_limits_across_channels(self):
        credentials = {"email": "absent@example.test", "password": self.secret}
        browser = Client()
        for i in range(8):
            self.assertEqual(
                self.post(
                    "/api/login" if i % 2 else "/mobile/login", credentials, browser
                ).status_code,
                401,
            )
        self.assertEqual(self.post("/api/login", credentials, browser).status_code, 429)

    def test_input_and_idempotency(self):
        trip = self.trip()
        self.assertEqual(
            self.post("/api/trips/create", self.values).json()["id"], str(trip.pk)
        )
        self.assertEqual(Trip.objects.count(), 1)
        self.assertEqual(
            self.post("/api/trips/create", self.values | {"travellers": 3}).status_code,
            409,
        )
        for override in (
            {"amount": 1},
            {"owner": self.other.pk},
            {"travellers": 0},
            {"travellers": True},
            {"departure": "invalid"},
            {"service": "unknown"},
            {"destination": " "},
        ):
            self.assertEqual(
                self.post("/api/trips/create", self.values | override).status_code, 400
            )

    def test_private_data_isolation_and_guest(self):
        trip = self.trip()
        self.client.force_login(self.other)
        route = "/api/trips/" + str(trip.pk)
        self.assertEqual(self.client.get("/api/trips").json()["trips"], [])
        self.assertEqual(self.client.get(route).status_code, 404)
        for suffix, body in [
            ("messages", {"body": "A question"}),
            ("accept", {"quoteId": str(uuid4())}),
        ]:
            self.assertEqual(self.post(route + "/" + suffix, body).status_code, 404)
        self.assertEqual(self.client.post(route + "/attachment", {}).status_code, 404)
        self.assertEqual(Client().get(route).status_code, 401)

    def test_quote_versions_and_expiry(self):
        trip = self.trip()
        route = "/api/trips/" + str(trip.pk) + "/accept"
        old = self.quote(trip, valid_until=self.today - timedelta(days=1))
        self.assertEqual(self.post(route, {"quoteId": str(old.pk)}).status_code, 409)
        new = self.quote(trip)
        self.assertEqual(self.post(route, {"quoteId": str(old.pk)}).status_code, 409)
        self.assertEqual(
            self.post(route, {"quoteId": str(new.pk), "amount": 1}).status_code, 400
        )
        for _ in range(2):
            self.assertEqual(
                self.post(route, {"quoteId": str(new.pk)}).status_code, 200
            )
        self.assertEqual(trip.quotes.filter(accepted__isnull=False).count(), 1)

    def test_messages_and_staff_boundary(self):
        trip = self.trip()
        route = "/api/trips/" + str(trip.pk)
        self.assertEqual(
            self.post(route + "/messages", {"body": "Window seat please"}).status_code,
            200,
        )
        self.assertFalse(self.client.get(route).json()["messages"][0]["staff"])
        self.assertEqual(
            self.post(route + "/messages", {"body": "test", "staff": True}).status_code,
            400,
        )
        self.assertEqual(self.client.get("/staff/").status_code, 302)

    def test_upload_gate_validation_and_metadata_removal(self):
        trip = self.trip()
        route = "/api/trips/" + str(trip.pk) + "/attachment"
        self.assertEqual(self.client.post(route, {}).status_code, 403)
        trip.attachment_requested = True
        trip.save()
        self.assertEqual(
            self.client.post(
                route, {"image": SimpleUploadedFile("x.png", b"not an image")}
            ).status_code,
            400,
        )
        image = BytesIO()
        src = Image.new("RGB", (20, 30))
        exif = Image.Exif()
        exif[270] = "private description"
        src.save(image, "JPEG", exif=exif)
        self.assertEqual(
            self.client.post(
                route, {"image": SimpleUploadedFile("sample.jpg", image.getvalue())}
            ).status_code,
            200,
        )
        clean = Image.open(BytesIO(Attachment.objects.get().image))
        self.assertEqual(clean.size, (20, 30))
        self.assertFalse(clean.getexif())
        self.assertEqual(
            self.client.post(
                route,
                {
                    "image": SimpleUploadedFile(
                        "big.jpg", bytes(2 * 1024 * 1024 + 10000)
                    )
                },
            ).status_code,
            413,
        )

    def test_deletion_cascades_and_revokes(self):
        trip = self.trip()
        self.quote(trip)
        Message.objects.create(trip=trip, body="Hello")
        Attachment.objects.create(trip=trip, image=b"test")
        DeviceSession.objects.create(
            user=self.user, digest="a" * 64, expires=timezone.now(), auth_hash=""
        )
        self.assertEqual(
            self.post("/api/delete", {"password": "wrong"}).status_code, 403
        )
        self.assertEqual(
            self.post("/api/delete", {"password": self.secret}).status_code, 200
        )
        for model in (Trip, Quote, Message, Attachment, DeviceSession):
            self.assertEqual(model.objects.count(), 0)
        self.assertTrue(get_user_model().objects.filter(pk=self.other.pk).exists())
        self.assertEqual(self.client.get("/api/trips").status_code, 401)

    def test_security_headers_tls_and_cleanup(self):
        r = self.client.get("/api/session")
        self.assertEqual(r["Cache-Control"], "no-store")
        self.assertEqual(r["X-Content-Type-Options"], "nosniff")
        self.assertIn("object-src 'none'", r["Content-Security-Policy"])
        with self.settings(SECURE_SSL_REDIRECT=True, SECURE_HSTS_SECONDS=31536000):
            tls_client = Client()
            self.assertEqual(tls_client.get("/api/session").status_code, 301)
            self.assertIn(
                "31536000",
                tls_client.get("/api/session", secure=True)[
                    "Strict-Transport-Security"
                ],
            )
        Window.objects.update(expires=timezone.now() - timedelta(seconds=1))
        call_command("prune_travel")
        self.assertEqual(Window.objects.count(), 0)

    def test_history_pages_are_private_and_complete(self):
        trip = self.trip()
        Message.objects.bulk_create(
            [Message(trip=trip, body=str(i)) for i in range(105)]
        )
        route = f"/api/trips/{trip.pk}"
        latest = self.client.get(route).json()["messages"]
        self.assertEqual(len(latest), 100)
        previous = self.client.get(
            route + "/history", {"before": latest[0]["id"]}
        ).json()
        self.assertFalse(previous["more"])
        self.assertEqual(
            [m["body"] for m in previous["messages"] + latest],
            [str(i) for i in range(105)],
        )
        self.client.force_login(self.other)
        self.assertEqual(
            self.client.get(
                route + "/history", {"before": latest[0]["id"]}
            ).status_code,
            404,
        )

    def test_input_types_and_guest_email_response(self):
        self.assertEqual(
            self.post("/api/trips/create", self.values | {"service": {}}).status_code,
            400,
        )
        for email in ("absent@example.test", self.user.email):
            self.assertEqual(
                self.post("/api/email", {"email": email, "purpose": "reset"}).json(), {}
            )
        self.assertEqual(len(mail.outbox), 0)
