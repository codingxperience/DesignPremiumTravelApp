import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def protect_profile_table(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    table = schema_editor.quote_name(apps.get_model("travel", "TravellerProfile")._meta.db_table)
    schema_editor.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
    schema_editor.execute(f"REVOKE ALL ON {table} FROM PUBLIC")
    for role in ("anon", "authenticated", "service_role"):
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", [role])
            exists = cursor.fetchone()
        if exists:
            schema_editor.execute(f"REVOKE ALL ON {table} FROM {schema_editor.quote_name(role)}")


class Migration(migrations.Migration):
    dependencies = [
        ("travel", "0004_service_search_and_approval"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]
    operations = [
        migrations.CreateModel(
            name="TravellerProfile",
            fields=[
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, serialize=False, to=settings.AUTH_USER_MODEL)),
                ("full_name", models.CharField(max_length=150)),
                ("phone", models.CharField(max_length=16)),
                ("terms_accepted_at", models.DateTimeField()),
            ],
        ),
        migrations.RunPython(protect_profile_table, migrations.RunPython.noop),
    ]
