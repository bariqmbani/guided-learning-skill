# Profile Schema and Saving

Use for field validation and authorized profile writes. This is a terminal
reference: do not load another workflow. The caller supplies explicit answers or
approved changes; if authorization is missing, do not save inferred preferences.

## Complete object and defaults

The helper validates this existing schema. Supply exactly these fields; do not
add keys. The nine learner-facing fields are optional. Metadata is not a question;
unconfigured defaults are placeholders, not learner answers.

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

- `schema_version`: 1. `configured`: boolean, set to `true` by a successful save.
- `name`, `background`, `goals`, `language`, `preferences`: strings. The first three
  are general context, not course objectives or evidence of learning.
- `language`: nonempty after trimming; preserve bilingual wording. Applies to
  teaching and new lesson prose. Studying a language does not itself change it.
- `learning_context`: `auto`, `self-study`, `professional`, or `research`.
- `session_minutes`: integer 5–180, not boolean. For a range, save a representative
  integer and preserve the range in `preferences`. Record shorter windows there
  too and reduce lesson scope to fit them.
- `explanation_style`: `adaptive`, `step-by-step`, `concise`, `visual`, `discussion`,
  or `hands-on`; adjustable preferences, not learner types.
- `preferred_extras`: list without duplicates, drawn from `worked_examples`,
  `practice_exercises`, `interactive_visualizations`, `code_examples`,
  `mini_projects`, `writing_exercises`, `source_reading`. Empty means no priorities,
  not a ban on aids; practice and feedback remain part of teaching.
- `preferences`: free-text constraints, accommodations, tools, and requests.
  Store exclusions such as “no interactives” here.

## Read, merge, save, verify

Use the saved Python runtime from the installed vault root:

```sh
python3 SKILLS/learner-profile/scripts/profile.py show
python3 SKILLS/learner-profile/scripts/profile.py save --input /path/to/temporary-profile.json
```

`--vault <path>` before the subcommand selects another installed vault. Reuse the
current `show` result if already available; missing profiles return defaults
without writing. Repair invalid data only at the concrete error, preserving answers.
Merge only supplied/approved changes into the complete object, retaining unrelated
fields, free-text rules, and compatible older preferences. Explicit scoped requests
and onboarding answers need no extra confirmation.

Write temporary JSON with a structured file write; never interpolate learner text
into a shell command. Save, read the result to verify the requested changes,
remove the temporary input, and summarize. Validation precedes writes; only
`learner-profile.json` and `Learner Profile.md` change. The former guided-learning
profile helper remains compatible. No schema or helper API changes are needed.

Writes require an installed vault. Do not create a vault/course/session to save
preferences, or change learning records. Report an unavailable requested save.
Profile files are local; chat uses the learner's AI service.
