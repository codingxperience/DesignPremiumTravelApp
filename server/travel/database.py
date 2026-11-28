from urllib.parse import parse_qs, unquote, urlsplit


def selected_database_url(database_url, direct_url, *, migrations):
    if migrations:
        direct_url = direct_url.strip()
        if not direct_url:
            raise ValueError("TRAVEL_MIGRATIONS=1 requires DIRECT_URL.")
        return direct_url
    return database_url.strip()


def database_config_from_url(database_url, *, sslmode, serverless):
    if sslmode != "verify-full":
        raise ValueError("PostgreSQL connections require verify-full TLS.")

    try:
        parsed = urlsplit(database_url)
        port = parsed.port
    except ValueError as error:
        raise ValueError("Invalid PostgreSQL DATABASE_URL.") from error

    if (
        parsed.scheme not in ("postgres", "postgresql")
        or not parsed.hostname
        or not parsed.path.startswith("/")
        or len(parsed.path) < 2
        or parsed.fragment
    ):
        raise ValueError("DATABASE_URL must be a PostgreSQL URL with a database name.")

    if not parsed.username or not parsed.password:
        raise ValueError("DATABASE_URL must include PostgreSQL credentials.")

    parameters = parse_qs(parsed.query, keep_blank_values=True)
    unsupported = set(parameters) - {"pgbouncer", "sslmode"}
    if unsupported:
        raise ValueError("Unsupported PostgreSQL DATABASE_URL parameters.")

    if parameters.get("sslmode", [sslmode]) != [sslmode]:
        raise ValueError("PostgreSQL DATABASE_URL must use verify-full TLS.")
    if parameters.get("pgbouncer", ["true"]) != ["true"]:
        raise ValueError("PostgreSQL pooler URLs must set pgbouncer=true.")

    options = {
        "sslmode": sslmode,
        "prepare_threshold": None,
    }
    if serverless:
        options["sslrootcert"] = "/etc/ssl/certs/ca-certificates.crt"

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": unquote(parsed.path[1:]),
        "USER": unquote(parsed.username),
        "PASSWORD": unquote(parsed.password),
        "HOST": parsed.hostname,
        "PORT": str(port or 5432),
        "CONN_MAX_AGE": 0 if serverless else 60,
        "CONN_HEALTH_CHECKS": True,
        "OPTIONS": options,
    }
