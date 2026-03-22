#!/usr/bin/env bash
# Generate extension icons from source SVG using ImageMagick.
# Usage: bash scripts/generate-icons.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SVG="$ROOT/docs/output-stroke-105-512px.svg"
OUT="$ROOT/public/icons"

mkdir -p "$OUT"

SIZES=(16 32 48 128)

for SIZE in "${SIZES[@]}"; do
  PADDING=$(( SIZE * 8 / 100 ))
  PADDING=$(( PADDING < 1 ? 1 : PADDING ))
  INNER=$(( SIZE - PADDING * 2 ))
  RADIUS=$(( SIZE * 15 / 100 ))

  magick \
    -size "${SIZE}x${SIZE}" xc:white \
    -fill white -draw "roundrectangle 0,0 $((SIZE-1)),$((SIZE-1)) ${RADIUS},${RADIUS}" \
    \( "$SVG" -resize "${INNER}x${INNER}" -background none \) \
    -gravity center -composite \
    "$OUT/icon-${SIZE}.png"

  BYTES=$(wc -c < "$OUT/icon-${SIZE}.png")
  echo "  ✓ icon-${SIZE}.png (${BYTES} bytes)"
done

echo ""
echo "Done! Icons written to public/icons/"
