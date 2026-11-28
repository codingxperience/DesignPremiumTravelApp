from django.conf import settings
from django.contrib import admin
from django.http import FileResponse, HttpResponse
from django.urls import include, path
from django.views.decorators.csrf import csrf_exempt

from . import api, cron, search, trips


def shell(request):
    index = settings.DIST / "index.html"
    if not index.is_file():
        return HttpResponse("Build the mobile client to serve this page.", status=503)
    response = FileResponse(index.open("rb"), content_type="text/html; charset=utf-8")
    response["Cache-Control"] = "no-store"
    return response


endpoints = [
    ("flight-search", search.flights),
    ("approval-countries", search.approval_countries),
    ("approval", trips.create_approval),
    ("session", api.session),
    ("login", api.sign_in),
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
    path("internal/cron/mail", cron.mail),
    path("internal/cron/prune", cron.prune),
    path("staff/", admin.site.urls),
    path("api/", include(web)),
    path("mobile/", include(device)),
] + [path(route, shell) for route in ("", "delete-account", "privacy", "terms")]
