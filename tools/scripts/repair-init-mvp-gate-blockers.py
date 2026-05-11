#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re


SPEC_TYPES = '''export type FoundrySpecStatus =
  | "draft"
  | "clarifying"
  | "planned"
  | "tasked"
  | "approved"
  | "implemented"
  | "verified"
  | "superseded"
  | "rejected";

export type FoundrySpecKind =
  | "feature"
  | "bugfix"
  | "refactor"
  | "architecture"
  | "security"
  | "operations"
  | "documentation"
  | "research";

export type FoundrySpecRiskLevel = "low" | "medium" | "high" | "critical";

export interface FoundrySpecFrontmatter {
  id: string;
  title: string;
  status: FoundrySpecStatus;
  kind: FoundrySpecKind;
  created: string;
  updated: string;
  owners: string[];
  related_adrs: string[];
  related_work_packets: string[];
  risk_level: FoundrySpecRiskLevel;
  requires_ai: boolean;
  requires_database_change: boolean;
  requires_api_change: boolean;
  requires_security_review: boolean;
  requires_migration: boolean;
}

export interface ParsedFoundrySpec {
  filePath: string;
  frontmatter: Partial<FoundrySpecFrontmatter>;
  body: string;
}

export interface SpecValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  field?: string;
  section?: string;
}

export interface SpecValidationResult {
  ok: boolean;
  filePath: string;
  issues: SpecValidationIssue[];
}
'''


def write_spec_types() -> None:
    path = Path("packages/cli/src/spec/spec-types.ts")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(SPEC_TYPES, encoding="utf-8")
    print(f"rewrote {path}")


def demote_placeholder_adr_to_planning() -> None:
    path = Path("docs/planning/04-decisions/ADR-00XX-native-spec-lifecycle-engine.md")

    if not path.exists():
        print(f"skipped missing {path}")
        return

    content = path.read_text(encoding="utf-8")
    original = content

    content = re.sub(
        r'^documentType:\s*"?ADR"?\s*$',
        'documentType: "Planning"',
        content,
        flags=re.MULTILINE,
    )

    content = re.sub(
        r'^title:\s*"?ADR-00XX:?\s*(.*?)"?\s*$',
        lambda match: f'title: "{match.group(1).strip() or "Native Spec Lifecycle Engine"}"',
        content,
        flags=re.MULTILINE,
    )

    if content != original:
        path.write_text(content, encoding="utf-8")
        print(f"demoted placeholder ADR draft to Planning: {path}")
    else:
        print(f"no placeholder ADR metadata change needed: {path}")


def ensure_glossary_heading(path: Path, heading: str, body: str) -> bool:
    if not path.exists():
        print(f"skipped missing {path}")
        return False

    content = path.read_text(encoding="utf-8")

    if f"## {heading}" in content:
        return False

    path.write_text(content.rstrip() + f"\n\n## {heading}\n\n{body.strip()}\n", encoding="utf-8")
    return True


def ensure_glossary_terms() -> None:
    glossary = Path("docs/planning/glossary.md")
    quickref = Path("docs/onboarding/glossary-quickref.md")

    changed_glossary = False
    changed_quickref = False

    changed_glossary |= ensure_glossary_heading(
        glossary,
        "Audit",
        "A durable record of actions, generated artifacts, decisions, or state changes used to support accountability, inspection, and reproducibility.",
    )
    changed_glossary |= ensure_glossary_heading(
        glossary,
        "Provenance",
        "Machine-readable information that records how an artifact was produced, by which tool or process, with which inputs, and under which generated context.",
    )
    changed_glossary |= ensure_glossary_heading(
        glossary,
        "Specification",
        "A structured statement of intended behavior, requirements, constraints, or acceptance criteria used to guide implementation and verification.",
    )

    changed_quickref |= ensure_glossary_heading(
        quickref,
        "Audit",
        "A quick reference term for durable action and decision records used for accountability and verification.",
    )
    changed_quickref |= ensure_glossary_heading(
        quickref,
        "Provenance",
        "A quick reference term for metadata describing how generated artifacts were produced.",
    )
    changed_quickref |= ensure_glossary_heading(
        quickref,
        "Specification",
        "A quick reference term for structured requirements and acceptance criteria used to guide implementation.",
    )

    if changed_glossary:
        print(f"patched {glossary}")

    if changed_quickref:
        print(f"patched {quickref}")


def patch_metadata_placement_for_placeholder_decisions() -> None:
    path = Path("packages/cli/src/docs/metadata.ts")

    if not path.exists():
        print(f"skipped missing {path}")
        return

    content = path.read_text(encoding="utf-8")

    # Keep docs/planning/04-decisions as Planning unless a document has been promoted
    # into a numbered ADR under docs/architecture/adr or docs/adr. This prevents
    # ADR-00XX planning drafts from entering the ADR validator.
    block = '''  if (relativePath.startsWith("docs/planning/04-decisions/")) {
    return ["Planning"];
  }

'''

    if 'relativePath.startsWith("docs/planning/04-decisions/")' in content:
        content = re.sub(
            r'  if \(relativePath\.startsWith\("docs/planning/04-decisions/"\)\) \{\n    return \[[^\]]+\];\n  \}\n\n',
            block,
            content,
            count=1,
        )
    else:
        content = content.replace(
            '  if (relativePath.startsWith("docs/planning/")) {\n    return ["Planning"];\n  }\n',
            block + '  if (relativePath.startsWith("docs/planning/")) {\n    return ["Planning"];\n  }\n',
        )

    path.write_text(content, encoding="utf-8")
    print(f"patched {path}")


def main() -> int:
    write_spec_types()
    demote_placeholder_adr_to_planning()
    ensure_glossary_terms()
    patch_metadata_placement_for_placeholder_decisions()

    print("")
    print("Next:")
    print("  bun run --cwd packages/cli typecheck")
    print("  ( cd packages/cli && bun run build )")
    print("  node packages/cli/bin/run.js docs verify")
    print("  node packages/cli/bin/run.js docs readiness --report-path .artifacts/docs/readiness-report.json")
    print("  tools/scripts/check-foundry-init-mvp.sh")
    print("  cat .artifacts/foundry/init-mvp/summary.json")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
