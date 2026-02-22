#!/bin/bash

set -euo pipefail

# default GITHUB_WORKSPACE to current directory when not set (local runs)
: "${GITHUB_WORKSPACE:=$(pwd)}"

echo "🛠️  Setting up environment variables for testing..."
export AUTHELIA_CONFIG=$(mktemp /tmp/authelia-config.XXXXXX)
export AUTHELIA_USERS=$(mktemp /tmp/authelia-users.XXXXXX)
export CADDY_CADDYFILE_PATH=$(mktemp /tmp/Caddyfile.XXXXXX)
export DB_MIGRATIONS_FOLDER="${GITHUB_WORKSPACE}/packages/backend/drizzle"

cleanup() {
	rc=$?
	echo "🧹 Cleaning up temporary files..."
	rm -f "$AUTHELIA_CONFIG" "$AUTHELIA_USERS" "$CADDY_CADDYFILE_PATH"
	if [ "$rc" -eq 0 ]; then
		echo "✅ Cleanup complete"
	else
		echo "❌ Cleanup complete (tests exited with code $rc)"
	fi
	exit "$rc"
}
trap cleanup EXIT

echo "🧪 Running tests..."
if yarn test; then
	echo "✅ Tests passed"
else
	exit_code=$?
	echo "❌ Tests failed"
	exit "$exit_code"
fi
