#!/usr/bin/env python3
"""Create or locate focused learning sessions without changing profiles or courses."""

import argparse
from datetime import date
import json
from pathlib import Path
import re


SLUG = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
SESSION_ID = re.compile(r"(?P<date>\d{4}-\d{2}-\d{2})_(?P<slug>[a-z0-9]+(?:-[a-z0-9]+)*)")
DOCUMENTS = {
    "note": "note.md",
    "mentor_feedback": "mentor-feedback.md",
    "practice": "practice.md",
}
ASSETS = Path(__file__).resolve().parent.parent / "assets"


def learning_root(value):
    root = Path(value).expanduser().resolve()
    if not root.is_dir():
        raise ValueError("Choose an existing learning directory with --vault")
    for ancestor in (root, *root.parents):
        if ((ancestor / "AGENTS.md").is_file()
                and (ancestor / "scripts/create_vault.py").is_file()
                and (ancestor / "SKILLS/guided-learning/SKILL.md").is_file()):
            instructions = (ancestor / "AGENTS.md").read_text(encoding="utf-8")
            if "# Learning vault setup repository" in instructions.splitlines():
                raise ValueError("Keep learner data outside the setup source repository; choose a learning directory")
        if ancestor.name == "concept-sessions":
            raise ValueError("Choose the learning root, not a concept session directory")
        if ancestor.name == "topics" and (ancestor / "registry.json").is_file():
            raise ValueError("Choose the vault root, not a course directory under topics")
    return root


def safe_path(root, relative):
    """Reject traversal and symlinks, including links to locations inside the vault."""
    if not isinstance(relative, str) or not relative:
        raise ValueError(f"Expected a safe vault-relative path: {relative!r}")
    path = Path(relative)
    if path.is_absolute() or ".." in path.parts or "\\" in relative:
        raise ValueError(f"Expected a safe vault-relative path: {relative!r}")
    candidate = root
    for part in path.parts:
        candidate = candidate / part
        if candidate.is_symlink():
            raise ValueError(f"Refusing a symlinked session path: {relative}")
    if not candidate.resolve().is_relative_to(root):
        raise ValueError(f"Session path leaves the learning directory: {relative}")
    return candidate


def validate_date(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError("Date must use YYYY-MM-DD in the learner's local timezone")
    try:
        date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError("Date must be a valid calendar date") from exc
    return value


def manifest(session_id):
    relative = f"concept-sessions/{session_id}"
    return {
        "id": session_id,
        "root": relative,
        "paths": {key: f"{relative}/{filename}" for key, filename in DOCUMENTS.items()},
    }


def render_documents(session_id, title, session_date):
    # Substitute in a single pass so user-provided titles are always literal data.
    values = {
        "session_json": json.dumps(session_id, ensure_ascii=False),
        "date_json": json.dumps(session_date),
        "title_json": json.dumps(title, ensure_ascii=False),
        "title": re.sub(r"([\\`*{}\[\]<>#_!|])", r"\\\1", title),
    }
    rendered = {}
    for filename in DOCUMENTS.values():
        source = ASSETS / filename
        template = source.read_text(encoding="utf-8")
        rendered[filename] = re.sub(
            r"\{\{(session_json|date_json|title_json|title)\}\}",
            lambda match: values[match.group(1)], template,
        )
    return rendered


def create(root, slug, title, session_date):
    if not isinstance(slug, str) or not SLUG.fullmatch(slug) or len(slug) > 80:
        raise ValueError("Use a slug of at most 80 lowercase letters/digits separated by hyphens")
    if (not isinstance(title, str) or not title.strip()
            or any(ord(char) < 32 or ord(char) == 127 for char in title)
            or "\u2028" in title or "\u2029" in title):
        raise ValueError("Title must be nonempty text on a single line")
    session_date = validate_date(session_date)
    title = title.strip()
    # Load every template before touching the destination; a broken installation
    # must not leave an apparently usable session with missing standard records.
    base_id = f"{session_date}_{slug}"
    render_documents(base_id, title, session_date)
    sessions = safe_path(root, "concept-sessions")
    sessions.mkdir(exist_ok=True)
    number = 1
    while True:
        session_id = base_id if number == 1 else f"{base_id}-{number:02d}"
        session = safe_path(root, f"concept-sessions/{session_id}")
        try:
            session.mkdir()
            break
        except FileExistsError:
            if not session.is_dir():
                raise ValueError(f"Session destination is not a directory: {session.name}")
            number += 1
    written = []
    try:
        for filename, content in render_documents(session_id, title, session_date).items():
            target = safe_path(root, f"concept-sessions/{session_id}/{filename}")
            with target.open("x", encoding="utf-8") as handle:
                written.append(target)
                handle.write(content)
    except Exception:
        # Only remove files made by this invocation; never an earlier session.
        for target in written:
            target.unlink()
        session.rmdir()
        raise
    return manifest(session_id)


def resolve(root, relative):
    if not isinstance(relative, str) or not relative.startswith("concept-sessions/"):
        raise ValueError("Name the explicit session path: concept-sessions/YYYY-MM-DD_slug")
    session_id = relative.removeprefix("concept-sessions/")
    match = SESSION_ID.fullmatch(session_id)
    if not match:
        raise ValueError("Expected concept-sessions/YYYY-MM-DD_slug with an optional numbered suffix")
    validate_date(match.group("date"))
    session = safe_path(root, relative)
    if not session.is_dir():
        raise ValueError(f"Session does not exist: {relative}")
    result = manifest(session_id)
    for path in result["paths"].values():
        if not safe_path(root, path).is_file():
            raise ValueError(f"Session record is missing: {path}; inspect before resuming")
    return result


def list_sessions(root):
    sessions = safe_path(root, "concept-sessions")
    if not sessions.exists():
        return {"sessions": []}
    if not sessions.is_dir():
        raise ValueError("concept-sessions must be a directory")
    found = []
    for child in sorted(sessions.iterdir(), key=lambda path: path.name, reverse=True):
        if SESSION_ID.fullmatch(child.name):
            found.append(resolve(root, f"concept-sessions/{child.name}"))
    return {"sessions": found}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vault", type=Path, required=True, help="Existing learning root, outside the setup repository")
    commands = parser.add_subparsers(dest="command", required=True)
    new = commands.add_parser("create", help="Create three new session records without overwriting earlier sessions")
    new.add_argument("slug")
    new.add_argument("--title", required=True)
    new.add_argument("--date", required=True, help="Learner-local date, YYYY-MM-DD")
    read = commands.add_parser("resolve", help="Validate and locate one explicit existing session")
    read.add_argument("session")
    commands.add_parser("list", help="List existing sessions without creating files")
    args = parser.parse_args()
    try:
        root = learning_root(args.vault)
        if args.command == "create":
            result = create(root, args.slug, args.title, args.date)
        elif args.command == "resolve":
            result = resolve(root, args.session)
        else:
            result = list_sessions(root)
    except (ValueError, OSError) as exc:
        parser.exit(1, f"Error: {exc}\n")
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
