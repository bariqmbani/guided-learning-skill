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
    "vault_profile", Path(__file__).resolve().parents[1] / "SKILLS/learner-profile/scripts/profile.py"
)
profiles = importlib.util.module_from_spec(profile_spec)
profile_spec.loader.exec_module(profiles)

runtime_spec = importlib.util.spec_from_file_location(
    "vault_runtime", Path(__file__).resolve().with_name("configure_runtime.py")
)
runtime = importlib.util.module_from_spec(runtime_spec)
runtime_spec.loader.exec_module(runtime)


# Explicitly enumerate reusable assets; never copy a course, registry, or workspace.
ASSETS = [
    ".gitattributes",
    "INSTALLATION.md",
    "scripts/install_vault.sh",
    "scripts/install_vault.ps1",
    "scripts/configure_runtime.py",
    "SKILLS/learner-profile/SKILL.md",
    "SKILLS/learner-profile/LICENSE",
    "SKILLS/learner-profile/CHANGELOG.md",
    "SKILLS/learner-profile/scripts/profile.py",
    "SKILLS/learner-profile/references/onboarding.md",
    "SKILLS/learner-profile/references/profile-schema.md",
    "SKILLS/learner-profile/references/onboarding-example.md",
    "SKILLS/learner-profile/references/onboarding-evidence.md",
    "SKILLS/learner-profile/references/personalization.md",
    "SKILLS/learner-profile/references/teaching.md",
    "SKILLS/concept-learning/SKILL.md",
    "SKILLS/concept-learning/LICENSE",
    "SKILLS/concept-learning/CHANGELOG.md",
    "SKILLS/concept-learning/scripts/sessions.py",
    "SKILLS/concept-learning/assets/note.md",
    "SKILLS/concept-learning/assets/mentor-feedback.md",
    "SKILLS/concept-learning/assets/practice.md",
    "SKILLS/guided-learning/scripts/profile.py",
    "SKILLS/guided-learning/references/installation-prompt.md",
    "SKILLS/guided-learning/references/topic-intake.md",
    "SKILLS/guided-learning/references/bootstrap.md",
    "SKILLS/guided-learning/references/teach-from-source.md",
    "SKILLS/guided-learning/references/comprehension-checks.md",
    "SKILLS/guided-learning/references/interactives.md",
    "SKILLS/guided-learning/references/session-records.md",
    "SKILLS/guided-learning/references/session-review.md",
    "SKILLS/guided-learning/SKILL.md",
    "SKILLS/guided-learning/CHANGELOG.md",
    "SKILLS/guided-learning/PEDAGOGY.md",
    "SKILLS/guided-learning/LICENSE",
    "SKILLS/guided-learning/references/topic-routing.md",
    "SKILLS/guided-learning/examples/concept-note.md",
    "SKILLS/guided-learning/examples/learning-roadmap.md",
    "SKILLS/guided-learning/examples/recall-queue.md",
    "SKILLS/guided-learning/examples/session-protocol.md",
    "SKILLS/guided-learning/scripts/topics.py",
    "SKILLS/guided-learning/interactives/interactive.css",
    "SKILLS/guided-learning/interactives/build.py",
    "SKILLS/guided-learning/interactives/example-interactive.html",
]

AGENTS = """# Learning vault

Treat this directory as the vault root. All learning paths are relative to it.

""" + runtime.RUNTIME_GUIDANCE + """

Choose the workflow before selecting a topic or writing learning data:

- Shared preferences: follow
  [learner-profile](SKILLS/learner-profile/SKILL.md).
- A focused concept, bounded source explanation, or concept-session resume:
  follow [concept-learning](SKILLS/concept-learning/SKILL.md).
- A course, roadmap, spaced recall, or topic continuation: follow
  [guided-learning](SKILLS/guided-learning/SKILL.md).

Honor an explicit skill choice. Ask one scope question only if focused learning
versus a course is unclear. Follow the selected skill's reference-loading rules.
Full onboarding is optional and never blocks learning.

Use the owning skill's helpers and pin its course or concept-session paths.
Preserve existing records and progress; never fall back to another topic.
The active course is not a destination for unrelated concept lessons. Course
handoffs require an explicit request. Keep learner data in this vault, never the
setup checkout or shared skill sources. Record actual attempts; never invent
learner answers or mastery.
"""

TOPICS = """# Learning Topics

Use **$guided-learning [subject]** in Codex or **/guided-learning [subject]** in
Claude Code to start a course. Your registered courses appear below.

<!-- topics:start -->
| Topic | Roadmap | Recall | Glossary |
| --- | --- | --- | --- |
<!-- topics:end -->

Each subject gets its own roadmap, recall queue, concepts, glossary, and journals
under `topics/<topic-id>/`. Say **Continue [topic]** to resume a course, or
**Continue my roadmap** to resume the last selected topic.
"""

CONCEPT_SESSIONS = """# Concept Sessions

Use `$concept-learning <concept>` in Codex or `/concept-learning <concept>` in
Claude Code for a personalized, focused lesson. Each session creates a dated
folder here containing `note.md`, `mentor-feedback.md`, and `practice.md`.
Supporting resources and an interactive are added only when useful. Documents
are updated from actual attempts; an unfinished assessment stays pending.

Ask to resume a named session to continue its records. Repeated sessions get
separate folders and may link to earlier work. These sessions do not change
`topics/` or its active course. Ask explicitly to add a lesson to a course when
you want it included in a roadmap or future recall.
"""

SKILL_NAMES = ("learner-profile", "concept-learning", "guided-learning")


def skill_entry(name, canonical):
    # Keep discovery metadata (including version) identical to the canonical
    # skill without introducing a YAML package dependency for installation.
    content = canonical.decode("utf-8").replace("\r\n", "\n")
    frontmatter, separator, _ = content.removeprefix("---\n").partition("\n---\n")
    if not content.startswith("---\n") or not separator or f"name: {name}" not in frontmatter.splitlines():
        raise ValueError(f"Invalid canonical skill frontmatter: {name}")
    return f"""---
{frontmatter}
---

Read `SKILLS/{name}/SKILL.md` from the learning vault root and follow its
instructions. Use the Python executable in the vault's `runtime.local.toml` for helpers.
Resolve the requested entry point before selecting a course or
writing learning data. References are relative to that canonical skill directory,
not this registration entry. The same canonical instructions serve both agents.
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
/runtime.local.toml
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
        content = path.read_bytes()
        # Keep exported scripts usable in Bash/POSIX even from a CRLF source ZIP.
        files[relative] = content.replace(b"\r\n", b"\n") if path.suffix in {".py", ".sh", ".ps1"} else content
    # Source assets stay with the skill; installed vaults also need shared templates.
    for asset_filename in ["interactive.css", "build.py", "example-interactive.html"]:
        files[f"learning/interactives/{asset_filename}"] = files[f"SKILLS/guided-learning/interactives/{asset_filename}"]
    onboarding_example = files["SKILLS/learner-profile/references/onboarding-example.md"].decode("utf-8").rstrip("\n")
    installation_prompt = files["SKILLS/guided-learning/references/installation-prompt.md"].decode("utf-8").rstrip("\n")
    upstream = json.loads((source / "SKILLS/guided-learning/UPSTREAM.json").read_text(encoding="utf-8"))
    metadata = {key: upstream[key] for key in ["repository", "commit", "version"]}
    metadata["local_version"] = upstream.get("local_version", upstream["version"])
    metadata["local_changes"] = [
        "Independent topic routing and non-overwriting topic helpers.",
        "Customized shared interactive design system and CSS builder.",
        "Empty portable starter generated by scripts/create_vault.py.",
        "Conversational onboarding for language, time, and constraints; topic-specific learning plans with evidence-informed adaptive teaching.",
        "Shared learner-profile skill and compatibility aliases for existing onboarding and profile helper paths.",
        "Personalized concept-learning sessions with notes, mentor feedback, and practice outside course topics.",
    ]
    texts = {
        "AGENTS.md": AGENTS,
        "CLAUDE.md": "@AGENTS.md\n",
        "learner-profile.json": json_text(profile),
        "Learner Profile.md": profiles.profile_markdown(profile),
        "topics/README.md": TOPICS,
        "topics/registry.json": json_text({"schema_version": 1, "active_topic": None, "topics": []}),
        "concept-sessions/README.md": CONCEPT_SESSIONS,
        "Templates/Concept.md": CONCEPT,
        "Templates/Session Protocol.md": PROTOCOL,
        ".gitignore": IGNORE,
        "SKILLS/guided-learning/UPSTREAM.json": json_text(metadata),
        "SKILLS/guided-learning/README.md": f"""# Guided Learning

Read [[Home|Home]] to start, or [[topics/README|Learning Topics]] to navigate.
The method uses a spiral curriculum, comprehension checks, and spaced recall.
Every subject has an independent roadmap and learning history.

The canonical instructions are in [SKILL.md](SKILL.md) and
[topic-routing.md](references/topic-routing.md). [PEDAGOGY.md](PEDAGOGY.md)
explains the method. This setup builds on the MIT-licensed
[WSE Research guided-learning skill](https://github.com/WSE-research/guided-learning-skill).

[Learner Profile](../learner-profile/SKILL.md) guides every optional profile field,
one question at a time, to personalize both learning skills. [Concept Learning](../concept-learning/SKILL.md) teaches one concept
and saves notes, mentor feedback, and practice under `concept-sessions/` without
selecting a course. [Topic intake](references/topic-intake.md) sets a useful outcome and
starting point for each course. [Research rationale](../learner-profile/references/onboarding-evidence.md)
explains the evidence and limits of these design choices.

[Personalization from feedback](../learner-profile/references/personalization.md) lets the tutor
propose ongoing changes. It asks before saving them; choose topic or vault scope,
both, or neither. Topic overrides live in that topic's roadmap.

{installation_prompt}

{onboarding_example}
""",
        "Home.md": f"""# {name}

Your learning vault is ready. Use the links below to start or resume a course or
concept session.

1. Open this folder as a vault in Obsidian.
2. Open a terminal here and run `claude` or `codex`.
3. Optionally use **$learner-profile** in Codex or **/learner-profile** in Claude Code. Your tutor guides you through shared preferences one question at a time; every answer is optional.
4. Choose **$concept-learning bubble sort** for one concept or **$guided-learning algorithms** for an ongoing course. In Claude Code, use `/` in place of `$`.

Both teaching skills adapt to your goals, starting knowledge, available time, and
responses. Concept Learning guides a focused lesson and saves its three standard
documents automatically. Guided Learning creates a course roadmap and revisits
concepts through practice and spaced recall. Onboarding never blocks a lesson.

- [[topics/README|Learning Topics]] — start or resume a subject.
- [[concept-sessions/README|Concept Sessions]] — focused lessons with notes, feedback, and practice.
- [[Learner Profile|Your learner profile]] — language, session time, and practical preferences.
- [[Templates/Concept|Concept template]]
- [[Templates/Session Protocol|Session journal template]]
- [Example interactive](learning/interactives/example-interactive.html) — open in a browser to preview a learning activity.
- [Setup and sharing instructions](README.md)

Say **Continue [topic]** or **Continue my roadmap** for a course, or ask
**Resume concept session [session folder]** for a focused lesson.

Shared interactive assets are under `learning/interactives/`. Course roadmaps,
recall, and journals stay in `topics/`; focused lessons stay in `concept-sessions/`.
Adding a focused lesson to a course requires your explicit request.

Run **$learner-profile** or **/learner-profile** to update preferences.
""",
        "README.md": f"""# Empty Learning Vault

Open this folder as a vault in Obsidian, then run Claude Code or Codex from the
same folder. Read [Home.md](Home.md) to choose a learning workflow:

| Skill | Codex | Claude Code | Saved output |
| --- | --- | --- | --- |
| Learner Profile | `$learner-profile` | `/learner-profile` | Shared preferences |
| Concept Learning | `$concept-learning bubble sort` | `/concept-learning bubble sort` | A focused session under `concept-sessions/` |
| Guided Learning | `$guided-learning algorithms` | `/guided-learning algorithms` | A course under `topics/` |

{installation_prompt}

If you cloned this as a public template, first run
`python3 scripts/create_vault.py ../my-learning` and use that new folder for
your learning. Keep the template checkout separate from personal study records.

Python 3.9 or newer is required for setup, helpers, and interactive HTML builds.
Run `build.py` with the Python recorded in `runtime.local.toml` on any platform.
No Python packages are required. Skills are registered for both agents using
small entry files that load each canonical skill; symlinks are unnecessary.
See [installation and dependency recovery](INSTALLATION.md) if Git or Python is
missing, or the terminal uses PowerShell. Git and Bash are not needed to install.
`runtime.local.toml` remembers the local Python for future sessions and is excluded
from ZIP exports. See `INSTALLATION.md` to configure or refresh it.

The installer creates files without asking learning questions. Start onboarding
in your learning chat with **$learner-profile** (Codex) or
**/learner-profile** (Claude Code). The tutor asks one question at a time
about language, preferred name, background, broad goals, learning context,
session time, explanation preferences, preferred activities, and other needs.
Every answer is optional: skip a question, let the tutor choose, or finish early.
Your answers shape familiar examples, lesson pace, practice, and feedback.
It saves `learner-profile.json` and `Learner Profile.md`, shared by both teaching
skills. No topic or concept session is created during onboarding. Full onboarding
is optional; lessons can begin with the preferences and context already available.
Run Learner Profile again for a targeted change or to fill unanswered fields.

Concept Learning guides one concept through explanation, a worked example,
practice with gradually reduced help, and an independent check. It adapts to your
responses and waits for attempts. Every session automatically creates and updates:

```text
concept-sessions/YYYY-MM-DD_concept-slug/
  note.md
  mentor-feedback.md
  practice.md
```

Repeated sessions use a new suffix rather than overwriting earlier work. Resume a
named session to continue it. Feedback records only demonstrated understanding;
pending or interrupted work stays incomplete. `interactive.html` and `resources.md`
are added when useful. This route does not select a course, update a roadmap, or
schedule recall. Ask explicitly to add the session to a course; the original
session documents and existing course progress are preserved.

When feedback suggests an ongoing preference, the tutor proposes a specific
change and asks which scope should retain it. Vault defaults live in the shared
learner profile; approved course overrides live in the roadmap's Teaching
preferences section, and session-specific context stays in its note. See
[personalization from feedback](SKILLS/learner-profile/references/personalization.md).

When starting a course, the tutor asks only for missing information about
your desired outcome, what you already know, and feasible practice. These answers
stay in that topic's learning plan. Practice, feedback, and later recall are
part of lessons; you do not need to select them from an extras menu. Presentation
preferences can change and are not a test of ability. See the skill's
[research rationale](SKILLS/learner-profile/references/onboarding-evidence.md).
The research supports teaching principles; it does not validate this exact agent
workflow or establish durable mastery from a single successful session.

{onboarding_example}

To create another empty vault from this setup:

```sh
sh scripts/install_vault.sh /path/to/new-vault
```

To also produce a ZIP you can share:

```sh
sh scripts/install_vault.sh /path/to/new-vault --zip /path/to/new-vault.zip
```

You can also run `python3 scripts/create_vault.py /path/to/new-vault` directly.
On Windows, use `py -3 scripts/create_vault.py C:/path/to/new-vault`.
PowerShell also supports `./scripts/install_vault.ps1 C:/path/to/new-vault`;
the POSIX and PowerShell wrappers detect a compatible Python interpreter.
Choose a destination and ZIP path that
do not already exist. The destination must be outside this source vault's directory
tree, and the ZIP must be outside the new vault. No Git repository
is initialized. Current courses, concept sessions, study records, attachments, account paths,
Obsidian workspace state, and source Git history are not copied.

Guided Learning and the adapted shared teaching guidance build on the MIT-licensed
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
    for skill_name in SKILL_NAMES:
        entry = skill_entry(skill_name, files[f"SKILLS/{skill_name}/SKILL.md"])
        for agent in [".agents", ".claude"]:
            texts[f"{agent}/skills/{skill_name}/SKILL.md"] = entry
    files.update({relative: text.encode("utf-8") for relative, text in texts.items()})
    # Carry the generator forward, so the exported setup can generate more empty vaults.
    files["scripts/create_vault.py"] = Path(__file__).read_bytes().replace(b"\r\n", b"\n")
    return files


def create_vault(source, destination, name, archive=None):
    source = source.expanduser().resolve()
    destination = destination.expanduser().absolute()
    if destination.exists() or destination.is_symlink():
        raise ValueError(f"Destination already exists; nothing overwritten: {destination}")
    if destination.resolve().is_relative_to(source):
        raise ValueError("Destination must be outside the source setup or vault directory tree")
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
        runtime.configure_runtime(destination)
        if archive is not None:
            archive.parent.mkdir(parents=True, exist_ok=True)
            with archive.open("xb") as handle:
                archive_created = True
                with zipfile.ZipFile(handle, "w", compression=zipfile.ZIP_DEFLATED) as bundle:
                    # Directory entries preserve empty attachments and other scaffold folders.
                    for path in [destination, *sorted(destination.rglob("*"))]:
                        if path == destination / runtime.RUNTIME_FILE:
                            continue
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
    print(f"Saved Python runtime for future sessions: {destination / runtime.RUNTIME_FILE}")
    if archive is not None:
        print(f"Shareable ZIP: {archive}")
    print("Open the folder in Obsidian and run claude or codex here. Use learner-profile to personalize,")
    print("concept-learning for one concept, or guided-learning for an ongoing course.")


if __name__ == "__main__":
    main()
