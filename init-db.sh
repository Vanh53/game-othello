#!/bin/bash
set -euo pipefail

template_file="/docker-entrypoint-initdb.d/init-db.template.sql"

psql \
	--username "$POSTGRES_USER" \
	--dbname "$POSTGRES_DB" \
	-v AI_DB_PASSWORD="$AI_DB_PASSWORD" \
	-v LEADER_DB_PASSWORD="$LEADER_DB_PASSWORD" \
	-v PVP_DB_PASSWORD="$PVP_DB_PASSWORD" \
	-v USER_DB_PASSWORD="$USER_DB_PASSWORD" \
	-f "$template_file"