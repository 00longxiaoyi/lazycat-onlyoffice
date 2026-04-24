#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
APP_DIR="$ROOT_DIR/app"
CONTENT_DIR="$ROOT_DIR/content"

cd "$APP_DIR"
npm run build

rm -rf "$CONTENT_DIR"
mkdir -p "$CONTENT_DIR/dist"
cp -R "$APP_DIR/dist/frontend" "$CONTENT_DIR/dist/frontend"
cp -R "$APP_DIR/dist/server" "$CONTENT_DIR/dist/server"
