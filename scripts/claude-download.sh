#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-latest}"
ARCH="${2:-linux-arm64}"

BASE_URL="https://downloads.claude.ai/claude-code-releases"
CACHE_DIR="${CCX_KIT_CACHE_DIR:-$HOME/.local/share/ccx-kit-cache}"

if [[ "$VERSION" == "latest" ]]; then
    VERSION="$(curl -fsSL "$BASE_URL/latest")" || {
        echo "Failed to fetch latest version" >&2
        exit 1
    }
    echo "Latest version: $VERSION"
fi

URL="$BASE_URL/$VERSION/$ARCH/claude"
CACHE_ROOT="$CACHE_DIR/downloads.claude.ai/claude-code-releases/$VERSION/$ARCH"
OUT_FILE="$CACHE_ROOT/claude"

mkdir -p "$CACHE_ROOT"

printf 'Downloading Claude Code\n'
printf '  Version: %s\n' "$VERSION"
printf '  Arch:    %s\n' "$ARCH"
printf '  Source:  %s\n' "$URL"
printf '  Cache:   %s\n' "$OUT_FILE"

curl -fL "$URL" -o "$OUT_FILE"
chmod +x "$OUT_FILE"

printf 'Done: %s\n' "$OUT_FILE"
