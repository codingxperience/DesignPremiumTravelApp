"""Run behind the agency's TLS endpoint with a bounded HTTP body size."""

import ipaddress
import os

from waitress import serve

from travel.wsgi import application


def options():
    settings = {
        "host": os.environ.get("BIND_HOST", "0.0.0.0"),
        "port": int(os.environ.get("PORT", "8000")),
        "threads": int(os.environ.get("WEB_THREADS", "4")),
        "max_request_body_size": 3150000,
    }
    proxy = os.environ.get("TRUSTED_PROXY_IP")
    if proxy:
        settings.update(
            trusted_proxy=str(ipaddress.ip_address(proxy)),
            trusted_proxy_headers={"x-forwarded-for", "x-forwarded-proto"},
            trusted_proxy_count=1,
        )
    return settings


if __name__ == "__main__":
    serve(application, **options())
