#!/usr/bin/env python3
"""Update an installed learning vault's skills and setup files from this setup.

Learner data is never modified: the profile, topics, concept sessions,
attachments, Obsidian settings, and the local runtime record stay as they are.
Setup files the learner edited are kept. When this setup changed the same file,
the incoming version is saved under .vault-updates/ for review.
"""

import argparse
from datetime import datetime, timezone
import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile


setup_spec = importlib.util.spec_from_file_location(
    "vault_setup", Path(__file__).resolve().with_name("create_vault.py")
)
setup = importlib.util.module_from_spec(setup_spec)
setup_spec.loader.exec_module(setup)
runtime = setup.runtime

UPDATES_DIR = ".vault-updates"
# Actions that write the incoming file into the vault.
WRITES = {"add", "update", "replace"}


def load_manifest(vault):
    """Return the installed baseline, or None for vaults installed before manifests."""
    path = vault / setup.MANIFEST_FILE
    if not path.is_file() or path.is_symlink():
        return None
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except ValueError:
        return None
    files = manifest.get("files") if isinstance(manifest, dict) else None
    if not isinstance(files, dict) or not all(isinstance(v, str) for v in files.values()):
        return None
    return manifest


def vault_name(vault, manifest):
    if manifest and isinstance(manifest.get("name"), str) and manifest["name"].strip():
        return manifest["name"]
    home = vault / "Home.md"
    if home.is_file():
        first = home.read_text(encoding="utf-8").splitlines()[:1]
        if first and first[0].startswith("# ") and first[0][2:].strip():
            return first[0][2:].strip()
    return vault.name


def unsafe_path(vault, relative):
    """Return why a path cannot be written safely, or None."""
    path = vault
    for part in Path(relative).parts:
        path = path / part
        if path.is_symlink():
            return "symlinked"
    if path.exists() and not path.is_file():
        return "not a regular file"
    return None


def plan_update(vault, incoming, manifest, overwrite_modified=False):
    """Classify every setup file; nothing is written here."""
    baseline = manifest["files"] if manifest else {}
    plan = []
    for relative, content in sorted(incoming.items()):
        path = vault / relative
        blocked = unsafe_path(vault, relative)
        if not setup.is_managed(relative):
            # Learner data and settings: restore a missing scaffold, never change one.
            missing = not blocked and not path.exists()
            plan.append(("add" if missing else "learner", relative, None))
            continue
        if blocked:
            plan.append(("blocked", relative, blocked))
            continue
        local = setup.file_digest(path.read_bytes()) if path.is_file() else None
        new = setup.file_digest(content)
        base = baseline.get(relative)
        if local == new:
            action = "current"
        elif local is None:
            # A file deleted by the learner stays deleted unless the setup changed it.
            if base is None:
                action = "add"
            elif base == new:
                action = "deleted"
            else:
                action = "replace" if overwrite_modified else "conflict"
        elif base is not None and local == base:
            action = "update"
        elif base is not None and new == base:
            action = "kept"
        else:
            # Edited locally (or no baseline to tell) and different from the incoming file.
            action = "replace" if overwrite_modified else "conflict"
        plan.append((action, relative, None))
    for relative, base in sorted(baseline.items()):
        if relative in incoming or not setup.is_managed(relative):
            continue
        path = vault / relative
        if unsafe_path(vault, relative) or not path.is_file():
            continue
        unchanged = setup.file_digest(path.read_bytes()) == base
        plan.append(("remove" if unchanged else "orphaned", relative, None))
    return plan


def write_file(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    handle, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(handle, "wb") as stream:
            stream.write(content)
        os.chmod(temporary, 0o755 if path.suffix in {".py", ".sh"} else 0o644)
        os.replace(temporary, path)
    except BaseException:
        Path(temporary).unlink(missing_ok=True)
        raise


def new_updates_directory(vault):
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    directory = vault / UPDATES_DIR / stamp
    suffix = 1
    while directory.exists():
        suffix += 1
        directory = vault / UPDATES_DIR / f"{stamp}-{suffix}"
    return directory


def apply_plan(vault, incoming, plan):
    """Write the planned changes and return the review directory, if one was needed."""
    if (vault / UPDATES_DIR).is_symlink():
        raise ValueError(f"Refusing to write through symlinked {UPDATES_DIR}/")
    review = None
    for action, relative, _ in plan:
        path = vault / relative
        if action in {"replace", "remove", "conflict", "blocked"}:
            review = review or new_updates_directory(vault)
        if action in {"replace", "remove"} and path.is_file():
            # Keep the learner's copy before replacing or removing it.
            write_file(review / "backup" / relative, path.read_bytes())
        if action in {"conflict", "blocked"}:
            write_file(review / "incoming" / relative, incoming[relative])
        if action in WRITES:
            write_file(path, incoming[relative])
        elif action == "remove":
            path.unlink()
    return review


def update_vault(source, vault, name=None, overwrite_modified=False, dry_run=False):
    source = source.expanduser().resolve()
    vault = vault.expanduser().resolve()
    for relative in ("AGENTS.md", "topics/registry.json", "SKILLS/learner-profile/SKILL.md"):
        if not (vault / relative).is_file():
            raise ValueError(f"Not an installed learning vault: {vault}")
    if vault == source:
        raise ValueError("Run update_vault.py from a newer setup checkout, not from the vault being updated")
    if vault.is_relative_to(source):
        raise ValueError("The vault must be outside the setup directory tree")
    if (vault / setup.MANIFEST_FILE).is_symlink():
        raise ValueError(f"Refusing to update symlinked {setup.MANIFEST_FILE}")
    manifest = load_manifest(vault)
    name = (name or vault_name(vault, manifest)).strip()
    if not name or any(ord(char) < 32 for char in name):
        raise ValueError("Vault name must be a nonempty single line")
    incoming = setup.make_files(source, name)
    plan = plan_update(vault, incoming, manifest, overwrite_modified)
    previous = runtime.read_record(vault / runtime.RUNTIME_FILE).get("source_commit")
    commit = setup.source_commit(source)
    review = None
    if not dry_run:
        review = apply_plan(vault, incoming, plan)
        # The baseline becomes this setup's files. Kept edits still differ from it,
        # so they stay protected in later updates; removed setup files are released.
        write_file(vault / setup.MANIFEST_FILE, setup.manifest_text(incoming, name).encode("utf-8"))
        runtime.record_source(vault, commit)
    return {"plan": plan, "review": review, "baseline": manifest is not None,
            "previous": previous, "commit": commit, "vault": vault}


LABELS = {
    "add": "Added",
    "update": "Updated",
    "replace": "Replaced your edited copy (backup saved)",
    "remove": "Removed from the setup (backup saved)",
    "conflict": "Kept your edited copy; incoming version saved for review",
    "blocked": "Skipped unsafe path; incoming version saved for review",
    "kept": "Kept your edits (no setup change)",
    "deleted": "Left deleted as you chose (no setup change)",
    "orphaned": "No longer part of the setup; kept your edited copy",
}


def report(result, dry_run):
    plan = result["plan"]
    lines = [f"{'Planned update for' if dry_run else 'Updated'} vault: {result['vault']}",
             f"Setup version: {result['previous'] or 'unknown'} -> {result['commit'] or 'unknown'}"]
    if not result["baseline"]:
        lines.append("No install manifest was found, so every file that differs from this setup is treated "
                     "as your edit. Review the incoming versions, or rerun with --overwrite-modified.")
    for action, label in LABELS.items():
        entries = [(relative, detail) for kind, relative, detail in plan if kind == action]
        if entries:
            lines.append(f"{label}: {len(entries)}")
            lines.extend(f"  {relative}" + (f" ({detail})" if detail else "") for relative, detail in entries)
    if not any(kind in WRITES | {"remove", "conflict", "blocked"} for kind, _, _ in plan):
        lines.append("Setup files are already up to date.")
    if result["review"]:
        lines.append(f"Review folder: {result['review']}")
    lines.append("Learner profile, topics, concept sessions, attachments, and Obsidian settings were not changed.")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("vault", type=Path, help="existing installed vault to update")
    parser.add_argument("--dry-run", action="store_true", help="show the planned changes without writing")
    parser.add_argument("--overwrite-modified", action="store_true",
                        help="replace setup files you edited, saving each previous copy under .vault-updates/")
    parser.add_argument("--name", help="vault title for Home.md; defaults to the installed name")
    args = parser.parse_args()
    if sys.version_info < (3, 9):
        parser.exit(1, "Error: Python 3.9 or newer is required.\n")
    source = Path(__file__).resolve().parents[1]
    try:
        result = update_vault(source, args.vault, args.name, args.overwrite_modified, args.dry_run)
    except (OSError, ValueError, KeyError) as exc:
        parser.exit(1, f"Error: {exc}\n")
    except KeyboardInterrupt:
        parser.exit(130, "\nUpdate interrupted. Rerun it to finish; completed files are recognized.\n")
    print(report(result, args.dry_run))


if __name__ == "__main__":
    main()
