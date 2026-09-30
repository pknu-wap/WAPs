#!/usr/bin/env bash
# Executed on OCI by the workflow, with shell-quoted environment variables over SSH.
set -euo pipefail

case "$DEPLOY_ENV" in
  main|production) ;;
  *) echo 'Only main and production can be deployed.' >&2; exit 1 ;;
esac

cd "$HOME/waps/$DEPLOY_ENV"
docker network inspect waps-network > /dev/null

# Keep registry credentials only for the duration of this deployment.
export DOCKER_CONFIG
DOCKER_CONFIG=$(mktemp -d)
trap 'rm -rf -- "$DOCKER_CONFIG"' EXIT
printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
unset GHCR_TOKEN

# Ignore any server-side .env; the workflow supplies this branch's exact values.
compose=(docker compose --env-file /dev/null -p "waps-$DEPLOY_ENV" -f docker-compose.yml)
"${compose[@]}" config --quiet
"${compose[@]}" pull app
"${compose[@]}" up -d --no-build --no-deps --wait --wait-timeout 180 app
