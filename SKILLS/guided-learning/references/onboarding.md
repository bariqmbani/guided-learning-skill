# Guided Learning Onboarding

Handle `$guided-learning onboard` (Codex), `/guided-learning onboard` (Claude Code), or a request to set up or update learning preferences as a conversation in chat. This sets reusable vault preferences. It does not require a topic, select a course, generate a roadmap, or change learning progress.

Ask a question only when its answer changes a teaching decision. The rationale and evidence are in [onboarding-evidence.md](onboarding-evidence.md). Topic goals and starting knowledge belong to [topic-intake.md](topic-intake.md), when the learner starts a subject.

## Read existing preferences

From the vault root:

```bash
python3 SKILLS/guided-learning/scripts/profile.py show
```

An absent profile returns unconfigured defaults without writing anything. If already configured, briefly show the saved language, session budget, and constraints, then ask what they want to change. Preserve every unanswered field, including older presentation and extras preferences. Never replace a configured profile with new defaults. If invalid, inspect the error and repair only the concrete problem; do not discard answers.

## First setup: three useful prompts

Say briefly: "I'll save your language and practical preferences for this vault. Each subject will have its own goal and starting point. You can skip questions or change answers later."

Ask the following in small groups, using answers already explicitly given. Accept natural language; do not require JSON, terminal prompts, or a questionnaire.

1. **Teaching language:** "Which language would you like explanations and questions in—English, Bahasa Indonesia, or a bilingual mix?" Ask explicitly unless already answered. Do not infer from name, location, system locale, or current message. The unconfigured English value is a placeholder. Save a bilingual choice verbatim, such as "Bahasa Indonesia with English technical terms". If the learner delegates the choice, offer English as the default.
2. **Session budget:** "How much time usually works for one session? If you're unsure, we can start with about 20 minutes." This controls scope, explanation length, and the amount of practice. Accept a rough estimate. For a range, use a representative value and retain the range in `preferences`; do not imply precision. If skipped, use the offered 20-minute starting budget.
3. **Optional constraints and preferences:** "Anything I should accommodate or prioritize—for example, text-only lessons, tools you can use, shorter chunks, examples from your work, or more hands-on practice? You can skip this." Record functional needs and explicit priorities. No medical diagnosis or personal history is needed. Ask a follow-up only to resolve a constraint that affects the next lesson.

Do not add a required name, occupation, education, demographic, personality, or learning-style survey. Accept an optional name, general background, or broad goal if volunteered; do not invent them. Do not ask learners to select a catalog of seven extras before they have seen a lesson. If they request an aid, store it as a priority. A visual preference does not establish a fixed "visual learner" type or exclude text, practice, or other useful representations.

The learner may skip or delegate any choice. Explain the resulting default briefly; do not silently treat a placeholder as an explicit answer. If there is no reply, wait rather than interpreting silence as a completed onboarding. Do not add a separate approval step after answers have been provided.

## Save the profile

Start from the result of `show` and update only answered fields. For first setup, use `adaptive` explanations and no aid priorities unless the learner states otherwise. Keep the existing schema and saved choices compatible with earlier vaults.

```json
{
  "schema_version": 1,
  "configured": true,
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

- `language`: any nonempty teaching language or bilingual preference. Apply to explanations, recall questions, comprehension checks, exercises, and newly written lesson prose. Studying a language as a topic does not automatically change this field.
- `session_minutes`: integer 5–180, an approximate budget. Record a shorter available window in `preferences` and adapt the session if the learner cannot use the minimum. Split a heavy concept across sessions instead of overrunning the budget.
- `preferences`: constraints, accommodations, available tools, and free-text requests. Store a desired restriction such as "no interactives" here; an empty extras list is not a ban on teaching aids.
- `explanation_style`: `adaptive`, `step-by-step`, `concise`, `visual`, `discussion`, or `hands-on`. This is an adjustable presentation preference, never a diagnosis or proof of an effective method.
- `preferred_extras`: optional priorities from `worked_examples`, `practice_exercises`, `interactive_visualizations`, `code_examples`, `mini_projects`, `writing_exercises`, or `source_reading`. An empty list means no priorities stated. Practice and feedback remain part of teaching.
- `learning_context`: `auto`, `self-study`, `professional`, or `research`; infer only from volunteered context. Each topic may differ.
- `name`, `background`, `goals`: optional general context. Store a particular course's goal and evidence of starting knowledge in that course, not as universal facts about the learner.

Write a complete object to a temporary JSON file using a structured write; do not interpolate learner text into a shell command. Save it:

```bash
python3 SKILLS/guided-learning/scripts/profile.py save --input /path/to/temporary-profile.json
```

The helper validates before writing, sets `configured: true`, and updates only `learner-profile.json` and `Learner Profile.md`. Delete the temporary input. Explain that preferences are stored in these local vault files; the learning chat runs through the learner's chosen AI service. Do not request credentials or unrelated private material.

Briefly summarize the language, budget, and constraints. Explain **I want to learn [topic]** or **Continue [topic]**. If a session is already in progress, apply the preferences while preserving its pinned topic and current position. Onboarding never edits course goals, checkboxes, recall dates, or journals.

## Apply and refine

Read the configured profile at session start. Current explicit requests take priority, then the selected topic's plan, then vault defaults. Choose explanations and aids by the concept, observed responses, and constraints; preferences are useful input, not evidence of mastery. Use worked examples when helpful, then reduce scaffolding as the learner succeeds independently. Provide accessible alternatives when an aid cannot be used.

Briefly explain that lessons include trying an answer or task, corrective feedback, and later recall. Respect requests to pause, defer, or change the form of a check. Keep these learning activities in the method rather than presenting them as optional extras to purchase or select.

If absent or unconfigured, offer onboarding without blocking a topic request; ask about language and immediate time constraints when needed. After an early lesson, invite one actionable adjustment, such as "Should we adjust pace, difficulty, or examples next time?" Skip this if the learner has already given feedback. Infer mastery from explanations and task performance over time, including delayed recall, not from preference answers or satisfaction alone.
