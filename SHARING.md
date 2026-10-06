# Create and share an empty learning vault

This repository contains reusable setup files. Learning data belongs in a
separate installed vault. Python 3.9 or newer is required; no packages are needed.

For an agent to clone and install the setup, use the **Install with an agent**
prompt in [README.md](README.md#install-with-an-agent). It clones `main` and
creates a new vault before onboarding.

## Install

```sh
./scripts/install_vault.sh ../friend-learning --name "Friend Learning"
```

Or use `python3 scripts/create_vault.py ../friend-learning` directly. On Windows,
use `py -3 scripts/create_vault.py C:/path/to/new-vault`. Interactive HTML builds
use Bash; Windows users can use WSL or Git Bash.

The destination must be a new directory. The installer creates Obsidian settings,
templates, both agents' skill entries, shared interactive assets, an empty topic
registry (`active_topic: null`, `topics: []`), and an unconfigured learner profile.
It does not ask questions, select a subject, or create course progress.

Open the installed folder in Obsidian and run Codex or Claude Code there. Start
with **$guided-learning onboard** in Codex or **/guided-learning onboard** in
Claude Code. Onboarding asks for teaching language, typical session time, and
optional constraints. Then say **I want to learn [topic]**. Each subject has its
own plan and course data. Run onboarding again to update preferences.

## Share an export

```sh
./scripts/install_vault.sh dist/learning-starter --zip dist/learning-starter.zip
```

The ZIP must be a new path outside the generated vault. Send the ZIP to your
friend; they extract it, open the folder in Obsidian, and start onboarding.
No ZIP is tracked in this repository.

The generator copies an explicit list of reusable assets. It never copies owner
profiles, topics, course notes, recall history, journals, attachments, execution
logs, account-specific instructions, Git history, or Obsidian workspace state.
The skill entries are regular files, so ZIP extraction does not require symlinks.
Exported vaults retain the generator and can create another fresh vault later.

## Maintain the public setup

Keep studying in an installed vault rather than this checkout. Learner directories
and generated exports are ignored here. Do not add learner files to this repository.
Deleting a file in a new commit does not erase it from earlier Git history.

Reusable interactive source files live under
`SKILLS/guided-learning/interactives/`; installed vaults receive shared templates
under `learning/interactives/`. Actual lessons use each topic's registered paths.

The original skill and pinned upstream commit are recorded in
`SKILLS/guided-learning/UPSTREAM.json`. The public fork's `main` branch distributes
this complete setup. Retain the MIT license and upstream attribution when sharing.

Read [the onboarding research rationale](SKILLS/guided-learning/references/onboarding-evidence.md)
for the question design and evidence limits. Learning research informs the method;
this specific LLM tutor and its onboarding flow still need user evaluation.
