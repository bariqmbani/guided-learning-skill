# Learning vault setup repository

This repository contains the installer, reusable guided-learning skill, templates,
and documentation. Learner profiles and course data belong in a separate vault.
Do not create topics, roadmaps, recall queues, or session journals in this checkout.

Read README.md for the installation prompt. Use scripts/create_vault.py or
scripts/install_vault.sh to create a new vault at a different path. The generator
creates fresh Obsidian settings, native Codex and Claude Code skill entries,
an empty topic registry, and an unconfigured learner profile.

Skill source lives under SKILLS/guided-learning/. Interactive source assets live
under SKILLS/guided-learning/interactives/. Installed vaults receive copies under
learning/interactives/ for new-topic scaffolding. Topic helpers and onboarding
operate in installed vaults, not this source checkout.

Keep the repository free of learner data and generated exports. Preserve the
license and attribution. Run python3 -m unittest discover -s tests -v after
installer or helper changes, and verify generated vaults remain empty.
