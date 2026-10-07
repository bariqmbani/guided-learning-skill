#!/usr/bin/env python3
"""Resolve, select, scaffold, and migrate independent learning tracks without resetting courses."""

import argparse
from contextlib import contextmanager
import json
import os
from pathlib import Path
import re
import shutil
import tempfile


SUFFIXES = {
    "roadmap": "learning/learning-roadmap.md",
    "recall_queue": "learning/recall-queue.md",
    "protocols_dir": "learning/protocols/",
    "interactives_dir": "learning/interactives/",
    "concepts_dir": "concepts/",
    "papers_dir": "literature/papers/",
    "glossary": "research/glossary.md",
    "skill_logs_dir": "logs/",
    "css_file": "learning/interactives/interactive.css",
    "build_script": "learning/interactives/build.py",
}
TOPIC_ID = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")


def inside(vault, relative):
    if not isinstance(relative, str) or not relative or Path(relative).is_absolute():
        raise ValueError(f"Expected a vault-relative path: {relative!r}")
    if ".." in Path(relative).parts:
        raise ValueError(f"Path traversal is not allowed: {relative}")
    resolved = (vault / relative).resolve()
    if not resolved.is_relative_to(vault):
        raise ValueError(f"Path leaves the vault: {relative}")
    return resolved


def validate(vault, registry):
    if not isinstance(registry, dict) or registry.get("schema_version") != 1:
        raise ValueError("Unsupported topic registry schema")
    topics = registry.get("topics")
    if not isinstance(topics, list):
        raise ValueError("Registry topics must be a list")
    names, all_paths = set(), []
    ids = set()
    for topic in topics:
        if not isinstance(topic, dict):
            raise ValueError("Each registry topic must be an object")
        topic_id = topic.get("id", "")
        if not isinstance(topic_id, str) or not TOPIC_ID.fullmatch(topic_id) or topic_id in ids:
            raise ValueError(f"Invalid or duplicate topic ID: {topic_id!r}")
        ids.add(topic_id)
        title, aliases = topic.get("title"), topic.get("aliases", [])
        if not isinstance(title, str) or not title.strip() or not isinstance(aliases, list):
            raise ValueError(f"Invalid title or aliases for {topic_id}")
        labels = [topic_id, title, *aliases]
        if any(not isinstance(label, str) or not label.strip() for label in labels):
            raise ValueError(f"Invalid alias for {topic_id}")
        labels = {label.strip().casefold() for label in labels}
        if names & labels:
            raise ValueError(f"Ambiguous topic names or aliases: {sorted(names & labels)}")
        names.update(labels)
        root = inside(vault, topic.get("root"))
        layout = topic.get("layout")
        if layout == "legacy":
            if root != vault:
                raise ValueError("The legacy track must retain its vault-root layout")
        elif layout == "topic":
            if root != inside(vault, f"topics/{topic_id}"):
                raise ValueError(f"Unexpected topic root for {topic_id}")
        else:
            raise ValueError(f"Unknown layout for {topic_id}: {layout!r}")
        paths = topic.get("paths")
        if not isinstance(paths, dict) or set(paths) != set(SUFFIXES):
            raise ValueError(f"Missing or unknown path keys for {topic_id}")
        resolved = [inside(vault, value) for value in paths.values()]
        if any(not path.is_relative_to(root) or path == root for path in resolved):
            raise ValueError(f"Learning paths must stay inside the topic root: {topic_id}")
        for other_id, other_paths in all_paths:
            if any(a == b or a.is_relative_to(b) or b.is_relative_to(a)
                   for a in resolved for b in other_paths):
                raise ValueError(f"Topics share learning paths: {topic_id} and {other_id}")
        all_paths.append((topic_id, resolved))
    active = registry.get("active_topic")
    if "active_topic" not in registry or (active is not None and active not in ids):
        raise ValueError("Active topic is missing or does not name a registered topic")
    return registry


def read_registry(vault):
    path = inside(vault, "topics/registry.json")
    if not path.is_file():
        raise ValueError("Topic registry is missing; inspect existing learning before registering it")
    return validate(vault, json.loads(path.read_text(encoding="utf-8")))


def resolve(registry, query=None):
    query = registry["active_topic"] if query is None else query
    if not query:
        raise ValueError("No active topic; choose an existing topic or create a new one")
    query = query.strip().casefold()
    matches = [topic for topic in registry["topics"]
               if query in {name.strip().casefold()
                            for name in [topic["id"], topic["title"], *topic.get("aliases", [])]}]
    if len(matches) != 1:
        raise ValueError(f"No unique registered topic matches {query!r}; list topics before proceeding")
    return matches[0]


@contextmanager
def registry_lock(vault):
    with inside(vault, "topics/.registry.lock").open("a+b") as handle:
        if os.name == "nt":
            import msvcrt

            if handle.seek(0, os.SEEK_END) == 0:
                handle.write(b"\0")
                handle.flush()
            handle.seek(0)
            msvcrt.locking(handle.fileno(), msvcrt.LK_LOCK, 1)
        else:
            import fcntl

            fcntl.flock(handle, fcntl.LOCK_EX)
        try:
            yield
        finally:
            if os.name == "nt":
                handle.seek(0)
                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(handle, fcntl.LOCK_UN)


def atomic_write(path, content):
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        temporary = Path(handle.name)
        handle.write(content)
    try:
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def save_registry(vault, registry):
    validate(vault, registry)
    atomic_write(inside(vault, "topics/registry.json"), json.dumps(registry, indent=2, ensure_ascii=False) + "\n")


def update_dashboard(vault, registry):
    path = inside(vault, "topics/README.md")
    start, end = "<!-- topics:start -->", "<!-- topics:end -->"
    rows = ["| Topic | Roadmap | Recall | Glossary |", "| --- | --- | --- | --- |"]
    for topic in registry["topics"]:
        p = topic["paths"]
        title = topic["title"].replace("|", "\\|").replace("\n", " ")
        links = [f"[[{p[key].removesuffix('.md')}|{label}]]"
                 for key, label in [("roadmap", "Roadmap"), ("recall_queue", "Recall queue"), ("glossary", "Glossary")]]
        rows.append(f"| {title} | " + " | ".join(links) + " |")
    block = start + "\n" + "\n".join(rows) + "\n" + end
    current = path.read_text(encoding="utf-8") if path.exists() else "# Learning Topics\n\n"
    if start in current and end in current:
        before, after = current.split(start, 1)[0], current.split(end, 1)[1]
        content = before + block + after
    else:
        content = current.rstrip() + "\n\n" + block + "\n"
    atomic_write(path, content)


def create(vault, registry, topic_id, title, aliases):
    if not TOPIC_ID.fullmatch(topic_id):
        raise ValueError("Topic IDs must be lowercase words separated by hyphens")
    root_name = f"topics/{topic_id}"
    root = inside(vault, root_name)
    if root.exists() or root.is_symlink():
        raise ValueError(f"Topic directory already exists; inspect before registering: {root_name}")
    topic = {"id": topic_id, "title": title, "aliases": aliases,
             "root": root_name, "layout": "topic",
             "paths": {key: f"{root_name}/{suffix}" for key, suffix in SUFFIXES.items()}}
    updated = {**registry, "active_topic": topic_id, "topics": [*registry["topics"], topic]}
    validate(vault, updated)
    source = inside(vault, "learning/interactives")
    for name in ["interactive.css", "interactive.js", "build.py"]:
        if not (source / name).is_file():
            raise ValueError(f"Interactive template is missing: {source / name}")
    # mkdir without exist_ok prevents overwriting another creator's directory.
    root.mkdir()
    for key, relative in topic["paths"].items():
        if key.endswith("_dir"):
            inside(vault, relative).mkdir(parents=True)
    p = topic["paths"]
    inside(vault, p["glossary"]).parent.mkdir(parents=True)
    with inside(vault, p["roadmap"]).open("x", encoding="utf-8") as handle:
        handle.write("# Learning Roadmap\n\nNo concepts yet. Bootstrap this topic using the learner's goal.\n")
    with inside(vault, p["recall_queue"]).open("x", encoding="utf-8") as handle:
        handle.write("# Recall Queue\n\n| concept | learned | interval | next_recall | last_result | notes |\n"
                     "|---------|---------|----------|-------------|-------------|-------|\n")
    with inside(vault, p["glossary"]).open("x", encoding="utf-8") as handle:
        handle.write("# Glossary\n\nTerms will be added during this topic's learning sessions.\n")
    for key, name in [("css_file", "interactive.css"), ("build_script", "build.py")]:
        shutil.copy2(source / name, inside(vault, p[key]))
    shutil.copy2(source / "interactive.js", inside(vault, p["interactives_dir"]) / "interactive.js")
    save_registry(vault, updated)
    update_dashboard(vault, updated)
    return topic


def migrate(vault, registry, query):
    """Move an existing root-level course into its independent topic folder."""
    topic = resolve(registry, query)
    if topic["layout"] != "legacy":
        raise ValueError(f"Topic is already using an independent layout: {topic['id']}")

    root_name = f"topics/{topic['id']}"
    root = inside(vault, root_name)
    if root.exists() or root.is_symlink():
        raise ValueError(f"Topic directory already exists; inspect before migrating: {root_name}")

    paths = {key: f"{root_name}/{suffix}" for key, suffix in SUFFIXES.items()}
    migrated = {**topic, "root": root_name, "layout": "topic", "paths": paths}
    updated = {**registry, "topics": [
        migrated if item["id"] == topic["id"] else item
        for item in registry["topics"]
    ]}
    validate(vault, updated)

    move_pairs = []
    for key in [
        "roadmap", "recall_queue", "protocols_dir", "concepts_dir",
        "papers_dir", "glossary", "skill_logs_dir",
    ]:
        source = inside(vault, topic["paths"][key])
        destination = inside(vault, paths[key])
        if source.is_symlink():
            raise ValueError(f"Refusing to migrate a symlinked learning path: {source}")
        if source.exists():
            if destination.exists():
                raise ValueError(f"Migration destination already exists: {destination}")
            move_pairs.append((source, destination))

    source_interactives = inside(vault, topic["paths"]["interactives_dir"])
    destination_interactives = inside(vault, paths["interactives_dir"])
    # Kit files stay in the shared directory; only learner lessons move.
    shared_interactive_files = {
        "interactive.css", "interactive.js", "build.py", "scaffold.py", "verify.py",
        "example-interactive.html", "index.html", "components.html",
        "README.md", "COMPONENTS.md", "templates",
    }
    if source_interactives.is_symlink():
        raise ValueError(f"Refusing to migrate a symlinked interactive directory: {source_interactives}")
    if source_interactives.exists():
        for child in source_interactives.iterdir():
            if child.name in shared_interactive_files:
                continue
            if child.is_symlink():
                raise ValueError(f"Refusing to migrate a symlinked interactive asset: {child}")
            destination = destination_interactives / child.name
            if destination.exists() or destination.is_symlink():
                raise ValueError(f"Migration destination already exists: {destination}")
            move_pairs.append((child, destination))

    shared_assets = [
        (inside(vault, topic["paths"]["css_file"]), inside(vault, paths["css_file"])),
        (source_interactives / "build.py", inside(vault, paths["build_script"])),
        (source_interactives / "interactive.js", destination_interactives / "interactive.js"),
    ]
    for source, destination in shared_assets:
        if not source.is_file():
            raise ValueError(f"Shared interactive template is missing: {source}")

    moved = []
    root.mkdir()
    try:
        for key, relative in paths.items():
            if key.endswith("_dir"):
                inside(vault, relative).mkdir(parents=True, exist_ok=True)
        inside(vault, paths["glossary"]).parent.mkdir(parents=True, exist_ok=True)
        for source, destination in move_pairs:
            destination.parent.mkdir(parents=True, exist_ok=True)
            source.rename(destination)
            moved.append((source, destination))
        for source, destination in shared_assets:
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
        save_registry(vault, updated)
        update_dashboard(vault, updated)
    except Exception:
        for source, destination in reversed(moved):
            source.parent.mkdir(parents=True, exist_ok=True)
            destination.rename(source)
        shutil.rmtree(root, ignore_errors=True)
        if read_registry(vault) == updated:
            save_registry(vault, registry)
            update_dashboard(vault, registry)
        raise
    return migrated


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vault", type=Path, default=Path(__file__).resolve().parents[3])
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("list")
    read = commands.add_parser("resolve")
    read.add_argument("topic", nargs="?")
    select = commands.add_parser("select")
    select.add_argument("topic")
    move = commands.add_parser("migrate")
    move.add_argument("topic")
    new = commands.add_parser("create")
    new.add_argument("id")
    new.add_argument("--title", required=True)
    new.add_argument("--alias", action="append", default=[])
    args = parser.parse_args()
    vault = args.vault.resolve()
    try:
        if args.command in {"list", "resolve"}:
            registry = read_registry(vault)
            result = registry if args.command == "list" else resolve(registry, args.topic)
        else:
            with registry_lock(vault):
                registry = read_registry(vault)
                if args.command == "select":
                    result = resolve(registry, args.topic)
                    registry["active_topic"] = result["id"]
                    save_registry(vault, registry)
                elif args.command == "migrate":
                    result = migrate(vault, registry, args.topic)
                else:
                    result = create(vault, registry, args.id, args.title, args.alias)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        parser.exit(1, f"Error: {exc}\n")


if __name__ == "__main__":
    main()
