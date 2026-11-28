"""Run the integrated travel app and local email worker on this computer."""

import os
import subprocess
import sys
from pathlib import Path

if __name__ == "__main__":
    base = Path(__file__).resolve().parent
    if not (base.parent / "dist" / "index.html").exists():
        sys.exit("Build the mobile client with pnpm build first.")
    env = {
        **os.environ,
        "TRAVEL_ENV": "local",
        "PUBLIC_ORIGIN": "http://localhost:8000",
    }
    for args in (
        ["migrate", "--noinput"],
        ["collectstatic", "--noinput"],
        ["setup_desk"],
    ):
        subprocess.run(
            [sys.executable, "manage.py", *args], cwd=base, env=env, check=True
        )
    worker = subprocess.Popen(
        [sys.executable, "manage.py", "work_mail"], cwd=base, env=env
    )
    try:
        subprocess.run(
            [
                sys.executable,
                "-m",
                "waitress",
                "--listen=127.0.0.1:8000",
                "--max-request-body-size=3150000",
                "travel.wsgi:application",
            ],
            cwd=base,
            env=env,
            check=True,
        )
    except KeyboardInterrupt:
        pass
    finally:
        worker.terminate()
        worker.wait()
