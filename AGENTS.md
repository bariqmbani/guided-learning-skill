# Learning vault

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

Read the learner profile using the skill's profile helper. Use its configured
language, session budget, and access constraints to tailor teaching. Its
background and goals are context, not evidence that concepts have been learned.
Use its learning context as a default for new topics; preserve an existing
topic's stored goals and domain mode. Requests in the current conversation take
priority over saved preferences. Ask only for missing topic-specific details.

Bootstrap only a selected topic with no concept checklist entries, checked or
unchecked. Follow `references/topic-intake.md` for the outcome, starting
knowledge, and feasible practice; keep the plan in that topic. Preserve existing
notes and progress, and record learning only from actual sessions.

Use topic-prefixed filenames and full vault-relative Obsidian wikilinks for new
concept and paper notes. Shared CSS and the HTML builder live in
`learning/interactives/`; each new topic receives its own copies. Run the selected
topic's registered builder after creating HTML.
