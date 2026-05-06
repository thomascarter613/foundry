#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

TMP_DIRS=(
  "tmp-foundry-init-no-db-test"
  "tmp-foundry-init-postgres-drizzle"
  "tmp-foundry-init-postgres-prisma"
  "tmp-foundry-init-sqlite-drizzle"
  "tmp-foundry-init-sqlite-prisma"
  "tmp-foundry-init-mongodb-native"
  "tmp-foundry-init-supabase-sql"
  "tmp-foundry-init-supabase-drizzle"
  "tmp-foundry-init-supabase-prisma"
  "tmp-foundry-init-supabase-client"
)

cleanup() {
  for dir in "${TMP_DIRS[@]}"; do
    rm -rf "$ROOT_DIR/$dir"
    rm -rf "$ROOT_DIR/packages/cli/$dir"
  done
}

assert_file() {
  local file_path="$1"

  if [[ ! -f "$file_path" ]]; then
    echo "Missing expected file: $file_path" >&2
    exit 1
  fi
}

assert_dir() {
  local dir_path="$1"

  if [[ ! -d "$dir_path" ]]; then
    echo "Missing expected directory: $dir_path" >&2
    exit 1
  fi
}

assert_not_dir() {
  local dir_path="$1"

  if [[ -d "$dir_path" ]]; then
    echo "Unexpected directory exists: $dir_path" >&2
    exit 1
  fi
}

verify_workspace_baseline() {
  local workspace="$1"

  assert_file "$workspace/package.json"
  assert_file "$workspace/README.md"
  assert_file "$workspace/bunfig.toml"
  assert_file "$workspace/tsconfig.base.json"
  assert_file "$workspace/turbo.json"
  assert_file "$workspace/tools/scripts/foundry.sh"
  assert_file "$workspace/tools/scripts/verify.sh"
  assert_file "$workspace/packages/cli/src/index.ts"
  assert_file "$workspace/config/foundry/generator-manifest.json"
  assert_file "$workspace/.scaffdog/config.js"

  assert_file "$workspace/.foundry/README.md"
  assert_file "$workspace/.foundry/manifest.json"
  assert_file "$workspace/.foundry/init/provenance.json"
  assert_file "$workspace/.foundry/init/audit.ndjson"

  assert_dir "$workspace/apps"
  assert_dir "$workspace/services"
  assert_dir "$workspace/packages"
  assert_dir "$workspace/docs"
  assert_dir "$workspace/tools"
  assert_dir "$workspace/contracts/openapi"
  assert_dir "$workspace/generated/clients"
  assert_dir "$workspace/templates"
}

verify_provenance() {
  local workspace="$1"

  python3 - "$workspace" <<'PY'
import json
import sys
from pathlib import Path

workspace = Path(sys.argv[1])
manifest_path = workspace / ".foundry/manifest.json"
provenance_path = workspace / ".foundry/init/provenance.json"
audit_path = workspace / ".foundry/init/audit.ndjson"

manifest = json.loads(manifest_path.read_text())
provenance = json.loads(provenance_path.read_text())
audit_lines = audit_path.read_text().splitlines()

assert manifest["schemaVersion"] == 1
assert manifest["workspace"]["name"]
assert manifest["workspace"]["packageManager"] == "bun"
assert manifest["lifecycle"]["model"] == "inspect-resolve-plan-apply-verify-document-audit-handoff"
assert manifest["ai"]["providerRequired"] is False

assert provenance["schemaVersion"] == 1
assert provenance["generatedBy"]["command"] == "foundry init"
assert provenance["workspace"]["name"]
assert isinstance(provenance["generatedFiles"], list)
assert len(provenance["generatedFiles"]) > 0
assert len(audit_lines) >= 1

for line in audit_lines:
    event = json.loads(line)
    assert event["schemaVersion"] == 1
    assert event["type"] == "foundry.init.workspace_created"
PY
}

verify_embedded_cli() {
  local workspace="$1"

  verify_provenance "$workspace"

  (
    cd "$workspace"
    bun run foundry -- generate --list
    bun run verify
  )
}

verify_no_database_workspace() {
  local workspace="$ROOT_DIR/tmp-foundry-init-no-db-test"

  bun run foundry -- init tmp-foundry-init-no-db-test \
    --no-database \
    --yes \
    --no-install

  assert_dir "$workspace"
  assert_not_dir "$ROOT_DIR/packages/cli/tmp-foundry-init-no-db-test"

  verify_workspace_baseline "$workspace"

  if [[ -e "$workspace/db/provider.json" ]]; then
    echo "No-database workspace unexpectedly contains db/provider.json" >&2
    exit 1
  fi

  verify_embedded_cli "$workspace"
}

verify_postgres_drizzle() {
  local workspace="$ROOT_DIR/tmp-foundry-init-postgres-drizzle"

  bun run foundry -- init tmp-foundry-init-postgres-drizzle \
    --database-provider postgres:drizzle \
    --yes \
    --no-install

  verify_workspace_baseline "$workspace"
  verify_provenance "$workspace"

  assert_file "$workspace/db/provider.json"
  assert_file "$workspace/.env.example"
  assert_file "$workspace/drizzle.config.ts"
  assert_file "$workspace/db/schema.ts"
  assert_file "$workspace/db/client.ts"
  assert_file "$workspace/docker-compose.yml"
  assert_file "$workspace/tools/scripts/db-validate.sh"
  assert_file "$workspace/tools/scripts/db-start.sh"
  assert_file "$workspace/tools/scripts/db-stop.sh"
}

verify_postgres_prisma() {
  local workspace="$ROOT_DIR/tmp-foundry-init-postgres-prisma"

  bun run foundry -- init tmp-foundry-init-postgres-prisma \
    --database-provider postgres:prisma \
    --yes \
    --no-install

  verify_workspace_baseline "$workspace"
  verify_provenance "$workspace"

  assert_file "$workspace/db/provider.json"
  assert_file "$workspace/.env.example"
  assert_file "$workspace/prisma/schema.prisma"
  assert_file "$workspace/db/client.ts"
  assert_file "$workspace/docker-compose.yml"
}

verify_sqlite_drizzle() {
  local workspace="$ROOT_DIR/tmp-foundry-init-sqlite-drizzle"

  bun run foundry -- init tmp-foundry-init-sqlite-drizzle \
    --database-provider sqlite:drizzle \
    --yes \
    --no-install

  verify_workspace_baseline "$workspace"
  verify_provenance "$workspace"

  assert_file "$workspace/db/provider.json"
  assert_file "$workspace/.env.example"
  assert_file "$workspace/drizzle.config.ts"
  assert_file "$workspace/db/schema.ts"
  assert_file "$workspace/db/client.ts"
  assert_file "$workspace/data/.gitkeep"
}

verify_sqlite_prisma() {
  local workspace="$ROOT_DIR/tmp-foundry-init-sqlite-prisma"

  bun run foundry -- init tmp-foundry-init-sqlite-prisma \
    --database-provider sqlite:prisma \
    --yes \
    --no-install

  verify_workspace_baseline "$workspace"
  verify_provenance "$workspace"

  assert_file "$workspace/db/provider.json"
  assert_file "$workspace/.env.example"
  assert_file "$workspace/prisma/schema.prisma"
  assert_file "$workspace/db/client.ts"
  assert_file "$workspace/data/.gitkeep"
}

verify_mongodb_native() {
  local workspace="$ROOT_DIR/tmp-foundry-init-mongodb-native"

  bun run foundry -- init tmp-foundry-init-mongodb-native \
    --database-provider mongodb:native \
    --yes \
    --no-install

  verify_workspace_baseline "$workspace"
  verify_provenance "$workspace"

  assert_file "$workspace/db/provider.json"
  assert_file "$workspace/.env.example"
  assert_file "$workspace/db/client.ts"
  assert_file "$workspace/db/indexes.ts"
  assert_file "$workspace/docker-compose.yml"
}

verify_supabase_sql() {
  local workspace="$ROOT_DIR/tmp-foundry-init-supabase-sql"

  bun run foundry -- init tmp-foundry-init-supabase-sql \
    --database-provider supabase:sql \
    --yes \
    --no-install

  verify_workspace_baseline "$workspace"
  verify_provenance "$workspace"

  assert_file "$workspace/db/provider.json"
  assert_file "$workspace/.env.example"
  assert_file "$workspace/supabase/README.md"
  assert_file "$workspace/supabase/migrations/0001_initial.sql"
  assert_file "$workspace/db/client.ts"
}

verify_supabase_drizzle() {
  local workspace="$ROOT_DIR/tmp-foundry-init-supabase-drizzle"

  bun run foundry -- init tmp-foundry-init-supabase-drizzle \
    --database-provider supabase:drizzle \
    --yes \
    --no-install

  verify_workspace_baseline "$workspace"
  verify_provenance "$workspace"

  assert_file "$workspace/db/provider.json"
  assert_file "$workspace/.env.example"
  assert_file "$workspace/supabase/README.md"
  assert_file "$workspace/supabase/migrations/0001_initial.sql"
  assert_file "$workspace/drizzle.config.ts"
  assert_file "$workspace/db/schema.ts"
  assert_file "$workspace/db/client.ts"
}

verify_supabase_prisma() {
  local workspace="$ROOT_DIR/tmp-foundry-init-supabase-prisma"

  bun run foundry -- init tmp-foundry-init-supabase-prisma \
    --database-provider supabase:prisma \
    --yes \
    --no-install

  verify_workspace_baseline "$workspace"
  verify_provenance "$workspace"

  assert_file "$workspace/db/provider.json"
  assert_file "$workspace/.env.example"
  assert_file "$workspace/supabase/README.md"
  assert_file "$workspace/supabase/migrations/0001_initial.sql"
  assert_file "$workspace/prisma/schema.prisma"
  assert_file "$workspace/db/client.ts"
}

verify_supabase_client() {
  local workspace="$ROOT_DIR/tmp-foundry-init-supabase-client"

  bun run foundry -- init tmp-foundry-init-supabase-client \
    --database-provider supabase:client \
    --yes \
    --no-install

  verify_workspace_baseline "$workspace"
  verify_provenance "$workspace"

  assert_file "$workspace/db/provider.json"
  assert_file "$workspace/.env.example"
  assert_file "$workspace/supabase/README.md"
  assert_file "$workspace/db/client.ts"
}

trap cleanup EXIT

cleanup

echo "verify:init: typechecking CLI"
(
  cd packages/cli
  bun run typecheck
  bun run build
)

echo "verify:init: no-database workspace"
verify_no_database_workspace

echo "verify:init: postgres:drizzle"
verify_postgres_drizzle

echo "verify:init: postgres:prisma"
verify_postgres_prisma

echo "verify:init: sqlite:drizzle"
verify_sqlite_drizzle

echo "verify:init: sqlite:prisma"
verify_sqlite_prisma

echo "verify:init: mongodb:native"
verify_mongodb_native

echo "verify:init: supabase:sql"
verify_supabase_sql

echo "verify:init: supabase:drizzle"
verify_supabase_drizzle

echo "verify:init: supabase:prisma"
verify_supabase_prisma

echo "verify:init: supabase:client"
verify_supabase_client

cleanup

echo "verify:init: ok"
