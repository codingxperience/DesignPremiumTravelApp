import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def protect_google_tables(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "SELECT rolname FROM pg_roles WHERE rolname IN (%s, %s, %s)",
            ["anon", "authenticated", "service_role"],
        )
        role_names = [schema_editor.quote_name(row[0]) for row in cursor.fetchall()]
    roles = ", ".join(["PUBLIC", *role_names])
    for model_name in ("GoogleIdentity", "GoogleDeviceGrant"):
        table = schema_editor.quote_name(apps.get_model("travel", model_name)._meta.db_table)
        schema_editor.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        schema_editor.execute(f"REVOKE ALL ON {table} FROM {roles}")


class Migration(migrations.Migration):
    dependencies = [
        ("travel", "0005_traveller_profile"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="devicesession",
            name="google_authenticated_at",
            field=models.DateTimeField(null=True),
        ),
        migrations.CreateModel(
            name="GoogleIdentity",
            fields=[
                ("subject", models.CharField(max_length=255, primary_key=True, serialize=False)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="GoogleDeviceGrant",
            fields=[
                ("digest", models.CharField(max_length=64, primary_key=True, serialize=False)),
                ("challenge", models.CharField(max_length=43)),
                ("expires", models.DateTimeField(db_index=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.RunPython(protect_google_tables, migrations.RunPython.noop),
    ]
