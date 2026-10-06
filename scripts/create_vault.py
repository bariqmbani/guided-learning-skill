#!/usr/bin/env python3
"""Create an empty Obsidian learning vault from reusable setup files only."""

import argparse
import importlib.util
import json
from pathlib import Path
import shutil
import sys
import zipfile


profile_spec = importlib.util.spec_from_file_location(
    "vault_profile", Path(__file__).resolve().parents[1] / "SKILLS/guided-learning/scripts/profile.py"
)
profiles = importlib.util.module_from_spec(profile_spec)
profile_spec.loader.exec_module(profiles)


# Explicitly enumerate reusable assets; never copy a course, registry, or workspace.
ASSETS = [
    "scripts/install_vault.sh",
    "SKILLS/guided-learning/scripts/profile.py",
    "SKILLS/guided-learning/references/onboarding.md",
    "SKILLS/guided-learning/SKILL.md",
    "SKILLS/guided-learning/PEDAGOGY.md",
    "SKILLS/guided-learning/LICENSE",
    "SKILLS/guided-learning/references/topic-routing.md",
    "SKILLS/guided-learning/references/session-log-template.md",
    "SKILLS/guided-learning/examples/concept-note.md",
    "SKILLS/guided-learning/examples/learning-roadmap.md",
    "SKILLS/guided-learning/examples/recall-queue.md",
    "SKILLS/guided-learning/examples/session-protocol.md",
    "SKILLS/guided-learning/scripts/topics.py",
    "learning/interactives/interactive.css",
    "learning/interactives/build.sh",
]

AGENTS = """# Learning vault

Treat this directory as the vault root. All learning paths are relative to it.

For learning sessions, study, quizzes, papers, or new subjects, read
`SKILLS/guided-learning/SKILL.md` and its `references/topic-routing.md` before
reading or writing learning data. Use `SKILLS/guided-learning/scripts/topics.py`
to resolve, create, or select the intended topic from `topics/registry.json`.

New subjects have independent folders under `topics/<topic-id>/`. Each has its
own roadmap, concepts, sources, recall queue, glossary, journals, and logs.
Pin the selected topic ID and paths for the whole session. Never reset an
existing topic or fall back to another topic's roadmap.

For `guided-learning onboard`, follow the skill's `references/onboarding.md`
as a conversation before topic selection. Save only the learner profile and
its readable note; do not create a subject or change learning progress.

Read `learner-profile.json` when present. Use its configured language, session
length, explanation preferences, and preferred extras to tailor teaching. Its
background and goals are context, not evidence that concepts have been learned.
Use its learning context as a default for new topics; preserve an existing
topic's stored goals and domain mode. Requests in the current conversation take
priority over saved preferences. Ask only for missing topic-specific details.

Bootstrap only a selected topic with no concept checklist entries, checked or
unchecked. Ask for the learner's goal and starting knowledge. Preserve existing
notes and progress, and record learning only from actual sessions.

Use topic-prefixed filenames and full vault-relative Obsidian wikilinks for new
concept and paper notes. Shared CSS and the HTML builder live in
`learning/interactives/`; each new topic receives its own copies. Run the selected
topic's registered builder after creating HTML.
"""

TOPICS = """# Learning Topics

No topics yet. Ask your agent **I want to learn about [your topic]** to begin.

<!-- topics:start -->
| Topic | Roadmap | Recall | Glossary |
| --- | --- | --- | --- |
<!-- topics:end -->

Each subject gets its own roadmap, recall queue, concepts, glossary, and journals
under `topics/<topic-id>/`. Say **Continue [topic]** to resume a course, or
**Continue my roadmap** to resume the last selected topic.
"""

SKILL_ENTRY = """---
name: guided-learning
description: >
  Onboard learners, teach, study, quiz, understand papers, and learn new subjects using independent
  topic tracks, a spiral curriculum, comprehension checks, and spaced recall.
---

# Guided Learning

Read `SKILLS/guided-learning/SKILL.md` from the vault root and its
`SKILLS/guided-learning/references/topic-routing.md` before any learning-file
read or write, then follow those instructions. The canonical skill and helpers
live under `SKILLS/guided-learning/`; this entry registers that shared skill.
For the `onboard` subcommand, follow the canonical skill's conversational
onboarding flow before topic selection. Onboarding does not require a subject.
"""

CONCEPT = """---
title: "{{title}}"
type: "concept"
created: "{{date}}"
sources: []
tags: []
related: []
---

# {{title}}

## Core Claim

## Mechanism

## Evidence

## Implications

## Limitations

## Connections
"""

PROTOCOL = """---
date: "{{date}}"
topic: ""
pass: 1
cluster: ""
concept: ""
complexity: ""
comprehension: ""
---

# Session: {{title}}

## Recall checks

## What we covered

## How we learned it

## Artifacts

## Corrections given

## Connections made

## Next up
"""

IGNORE = """.obsidian/workspace.json
.obsidian/workspace-mobile.json
.obsidian/cache/
.trash/
.DS_Store
topics/.registry.lock
__pycache__/
/dist/
"""


def json_text(value):
    return json.dumps(value, indent=2, ensure_ascii=False) + "\n"


def make_files(source, name):
    profile = profiles.default_profile()
    files = {}
    for relative in ASSETS:
        path = source / relative
        if not path.is_file() or path.is_symlink():
            raise ValueError(f"Reusable asset missing or symlinked: {relative}")
        files[relative] = path.read_bytes()
    upstream = json.loads((source / "SKILLS/guided-learning/UPSTREAM.json").read_text(encoding="utf-8"))
    metadata = {key: upstream[key] for key in ["repository", "commit", "version"]}
    metadata["local_version"] = upstream.get("local_version", upstream["version"])
    metadata["local_changes"] = [
        "Independent topic routing and non-overwriting topic helpers.",
        "Customized shared interactive design system and CSS builder.",
        "Empty portable starter generated by scripts/create_vault.py.",
    ]
    texts = {
        "AGENTS.md": AGENTS,
        "CLAUDE.md": "@AGENTS.md\n",
        "learner-profile.json": json_text(profile),
        "Learner Profile.md": profiles.profile_markdown(profile),
        "topics/README.md": TOPICS,
        "topics/registry.json": json_text({"schema_version": 1, "active_topic": None, "topics": []}),
        "Templates/Concept.md": CONCEPT,
        "Templates/Session Protocol.md": PROTOCOL,
        ".gitignore": IGNORE,
        ".agents/skills/guided-learning/SKILL.md": SKILL_ENTRY,
        ".claude/skills/guided-learning/SKILL.md": SKILL_ENTRY,
        "SKILLS/guided-learning/UPSTREAM.json": json_text(metadata),
        "SKILLS/guided-learning/README.md": """# Guided Learning

Read [[Home|Home]] to start, or [[topics/README|Learning Topics]] to navigate.
The method uses a spiral curriculum, comprehension checks, and spaced recall.
Every subject has an independent roadmap and learning history.

The canonical instructions are in [SKILL.md](SKILL.md) and
[topic-routing.md](references/topic-routing.md). [PEDAGOGY.md](PEDAGOGY.md)
explains the method. This setup builds on the MIT-licensed
[WSE Research guided-learning skill](https://github.com/WSE-research/guided-learning-skill).
""",
        "SKILLS/guided-learning/CHANGELOG.md": """# Guided Learning — Changelog

## Empty starter

- Independent topic tracks and a registry with no active topic.
- Portable agent instructions and shared interactive assets.
- No course notes, journals, recall history, or source-vault Git history.
""",
        "Home.md": f"""# {name}

Your learning vault is ready. No subject has been selected yet.

1. Open this folder as a vault in Obsidian.
2. Open a terminal here and run `claude` or `codex`.
3. Start with **$guided-learning onboard** in Codex or **/guided-learning onboard** in Claude Code to set your learner profile and preferred extras.
4. Say **I want to learn about [your topic]** to start your first subject.

The agent creates your first topic, builds a roadmap, and starts teaching.
Every additional subject gets its own folder and progress.

- [[topics/README|Learning Topics]] — start or resume a subject.
- [[Learner Profile|Your learner profile]] — teaching preferences and preferred extras.
- [[Templates/Concept|Concept template]]
- [[Templates/Session Protocol|Session journal template]]
- [Setup and sharing instructions](README.md)

In Claude Code, invoke `/guided-learning`; in Codex, use `$guided-learning`.
Later, say **Continue [topic]** or **Continue my roadmap**.

Shared interactive assets are under `learning/interactives/`; actual lessons,
roadmaps, recall, and journals are created inside each topic's folder.

Run the skill's **onboard** command again whenever you want to update your preferences.
""",
        "README.md": """# Empty Learning Vault

Open this folder as a vault in Obsidian, then run Claude Code or Codex from the
same folder. Say **I want to learn about [your topic]**. Read [Home.md](Home.md)
for the learning flow.

Python 3.9 or newer is required for the topic helper and setup script. Interactive
HTML builds also use Bash; on Windows use WSL or Git Bash for those builds.
No Python packages are required. Skills are registered for both agents using
small entry files that load the shared canonical skill; symlinks are unnecessary.

The installer creates files without asking learning questions. Start onboarding
in your learning chat with **$guided-learning onboard** (Codex) or
**/guided-learning onboard** (Claude Code). The tutor asks about your background,
goals, language, session length, explanation preferences, and preferred extras.
It saves `learner-profile.json` and `Learner Profile.md`. No topic or learning
progress is created until you choose a subject. Run onboarding again in chat
whenever you want to change preferences.

To create another empty vault from this setup:

```sh
bash scripts/install_vault.sh /path/to/new-vault
```

To also produce a ZIP you can share:

```sh
bash scripts/install_vault.sh /path/to/new-vault --zip /path/to/new-vault.zip
```

You can also run `python3 scripts/create_vault.py /path/to/new-vault` directly.
On Windows, use `py -3 scripts/create_vault.py C:/path/to/new-vault`.
Choose a destination and ZIP path that
do not already exist. The ZIP must be outside the new vault. No Git repository
is initialized. Current courses, study records, attachments, account paths,
Obsidian workspace state, and source Git history are not copied.

The shared skill is based on the MIT-licensed
[WSE Research guided-learning skill](https://github.com/WSE-research/guided-learning-skill);
its license and upstream attribution are included under `SKILLS/guided-learning/`.
""",
        ".obsidian/app.json": json_text({"attachmentFolderPath": "attachments", "alwaysUpdateLinks": True}),
        ".obsidian/templates.json": json_text({"folder": "Templates", "dateFormat": "YYYY-MM-DD", "timeFormat": "HH:mm"}),
        ".obsidian/community-plugins.json": "[]\n",
        ".obsidian/core-plugins.json": json_text([
            "file-explorer", "global-search", "switcher", "graph", "backlink",
            "outgoing-link", "tag-pane", "page-preview", "templates",
            "note-composer", "outline", "word-count", "file-recovery",
        ]),
    }
    files.update({relative: text.encode("utf-8") for relative, text in texts.items()})
    # Carry the generator forward, so the exported setup can generate more empty vaults.
    files["scripts/create_vault.py"] = Path(__file__).read_bytes()
    return files


def create_vault(source, destination, name, archive=None):
    destination = destination.expanduser().absolute()
    if destination.exists() or destination.is_symlink():
        raise ValueError(f"Destination already exists; nothing overwritten: {destination}")
    if archive is not None:
        archive = archive.expanduser().absolute()
        if archive.exists() or archive.is_symlink():
            raise ValueError(f"ZIP already exists; nothing overwritten: {archive}")
        if archive.resolve().is_relative_to(destination.resolve()):
            raise ValueError("The ZIP must be outside the generated vault")
    if not name.strip() or any(ord(char) < 32 for char in name):
        raise ValueError("Vault name must be a nonempty single line")
    # Read and validate all input assets before creating the destination.
    files = make_files(source, name.strip())
    destination.mkdir(parents=True)
    archive_created = False
    try:
        (destination / "attachments").mkdir()
        for relative, content in files.items():
            path = destination / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
            if path.suffix in {".py", ".sh"}:
                path.chmod(0o755)
        if archive is not None:
            archive.parent.mkdir(parents=True, exist_ok=True)
            with archive.open("xb") as handle:
                archive_created = True
                with zipfile.ZipFile(handle, "w", compression=zipfile.ZIP_DEFLATED) as bundle:
                    # Directory entries preserve empty attachments and other scaffold folders.
                    for path in [destination, *sorted(destination.rglob("*"))]:
                        bundle.write(path, Path(destination.name) / path.relative_to(destination))
    except BaseException:
        if archive_created:
            archive.unlink(missing_ok=True)
        shutil.rmtree(destination)
        raise
    return destination, archive


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path, help="new vault directory; must not exist")
    parser.add_argument("--name", help="display title in Home.md; defaults to the destination name")
    parser.add_argument("--zip", dest="archive", type=Path, help="optional new ZIP path outside the vault")
    args = parser.parse_args()
    if sys.version_info < (3, 9):
        parser.exit(1, "Error: Python 3.9 or newer is required.\n")
    source = Path(__file__).resolve().parents[1]
    try:
        name = args.destination.name if args.name is None else args.name
        if args.destination.expanduser().exists() or args.destination.expanduser().is_symlink():
            raise ValueError(f"Destination already exists; nothing overwritten: {args.destination}")
        destination, archive = create_vault(source, args.destination, name, args.archive)
    except (OSError, ValueError, KeyError) as exc:
        parser.exit(1, f"Error: {exc}\n")
    except KeyboardInterrupt:
        parser.exit(130, "\nInstallation cancelled.\n")
    print(f"Created empty learning vault: {destination}")
    if archive is not None:
        print(f"Shareable ZIP: {archive}")
    print("Open the folder in Obsidian, run claude or codex here, and start guided-learning onboard.")


if __name__ == "__main__":
    main()
