#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")"
umask 077

command -v docker >/dev/null || { echo "Docker is required on the Linux host." >&2; exit 1; }
command -v git >/dev/null || { echo "Git is required on the Linux host." >&2; exit 1; }
docker compose version >/dev/null || { echo "Docker Compose v2 is required." >&2; exit 1; }

if [[ ! -f .env ]]; then
    echo "Missing .env. Run: cp .env.example .env, then set secrets." >&2
    exit 1
fi
chmod 600 .env

# Fail closed if required secrets are absent or still contain example placeholders.
for key in DB_PASSWORD DB_ROOT_PASSWORD ENCRYPTION_KEY ADMIN_PASSWORD; do
    val="$(grep -E "^${key}=" .env | head -1 | cut -d '=' -f2- || true)"
    if [[ -z "$val" || "$val" == CHANGE_ME* || "$val" == REPLACE* ]]; then
        echo "Configure a strong value for $key in .env before deployment." >&2
        exit 1
    fi
done

# Build the upstream, audited release source. Never deploy the moving develop branch.
readonly UPSTREAM_REPO="https://github.com/InvoicePlane/InvoicePlane.git"
readonly UPSTREAM_TAG="v1.7.2"
readonly UPSTREAM_SHA="aaeea1e4825785c6138fa84be49ac373bac4f0af"

if [[ ! -d upstream/.git ]]; then
    if [[ -e upstream ]]; then
        echo "upstream exists but is not a Git checkout. Stop to avoid overwriting it." >&2
        exit 1
    fi
    git clone --depth 1 --branch "$UPSTREAM_TAG" "$UPSTREAM_REPO" upstream
fi
actual="$(git -C upstream rev-parse HEAD)"
if [[ "$actual" != "$UPSTREAM_SHA" ]]; then
    echo "Unexpected upstream SHA $actual; expected $UPSTREAM_SHA. Aborting." >&2
    exit 1
fi

docker compose --env-file .env config --quiet
docker compose --env-file .env up -d --build
docker compose --env-file .env ps

echo "Provisioning initiated for https://$(grep '^INVOICE_DOMAIN=' .env | cut -d '=' -f2-)"
echo "Verify DNS, HTTPS, login, invoices, and payments before using in production."
