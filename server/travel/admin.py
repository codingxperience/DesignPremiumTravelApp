from django import forms
from django.contrib import admin
from django.http import Http404, HttpResponse
from django.urls import path, reverse
from django.utils import timezone
from django.utils.html import format_html

from .models import (
    ApprovalCountry,
    Attachment,
    Confirmation,
    FlightTicket,
    Message,
    PublishedFlight,
    Quote,
    Trip,
)

admin.site.site_header = "Cross World · Travel desk"
admin.site.site_title = "Travel desk"


class QuoteForm(forms.ModelForm):
    class Meta:
        model = Quote
        fields = ["trip", "amount", "currency", "valid_until", "details"]

    def clean(self):
        values = super().clean()
        trip = values.get("trip")
        if trip:
            Trip.objects.select_for_update().get(pk=trip.pk)
            if trip.quotes.filter(accepted__isnull=False).exists():
                raise forms.ValidationError("This traveller already accepted a quote.")
        if values.get("valid_until") and values["valid_until"] < timezone.localdate():
            raise forms.ValidationError("Choose a current or future expiry date.")
        return values


class ImmutableAdmin(admin.ModelAdmin):
    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Quote)
class QuoteAdmin(ImmutableAdmin):
    form = QuoteForm
    list_display = ["trip", "amount", "currency", "valid_until", "accepted"]
    autocomplete_fields = ["trip"]


@admin.register(Message)
class MessageAdmin(ImmutableAdmin):
    list_display = ["trip", "staff", "created"]
    fields = ["trip", "body"]
    autocomplete_fields = ["trip"]

    def save_model(self, request, obj, form, change):
        obj.staff = True
        super().save_model(request, obj, form, change)


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ["destination", "service", "owner", "departure", "created"]
    list_filter = ["service", "attachment_requested"]
    search_fields = ["destination", "owner__email", "=id"]
    fields = [
        "id",
        "owner",
        "service",
        "destination",
        "travellers",
        "departure",
        "rooms",
        "phone",
        "preferred_currency",
        "flight_search",
        "ticket_link",
        "attachment_requested",
        "attachment_link",
    ]
    readonly_fields = [f for f in fields if f != "attachment_requested"]

    def has_add_permission(self, request):
        return False

    def get_urls(self):
        return [
            path(
                "<uuid:trip_id>/ticket/",
                self.admin_site.admin_view(self.ticket),
                name="travel_ticket",
            ),
            path(
                "<uuid:trip_id>/photo/",
                self.admin_site.admin_view(self.photo),
                name="travel_photo",
            ),
        ] + super().get_urls()

    def ticket_link(self, obj):
        ticket = FlightTicket.objects.filter(trip=obj).only("nationality").first()
        return (
            format_html(
                '<a href="{}">Flight ticket · {}</a>',
                reverse("admin:travel_ticket", args=[obj.pk]),
                ticket.nationality,
            )
            if ticket
            else "—"
        )

    def ticket(self, request, trip_id):
        if not self.has_view_permission(request) or not request.user.has_perm(
            "travel.view_flightticket"
        ):
            raise Http404
        ticket = FlightTicket.objects.filter(trip_id=trip_id).first()
        if not ticket:
            raise Http404
        response = HttpResponse(bytes(ticket.image), content_type="image/jpeg")
        response["Content-Disposition"] = 'attachment; filename="flight-ticket.jpg"'
        response["Cache-Control"] = "private, no-store"
        return response

    def attachment_link(self, obj):
        if obj and Attachment.objects.filter(trip=obj).exists():
            return format_html(
                '<a href="{}">Download submitted image</a>',
                reverse("admin:travel_photo", args=[obj.pk]),
            )
        return "No image submitted"

    def photo(self, request, trip_id):
        if not self.has_view_permission(request) or not request.user.has_perm(
            "travel.view_attachment"
        ):
            raise Http404
        attachment = Attachment.objects.filter(trip_id=trip_id).first()
        if not attachment:
            raise Http404
        response = HttpResponse(bytes(attachment.image), content_type="image/jpeg")
        response["Content-Disposition"] = 'attachment; filename="travel-image.jpg"'
        return response


class ConfirmationForm(forms.ModelForm):
    class Meta:
        model = Confirmation
        fields = ["trip", "supplier", "reference", "itinerary"]

    def clean_trip(self):
        trip = self.cleaned_data["trip"]
        Trip.objects.select_for_update().get(pk=trip.pk)
        if not trip.quotes.filter(accepted__isnull=False).exists():
            raise forms.ValidationError(
                "Record a supplier confirmation after the traveller accepts a quote."
            )
        return trip


@admin.register(Confirmation)
class ConfirmationAdmin(ImmutableAdmin):
    form = ConfirmationForm
    autocomplete_fields = ["trip"]
    list_display = ["trip", "supplier", "created"]


admin.site.register(ApprovalCountry)


@admin.register(PublishedFlight)
class FlightAdmin(admin.ModelAdmin):
    list_display = [
        "number",
        "origin",
        "destination",
        "date",
        "departure",
        "cabin",
        "stops",
        "published",
    ]
    list_filter = ["published", "cabin", "date"]
