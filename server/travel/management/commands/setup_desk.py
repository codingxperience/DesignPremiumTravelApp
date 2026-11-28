from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Create the permissions group for agency operators."

    @transaction.atomic
    def handle(self, *args, **kwargs):
        role, _ = Group.objects.get_or_create(name="Travel desk")
        names = [
            "view_trip",
            "change_trip",
            "view_quote",
            "add_quote",
            "view_message",
            "add_message",
            "view_attachment",
            "view_flightticket",
            "view_approvalcountry",
            "add_approvalcountry",
            "delete_approvalcountry",
            "view_publishedflight",
            "add_publishedflight",
            "change_publishedflight",
            "delete_publishedflight",
            "add_confirmation",
            "view_confirmation",
        ]
        role.permissions.set(
            Permission.objects.filter(
                content_type__app_label="travel", codename__in=names
            )
        )
