"""
Local cache addon for mitmproxy.

Serves cached files from disk when the URL path matches a local file.
Mapping: https://host/path/to/file → CACHE_ROOT/host/path/to/file

Only intercepts GET requests. Non-cached URLs pass through transparently.
"""

from __future__ import annotations

import mimetypes
import os
from pathlib import Path
from urllib.parse import unquote, urlsplit

from mitmproxy import ctx, http

CACHE_ROOT = Path(
    os.environ.get(
        "CCX_KIT_CACHE_DIR",
        str(Path.home() / ".local" / "share" / "ccx-kit-cache"),
    )
)


def _candidate_path(url: str) -> Path | None:
    parts = urlsplit(url)
    if not parts.scheme or not parts.netloc:
        return None

    rel_path = unquote(parts.path.lstrip("/"))
    if not rel_path:
        return None

    candidate = (CACHE_ROOT / parts.netloc / rel_path).resolve()
    try:
        candidate.relative_to(CACHE_ROOT.resolve())
    except ValueError:
        return None
    return candidate


class LocalCache:
    def request(self, flow: http.HTTPFlow) -> None:
        if flow.request.method != "GET":
            return

        candidate = _candidate_path(flow.request.pretty_url)
        if not candidate or not candidate.is_file():
            return

        content = candidate.read_bytes()
        content_type, _ = mimetypes.guess_type(candidate.name)
        if not content_type:
            content_type = "application/octet-stream"

        headers = {
            "Content-Type": content_type,
            "Content-Length": str(len(content)),
            "X-Local-Cache": "HIT",
        }

        flow.response = http.Response.make(200, content, headers)
        flow.request.stream = False

        ctx.log.info(
            f"[local-cache] HIT {flow.request.pretty_url} -> {candidate} ({len(content)} bytes)"
        )


addons = [LocalCache()]
