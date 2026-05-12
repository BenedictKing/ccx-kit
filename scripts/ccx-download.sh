#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-latest}"
PLATFORM_ARCH="${2:-linux-arm64}"

REPO="BenedictKing/ccx"
CACHE_DIR="${CCX_KIT_CACHE_DIR:-$HOME/.local/share/ccx-kit-cache}"

if [[ "$VERSION" == "latest" ]]; then
    VERSION="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | sed 's/.*"v\(.*\)".*/\1/')" || {
        echo "Failed to fetch latest version" >&2
        exit 1
    }
    echo "Latest version: $VERSION"
fi

ASSET_NAME="ccx-${PLATFORM_ARCH}"

URL="https://github.com/$REPO/releases/download/v${VERSION}/${ASSET_NAME}"
CACHE_ROOT="$CACHE_DIR/github.com/$REPO/releases/download/v${VERSION}"
OUT_FILE="$CACHE_ROOT/$ASSET_NAME"

mkdir -p "$CACHE_ROOT"

printf 'Downloading CCX\n'
printf '  Version: %s\n' "$VERSION"
printf '  Asset:   %s\n' "$ASSET_NAME"
printf '  Source:  %s\n' "$URL"
printf '  Cache:   %s\n' "$OUT_FILE"

curl -fL "$URL" -o "$OUT_FILE"
chmod +x "$OUT_FILE"

printf 'Done: %s\n' "$OUT_FILE"
