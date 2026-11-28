import base64
import hashlib
import hmac
import logging
import re
import secrets
from datetime import timedelta
from functools import partial
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import HttpResponse, HttpResponseRedirect
from django.utils import timezone
from django.utils.html import format_html
from django.views.decorators.http import require_GET
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request
from google.oauth2.id_token import verify_oauth2_token

from .api import Invalid, User, email_address, endpoint, fields, slow_error, start_session
from .deployment import redirect_legacy_page
from .models import GoogleDeviceGrant, GoogleIdentity
from .security import allowance, digest, remote

logger = logging.getLogger(__name__)
AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
APP_CALLBACK = "com.crossworldtravelagency.travel://auth/google"
ATTEMPT_TTL = timedelta(minutes=10)
GRANT_TTL = timedelta(minutes=2)
VALUE = re.compile(r"^[A-Za-z0-9_-]{43}$")


def challenge_for(value):
    sha256 = hashlib.sha256(value.encode("ascii")).digest()
    return base64.urlsafe_b64encode(sha256).decode("ascii").rstrip("=")


def reply(response):
    response["Cache-Control"] = "no-store"
    response["Referrer-Policy"] = "no-referrer"
    return response


def redirect(path):
    return reply(HttpResponseRedirect(settings.PUBLIC_ORIGIN + path))


def failed():
    return redirect("/#account?google=failed")


def callback_url():
    return settings.PUBLIC_ORIGIN + "/auth/google/callback"


@require_GET
def begin(request):
    legacy = redirect_legacy_page(request)
    if legacy:
        return legacy
    if not settings.GOOGLE_SIGN_IN or not allowance("google-start", remote(request), 15, 600):
        return failed()
    challenge = request.GET.get("device", "")
    if challenge and not VALUE.fullmatch(challenge):
        return failed()

    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    verifier = secrets.token_urlsafe(32)
    request.session.pop("google_device_result", None)
    request.session["google_attempt"] = {
        "state": state,
        "nonce": nonce,
        "verifier": verifier,
        "device": challenge,
        "issued": timezone.now().timestamp(),
    }
    query = urlencode({
        "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
        "redirect_uri": callback_url(),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "nonce": nonce,
        "code_challenge": challenge_for(verifier),
        "code_challenge_method": "S256",
        "prompt": "select_account",
    })
    return reply(HttpResponseRedirect(AUTHORIZATION_URL + "?" + query))


def google_claims(code, attempt):
    response = requests.post(
        TOKEN_URL,
        data={
            "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
            "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET,
            "redirect_uri": callback_url(),
            "grant_type": "authorization_code",
            "code": code,
            "code_verifier": attempt["verifier"],
        },
        timeout=10,
        allow_redirects=False,
    )
    if response.status_code != 200:
        raise ValueError("Google rejected the authorization code.")
    payload = response.json()
    token = payload.get("id_token") if isinstance(payload, dict) else None
    if not isinstance(token, str):
        raise ValueError("Google returned no identity token.")
    transport = partial(Request(), timeout=10)
    claims = verify_oauth2_token(token, transport, audience=settings.GOOGLE_OAUTH_CLIENT_ID)
    nonce = claims.get("nonce")
    if not isinstance(nonce, str) or not VALUE.fullmatch(nonce) or not hmac.compare_digest(nonce, attempt["nonce"]):
        raise ValueError("Google nonce mismatch.")
    return claims


def traveller_for(claims):
    if claims.get("email_verified") is not True:
        raise ValueError("Google did not verify the email.")
    subject = claims.get("sub")
    if not isinstance(subject, str) or not 1 <= len(subject) <= 255:
        raise ValueError("Invalid Google subject.")
    email = email_address(claims.get("email"))

    with transaction.atomic():
        linked = GoogleIdentity.objects.select_related("user").filter(pk=subject).first()
        if linked:
            user = linked.user
        else:
            matching = list(
                User.objects.select_for_update().filter(Q(username__iexact=email) | Q(email__iexact=email))[:2]
            )
            if len(matching) > 1:
                raise ValueError("Ambiguous account match.")
            if matching:
                user = matching[0]
                authoritative = email.endswith("@gmail.com") or claims.get("hd") == email.rsplit("@", 1)[1]
                if not authoritative or GoogleIdentity.objects.filter(user=user).exists():
                    raise ValueError("Account could not be linked.")
            else:
                user = User(
                    username=email, email=email,
                    first_name=clean_name(claims.get("given_name")),
                    last_name=clean_name(claims.get("family_name")),
                )
                user.set_unusable_password()
                user.save(force_insert=True)
            check_traveller(user)
            GoogleIdentity.objects.create(subject=subject, user=user)
        check_traveller(user)
        return user


def clean_name(value):
    if not isinstance(value, str):
        return ""
    return "".join(character for character in value if character.isprintable()).strip()[:150]


def check_traveller(user):
    if not user.is_active or user.is_staff or user.is_superuser:
        raise ValueError("Google sign-in is available to active traveller accounts.")


@require_GET
def callback(request):
    attempt = request.session.pop("google_attempt", None)
    state = request.GET.get("state", "")
    code = request.GET.get("code", "")
    if (
        not settings.GOOGLE_SIGN_IN
        or not attempt
        or not VALUE.fullmatch(state)
        or not hmac.compare_digest(state, attempt["state"])
        or not 0 <= timezone.now().timestamp() - attempt["issued"] <= ATTEMPT_TTL.total_seconds()
        or not 0 < len(code) <= 2048
    ):
        return failed()

    try:
        user = traveller_for(google_claims(code, attempt))
    except (ValueError, Invalid, IntegrityError, GoogleAuthError, requests.RequestException):
        logger.warning("Google sign-in did not complete.")
        return failed()

    if attempt["device"]:
        handoff = secrets.token_urlsafe(32)
        GoogleDeviceGrant.objects.create(
            digest=digest(handoff),
            challenge=attempt["device"],
            user=user,
            expires=timezone.now() + GRANT_TTL,
        )
        request.session["google_device_result"] = handoff
        return redirect("/auth/google/finish")

    request.native = False
    start_session(request, user, google=True)
    return redirect("/#account?google=done")


@require_GET
def finish(request):
    handoff = request.session.pop("google_device_result", "")
    if not handoff:
        return failed()
    app_url = APP_CALLBACK + "?" + urlencode({"code": handoff})
    body = format_html(
        '<!doctype html><html lang="en"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>Cross World Travel</title><main><h1>Sign-in complete</h1>'
        '<p><a href="{}">Continue in Cross World Travel</a></p></main></html>',
        app_url,
    )
    return reply(HttpResponse(body, headers={"Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'"}))


@endpoint("POST")
def exchange_device_grant(request, data):
    if not settings.GOOGLE_SIGN_IN or not request.native:
        raise Invalid("Google sign-in is unavailable.", 403)
    if not allowance("google-exchange", remote(request), 20, 600):
        slow_error()
    fields(data, ["code", "verifier"])
    code, verifier = data["code"], data["verifier"]
    if (
        not isinstance(code, str) or not VALUE.fullmatch(code)
        or not isinstance(verifier, str) or not VALUE.fullmatch(verifier)
    ):
        raise Invalid("Start Google sign-in again.")
    with transaction.atomic():
        grant = (
            GoogleDeviceGrant.objects.select_for_update().select_related("user")
            .filter(pk=digest(code), expires__gt=timezone.now()).first()
        )
        if not grant or not hmac.compare_digest(grant.challenge, challenge_for(verifier)):
            raise Invalid("Start Google sign-in again.")
        user = grant.user
        if not user.is_active or user.is_staff or user.is_superuser:
            raise Invalid("Start Google sign-in again.")
        grant.delete()
        return start_session(request, user, google=True)
