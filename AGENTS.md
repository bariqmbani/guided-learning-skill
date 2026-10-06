# Learning vault

@/home/bariqmbani/.codex/RTK.md

Treat this directory as the vault root. All learning paths are relative to it.

For learning, studying, quizzes, papers, topic bootstrapping, or continuing a roadmap, read and follow `SKILLS/guided-learning/SKILL.md`. The project skill is registered through `.agents/skills/guided-learning` and `.claude/skills/guided-learning`.

Before reading or writing learning files, follow `SKILLS/guided-learning/references/topic-routing.md` and resolve the selected track with `SKILLS/guided-learning/scripts/topics.py`. The Tokenizers and Tokenization course is registered under `topics/tokenizers-and-tokenization/`; preserve its progress, notes, and existing concept filenames. Create unrelated subjects in separate `topics/<topic-id>/` folders. Bootstrap only a selected track with no concept checklist entries, checked or unchecked. Never reset an existing track. Ask for the learner's goal when a new topic is started, and do not mark progress before a real learning session.

Use the selected topic's registered paths for all learning operations. `learning/interactives/interactive.css`, `learning/interactives/build.sh`, and `learning/interactives/example-interactive.html` remain shared templates for new topics; topic-specific interactive pages belong under the selected topic's registered path. Use `topics/README.md` to navigate tracks. Pin the topic ID and paths for each session so switching the active topic elsewhere cannot redirect that session's writes.

Use Obsidian wikilinks for notes. Preserve the learner's existing notes and track progress, recall, and comprehension from actual sessions. After creating or editing interactive HTML, run the selected topic's registered build script from the vault root to inline its stylesheet. Prefix new-topic concept and paper filenames with the topic ID and use vault-relative wikilinks; preserve migrated course filenames and short concept links while updating path-bearing links.
