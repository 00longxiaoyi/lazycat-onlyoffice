#!/bin/sh
set -u

FONT_DIR="${FONT_DIR:-/usr/share/fonts/truetype/custom}"
REFRESH_DIR="${FONT_REFRESH_DIR:-/lzcapp/font-refresh}"
REQUEST_FILE="$REFRESH_DIR/request"
LAST_SUCCESS_FILE="$REFRESH_DIR/last-success"
LOG_FILE="$REFRESH_DIR/fonts.log"
POLL_INTERVAL="${FONT_REFRESH_INTERVAL:-5}"
LAST=""

mkdir -p "$FONT_DIR" "$REFRESH_DIR"

timestamp() {
  date -Iseconds
}

log_fonts() {
  echo "[$(timestamp)] $*" | tee -a "$LOG_FILE"
}

refresh_fonts() {
  log_fonts "font refresh started"
  log_fonts "custom font files:"
  find "$FONT_DIR" -maxdepth 1 -type f \( -name '*.ttf' -o -name '*.otf' -o -name '*.ttc' \) -printf '%f %s bytes\n' 2>&1 | tee -a "$LOG_FILE"

  log_fonts "running fc-cache"
  fc-cache -f -v 2>&1 | tee -a "$LOG_FILE"

  log_fonts "fc-list custom fonts:"
  fc-list "$FONT_DIR" 2>&1 | tee -a "$LOG_FILE" || true

  if [ -x /usr/bin/documentserver-generate-allfonts.sh ]; then
    log_fonts "running documentserver-generate-allfonts.sh"
    /usr/bin/documentserver-generate-allfonts.sh > /tmp/generate-allfonts.log 2>&1
    STATUS="$?"
    cat /tmp/generate-allfonts.log | tee -a "$LOG_FILE"
    log_fonts "documentserver-generate-allfonts.sh exit=$STATUS"
  else
    log_fonts "documentserver-generate-allfonts.sh not found"
  fi

  timestamp > "$LAST_SUCCESS_FILE"
  log_fonts "font refresh finished"
}

refresh_fonts

while true; do
  CURRENT="$(cat "$REQUEST_FILE" 2>/dev/null || true)"
  if [ "$CURRENT" != "$LAST" ]; then
    log_fonts "font refresh request changed: $CURRENT"
    LAST="$CURRENT"
    refresh_fonts
  fi
  sleep "$POLL_INTERVAL"
done
