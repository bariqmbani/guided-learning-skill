# Learning vault setup repository

This repository contains the installer, reusable learner-profile, concept-learning,
guided-learning, and learning-interactives skills, templates, and documentation.
Learner profiles and learning records belong in a separate installed vault or workspace.
Do not create topics, roadmaps, recall queues, concept-sessions, or session journals
in this checkout.

Installation creates an independent local copy. Installed vaults use their own
skills, helpers, and assets; later source or remote changes do not affect them.
Do not add repository synchronization or upgrade-migration instructions.

Read README.md for the installation prompt and INSTALLATION.md for missing tools
and shell-specific setup. Use scripts/create_vault.py, scripts/install_vault.sh,
or scripts/install_vault.ps1 to create a new vault at a different path. The generator
creates fresh Obsidian settings, native Codex and Claude Code entries for all four
skills, an empty topic registry, and an unconfigured learner profile. It must not
include learner concept sessions.

Skill source lives under SKILLS/learner-profile/, SKILLS/concept-learning/,
SKILLS/guided-learning/, and SKILLS/learning-interactives/. The shared profile helper
is SKILLS/learner-profile/scripts/profile.py; the former guided-learning helper path
is a compatibility alias. Profile setup is optional and shared by both teaching
skills. Concept learning writes its required session documents in the installed
workspace's concept-sessions/ directory. Guided learning owns course topics,
roadmaps, and spaced recall. Topic helpers and profile setup operate in installed
vaults; concept sessions also support a separate learning workspace. None writes
learner data in this source checkout.

Generated vaults remember Python in `runtime.local.toml`, ignored by Git and
excluded from ZIPs. `scripts/configure_runtime.py` refreshes installed vaults only.

Interactive source assets live under SKILLS/learning-interactives/. Installed
vaults receive copies under learning/interactives/ for activity scaffolding.
Edit compact .source.html files and build standalone .html delivery files.

Keep the repository free of learner data and generated exports. Preserve the
license and attribution. Run python3 -m unittest discover -s tests -v after
installer or helper changes, and verify generated vaults remain empty.
