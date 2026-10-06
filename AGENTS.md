# Learning vault setup repository

This repository contains the installer, reusable learner-profile, concept-learning,
and guided-learning skills, templates, and documentation. Learner profiles and
learning records belong in a separate installed vault or learning workspace.
Do not create topics, roadmaps, recall queues, concept-sessions, or session journals
in this checkout.

Read README.md for the installation prompt. Use scripts/create_vault.py or
scripts/install_vault.sh to create a new vault at a different path. The generator
creates fresh Obsidian settings, native Codex and Claude Code entries for all three
skills, an empty topic registry, and an unconfigured learner profile. It must not
include learner concept sessions.

Skill source lives under SKILLS/learner-profile/, SKILLS/concept-learning/, and
SKILLS/guided-learning/. The shared profile helper is
SKILLS/learner-profile/scripts/profile.py; the former guided-learning helper path
is a compatibility alias. Profile setup is optional and shared by both teaching
skills. Concept learning writes its required session documents in the installed
workspace's concept-sessions/ directory. Guided learning owns course topics,
roadmaps, and spaced recall. Topic helpers and profile setup operate in installed
vaults; concept sessions also support a separate learning workspace. None writes
learner data in this source checkout.

Interactive source assets live
under SKILLS/guided-learning/interactives/. Installed vaults receive copies under
learning/interactives/ for new-topic scaffolding.

Keep the repository free of learner data and generated exports. Preserve the
license and attribution. Run python3 -m unittest discover -s tests -v after
installer or helper changes, and verify generated vaults remain empty.
