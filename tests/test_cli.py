"""Tests for the bioprocess_twin CLI and local static UI HTTP server."""

import threading
import urllib.request
from pathlib import Path

from bioprocess_twin.cli import create_ui_server


def test_ui_server_serves_modules_and_pwa_assets() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    server, url = create_ui_server(host="127.0.0.1", port=0, web_root=repo_root, quiet=True)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    base_url = url.rsplit("/", 1)[0]
    try:
        checks = [
            ("/index.html", "text/html"),
            ("/dashboard.html", "text/html"),
            ("/js/kinetics.js", "javascript"),
            ("/js/sim-worker.js", "javascript"),
            ("/css/styles.css", "text/css"),
            ("/manifest.webmanifest", "manifest+json"),
            ("/assets/icon.svg", "image/svg+xml"),
        ]
        for route, expected_mime in checks:
            with urllib.request.urlopen(f"{base_url}{route}", timeout=5) as resp:
                assert resp.status == 200
                content_type = resp.headers.get("Content-Type", "")
                assert expected_mime in content_type, f"{route}: expected {expected_mime}, got {content_type}"
                body = resp.read()
                assert len(body) > 0
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)
