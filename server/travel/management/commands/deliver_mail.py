import logging
import secrets
from datetime import timedelta
from smtplib import SMTPException
from uuid import uuid4

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.utils import timezone

from travel.models import EmailDelivery, EmailLink
from travel.security import digest

log = logging.getLogger(__name__)


def claim():
    now = timezone.now()
    with transaction.atomic():
        pending = EmailDelivery.objects.select_for_update(
            skip_locked=connection.features.has_select_for_update_skip_locked
        )
        job = pending.filter(due__lte=now).order_by("due", "pk").first()
        if job:
            job.lease, job.due = uuid4(), now + timedelta(minutes=2)
            job.attempts += 1
            job.save(update_fields=["lease", "due", "attempts"])
        return job


def deliver(job):
    current = EmailDelivery.objects.filter(pk=job.pk, lease=job.lease)
    with transaction.atomic():
        if not current.select_for_update().exists():
            return
        exists = (
            get_user_model().objects.filter(username=job.email, is_active=True).exists()
        )
        if (
            job.purpose == "reset"
        ) != exists or job.created < timezone.now() - timedelta(minutes=30):
            current.delete()
            return
        token = secrets.token_urlsafe(32)
        EmailLink.objects.update_or_create(
            email=job.email,
            defaults={
                "purpose": job.purpose,
                "digest": digest(token),
                "expires": timezone.now()
                + timedelta(seconds=settings.PASSWORD_RESET_TIMEOUT),
            },
        )
    try:
        send_mail(
            "Choose your Cross World Travel password",
            f"Open this link in your browser within 30 minutes:\n{settings.PUBLIC_ORIGIN}/#setup={token}\nIf you did not request this, ignore this email.",
            settings.DEFAULT_FROM_EMAIL,
            [job.email],
        )
    except (OSError, SMTPException):
        EmailLink.objects.filter(digest=digest(token)).delete()
        log.warning("Account email delivery failed (attempt %d).", job.attempts)
        if job.attempts >= 4:
            current.delete()
        else:
            current.update(
                due=timezone.now() + timedelta(minutes=2**job.attempts), lease=None
            )
    else:
        current.delete()


class Command(BaseCommand):
    help = "Deliver up to 100 pending account emails. Run at least once a minute."

    def handle(self, *args, **kwargs):
        for _ in range(100):
            job = claim()
            if not job:
                break
            deliver(job)
