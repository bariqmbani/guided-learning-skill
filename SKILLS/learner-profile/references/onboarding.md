# Shared Learner Setup

Conduct the full optional profile conversation. The owning skill handles targeted
updates separately; do not restart a questionnaire for one changed preference.

## Read and orient

From the installed vault root, use its saved Python runtime to run
`python3 SKILLS/learner-profile/scripts/profile.py show`. Missing profiles return
unconfigured defaults without writing. For invalid data, repair only the concrete
error; never discard answers or replace an existing profile with defaults.

Briefly acknowledge saved choices. Track answered, skipped, and pending fields in
conversation only. Reuse explicitly supplied answers; unconfigured defaults are
not answers, and `configured: true` does not prove every field was offered.

Introduce the flow briefly: one small question at a time; every answer is optional;
“skip,” “you choose,” and “finish” are welcome. Preferences are stored locally,
while chat uses the chosen AI service—do not promise private or offline chat.
The setup request authorizes starting; no initial permission question is needed.

## Conversation and question delivery

Offer every pending field in order below unless the learner finishes early.
Optional means invite and accept a skip, not omit. Do not stop after language/time
or substitute one broad “anything else?” for the remaining invitations.

Keep one question outstanding and wait; two closely related questions are allowed
only when the learner asks for a faster flow. Acknowledge each answer in one
sentence, optionally explain its teaching consequence, then ask the next question.
Use natural conversation, not a JSON form, canned praise, or learner-type claims.
If unsure, offer an example or an adaptive default without pressuring an answer.

- Prefer an available, permitted native question tool; follow its actual schema.
  With blocking tools, continue after the answer without an intervening final
  chat question. With asynchronous tools, wait/yield with one question pending;
  do not queue another or repeat it in a final reply.
- Accept free text for name, background, goals, and preferences. Other fields may
  have short choices plus custom input; use multi-select for activities if supported.
  Follow option limits, use the built-in custom-answer control, and allow skips.
- A UI preselection, timeout, or silence is not an answer or permission to save.
  Ask in chat and wait if no usable tool exists in this mode or it cannot accept
  the needed input. Do not change modes or launch a separate CLI to collect answers.
- Put tool questions only in the question field; avoid duplicating them in
  commentary. Use the chosen language for prompts, choices, and acknowledgments.
  The same learner controls below apply with either delivery method.

## Nine optional invitations

Adapt wording to prior answers while preserving each invitation:

| Field | Invitation and handling |
| --- | --- |
| `language` | “Which language would you like us to use? A bilingual mix is welcome.” Apply immediately; preserve bilingual wording. Never infer from name, location, or locale. If skipped, disclose the English starting default. |
| `name` | “What would you like me to call you? A nickname is fine, or skip.” Address naturally without repeating the name in every reply. |
| `background` | “What experience or interests could I draw on for examples?” Familiar examples need no employer, degree, job title, or personal history. Self-report is not proof of mastery. |
| `goals` | “Broadly, what would you like learning to help you do? Exploring is fine.” Use for relevance and encouragement; detailed outcomes belong in a course or concept session. |
| `learning_context` | “Personal curiosity, work, research, or a mix?” Reuse a stated purpose; map these to `self-study`, `professional`, `research`, or `auto`. Mixed/undecided uses `auto`; each lesson may differ. |
| `session_minutes` | “How much time usually feels comfortable? Around 20 minutes if unsure.” Use the schema's range handling when saving. |
| `explanation_style` | “Step by step, a short overview, discussion, or adapt as we go?” Visual, hands-on, and custom requests are welcome. Explain unfamiliar choices with a small example if asked; preferences stay adjustable. |
| `preferred_extras` | “More worked examples, practice challenges, or small projects?” Offer two or three relevant aids, multiple/custom choices, or tutor selection. Code, interactives, writing, and source reading are also available; no catalog selection is required. |
| `preferences` | “What else would help—correction style, analogies, sources, shorter chunks, or formats to avoid?” Keep free-text requests and functional needs; ask for accommodations, not diagnoses or unrelated private details. |

## Learner controls

- **Skip / prefer not to say:** leave unchanged, mark skipped for this conversation,
  and continue. Never store “skip” as a personal answer.
- **You choose:** explain a suitable default; never invent a name, background, or goal.
- **Finish / skip the rest / start learning:** save collected answers, preserving
  other values. Skipping everything is valid. Begin a lesson only if also requested.
- **Pause / cancel:** stop. Cancel without saving leaves files unchanged; on pause,
  clarify saving only if the learner's intent is unclear.
- **No reply:** wait; silence cannot finish onboarding or authorize a write.

## Save and close

Save when all pending fields are answered/skipped, or the learner finishes early.
Do not reconfirm supplied answers. Read [schema and saving](profile-schema.md)
for validation and persistence; preserve existing values for skipped fields.
For first setup, retain adaptive explanations and no aid priorities unless stated.
Metadata is never a learner question. Do not request credentials or private material.

After verification, briefly connect answers to examples, pace, explanation,
practice, and feedback. Identify defaults/skips without treating them as personal
facts; illustrate a lesson approach without inventing completed learning.
Explain that lessons include attempts and corrective feedback; courses add later
recall, while focused lessons do not automatically enroll or schedule it.
Point to `$concept-learning <concept>` / `/concept-learning <concept>` for a focused
lesson and `$guided-learning <topic>` / `/guided-learning <topic>` for a course.
Setup can be revisited. If learning is in progress, preserve its pinned location,
position, and records; onboarding never changes course or concept-session progress.
