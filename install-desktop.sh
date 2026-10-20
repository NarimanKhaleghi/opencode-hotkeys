#!/bin/sh
set -eu

url="https://raw.githubusercontent.com/NarimanKhaleghi/opencode-hotkeys/main/desktop/install.mjs"
tmp="${TMPDIR:-/tmp}/opencode-hotkeys-desktop-install-$$.mjs"

cleanup() {
  rm -f "$tmp"
}
trap cleanup EXIT HUP INT TERM

if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$url" -o "$tmp"
elif command -v wget >/dev/null 2>&1; then
  wget -qO "$tmp" "$url"
else
  echo "opencode-hotkeys-desktop: curl or wget is required" >&2
  exit 1
fi

node "$tmp" "$@"
