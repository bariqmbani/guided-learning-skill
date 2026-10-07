# Topic routing

Read after dispatch has selected course work, before accessing course data.
Independent focused lessons and shared profile setup do not resolve a topic.
Questions within the current course stay in that course. Routing owns path
selection; the calling teaching skill owns preferences and assessment.

## Resolve and pin

From the installed vault root, use the configured Python runtime and
`SKILLS/guided-learning/scripts/topics.py`. `list` shows registered topics;
`topics/registry.json` stores their entries.

1. An explicit topic takes priority: `select "<topic>"` matches its ID, title,
   or alias without regard to case. An existing subject resumes its course.
2. For a new course subject, run `create <topic-id> --title "<title>" --alias
   "<short name>"` with a descriptive lowercase ID. Do not extend a different
   roadmap unless the learner requests it. If the request might name a concept
   or cluster inside an existing course, inspect that roadmap and clarify only
   an unresolved destination.
3. Course-context “continue” and unnamed guided-learning sessions use `resolve`
   for the active topic. If none exists, show the list and ask for a topic.
4. Resolve concepts and clusters within the chosen topic. For ambiguous matches
   or any unclear source destination, ask before persisting data. An explicitly
   supplied destination needs no redundant confirmation.
   A source lesson still needs a topic for its journal even if no concepts are
   added to its roadmap. Never fall back to a root roadmap.

Pin the returned JSON topic ID and `paths` for the entire session. Use them for
all course reads and writes, resolving the core skill's placeholders to these
vault-relative paths. Join directory and filename with one slash. Another
session may change the active topic: never reread that default to decide where
an in-progress session saves. Save the original topic's journal before an
explicit switch.

## Keep tracks independent

`create` makes an empty topic scaffold, copies local interactive assets, updates
the registry/dashboard, and selects the topic. It generates no curriculum or
learning progress. The core flow loads bootstrap only when the selected roadmap
has no concept checklist entries, checked or unchecked. Missing individual
files may be created without replacing existing notes, dates, logs, or mode.

The helper refuses an existing directory or registry entry. Inspect an
unregistered course before offering to register its actual paths; do not delete
it or choose another ID to conceal a collision. IDs cannot include path
separators or traversal; paths stay inside the vault, and topics cannot share
mutable learning files.

New concept notes use `<topic-id>--<concept-slug>.md`; prefix new paper-note
filenames with the topic ID too. Preserve existing filenames and links. In new
roadmaps, recall rows, notes, journals, and glossaries, use full vault-relative
wikilinks with readable aliases, for example
`[[topics/japanese/concepts/japanese--word-order|Word order]]`. Planned concept
links may remain unresolved until their notes are needed.

Use only the selected topic's roadmap, recall queue, mode, and logs for next
concepts, recall, check rotation, session numbering, and reviews. Add its ID to
new protocol and execution-log frontmatter; do not backfill older records.
Cross-topic links never authorize changing another track's learning data.

Interactive handoffs use the pinned `interactives_dir`, `css_file`, and
`build_script`; see [the course adapter](interactives.md) only when an activity
is needed. No construction instructions are loaded during ordinary routing.

## Registry recovery

A fresh vault has an empty registry with `active_topic: null`. If a registry is
missing or invalid after learning has begun, inspect existing topics before
repairing it. Never reset the registry, guess a fallback course, or discard data.
Use the helper for creation and selection: it serializes registry changes and
preserves other topics.
