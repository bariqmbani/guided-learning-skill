# Create and share an empty learning vault

This repository contains reusable setup files. Learning data belongs in a
separate installed vault or learning workspace. Python 3.9 or newer is required;
no packages are needed.

For an agent to fetch and install the setup, use the **Install with an agent**
prompt in [README.md](README.md#install-with-an-agent). It clones or downloads `main` and
creates a new vault before learning or optional profile setup.
See [installation and dependency recovery](INSTALLATION.md) for tool detection,
archive downloads without Git, Python setup, and PowerShell support.

## Install

```sh
sh scripts/install_vault.sh ../friend-learning --name "Friend Learning"
```

In PowerShell, run:

```powershell
.\scripts\install_vault.ps1 'C:\Learning\Friend Learning' --name 'Friend Learning'
```

Both wrappers detect a working Python 3.9+ interpreter. They do not install
dependencies automatically. Or run
`python3 scripts/create_vault.py ../friend-learning` directly. On Windows, use `py -3 scripts/create_vault.py C:/path/to/new-vault`. Interactive HTML builds
use the same Python interpreter on all platforms.
Neither Git nor Bash is required for vault generation or Python learning helpers.

The destination must be a new directory outside the source setup directory and
all its subdirectories. If you run the generator from an installed vault, the new
destination must also be outside that source vault. The installer creates Obsidian settings,
templates, native entries for learner-profile, concept-learning, and guided-learning
in both agents, shared interactive assets, an empty topic registry
(`active_topic: null`, `topics: []`), and an unconfigured shared learner profile.
It does not ask questions, select a subject, create course progress, or include
learner concept sessions. Verify all three entries in `.agents/skills/` and
`.claude/skills/` after installation.

Open the installed folder in Obsidian and run Codex or Claude Code there. Choose:

| Purpose | Codex | Claude Code |
| --- | --- | --- |
| Optional shared preference setup or updates | `$learner-profile` | `/learner-profile` |
| One concept with saved notes, feedback, and practice | `$concept-learning bubble sort` | `/concept-learning bubble sort` |
| A course with a roadmap and spaced recall | `$guided-learning probability` | `/guided-learning probability` |

Profile setup offers every field one question at a time, accepts skips and early
completion, and supports targeted updates. Both teaching skills read the same root
`learner-profile.json` and `Learner Profile.md`; profile setup is not required to
start learning. The canonical profile helper is
`SKILLS/learner-profile/scripts/profile.py`, with the former guided-learning path
kept as a compatibility alias.

Concept-learning always writes `note.md`, `mentor-feedback.md`, and `practice.md`
under `concept-sessions/YYYY-MM-DD_slug/`; `interactive.html` and `resources.md`
are added when useful. Ordinary concept sessions do not write course data.
Explicitly requesting a course hands off to guided-learning while preserving
the concept session. Guided-learning keeps each subject's course data separate.

## Share an export

```sh
./scripts/install_vault.sh ../learning-exports/learning-starter --zip ../learning-exports/learning-starter.zip
```

This example places both outputs outside the source checkout. The generated vault
must be outside the source setup or installed vault directory; the ZIP must be a
new path outside the generated vault. Send the ZIP to your
friend; they extract it, open the folder in Obsidian, and choose a learning skill
or optional profile setup.
No ZIP is tracked in this repository.

ZIPs omit `runtime.local.toml`. After extraction, use a verified local Python to run
`scripts/configure_runtime.py`; see [runtime configuration](INSTALLATION.md#python-in-a-new-session-or-an-existing-vault).

The generator copies an explicit list of reusable assets. It never copies owner
profiles, topics, concept-session bundles, course notes, recall history, journals, attachments, execution
logs, account-specific instructions, Git history, or Obsidian workspace state.
The skill entries are regular files, so ZIP extraction does not require symlinks.
Exported vaults retain the generator and can create another fresh vault later.

## Maintain the public setup

Keep studying in an installed vault or separate learning workspace. This checkout
contains only skills, templates, installer code, and documentation. Do not add
learner profiles, concept-session bundles, course files, or generated exports here.
Deleting a file in a new commit does not erase it from earlier Git history.

Reusable interactive source files live under
`SKILLS/guided-learning/interactives/`; installed vaults receive shared templates
under `learning/interactives/`. Course lessons use each topic's registered paths;
concept lessons keep any interactive in their own session bundle.

The original skill and pinned upstream commit are recorded in
`SKILLS/guided-learning/UPSTREAM.json`. The public fork's `main` branch distributes
this complete setup. Retain the MIT license and upstream attribution when sharing.

Read [the onboarding research rationale](SKILLS/learner-profile/references/onboarding-evidence.md)
for the question design and evidence limits. Learning research informs the method;
these specific agent skills and their flows still need user evaluation. A correct
answer during one session does not prove lasting mastery.
