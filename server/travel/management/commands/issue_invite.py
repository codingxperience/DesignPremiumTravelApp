import secrets
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from travel.api import Invalid, account_exists, email_address
from travel.models import EmailLink
from travel.security import digest


class Command(BaseCommand):
    help = "Issue a single-use account setup code for an invite-only traveller."

    def add_arguments(self, parser):
        parser.add_argument("email")

    def handle(self, *args, **options):
        if not settings.INVITE_ONLY:
            raise CommandError("Enable invite-only mode before issuing an invite.")
        try:
            address = email_address(options["email"])
        except Invalid as error:
            raise CommandError(error.message) from error
        if account_exists(address):
            raise CommandError("This email already belongs to an account.")

        code = secrets.token_urlsafe(24)
        EmailLink.objects.update_or_create(
            email=address,
            defaults={
                "digest": digest(code),
                "expires": timezone.now() + timedelta(hours=24),
                "purpose": "invite",
            },
        )
        self.stdout.write(code)
