import secrets
from datetime import timedelta
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

from django.contrib.auth import get_user_model
from django.test import Client, TestCase, override_settings
from django.utils import timezone

from .google_sign_in import challenge_for
from .models import DeviceSession, GoogleDeviceGrant, GoogleIdentity
from .security import digest


User = get_user_model()
GOOGLE_ORIGIN = "https://travel.example"
CLAIMS = {
    "sub": "traveller-google-subject",
    "email": "traveller@gmail.com",
    "email_verified": True,
    "given_name": "Alex",
    "family_name": "Traveller",
}


@override_settings(
    GOOGLE_SIGN_IN=True,
    GOOGLE_OAUTH_CLIENT_ID="travel-test.apps.googleusercontent.com",
    GOOGLE_OAUTH_CLIENT_SECRET="test-oauth-secret",
    INVITE_ONLY=True,
    PUBLIC_ORIGIN=GOOGLE_ORIGIN,
)
class GoogleSignInTests(TestCase):
    def begin(self, **params):
        response = self.client.get("/auth/google/start", params)
        self.assertEqual(response.status_code, 302)
        redirect = urlsplit(response.headers["Location"])
        self.assertEqual(redirect.netloc, "accounts.google.com")
        query = parse_qs(redirect.query)
        self.assertEqual(query["redirect_uri"], [GOOGLE_ORIGIN + "/auth/google/callback"])
        self.assertEqual(query["code_challenge_method"], ["S256"])
        self.assertNotIn("client_secret", query)
        return query["state"][0]

    def complete(self, claims=CLAIMS, **params):
        state = self.begin(**params)
        with patch("travel.google_sign_in.google_claims", return_value=claims):
            return self.client.get("/auth/google/callback", {"state": state, "code": "test-code"})

    def post(self, path, data, **headers):
        return self.client.post(path, data, content_type="application/json", **headers)

    def test_google_creates_passwordless_traveller_and_uses_stable_identity(self):
        response = self.complete()
        self.assertTrue(response.headers["Location"].endswith("/#account?google=done"))
        user = User.objects.get(email=CLAIMS["email"])
        self.assertFalse(user.has_usable_password())
        self.assertFalse(user.is_staff)
        self.assertEqual(GoogleIdentity.objects.get(subject=CLAIMS["sub"]).user, user)
        session = self.client.get("/api/session").json()
        self.assertEqual(session["fullName"], "Alex Traveller")
        self.assertTrue(session["inviteOnly"])
        self.assertTrue(session["googleSignIn"])
        self.assertTrue(session["passwordless"])
        self.post("/api/logout", {})
        response = self.complete({**CLAIMS, "email": "new-address@gmail.com"})
        self.assertTrue(response.headers["Location"].endswith("google=done"))
        self.assertEqual(self.client.get("/api/session").json()["email"], user.email)
        self.assertEqual(User.objects.count(), 1)

    def test_incorrect_state_is_rejected_without_exchanging_code(self):
        self.begin()
        with patch("travel.google_sign_in.google_claims") as exchange:
            response = self.client.get("/auth/google/callback", {
                "state": secrets.token_urlsafe(32),
                "code": "test-code",
            })
        exchange.assert_not_called()
        self.assertTrue(response.headers["Location"].endswith("google=failed"))
        self.assertFalse(User.objects.exists())

    def test_google_does_not_link_staff_or_unverified_email(self):
        staff = User.objects.create_user(CLAIMS["email"], CLAIMS["email"], is_staff=True)
        response = self.complete()
        self.assertTrue(response.headers["Location"].endswith("google=failed"))
        self.assertFalse(GoogleIdentity.objects.filter(user=staff).exists())
        response = self.complete({**CLAIMS, "email": "new@gmail.com", "email_verified": False})
        self.assertTrue(response.headers["Location"].endswith("google=failed"))
        self.assertEqual(User.objects.count(), 1)

    def test_existing_gmail_account_keeps_password_when_google_links(self):
        user = User.objects.create_user(CLAIMS["email"], CLAIMS["email"], "original-password")
        self.complete()
        self.assertEqual(GoogleIdentity.objects.get(subject=CLAIMS["sub"]).user, user)
        self.assertTrue(user.check_password("original-password"))

    def test_google_without_authority_for_email_does_not_link_existing_account(self):
        email = "traveller@example.org"
        User.objects.create_user(email, email, "original-password")
        response = self.complete({**CLAIMS, "email": email})
        self.assertTrue(response.headers["Location"].endswith("google=failed"))
        self.assertFalse(GoogleIdentity.objects.exists())

    def test_native_grant_requires_device_verifier_and_can_be_used_once(self):
        verifier = secrets.token_urlsafe(32)
        response = self.complete(device=challenge_for(verifier))
        self.assertTrue(response.headers["Location"].endswith("/auth/google/finish"))
        self.assertIsNone(self.client.get("/api/session").json()["email"])
        finish = self.client.get("/auth/google/finish")
        self.assertEqual(finish.headers["Cache-Control"], "no-store")
        self.assertNotIn("google_device_result", self.client.session)
        grant = GoogleDeviceGrant.objects.get()
        native = Client(HTTP_ORIGIN="https://localhost")
        handoff_url = finish.content.decode().split('href="', 1)[1].split('"', 1)[0]
        code = parse_qs(urlsplit(handoff_url).query)["code"][0]
        self.assertEqual(grant.digest, digest(code))
        self.assertEqual(native.post("/mobile/google/exchange", {
            "code": code, "verifier": secrets.token_urlsafe(32),
        }, content_type="application/json").status_code, 400)
        response = native.post("/mobile/google/exchange", {"code": code, "verifier": verifier}, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        native_token = response.json()["token"]
        self.assertEqual(native.post("/mobile/google/exchange", {
            "code": code, "verifier": verifier,
        }, content_type="application/json").status_code, 400)
        auth = {"HTTP_AUTHORIZATION": "Bearer " + native_token}
        self.assertEqual(native.get("/mobile/session", **auth).json()["email"], CLAIMS["email"])
        DeviceSession.objects.update(google_authenticated_at=timezone.now() - timedelta(minutes=11))
        self.assertEqual(native.post("/mobile/delete", {"confirm": True}, content_type="application/json", **auth).status_code, 403)
        DeviceSession.objects.update(google_authenticated_at=timezone.now())
        self.assertEqual(native.post("/mobile/delete", {"confirm": True}, content_type="application/json", **auth).status_code, 200)
        self.assertFalse(GoogleIdentity.objects.exists())
        self.assertFalse(DeviceSession.objects.exists())

    @override_settings(GOOGLE_SIGN_IN=False)
    def test_provider_is_unavailable_until_configured(self):
        self.assertFalse(self.client.get("/api/session").json()["googleSignIn"])
        self.assertTrue(self.client.get("/auth/google/start").headers["Location"].endswith("google=failed"))
