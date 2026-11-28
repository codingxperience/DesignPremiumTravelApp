import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, RegexValidator
from django.db import models
from django.db.models import Q


class Window(models.Model):
    key = models.CharField(primary_key=True, max_length=64)
    expires = models.DateTimeField(db_index=True)
    count = models.PositiveIntegerField(default=0)


class EmailLink(models.Model):
    digest = models.CharField(unique=True, max_length=64)
    email = models.EmailField(primary_key=True)
    purpose = models.CharField(max_length=12)
    expires = models.DateTimeField(db_index=True)


class DeviceSession(models.Model):
    digest = models.CharField(primary_key=True, max_length=64)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    auth_hash = models.CharField(max_length=128)
    expires = models.DateTimeField(db_index=True)


class TravellerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, primary_key=True, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=16)
    terms_accepted_at = models.DateTimeField()


class Trip(models.Model):
    SERVICES = [
        (s, s.title())
        for s in ("flight", "hotel", "holiday", "visa", "umrah", "egypt", "approval")
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    client_id = models.UUIDField()
    service = models.CharField(max_length=12, choices=SERVICES)
    destination = models.CharField(max_length=120)
    departure = models.DateField()
    travellers = models.PositiveSmallIntegerField()
    created = models.DateTimeField(auto_now_add=True)
    attachment_requested = models.BooleanField(default=False)
    phone = models.CharField(max_length=16, blank=True)
    preferred_currency = models.CharField(max_length=3, blank=True)
    rooms = models.PositiveSmallIntegerField(null=True, blank=True)
    flight_search = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created", "id"]
        indexes = [models.Index(fields=["owner", "-created", "id"])]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "client_id"], name="trip_owner_retry"
            ),
            models.CheckConstraint(
                condition=Q(travellers__gte=1, travellers__lte=9),
                name="trip_group_size",
            ),
        ]

    def __str__(self):
        return f"{self.get_service_display()} · {self.destination}"


class Quote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="quotes")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(
        max_length=3,
        choices=[
            (c, c) for c in ("USD", "GBP", "EUR", "UGX", "KES", "SAR", "EGP", "AED")
        ],
    )
    details = models.CharField(max_length=1000)
    valid_until = models.DateField()
    created = models.DateTimeField(auto_now_add=True)
    accepted = models.DateTimeField(null=True, blank=True, editable=False)

    class Meta:
        ordering = ["-created"]
        constraints = [
            models.CheckConstraint(condition=Q(amount__gt=0), name="quote_positive"),
            models.UniqueConstraint(
                fields=["trip"],
                condition=Q(accepted__isnull=False),
                name="one_accepted_quote",
            ),
        ]


class Message(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="messages")
    body = models.CharField(max_length=1000)
    staff = models.BooleanField(default=False, editable=False)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created", "id"]


class Attachment(models.Model):
    trip = models.OneToOneField(
        Trip, on_delete=models.CASCADE, related_name="attachment"
    )
    image = models.BinaryField()
    created = models.DateTimeField(auto_now=True)


class EmailDelivery(models.Model):
    email = models.EmailField(db_index=True)
    purpose = models.CharField(max_length=12)
    due = models.DateTimeField(db_index=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    lease = models.UUIDField(null=True)
    created = models.DateTimeField(auto_now_add=True)


class Confirmation(models.Model):
    trip = models.OneToOneField(Trip, on_delete=models.CASCADE)
    supplier = models.CharField(max_length=120)
    reference = models.CharField(max_length=100)
    itinerary = models.TextField(max_length=4000)
    created = models.DateTimeField(auto_now_add=True)


class ApprovalCountry(models.Model):
    code = models.CharField(
        primary_key=True,
        max_length=2,
        validators=[
            RegexValidator(r"^[A-Z]{2}$", "Enter an uppercase ISO country code.")
        ],
        verbose_name="Passport country code",
    )

    def __str__(self):
        return self.code


class FlightTicket(models.Model):
    trip = models.OneToOneField(Trip, on_delete=models.CASCADE)
    nationality = models.CharField(max_length=2)
    image = models.BinaryField()
    digest = models.CharField(max_length=64)


class PublishedFlight(models.Model):
    origin = models.CharField(max_length=3, validators=[RegexValidator(r"^[A-Z]{3}$")])
    destination = models.CharField(
        max_length=3, validators=[RegexValidator(r"^[A-Z]{3}$")]
    )
    date = models.DateField()
    departure = models.TimeField(help_text="Local time at the origin airport")
    airline = models.CharField(max_length=80)
    number = models.CharField(max_length=12)
    cabin = models.CharField(
        max_length=10,
        choices=[(c, c) for c in ("economy", "premium", "business", "first")],
    )
    stops = models.PositiveSmallIntegerField(validators=[MaxValueValidator(10)])
    duration = models.PositiveSmallIntegerField(help_text="Duration in minutes")
    published = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["origin", "destination", "date", "published"])]
        ordering = ["departure", "pk"]
