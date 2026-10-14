#!/usr/bin/env bash
#
# prerender-daily.sh — nightly rebuild of the crawler snapshots in production.
#
# Snapshots (public/ICSDC_Frontend/prerendered/*.html) are point-in-time copies
# served to non-JS crawlers by the bot middleware in server.js. They go stale the
# moment anyone edits content in Strapi, and nothing rebuilds them automatically —
# which is exactly how a corrected footer URL kept serving the old value to
# Googlebot while looking fine in a browser. This job closes that gap.
#
# Install (run as the same user that owns the app + node_modules):
#   chmod +x scripts/prerender-daily.sh
#   crontab -e
#   # 03:20 daily — off-peak, and after any nightly content work
#   20 3 * * * /srv/icsdc_node_fe/scripts/prerender-daily.sh >> /var/log/icsdc/prerender-cron.log 2>&1
#
# Exit codes:  0 = all pages rebuilt   1 = build failed / partial failure
#              2 = skipped (app server not reachable, or another build running)
#
set -uo pipefail

# Repo root = parent of this script's directory, so cron's cwd doesn't matter.
# prerender.js resolves publicPath and sitemap.xml relative to the repo root.
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR" || exit 1

PORT="${PORT:-3000}"
ORIGIN="http://localhost:${PORT}"
LOG_DIR="${PRERENDER_LOG_DIR:-$APP_DIR/logs}"
LOG_FILE="$LOG_DIR/prerender.log"
LOCK_FILE="${TMPDIR:-/tmp}/icsdc-prerender.lock"
MAX_LOG_BYTES=$((5 * 1024 * 1024))   # 5MB, then rotate to .1

mkdir -p "$LOG_DIR"

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG_FILE"; }

# Keep the log from growing without bound (single-generation rotation).
if [ -f "$LOG_FILE" ] && [ "$(wc -c < "$LOG_FILE")" -gt "$MAX_LOG_BYTES" ]; then
    mv -f "$LOG_FILE" "$LOG_FILE.1"
fi

# ── Serialise runs ────────────────────────────────────────────────────────────
# Two concurrent puppeteer builds would write the same files and can interleave
# partial HTML. flock releases automatically if a previous run was killed, which
# a bare "is the pidfile there?" check would not.
# NOTE: this does NOT coordinate with an admin-triggered build (Admin → Prerender),
# which is guarded separately by prerenderState.running inside server.js. Avoid
# clicking "Build all" while this job is scheduled to fire.
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    log "[skip] another prerender run holds $LOCK_FILE"
    exit 2
fi

# ── Preflight ─────────────────────────────────────────────────────────────────
# prerender.js renders pages by hitting the app over HTTP, so a build started
# while the app is down produces error pages and would overwrite good snapshots
# with garbage. Bail out instead — stale snapshots beat broken ones.
if ! curl -fsS --max-time 10 -o /dev/null "$ORIGIN/"; then
    log "[skip] app server not responding at $ORIGIN — not rebuilding"
    exit 2
fi

# Strapi supplies the page content. If it is down, pages still render but come out
# empty/fallback, which is worse than keeping yesterday's snapshots.
STRAPI_URL="${STRAPI_URL:-http://localhost:1337}"
if ! curl -fsS --max-time 10 -o /dev/null "$STRAPI_URL/_health" \
   && ! curl -fsS --max-time 10 -o /dev/null "$STRAPI_URL/admin"; then
    log "[skip] Strapi not responding at $STRAPI_URL — not rebuilding"
    exit 2
fi

# ── Build ─────────────────────────────────────────────────────────────────────
log "[start] rebuilding snapshots (origin $ORIGIN)"
START_TS=$(date +%s)

BUILD_OUT="$(node prerender.js 2>&1)"
BUILD_RC=$?
printf '%s\n' "$BUILD_OUT" >> "$LOG_FILE"

ELAPSED=$(( $(date +%s) - START_TS ))

# prerender.js only exits non-zero when EVERY page fails (`fail && !ok`), so a
# run where 3 of 55 pages broke still returns 0. Parse its summary line to catch
# partial failures too, otherwise cron reports success while pages rot.
FAILED_COUNT="$(printf '%s' "$BUILD_OUT" | sed -n 's/.*done — [0-9]\{1,\} ok, \([0-9]\{1,\}\) failed.*/\1/p' | tail -1)"

if [ "$BUILD_RC" -ne 0 ]; then
    log "[FAIL] prerender.js exited $BUILD_RC after ${ELAPSED}s"
    exit 1
fi
if [ -n "$FAILED_COUNT" ] && [ "$FAILED_COUNT" -gt 0 ]; then
    log "[FAIL] $FAILED_COUNT page(s) failed to render after ${ELAPSED}s"
    exit 1
fi

# ── Post-build sanity check ───────────────────────────────────────────────────
# An unattended nightly build will happily bake in whatever Strapi returns. This
# catches the specific shape that caused the icsdc.com/icsdc.com/... bug: an href
# whose path segment is itself a bare hostname (e.g. href="/icsdc.com/foo"),
# which a browser resolves into a doubled domain.
# Deliberately a warning, not a hard failure — the snapshots are already written,
# and refusing to report success would hide an otherwise healthy build. Surfacing
# it in the log/exit code is enough for monitoring to page someone.
BAD="$(grep -rlE 'href="/[a-z0-9-]+\.(com|net|org|in)/' \
        "$APP_DIR/public/ICSDC_Frontend/prerendered/" 2>/dev/null | head -5)"
if [ -n "$BAD" ]; then
    log "[WARN] malformed host-in-path href found in rebuilt snapshots:"
    printf '%s\n' "$BAD" | while read -r f; do log "        $f"; done
    log "[WARN] check the corresponding Strapi link values, then re-run"
    exit 1
fi

PAGE_COUNT="$(find "$APP_DIR/public/ICSDC_Frontend/prerendered" -name '*.html' | wc -l)"
log "[ok] rebuilt in ${ELAPSED}s — ${PAGE_COUNT} snapshot file(s) on disk"
exit 0
