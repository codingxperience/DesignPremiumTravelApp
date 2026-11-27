from urllib.parse import urlsplit


def deployment_security_settings(public_origin, deployment_url, *, vercel):
    canonical = urlsplit(public_origin)
    if (
        not canonical.hostname
        or canonical.username
        or canonical.password
        or canonical.query
        or canonical.fragment
        or canonical.path
    ):
        raise ValueError("The public origin must contain only an origin.")

    allowed_hosts = [canonical.hostname]
    trusted_origins = [public_origin]
    proxy_ssl_header = None

    if vercel:
        proxy_ssl_header = ("HTTP_X_FORWARDED_PROTO", "https")
        if deployment_url:
            try:
                deployment = urlsplit(f"https://{deployment_url}")
                port = deployment.port
            except ValueError as error:
                raise ValueError("Invalid Vercel deployment URL.") from error

            if (
                not deployment.hostname
                or deployment.username
                or deployment.password
                or deployment.path
                or deployment.query
                or deployment.fragment
                or port is not None
            ):
                raise ValueError("Invalid Vercel deployment URL.")

            deployment_origin = f"https://{deployment.hostname}"
            if deployment.hostname not in allowed_hosts:
                allowed_hosts.append(deployment.hostname)
            if deployment_origin not in trusted_origins:
                trusted_origins.append(deployment_origin)

    return {
        "ALLOWED_HOSTS": allowed_hosts,
        "CSRF_TRUSTED_ORIGINS": trusted_origins,
        "SECURE_PROXY_SSL_HEADER": proxy_ssl_header,
    }


def validate_smtp_settings(host, username, password, from_address):
    if not all((host.strip(), username.strip(), password, from_address.strip())):
        raise ValueError(
            "Configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and MAIL_FROM "
            "for authenticated account email."
        )
