#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re


ARTIFACT_DIR = Path(".artifacts/foundry/init-path-fix")
REPORT = ARTIFACT_DIR / "patch-targets.txt"


HELPER = r'''
function deriveProjectNameFromDestination(destination: string): string {
  const normalizedDestination = destination.replaceAll("\\", "/").replace(/\/+$/, "");
  const segments = normalizedDestination.split("/").filter((segment) => segment.length > 0);

  return segments.at(-1) ?? "myapp";
}
'''


def find_files_containing(pattern: str) -> list[Path]:
    results: list[Path] = []

    for path in Path("packages/cli/src").rglob("*.ts"):
        text = path.read_text(encoding="utf-8")
        if pattern in text:
            results.append(path)

    return sorted(results)


def source_context(path: Path, pattern: str, before: int = 40, after: int = 80) -> str:
    lines = path.read_text(encoding="utf-8").splitlines()
    hits = [index for index, line in enumerate(lines, start=1) if pattern in line]

    chunks: list[str] = []

    for line_number in hits:
        start = max(1, line_number - before)
        end = min(len(lines), line_number + after)

        chunks.append(f"### {path}:{line_number}")
        for index in range(start, end + 1):
            chunks.append(f"{index:04d}: {lines[index - 1]}")
        chunks.append("")

    return "\n".join(chunks)


def likely_init_request_context(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()

    interesting_terms = [
        "projectName",
        "destination",
        "args.destination",
        "flags.yes",
        "no-install",
        "noInstall",
        "Init",
        "init"
    ]

    hit_lines: set[int] = set()

    for index, line in enumerate(lines, start=1):
        if any(term in line for term in interesting_terms):
            for offset in range(-8, 12):
                candidate = index + offset
                if 1 <= candidate <= len(lines):
                    hit_lines.add(candidate)

    if not hit_lines:
        return ""

    chunks: list[str] = [f"### likely init context: {path}"]
    previous = 0

    for index in sorted(hit_lines):
        if previous and index > previous + 1:
            chunks.append("...")
        chunks.append(f"{index:04d}: {lines[index - 1]}")
        previous = index

    chunks.append("")
    return "\n".join(chunks)


def update_smoke_candidate() -> None:
    path = Path("tools/scripts/check-foundry-init-workspace.sh")

    if not path.exists():
        print(f"missing smoke script: {path}")
        return

    text = path.read_text(encoding="utf-8")
    old = "node packages/cli/bin/run.js init $WORKSPACE_DIR --yes --no-install"
    new = "node packages/cli/bin/run.js init $WORKSPACE_DIR --yes --no-install --no-database"

    if new in text:
        print("smoke script already uses --no-database for candidate 1")
        return

    if old not in text:
        print("could not find canonical smoke candidate to patch")
        return

    path.write_text(text.replace(old, new), encoding="utf-8")
    print(f"patched {path}")


def write_report() -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    separator_files = find_files_containing("project-name-path-separator")
    command_files = [
        *find_files_containing("args.destination"),
        *find_files_containing("DESTINATION"),
        *find_files_containing("no-install"),
    ]

    unique_command_files = sorted(set(command_files))

    parts: list[str] = []

    parts.append("# Init Destination Path Patch Targets")
    parts.append("")
    parts.append("## Files containing project-name-path-separator")
    parts.extend(f"- {path}" for path in separator_files)
    parts.append("")
    parts.append("## Files likely constructing init request")
    parts.extend(f"- {path}" for path in unique_command_files)
    parts.append("")

    parts.append("## Source context for project-name-path-separator")
    for path in separator_files:
        parts.append(source_context(path, "project-name-path-separator"))

    parts.append("")
    parts.append("## Likely init request construction context")
    for path in unique_command_files:
        context = likely_init_request_context(path)
        if context:
            parts.append(context)

    parts.append("")
    parts.append("## Required patch")
    parts.append("")
    parts.append("The fix is to keep destination as the full path and derive projectName from the destination basename.")
    parts.append("")
    parts.append("Add this helper near the init command/request construction code:")
    parts.append("")
    parts.append(HELPER)
    parts.append("")
    parts.append("Then change request construction from this shape:")
    parts.append("")
    parts.append('  projectName: destination')
    parts.append("")
    parts.append("or:")
    parts.append("")
    parts.append('  projectName: args.destination')
    parts.append("")
    parts.append("to this shape:")
    parts.append("")
    parts.append('  const destination = args.destination ?? "myapp";')
    parts.append("  const projectName = deriveProjectNameFromDestination(destination);")
    parts.append("")
    parts.append("  ...")
    parts.append("  destination,")
    parts.append("  projectName,")
    parts.append("")
    parts.append("Validation must still reject explicit project names containing path separators, but it must not validate the full destination path as the project name.")

    REPORT.write_text("\n".join(parts) + "\n", encoding="utf-8")
    print(f"wrote {REPORT}")


def main() -> int:
    update_smoke_candidate()
    write_report()

    print("")
    print("Next:")
    print(f"  sed -n '1,260p' {REPORT}")
    print("  apply the shown projectName/destination patch")
    print("  bun run --cwd packages/cli typecheck")
    print("  ( cd packages/cli && bun run build )")
    print("  tools/scripts/check-foundry-init-workspace.sh")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
