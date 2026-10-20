#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")"
umask 077

docker compose version >/dev/null
[[ -f .env ]] || { echo "Missing .env" >&2; exit 1; }

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p backups
tmp="$(mktemp -d "backups/.pending-${stamp}-XXXX")"
trap 'rm -rf "$tmp"' EXIT

# Consistent transactional dump of the MariaDB database.
docker compose --env-file .env exec -T db sh -ec \
  'MYSQL_PWD="$MARIADB_PASSWORD" exec mariadb-dump --single-transaction --quick --routines --triggers --events --default-character-set=utf8mb4 -u "$MARIADB_USER" "$MARIADB_DATABASE"' \
  | gzip > "$tmp/database.sql.gz"

# Both user-upload and runtime storage volumes are part of the recoverable dataset.
docker compose --env-file .env exec -T app \
  tar -czf - -C /var/www/html uploads storage > "$tmp/files.tar.gz"

test -s "$tmp/database.sql.gz"
test -s "$tmp/files.tar.gz"
mv "$tmp" "backups/$stamp"
echo "Backup created: backups/$stamp"
echo "IMPORTANT: Encrypt and copy backup files off the host; back up .env securely too."
