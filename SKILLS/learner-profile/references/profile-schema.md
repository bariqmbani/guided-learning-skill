# Profile Schema and Saving

Read for a profile write or field validation. This reference does not start an
onboarding conversation. The helper in `../scripts/profile.py` validates the
existing schema; do not add fields or discard compatible older preferences.

## Fields and defaults

All nine learner-facing fields are optional. Metadata is managed by the helper,
not asked of the learner. Unconfigured defaults are placeholders, not answers.

```json
{
  "schema_version": 1,
  "configured": false,
  "name": "",
  "background": "",
  "goals": "",
  "language": "English",
  "learning_context": "auto",
  "session_minutes": 20,
  "explanation_style": "adaptive",
  "preferred_extras": [],
  "preferences": ""
}
```

- Supply exactly these fields in a complete JSON object. `schema_version` is 1;
  `configured` is boolean and becomes `true` on a successful save.
- `name`, `background`, `goals`, `language`, and `preferences` are strings.
  Name, background, and goals are optional general context. Course goals and
  starting-knowledge evidence belong in the course; focused objectives and
  attempts belong in the concept-session note.
- `language` must be nonempty after trimming. Preserve any teaching language or
  bilingual preference. It applies to explanations, questions, recall, exercises,
  and new lesson prose. Studying a language does not itself change this field.
- `learning_context`: `auto`, `self-study`, `professional`, or `research`, based
  on stated purpose. Individual courses and concept sessions may differ.
- `session_minutes`: integer 5–180, not a boolean. Use a representative integer
  for a range and retain the range in `preferences`. Record shorter available
  windows there too; adapt scope rather than overrunning the learner's budget.
- `explanation_style`: `adaptive`, `step-by-step`, `concise`, `visual`,
  `discussion`, or `hands-on`. These are adjustable preferences, not learner types.
- `preferred_extras`: a list without duplicates, drawn from `worked_examples`,
  `practice_exercises`, `interactive_visualizations`, `code_examples`,
  `mini_projects`, `writing_exercises`, or `source_reading`. Empty means no
  priorities, not a ban on aids. Practice and feedback remain part of teaching.
- `preferences`: free-text constraints, accommodations, tools, and requests.
  Store explicit exclusions such as “no interactives” here.

## Read, merge, save, verify

1. Use the installed vault root and its saved Python runtime. Read the profile:
   `python3 SKILLS/learner-profile/scripts/profile.py show`.
   `--vault <path>` before the subcommand selects another installed vault.
   An absent profile returns defaults without writing. If invalid, repair only
   the concrete error; never replace existing answers with defaults.
2. Merge only supplied answers or explicitly approved changes into that complete
   object. Preserve unrelated fields and free-text rules. For inferred ongoing
   preferences, obtain wording/scope approval through
   [personalization](personalization.md) before this step; explicit scoped requests
   and onboarding answers already authorize their changes.
3. Write the complete object to a temporary JSON file using a structured write;
   never interpolate learner text into a shell command. Save with:
   `python3 SKILLS/learner-profile/scripts/profile.py save --input /path/to/temporary-profile.json`.
4. The helper validates before writing, sets `configured: true`, and updates only
   `learner-profile.json` and `Learner Profile.md`. Read the saved result, verify
   the requested changes, remove the temporary input, and summarize what changed.

The former `SKILLS/guided-learning/scripts/profile.py` entry remains compatible.
Profile writes require an installed vault; do not create a course or vault just
to save preferences. Report a requested save that cannot be made. Profile changes
never update learning progress or concept-session records. Profile files are
local; the learning chat uses the learner's chosen AI service. Do not request
credentials or unrelated private material.
