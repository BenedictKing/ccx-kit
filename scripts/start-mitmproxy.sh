#!/bin/bash
set -e

if ! command -v mitmdump > /dev/null 2>&1; then
    echo "mitmproxy not installed"
    echo "  uv tool install mitmproxy"
    exit 1
fi

PROXY_PORT="${CCX_KIT_PROXY_PORT:-18082}"
UPSTREAM_PROXY="${CCX_KIT_UPSTREAM_PROXY:-http://127.0.0.1:6785}"

echo "Starting mitmproxy cache"
echo "  Proxy port:   $PROXY_PORT"
echo "  Upstream:     $UPSTREAM_PROXY"
echo "  Cache dir:    ${CCX_KIT_CACHE_DIR:-$HOME/.local/share/ccx-kit-cache}"
echo "  Web UI:       http://localhost:8081"
echo ""

exec mitmweb \
  --mode "upstream:${UPSTREAM_PROXY}" \
  --listen-port "$PROXY_PORT" \
  --web-host 0.0.0.0 \
  --no-web-open-browser \
  --set block_global=false \
  --set upstream_cert=false \
  --scripts ./scripts/local_cache.py
