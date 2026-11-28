from django.contrib.sessions.models import Session
from django.core.management.base import BaseCommand
from django.utils import timezone

from travel.models import DeviceSession, EmailLink, GoogleDeviceGrant, Window


class Command(BaseCommand):
    help = "Purge expired authentication, throttling and session data."

    def handle(self, *args, **kwargs):
        for model in (DeviceSession, EmailLink, GoogleDeviceGrant, Window):
            model.objects.filter(expires__lte=timezone.now()).delete()
        Session.objects.filter(expire_date__lte=timezone.now()).delete()
