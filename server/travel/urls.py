from django.conf import settings
from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path
from django.utils.html import escape
from django.views.decorators.csrf import csrf_exempt

from . import api, cron, google_sign_in, search, trips
from .deployment import redirect_legacy_page


def shell(request):
    redirect = redirect_legacy_page(request)
    if redirect:
        return redirect
    index = settings.DIST / "index.html"
    if not index.is_file():
        return HttpResponse("Build the mobile client to serve this page.", status=503)
    html = index.read_text(encoding="utf-8").replace(
        "__TRAVEL_PUBLIC_ORIGIN__", escape(settings.PUBLIC_ORIGIN)
    ).replace("__TRAVEL_PAGE_URL__", escape(settings.PUBLIC_ORIGIN + request.path))
    response = HttpResponse(html, content_type="text/html; charset=utf-8")
    response["Cache-Control"] = "no-store"
    return response


endpoints = [
    ("flight-search", search.flights),
    ("approval-countries", search.approval_countries),
    ("approval", trips.create_approval),
    ("session", api.session),
    ("login", api.sign_in),
    ("activate", api.activate_invite),
    ("google/exchange", google_sign_in.exchange_device_grant),
    ("logout", api.sign_out),
    ("email", api.send_link),
    ("password", api.set_password),
    ("delete", api.delete_account),
    ("trips", trips.list_trips),
    ("trips/create", trips.create_trip),
    ("trips/<uuid:trip_id>", trips.detail),
    ("trips/<uuid:trip_id>/accept", trips.accept),
    ("trips/<uuid:trip_id>/messages", trips.message),
    ("trips/<uuid:trip_id>/history", trips.history),
    ("trips/<uuid:trip_id>/attachment", trips.attach),
]

# Device requests reject cookies and authenticate with an explicitly attached bearer token.
web = [path(route, view) for route, view in endpoints]
device = [path(route, csrf_exempt(view)) for route, view in endpoints]
urlpatterns = [
    path("auth/google/start", google_sign_in.begin),
    path("auth/google/callback", google_sign_in.callback),
    path("auth/google/finish", google_sign_in.finish),
    path("internal/cron/mail", cron.mail),
    path("internal/cron/prune", cron.prune),
    path("staff/", admin.site.urls),
    path("api/", include(web)),
    path("mobile/", include(device)),
] + [path(route, shell) for route in ("", "delete-account", "privacy", "terms")]
