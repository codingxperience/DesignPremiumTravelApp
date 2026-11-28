from hmac import compare_digest

from django.conf import settings
from django.core.management import call_command
from django.http import HttpResponse
from django.views.decorators.http import require_GET


def _authorized(request):
    secret = getattr(settings, "CRON_SECRET", "")
    authorization = request.headers.get("Authorization", "")
    expected = f"Bearer {secret}"
    return bool(secret) and len(authorization) <= len(expected) and compare_digest(
        authorization.encode("utf-8"), expected.encode("utf-8")
    )


@require_GET
def mail(request):
    if not _authorized(request):
        return HttpResponse(status=404)

    call_command("deliver_mail", limit=5)
    return HttpResponse(status=204)


@require_GET
def prune(request):
    if not _authorized(request):
        return HttpResponse(status=404)

    call_command("prune_travel")
    return HttpResponse(status=204)
