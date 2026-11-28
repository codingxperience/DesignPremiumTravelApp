import os
from pathlib import Path
from urllib.parse import urlsplit

from django.core.exceptions import ImproperlyConfigured
from django.core.management.utils import get_random_secret_key

from .database import database_config_from_url, selected_database_url
from .deployment import deployment_security_settings, validate_smtp_settings

BASE = Path(__file__).resolve().parents[1]
LOCAL = os.environ.get("TRAVEL_ENV") == "local"
VERCEL = os.environ.get("VERCEL") == "1"
INVITE_ONLY = os.environ.get("TRAVEL_INVITE_ONLY") == "1"
CRON_SECRET = os.environ.get("CRON_SECRET", "")
if VERCEL and len(CRON_SECRET) < 32:
    raise ImproperlyConfigured("Set CRON_SECRET to at least 32 random characters.")
DEBUG = False
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")
if LOCAL and not SECRET_KEY:
    key_file = BASE / ".local-key"
    try:
        with key_file.open("x") as output:
            output.write(get_random_secret_key())
    except FileExistsError:
        pass
    SECRET_KEY = key_file.read_text()
if len(SECRET_KEY) < 50:
    raise ImproperlyConfigured(
        "Set DJANGO_SECRET_KEY to a random secret of at least 50 characters."
    )
PUBLIC_ORIGIN = os.environ.get(
    "PUBLIC_ORIGIN", "http://localhost:8000" if LOCAL else ""
).rstrip("/")
origin = urlsplit(PUBLIC_ORIGIN)
if (
    not origin.hostname
    or origin.username
    or origin.password
    or origin.query
    or origin.fragment
    or origin.path
    or (not LOCAL and origin.scheme != "https")
):
    raise ImproperlyConfigured("Set PUBLIC_ORIGIN to the public HTTPS origin.")
try:
    deployment_security = deployment_security_settings(
        PUBLIC_ORIGIN,
        os.environ.get("VERCEL_URL", ""),
        vercel=VERCEL,
    )
except ValueError as error:
    raise ImproperlyConfigured(str(error)) from error
ALLOWED_HOSTS = deployment_security["ALLOWED_HOSTS"] + (
    ["127.0.0.1", "localhost"] if LOCAL else []
)
CSRF_TRUSTED_ORIGINS = deployment_security["CSRF_TRUSTED_ORIGINS"] + (
    ["http://localhost:5173", "http://127.0.0.1:5173"] if LOCAL else []
)
if VERCEL:
    SECURE_PROXY_SSL_HEADER = deployment_security["SECURE_PROXY_SSL_HEADER"]
NATIVE_ORIGINS = {"capacitor://localhost", "https://localhost"}
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "travel",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "travel.security.Boundaries",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "travel.urls"
WSGI_APPLICATION = "travel.wsgi.application"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]
if not LOCAL and os.environ.get("PGSSLMODE", "verify-full") != "verify-full":
    raise ImproperlyConfigured(
        "Production database connections require verify-full TLS."
    )
MIGRATION_MODE = os.environ.get("TRAVEL_MIGRATIONS") == "1"
try:
    database_url = selected_database_url(
        os.environ.get("DATABASE_URL", ""),
        os.environ.get("DIRECT_URL", ""),
        migrations=MIGRATION_MODE,
    )
except ValueError as error:
    raise ImproperlyConfigured(str(error)) from error
if database_url:
    try:
        DATABASES = {
            "default": database_config_from_url(
                database_url,
                sslmode=os.environ.get("PGSSLMODE", "verify-full"),
                serverless=VERCEL and not MIGRATION_MODE,
            )
        }
    except ValueError as error:
        raise ImproperlyConfigured(str(error)) from error
    root_certificate = os.environ.get("PGSSLROOTCERT")
    if root_certificate:
        DATABASES["default"]["OPTIONS"]["sslrootcert"] = root_certificate
elif LOCAL and not os.environ.get("PGDATABASE"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE / "local.sqlite3",
            "OPTIONS": {"transaction_mode": "IMMEDIATE", "timeout": 10},
        }
    }
elif all(os.environ.get(name) for name in ("PGDATABASE", "PGUSER", "PGHOST", "PGPASSWORD")):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ["PGDATABASE"],
            "USER": os.environ["PGUSER"],
            "HOST": os.environ["PGHOST"],
            "PASSWORD": os.environ["PGPASSWORD"],
            "PORT": os.environ.get("PGPORT", "5432"),
            "CONN_MAX_AGE": 60,
            "CONN_HEALTH_CHECKS": True,
            "OPTIONS": {"sslmode": os.environ.get("PGSSLMODE", "verify-full")},
        }
    }
else:
    raise ImproperlyConfigured(
        "Configure DATABASE_URL or the PGDATABASE, PGUSER, PGHOST, and PGPASSWORD settings."
    )
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation." + name}
    for name in [
        "UserAttributeSimilarityValidator",
        "CommonPasswordValidator",
        "NumericPasswordValidator",
    ]
] + [
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 12},
    }
]
PASSWORD_RESET_TIMEOUT = 1800
SESSION_COOKIE_AGE = 60 * 60 * 8
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = CSRF_COOKIE_SECURE = SECURE_SSL_REDIRECT = not LOCAL
SECURE_HSTS_SECONDS = 0 if LOCAL else 31536000
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "no-referrer"
X_FRAME_OPTIONS = "DENY"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
USE_TZ = True
TIME_ZONE = "UTC"
STATIC_URL = "/static/"
STATIC_ROOT = BASE / "staticfiles"
DIST = BASE.parent / "dist"
WHITENOISE_ROOT = DIST if DIST.exists() else None
WHITENOISE_INDEX_FILE = False
WHITENOISE_AUTOREFRESH = LOCAL
DATA_UPLOAD_MAX_MEMORY_SIZE = 3 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = DATA_UPLOAD_MAX_MEMORY_SIZE
DATA_UPLOAD_MAX_NUMBER_FILES = 1
DATA_UPLOAD_MAX_NUMBER_FIELDS = 12
EMAIL_BACKEND = (
    "django.core.mail.backends.filebased.EmailBackend"
    if LOCAL and not os.environ.get("SMTP_HOST")
    else "django.core.mail.backends.smtp.EmailBackend"
)
EMAIL_FILE_PATH = BASE / ".mail"
EMAIL_HOST = os.environ.get("SMTP_HOST", "")
EMAIL_PORT = int(os.environ.get("SMTP_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("SMTP_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
EMAIL_USE_TLS = True
EMAIL_TIMEOUT = 8
DEFAULT_FROM_EMAIL = os.environ.get("MAIL_FROM", "travel@localhost" if LOCAL else "")
if not LOCAL and not INVITE_ONLY:
    try:
        validate_smtp_settings(
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            DEFAULT_FROM_EMAIL,
        )
    except ValueError as error:
        raise ImproperlyConfigured(str(error)) from error

SECURE_HSTS_INCLUDE_SUBDOMAINS = (
    not LOCAL and os.environ.get("HSTS_INCLUDE_SUBDOMAINS") == "1"
)
SECURE_HSTS_PRELOAD = (
    SECURE_HSTS_INCLUDE_SUBDOMAINS and os.environ.get("HSTS_PRELOAD") == "1"
)
