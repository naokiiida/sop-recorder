#!/usr/bin/env bash
# Generate extension icons from source SVG using ImageMagick.
# Usage: bash scripts/generate-icons.sh

set -euo pipefail
trap 'rm -f /tmp/nuknow-icon-letter-*.png' EXIT

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SVG="$ROOT/docs/output-stroke-105-512px.svg"
[[ -f "$SVG" ]] || { echo "Error: SVG not found: $SVG" >&2; exit 1; }
OUT="$ROOT/public/icons"
command -v magick >/dev/null || { echo "Error: ImageMagick required. Install with: brew install imagemagick" >&2; exit 1; }

mkdir -p "$OUT"

SIZES=(16 32 48 128)

for SIZE in "${SIZES[@]}"; do
  PADDING=$(( SIZE * 8 / 100 ))
  PADDING=$(( PADDING < 1 ? 1 : PADDING ))
  INNER=$(( SIZE - PADDING * 2 ))
  RADIUS=$(( SIZE * 15 / 100 ))

  # 1. Rasterize SVG at high res then downscale for clean edges
  magick \
    -background none -density 300 "$SVG" \
    -resize "${INNER}x${INNER}" \
    -background none -flatten \
    /tmp/nuknow-icon-letter-${SIZE}.png

  # 2. Create white rounded-rect background and composite letterform on top
  magick \
    -size "${SIZE}x${SIZE}" xc:none \
    -fill white -draw "roundrectangle 0,0 $((SIZE-1)),$((SIZE-1)) ${RADIUS},${RADIUS}" \
    /tmp/nuknow-icon-letter-${SIZE}.png \
    -gravity center -composite \
    "$OUT/icon-${SIZE}.png"

  BYTES=$(wc -c < "$OUT/icon-${SIZE}.png")
  echo "  ✓ icon-${SIZE}.png (${BYTES} bytes)"
done

echo ""
echo "Done! Icons written to public/icons/"
