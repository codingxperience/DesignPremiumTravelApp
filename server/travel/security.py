import hashlib
import hmac
import ipaddress
import time
from datetime import datetime, timezone

from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.http import HttpResponse, JsonResponse
from django.utils.cache import patch_vary_headers

from .models import Window


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def remote(request):
    value = (
        request.META.get("HTTP_X_VERCEL_FORWARDED_FOR", "")
        if settings.VERCEL
        else request.META.get("REMOTE_ADDR", "")
    )
    try:
        return str(ipaddress.ip_address(value))
    except ValueError:
        return "unknown"


def allowance(scope, identity, maximum, seconds):
    bucket = int(time.time()) // seconds
    key = hmac.new(
        settings.SECRET_KEY.encode(),
        f"{scope}:{identity}:{bucket}".encode(),
        hashlib.sha256,
    ).hexdigest()
    expires = datetime.fromtimestamp((bucket + 1) * seconds, timezone.utc)
    with transaction.atomic():
        Window.objects.get_or_create(key=key, defaults={"expires": expires})
        return bool(
            Window.objects.filter(pk=key, count__lt=maximum).update(
                count=F("count") + 1
            )
        )


def slow(seconds):
    response = JsonResponse(
        {"error": "Too many attempts. Try again later."}, status=429
    )
    response["Retry-After"] = str(seconds - int(time.time()) % seconds)
    return response


class Boundaries:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        native = request.path.startswith("/mobile/")
        origin = request.headers.get("Origin")
        if native and (
            request.COOKIES or (origin and origin not in settings.NATIVE_ORIGINS)
        ):
            return JsonResponse({"error": "Device request denied."}, status=403)
        if native and request.method == "OPTIONS":
            response = HttpResponse(status=204)
        elif (
            request.method == "POST"
            and request.path in ("/api/login", "/mobile/login", "/staff/login/")
            and not allowance("login-ip", remote(request), 40, 600)
        ):
            response = slow(600)
        elif (
            request.method == "POST"
            and request.path == "/staff/login/"
            and not allowance(
                "login-account",
                request.POST.get("username", "").strip().lower()[:254],
                8,
                600,
            )
        ):
            response = slow(600)
        elif request.path.startswith(("/api/", "/mobile/")) and not allowance(
            "traffic", remote(request), 300, 60
        ):
            response = slow(60)
        else:
            response = self.get_response(request)
        if native and origin in settings.NATIVE_ORIGINS:
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
            patch_vary_headers(response, ["Origin"])
        if request.path.startswith(
            ("/api/", "/mobile/", "/staff/", "/internal/cron/")
        ):
            response["Cache-Control"] = "no-store"
        if request.path.startswith("/staff/"):
            # Preserve same-origin request metadata for Django's CSRF checks.
            response["Referrer-Policy"] = "same-origin"
        response["Permissions-Policy"] = (
            "geolocation=(), camera=(), microphone=(), payment=()"
        )
        response["Content-Security-Policy"] = "; ".join(
            [
                "default-src 'self'",
                "script-src 'self'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data:",
                "connect-src 'self'",
                "font-src 'self'",
                "object-src 'none'",
                "base-uri 'none'",
                "form-action 'self'",
                "frame-ancestors 'none'",
            ]
        )
        return response
