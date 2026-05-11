#!/usr/bin/env python3
from __future__ import annotations

from datetime import date
from pathlib import Path
import re

TODAY = date.today().isoformat()

CHANGEPLAN_PATH = Path("docs/changeplans/cp-0009-foundry-init-stabilization.md")
WORK_PACKET_PATH = Path("docs/work-packets/WP-0003-stabilize-foundry-init-mvp.md")
CHECK_SCRIPT_PATH = Path("tools/scripts/check-foundry-init-mvp.sh")

CHANGEPLAN = f'''---
title: "CP-0009: Foundry Init Stabilization"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "{TODAY}"
governanceLevel: "Required"
documentType: "ChangePlan"
upstream:
  - "docs/changeplans/index.md"
downstream:
  - "docs/work-packets/WP-0003-stabilize-foundry-init-mvp.md"
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "ChangePlan"
  - "Lifecycle"
  - "CLI"
  - "Scaffolding"
  - "Verification"
---

# CP-0009: Foundry Init Stabilization

## Purpose
Stabilize the `foundry init` path as the next product-MVP implementation track.
'''

WORK_PACKET = f'''---
title: "WP-0003: Stabilize Foundry Init MVP"
status: "Draft"
owner: "Engineering Productivity"
lastUpdated: "{TODAY}"
governanceLevel: "Required"
documentType: "WorkPacket"
upstream:
  - "docs/work-packets/index.md"
  - "docs/changeplans/cp-0009-foundry-init-stabilization.md"
downstream: []
governanceLinks:
  - "docs/governance/documentation-governance.md"
adrLinks: []
glossaryTerms:
  - "Work Packet"
  - "ChangePlan"
  - "CLI"
  - "Scaffolding"
  - "Verification"
---

# WP-0003: Stabilize Foundry Init MVP
'''

CHECK_SCRIPT = r'''#!/usr/bin/env bash
set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

ARTIFACT_DIR=".artifacts/foundry/init-mvp"
SUMMARY_TXT="$ARTIFACT_DIR/summary.txt"
mkdir -p "$ARTIFACT_DIR"
: > "$SUMMARY_TXT"

run_step() {
    local name="$1"
    shift
    echo "==> $name"
    echo "==> $name" >> "$SUMMARY_TXT"
    "$@" >> "$SUMMARY_TXT" 2>&1
    local status=$?
    printf '%s\t%s\n' "$name" "$status" >> "$SUMMARY_TXT"
    return 0
}

run_step "typecheck cli" bun run --cwd packages/cli typecheck
run_step "build cli" bash -lc '( cd packages/cli && bun run build )'
run_step "docs verify" node packages/cli/bin/run.js docs verify
run_step "docs readiness artifact" node packages/cli/bin/run.js docs readiness --report-path .artifacts/docs/readiness-report.json
run_step "cli help" node packages/cli/bin/run.js --help
run_step "init help" node packages/cli/bin/run.js init --help

python3 - <<'PY'
import json
from pathlib import Path

summary_txt = Path(".artifacts/foundry/init-mvp/summary.txt")
summary_json = Path(".artifacts/foundry/init-mvp/summary.json")

results = {}
if summary_txt.exists():
    for line in summary_txt.read_text().splitlines():
        if "\t" in line:
            name, status = line.split("\t", 1)
            results[name.strip()] = int(status.strip())

required = ["typecheck cli", "build cli", "docs verify", "docs readiness artifact", "cli help"]
optional = ["init help"]

report = {
    "ok": all(results.get(name) == 0 for name in required),
    "required": {name: results.get(name) for name in required},
    "optional": {name: results.get(name) for name in optional},
    "notes": [],
}

if results.get("init help") != 0:
    report["notes"].append("init help is not currently passing.")

summary_json.write_text(json.dumps(report, indent=2) + "\n")
print(f"Summary: {'OK' if report['ok'] else 'FAILED'}")
if not report["ok"]: exit(1)
PY
'''

def write(path: Path, content: str, executable: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    if executable:
        path.chmod(0o755)
    print(f"wrote {path}")

def add_index_row(index_path: Path, marker: str, row: str) -> None:
    if not index_path.exists(): return
    content = index_path.read_text(encoding="utf-8")
    if row in content: return
    if marker in content:
        content = content.replace(marker, marker + "\n" + row)
    else:
        content += "\n" + row + "\n"
    index_path.write_text(content, encoding="utf-8")
    print(f"updated {index_path}")

def ensure_frontmatter_downstream(path: Path, value: str) -> None:
    if not path.exists(): return
    content = path.read_text(encoding="utf-8")
    if value in content: return
    if "downstream: []" in content:
        content = content.replace("downstream: []", f'downstream:\n  - "{value}"')
    else:
        content = re.sub(r"(downstream:\n(?:  - .+\n)*)", 
                        lambda m: m.group(1) + f'  - "{value}"\n', content, count=1)
    path.write_text(content, encoding="utf-8")

def main() -> int:
    write(CHANGEPLAN_PATH, CHANGEPLAN)
    write(WORK_PACKET_PATH, WORK_PACKET)
    write(CHECK_SCRIPT_PATH, CHECK_SCRIPT, executable=True)

    add_index_row(Path("docs/changeplans/index.md"), "| --- | --- | --- | --- |", 
                  '| CP-0009 | Foundry Init Stabilization | Draft | `docs/changeplans/cp-0009-foundry-init-stabilization.md` |')
    
    add_index_row(Path("docs/work-packets/index.md"), "| --- | --- | --- | --- |", 
                  '| WP-0003 | Stabilize Foundry Init MVP | Draft | `docs/work-packets/WP-0003-stabilize-foundry-init-mvp.md` |')

    ensure_frontmatter_downstream(Path("docs/changeplans/index.md"), str(CHANGEPLAN_PATH))
    ensure_frontmatter_downstream(Path("docs/work-packets/index.md"), str(WORK_PACKET_PATH))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
