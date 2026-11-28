import hmac
import json
import secrets
from datetime import timedelta
from functools import wraps
from itertools import batched

from django.conf import settings
from django.contrib.admin.models import LogEntry
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from .models import (
    Confirmation,
    DeviceSession,
    EmailDelivery,
    EmailLink,
    Message,
    Quote,
    Trip,
)
from .security import allowance, digest, remote

User = get_user_model()


class Invalid(Exception):
    def __init__(self, message, status=400):
        self.message, self.status = message, status


def fields(data, required):
    if set(data) != set(required):
        raise Invalid("Check the fields and try again.")


def text(value, minimum, maximum):
    if (
        not isinstance(value, str)
        or not minimum <= len(value.strip()) <= maximum
        or any(ord(c) < 32 and c not in "\n\r" for c in value)
    ):
        raise Invalid("Check the text and try again.")
    return value.strip()


def email_address(value):
    try:
        value = text(value, 3, 150).lower()
        validate_email(value)
    except (Invalid, ValidationError) as error:
        raise Invalid("Enter a valid email address.") from error
    return value


def account_exists(email):
    return User.objects.filter(Q(username__iexact=email) | Q(email__iexact=email)).exists()


def endpoint(method, private=False, upload=False):
    def decorate(fn):
        @require_http_methods([method])
        @wraps(fn)
        def view(request, **kwargs):
            try:
                request.native = request.path.startswith("/mobile/")
                actor = (
                    request.user
                    if request.user.is_authenticated and not request.native
                    else None
                )
                if request.native:
                    header = request.headers.get("Authorization", "")
                    if header.startswith("Bearer ") and len(header) < 128:
                        session = (
                            DeviceSession.objects.select_related("user")
                            .filter(
                                pk=digest(header[7:]),
                                expires__gt=timezone.now(),
                                user__is_active=True,
                            )
                            .first()
                        )
                        if session and hmac.compare_digest(
                            session.auth_hash, session.user.get_session_auth_hash()
                        ):
                            actor = session.user
                request.actor = actor
                if private and not actor:
                    raise Invalid("Sign in to continue.", 401)
                data = {}
                if method == "POST" and not upload:
                    if request.content_type != "application/json":
                        raise Invalid("JSON required.", 415)
                    if (
                        int(request.META.get("CONTENT_LENGTH") or 0) > 10000
                        or len(request.body) > 10000
                    ):
                        raise Invalid("Request is too large.", 413)
                    try:
                        data = json.loads(request.body)
                    except (ValueError, UnicodeError):
                        raise Invalid("Invalid request.")
                    if not isinstance(data, dict):
                        raise Invalid("Invalid request.")
                return JsonResponse(fn(request, data, **kwargs))
            except Invalid as exc:
                return JsonResponse({"error": exc.message}, status=exc.status)
            except ValidationError as exc:
                return JsonResponse({"error": " ".join(exc.messages)}, status=400)

        return view

    return decorate


@endpoint("GET")
def session(request, data):
    return {
        "email": request.actor.email if request.actor else None,
        "csrf": None if request.native else get_token(request),
        "inviteOnly": settings.INVITE_ONLY,
    }


@endpoint("POST")
def sign_in(request, data):
    fields(data, ["email", "password"])
    email = email_address(data["email"])
    password = data["password"]
    if not isinstance(password, str) or len(password) > 256:
        raise Invalid("Check your email and password.", 401)
    if not allowance("login-account", email, 8, 600):
        return slow_error()
    user = authenticate(request, username=email, password=password)
    if not user:
        raise Invalid("Check your email and password.", 401)
    return start_session(request, user)


def start_session(request, user):
    if request.native:
        token = secrets.token_urlsafe(32)
        DeviceSession.objects.create(
            digest=digest(token),
            user=user,
            auth_hash=user.get_session_auth_hash(),
            expires=timezone.now() + timedelta(seconds=settings.SESSION_COOKIE_AGE),
        )
        return {"email": user.email, "token": token}
    login(request, user)
    return {"email": user.email, "csrf": get_token(request)}


@endpoint("POST")
def activate_invite(request, data):
    if not settings.INVITE_ONLY:
        raise Invalid("Use the email link to create your account.", 403)
    fields(data, ["email", "code", "password"])
    if not allowance("redeem", remote(request), 15, 600):
        slow_error()

    address = email_address(data["email"])
    try:
        code = text(data["code"], 32, 32)
    except Invalid as error:
        raise Invalid("Enter the 32-character invite code from the travel desk.") from error
    password = data["password"]
    if not isinstance(password, str) or len(password) > 256:
        raise Invalid("Password must be at most 256 characters.")

    unavailable = "That invite could not be used. Check the email and code or ask the travel desk for a new invite."
    with transaction.atomic():
        invitation = EmailLink.objects.select_for_update().filter(
            email=address, digest=digest(code), purpose="invite", expires__gt=timezone.now()
        ).first()
        if invitation is None or account_exists(address):
            raise Invalid(unavailable)

        user = User(username=address, email=address)
        try:
            validate_password(password, user)
        except ValidationError as error:
            first = error.error_list[0]
            messages = {
                "password_too_short": "Use at least 12 characters for your password.",
                "password_too_common": "Choose a less common password.",
                "password_entirely_numeric": "Add letters to your password so it is not all numbers.",
                "password_too_similar": "Choose a password that is different from your email address.",
            }
            raise Invalid(messages.get(first.code, first.messages[0])) from error
        user.set_password(password)
        user, created = User.objects.get_or_create(
            username=address, defaults={"email": address, "password": user.password}
        )
        if not created:
            raise Invalid(unavailable)
        invitation.delete()
        return start_session(request, user)


def slow_error():
    raise Invalid("Too many attempts. Try again later.", 429)


@endpoint("POST")
def sign_out(request, data):
    fields(data, [])
    if request.native:
        DeviceSession.objects.filter(
            pk=digest(request.headers.get("Authorization", "")[7:])
        ).delete()
    else:
        logout(request)
    return {}


@endpoint("POST")
def send_link(request, data):
    if settings.INVITE_ONLY:
        raise Invalid("Account email is unavailable during testing.", 503)
    fields(data, ["email", "purpose"])
    email = email_address(data["email"])
    purpose = data["purpose"]
    if purpose not in ("register", "reset"):
        raise Invalid("Unknown email request.")
    if not allowance("email-ip", remote(request), 15, 900):
        slow_error()
    # Both purposes give the same response; mailbox ownership is required to choose a password.
    if not allowance("email-address", email, 3, 900):
        return {}
    EmailDelivery.objects.create(email=email, purpose=purpose, due=timezone.now())
    return {}


@endpoint("POST")
def set_password(request, data):
    if settings.INVITE_ONLY:
        raise Invalid("Account email is unavailable during testing.", 503)
    fields(data, ["token", "password"])
    if not allowance("redeem", remote(request), 15, 600):
        slow_error()
    raw = text(data["token"], 20, 100)
    password = data["password"]
    if not isinstance(password, str) or len(password) > 256:
        raise Invalid("Password must be at most 256 characters.")
    with transaction.atomic():
        link = (
            EmailLink.objects.select_for_update()
            .filter(digest=digest(raw), purpose__in=("register", "reset"), expires__gt=timezone.now())
            .first()
        )
        if not link:
            raise Invalid("This link has expired or has already been used.")
        user = User.objects.select_for_update().filter(username=link.email).first()
        if (link.purpose == "register" and user) or (
            link.purpose == "reset" and (not user or not user.is_active)
        ):
            raise Invalid("Request a fresh email link.")
        if not user:
            user = User(username=link.email, email=link.email)
        validate_password(password, user)
        user.set_password(password)
        user.save()
        DeviceSession.objects.filter(user=user).delete()
        EmailLink.objects.filter(email=link.email).delete()
    return {}


@endpoint("POST", private=True)
def delete_account(request, data):
    fields(data, ["password"])
    if not allowance("delete", str(request.actor.pk), 5, 600):
        slow_error()
    password = data["password"]
    if (
        not isinstance(password, str)
        or len(password) > 256
        or not request.actor.check_password(password)
    ):
        raise Invalid("Check your current password.", 403)
    if request.actor.is_staff or request.actor.is_superuser:
        raise Invalid("Staff accounts are managed by the agency.", 403)
    with transaction.atomic():
        trips = Trip.objects.filter(owner=request.actor)
        for rows in (
            trips,
            Quote.objects.filter(trip__owner=request.actor),
            Message.objects.filter(trip__owner=request.actor),
            Confirmation.objects.filter(trip__owner=request.actor),
        ):
            # Django admin stores a human-readable copy of the object's name in its audit log.
            # UUID strings are formatted differently by SQLite and PostgreSQL, so use the field's Python representation.
            ids = (
                str(value)
                for value in rows.values_list("pk", flat=True).iterator(chunk_size=200)
            )
            for batch in batched(ids, 200):
                LogEntry.objects.filter(
                    content_type=ContentType.objects.get_for_model(rows.model),
                    object_id__in=batch,
                ).delete()
        EmailLink.objects.filter(email=request.actor.email).delete()
        EmailDelivery.objects.filter(email=request.actor.email).delete()
        request.actor.delete()
        if not request.native:
            logout(request)
    return {}
