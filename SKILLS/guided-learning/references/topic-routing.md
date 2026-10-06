# Topic Routing

Resolve a topic before reading or writing learning data. These instructions override the single-roadmap assumptions in upstream examples and templates.

## Resolve and pin a topic

From the vault root, use `python3 SKILLS/guided-learning/scripts/topics.py list` to see registered topics. The registry is `topics/registry.json`.

1. An explicitly named topic takes priority. Match its ID, title, or aliases, ignoring case. Select it with `python3 SKILLS/guided-learning/scripts/topics.py select "<topic>"`. An existing subject resumes its course; never bootstrap it again just because the learner says "I want to learn".
2. A request to learn an unregistered subject creates a separate track. Choose a descriptive lowercase topic ID, then run `python3 SKILLS/guided-learning/scripts/topics.py create <topic-id> --title "<title>" --alias "<short name>"`. A new subject must not be added to an existing roadmap unless the learner explicitly requests that extension. If the request could instead name an existing concept or cluster, inspect the selected roadmap and ask once when the intent is unclear.
3. "Continue", "continue my roadmap", and unnamed sessions use the last active topic: `python3 SKILLS/guided-learning/scripts/topics.py resolve`. If none is active, show the topics and ask the learner to choose or name a new subject.
4. A named concept or cluster is resolved within the selected topic. If multiple topics match or a topic cannot be resolved, ask before saving learning data; never fall back to the root roadmap.
5. For a PDF, URL, or paste, establish the target topic from the request. If the source is unrelated to the selected topic, or its destination is unclear, ask which topic to use or whether to create a new one before persisting it. A source taught without adding concepts still needs a topic for its journal.

The helper prints the selected entry as JSON, including its `paths`. Pin that topic ID and those paths in the session context; announce its title once. Do not reread a global active-topic value to decide where to save an in-progress session. Another session may have changed it. If the learner explicitly switches topics mid-session, save the current journal in its original topic before switching.

Use the JSON `paths` for **all** concept, paper, roadmap, recall, glossary, journal, interactive, and log operations. Every `{roadmap}`, `{recall_queue}`, `{protocols_dir}`, `{interactives_dir}`, `{concepts_dir}`, `{papers_dir}`, `{glossary}`, `{skill_logs_dir}`, `{css_file}`, and `{build_script}` in the skill is a placeholder for that selected entry's vault-relative path. Join directories and filenames with exactly one slash. Do not treat placeholders as literal filenames.

## Independent tracks

New topics have this structure:

```text
topics/<topic-id>/
  learning/
    learning-roadmap.md
    recall-queue.md
    protocols/
    interactives/
      interactive.css
      build.sh
  concepts/
  literature/papers/
  research/glossary.md
  logs/
```

`create` makes an empty scaffold, copies the current CSS and HTML builder, updates the registry and topic dashboard, and selects the new topic. It does not generate a curriculum, copy learning progress, or initialize another topic's files. Run the Bootstrapper afterward for the learner's actual subject and goal.

The helper refuses to create a topic in an existing directory or overwrite an existing registry entry. If an unregistered folder already contains a course, inspect it before offering to register its actual paths. Do not delete the folder or pick a different ID just to conceal a collision. Topic IDs cannot contain path separators or traversal components. Registry paths must remain inside the vault and different topics may not share mutable learning paths.

Bootstrap only when the **selected** roadmap has no concept checklist entries, checked or unchecked. Existing checked items are progress. Preserve any existing notes, recall rows, glossary, journals, logs, and domain mode; do not rewrite them from a starter template. Missing directories or individual files can be created without resetting existing ones. The learner's goal and domain mode are independent for every topic.

For new topics, concept filenames must be `<topic-id>--<concept-slug>.md`. Prefix newly created paper-note filenames with the topic ID too. This avoids duplicate basenames that could break existing short wikilinks. Use full vault-relative wikilinks with readable aliases, such as `[[topics/japanese/concepts/japanese--word-order|Word order]]`. When migrating an existing course, preserve its filenames and short concept links; update path-bearing links to the new registered locations. Use qualified links in new roadmap entries, recall rows, glossaries, journals, sources, and interactive references.

Recall comes only from the selected topic's queue. Pick the next concept only from its roadmap. Detect domain mode from its own roadmap or recall header. Choose comprehension checks, number logs, count sessions, and analyze struggle patterns using only its logs. Include the topic ID in newly written journal and execution-log frontmatter. Do not backfill old records just to add metadata.

Cross-topic links are allowed when useful. They do not mark another topic's concepts learned or change its recall queue or notes. Updating another track requires the learner to request that update. Do not change the shared teaching method based on a single topic's history unless the change applies across topics.

After creating interactive HTML, run `bash "<resolved build_script>"` from the vault root. The builder and CSS live alongside that topic's HTML. Do not run the legacy builder for another topic; skip the build when the selected interactive directory contains no HTML.

## Tokenizers and Tokenization course

**Tokenizers and Tokenization** is registered as `tokenizers-and-tokenization`, with `root: "topics/tokenizers-and-tokenization"` and `layout: "topic"`. Its exact paths are in `topics/registry.json`; resolve it with `topics.py` rather than deriving paths from its ID.

The course was migrated from the root-level layout. Its roadmap progress, recall rows and dates, glossary, notes, journals, logs, and interactive pages were preserved. Existing concept filenames and short concept links remain valid. The shared interactive CSS, builder, and example page remain at `learning/interactives/` as templates copied into new topics.

## Registry recovery

If a registry is missing, inspect the existing root roadmap before doing any learning-file writes. If it contains concepts, infer its subject from its title and contents and register it once at the existing paths. If its subject is unclear, ask. A generic empty scaffold is not a course; use an empty registry with `active_topic: null` and wait for a subject.

If an existing registry is invalid, the helper stops with the concrete inconsistency. Inspect before repairing it. Never reset the registry, guess a fallback course, or discard an entry. Registry updates are serialized by the helper and preserve all other topics; use it for creation and selection instead of hand-rewriting the JSON.
