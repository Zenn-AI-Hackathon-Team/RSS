#!/usr/bin/env bash
set -euo pipefail

# Simple curl helper for this project's API.
#
# Usage examples:
#   BASE_URL=http://localhost:3000 TOKEN="Bearer <JWT>" scripts/curl_api.sh health
#   scripts/curl_api.sh create-link https://example.com/article
#   scripts/curl_api.sh list-links --inbox true --limit 10
#   scripts/curl_api.sh get-link <LINK_ID>
#   scripts/curl_api.sh move-category <LINK_ID> <CATEGORY_ID|null>
#   scripts/curl_api.sh list-categories
#   scripts/curl_api.sh create-category "My Category"
#   scripts/curl_api.sh search "keyword" --limit 10

BASE_URL=${BASE_URL:-"http://localhost:3000"}

# If TOKEN is not provided via env, fallback to the provided token.
# Note: TOKEN should include the leading "Bearer ".
TOKEN=${TOKEN:-"Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImVmMjQ4ZjQyZjc0YWUwZjk0OTIwYWY5YTlhMDEzMTdlZjJkMzVmZTEiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoibWFzYS1tYXNzYXJhIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3Jzcy1oYWNrIiwiYXVkIjoicnNzLWhhY2siLCJhdXRoX3RpbWUiOjE3NTcxNTg5NzEsInVzZXJfaWQiOiI1bktlWlFmMjBwTjZJREhtamNxdGF2MFk4dWwyIiwic3ViIjoiNW5LZVpRZjIwcE42SURIbWpjcXRhdjBZOHVsMiIsImlhdCI6MTc1NzE1ODk5MiwiZXhwIjoxNzU3MTYyNTkyLCJlbWFpbCI6Im1hc2F5YXlvc2hpa2F3YTdAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsibWFzYXlheW9zaGlrYXdhN0BnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.oPB9ak9KCEQnnFEXaBo-bAm8oBbLM0ppFE9X6YcchNCRtJeyvnw3H9FduAWMCZItXHYmPDRltGl7aAQpmnlmePNsTVvgXg_o5_Q-Etq-J57WOEObP7LM9B-SN7PDJFz1hzeyxJn5SpejRWiE4YB5e6-oqCkUy2uf67RuYvA8SZbTLyqnioc1vL6fM7bdIMHVom_ZiyFJtmqVeZXvBr9YPobYqTzLCSQHCuYMSULtPcXJnUcOTzTwR1-5Or6tyLVCeGsFdkeDvQaNY_TtrHDcDcGdQjGMi-rJZdJcvJ4FejnppeQk_Ks5lJe1qzAnzbDgN3A180vai3kusRwswYWocA"}

AUTH_HEADER=("-H" "Authorization: ${TOKEN}")

have_jq() { command -v jq >/dev/null 2>&1; }

# Simple concurrency limiter using background jobs (portable for macOS bash)
# Usage: run_bg_with_limit <max> <command...>
run_bg_with_limit() {
  local max=$1; shift
  ("$@") &
  # Throttle number of background jobs
  while true; do
    local n
    n=$(jobs -p 2>/dev/null | wc -l | tr -d ' ')
    [[ "$n" -lt "$max" ]] && break
    sleep 0.05
  done
}

pp() {
  if have_jq; then jq .; else cat; fi
}

usage() {
  cat <<USAGE
Usage:
  $(basename "$0") health
  $(basename "$0") create-link <URL>
  $(basename "$0") bulk-create-links <FILE|-> [--concurrency N]
  $(basename "$0") list-links [--inbox true|false] [--category-id ID] [--sort asc|desc] [--limit N] [--cursor ID]
  $(basename "$0") get-link <ID>
  $(basename "$0") bulk-get-links <FILE|-> [--concurrency N]
  $(basename "$0") move-category <ID> <CATEGORY_ID|null>
  $(basename "$0") list-categories
  $(basename "$0") create-category <NAME>
  $(basename "$0") search <QUERY> [--limit N] [--cursor ID]
  $(basename "$0") smoke [--url URL] [--category-name NAME]

Env:
  BASE_URL   API base (default: ${BASE_URL})
  TOKEN      Authorization header value (include 'Bearer ...')
USAGE
}

cmd=${1:-}
case "${cmd}" in
  health)
    shift || true
    curl -sS -X GET "${BASE_URL}/api/healthz" | pp
    ;;

  create-link)
    if [[ ${2:-} == "" ]]; then echo "URL is required"; usage; exit 1; fi
    url=$2; shift 2
    curl -sS -X POST "${BASE_URL}/api/links" \
      "${AUTH_HEADER[@]}" \
      -H 'Content-Type: application/json' \
      -d "$(jq -n --arg url "$url" '{url: $url}')" | pp
    ;;

  bulk-create-links)
    # Reads newline-separated URLs from a file or stdin (use '-' for stdin)
    src=${2:-}
    if [[ -z "$src" ]]; then echo "FILE or '-' is required"; usage; exit 1; fi
    shift 2 || true
    concurrency=4
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --concurrency) concurrency=$2; shift 2 ;;
        *) echo "Unknown arg: $1"; usage; exit 1 ;;
      esac
    done
    read_input() {
      if [[ "$src" == "-" ]]; then cat -; else cat "$src"; fi
    }
    i=0
    while IFS= read -r line; do
      url="${line%%[$'\r\n']*}"
      [[ -z "$url" ]] && continue
      [[ "$url" =~ ^# ]] && continue
      i=$((i+1))
      run_bg_with_limit "$concurrency" bash -lc '
        url="$1"
        i="$2"
        echo "=== [$i] $url"
        curl -sS -X POST "'"${BASE_URL}"'/api/links" \
          '"${AUTH_HEADER[@]}"' -H '"Content-Type: application/json"' \
          -d "$(jq -n --arg url "$url" '{url: $url}')" | pp
        echo
      ' _ "$url" "$i"
    done < <(read_input)
    wait
    ;;

  list-links)
    shift || true
    inbox=""; category_id=""; sort=""; limit=""; cursor=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --inbox) inbox=$2; shift 2 ;;
        --category-id) category_id=$2; shift 2 ;;
        --sort) sort=$2; shift 2 ;;
        --limit) limit=$2; shift 2 ;;
        --cursor) cursor=$2; shift 2 ;;
        *) echo "Unknown arg: $1"; usage; exit 1 ;;
      esac
    done
    params=()
    [[ -n "$inbox" ]] && params+=(--data-urlencode "inbox=${inbox}")
    [[ -n "$category_id" ]] && params+=(--data-urlencode "categoryId=${category_id}")
    [[ -n "$sort" ]] && params+=(--data-urlencode "sort=${sort}")
    [[ -n "$limit" ]] && params+=(--data-urlencode "limit=${limit}")
    [[ -n "$cursor" ]] && params+=(--data-urlencode "cursor=${cursor}")
    curl -sS -G "${BASE_URL}/api/links" "${AUTH_HEADER[@]}" "${params[@]}" | pp
    ;;

  get-link)
    if [[ ${2:-} == "" ]]; then echo "ID is required"; usage; exit 1; fi
    id=$2; shift 2
    curl -sS -X GET "${BASE_URL}/api/links/${id}" "${AUTH_HEADER[@]}" | pp
    ;;

  bulk-get-links)
    # Reads newline-separated IDs from a file or stdin (use '-' for stdin)
    src=${2:-}
    if [[ -z "$src" ]]; then echo "FILE or '-' is required"; usage; exit 1; fi
    shift 2 || true
    concurrency=6
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --concurrency) concurrency=$2; shift 2 ;;
        *) echo "Unknown arg: $1"; usage; exit 1 ;;
      esac
    done
    read_input() {
      if [[ "$src" == "-" ]]; then cat -; else cat "$src"; fi
    }
    i=0
    while IFS= read -r line; do
      id="${line%%[$'\r\n']*}"
      [[ -z "$id" ]] && continue
      [[ "$id" =~ ^# ]] && continue
      i=$((i+1))
      run_bg_with_limit "$concurrency" bash -lc '
        id="$1"; i="$2"
        echo "=== [$i] ${id}"
        curl -sS -X GET "'"${BASE_URL}"'/api/links/${id}" '"${AUTH_HEADER[@]}"' | pp
        echo
      ' _ "$id" "$i"
    done < <(read_input)
    wait
    ;;

  move-category)
    if [[ ${2:-} == "" || ${3:-} == "" ]]; then echo "ID and CATEGORY_ID|null are required"; usage; exit 1; fi
    id=$2; dest=$3; shift 3
    if [[ "$dest" == "null" ]]; then
      body='{"categoryId":null}'
    else
      body=$(jq -n --arg cid "$dest" '{categoryId: $cid}')
    fi
    curl -sS -X PATCH "${BASE_URL}/api/links/${id}/category" \
      "${AUTH_HEADER[@]}" -H 'Content-Type: application/json' \
      -d "$body" | pp
    ;;

  list-categories)
    shift || true
    curl -sS -X GET "${BASE_URL}/api/categories" "${AUTH_HEADER[@]}" | pp
    ;;

  create-category)
    if [[ ${2:-} == "" ]]; then echo "NAME is required"; usage; exit 1; fi
    name=$2; shift 2
    curl -sS -X POST "${BASE_URL}/api/categories" \
      "${AUTH_HEADER[@]}" -H 'Content-Type: application/json' \
      -d "$(jq -n --arg name "$name" '{name: $name}')" | pp
    ;;

  search)
    if [[ ${2:-} == "" ]]; then echo "QUERY is required"; usage; exit 1; fi
    q=$2; shift 2
    limit=""; cursor=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --limit) limit=$2; shift 2 ;;
        --cursor) cursor=$2; shift 2 ;;
        *) echo "Unknown arg: $1"; usage; exit 1 ;;
      esac
    done
    params=(--data-urlencode "q=${q}")
    [[ -n "$limit" ]] && params+=(--data-urlencode "limit=${limit}")
    [[ -n "$cursor" ]] && params+=(--data-urlencode "cursor=${cursor}")
    curl -sS -G "${BASE_URL}/api/search" "${AUTH_HEADER[@]}" "${params[@]}" | pp
    ;;

  smoke)
    # End-to-end smoke test hitting all endpoints in sequence.
    shift || true
    url=""
    cat_name=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --url) url=$2; shift 2 ;;
        --category-name) cat_name=$2; shift 2 ;;
        *) echo "Unknown arg: $1"; usage; exit 1 ;;
      esac
    done
    if ! have_jq; then
      echo "smoke requires jq. Install jq or set PATH." >&2
      exit 1
    fi
    ts=$(date +%s)
    url=${url:-"https://example.com/smoke-${ts}"}
    cat_name=${cat_name:-"Smoke ${ts}"}

    echo "# 1) GET /api/healthz"
    curl -sS -X GET "${BASE_URL}/api/healthz" | pp
    echo

    echo "# 2) POST /api/categories"
    cat_json=$(curl -sS -X POST "${BASE_URL}/api/categories" \
      "${AUTH_HEADER[@]}" -H 'Content-Type: application/json' \
      -d "$(jq -n --arg name "$cat_name" '{name: $name}')")
    echo "$cat_json" | pp
    cat_id=$(echo "$cat_json" | jq -r '.id // empty')
    echo

    echo "# 3) POST /api/links"
    link_json=$(curl -sS -X POST "${BASE_URL}/api/links" \
      "${AUTH_HEADER[@]}" -H 'Content-Type: application/json' \
      -d "$(jq -n --arg url "$url" '{url: $url}')")
    echo "$link_json" | pp
    link_id=$(echo "$link_json" | jq -r '.id // empty')
    echo

    echo "# 4) GET /api/links?limit=5"
    curl -sS -G "${BASE_URL}/api/links" "${AUTH_HEADER[@]}" --data-urlencode "limit=5" | pp
    echo

    if [[ -n "$link_id" ]]; then
      echo "# 5) GET /api/links/${link_id}"
      curl -sS -X GET "${BASE_URL}/api/links/${link_id}" "${AUTH_HEADER[@]}" | pp
      echo
    else
      echo "# 5) GET /api/links/{id} skipped (no link id)" >&2
    fi

    if [[ -n "$link_id" && -n "$cat_id" ]]; then
      echo "# 6) PATCH /api/links/${link_id}/category -> ${cat_id}"
      curl -sS -X PATCH "${BASE_URL}/api/links/${link_id}/category" \
        "${AUTH_HEADER[@]}" -H 'Content-Type: application/json' \
        -d "$(jq -n --arg cid "$cat_id" '{categoryId: $cid}')" | pp
      echo

      echo "# 7) PATCH /api/links/${link_id}/category -> null (Inbox)"
      curl -sS -X PATCH "${BASE_URL}/api/links/${link_id}/category" \
        "${AUTH_HEADER[@]}" -H 'Content-Type: application/json' \
        -d '{"categoryId":null}' | pp
      echo
    else
      echo "# 6-7) PATCH category skipped (missing ids)" >&2
    fi

    echo "# 8) GET /api/categories"
    curl -sS -X GET "${BASE_URL}/api/categories" "${AUTH_HEADER[@]}" | pp
    echo

    echo "# 9) GET /api/search?q=smoke&limit=5 (may be empty)"
    curl -sS -G "${BASE_URL}/api/search" "${AUTH_HEADER[@]}" \
      --data-urlencode "q=smoke" --data-urlencode "limit=5" | pp
    echo

    echo "Done. link_id=${link_id:-} cat_id=${cat_id:-}"
    ;;

  *)
    usage; exit 1 ;;
esac
