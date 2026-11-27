import time

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import close_old_connections


class Command(BaseCommand):
    help = "Process account mail and prune expired records until the service stops."

    def handle(self, *args, **kwargs):
        next_cleanup = 0
        while True:
            close_old_connections()
            call_command("deliver_mail")
            if time.monotonic() >= next_cleanup:
                call_command("prune_travel")
                next_cleanup = time.monotonic() + 3600
            time.sleep(10)
