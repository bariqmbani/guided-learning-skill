# Guided Learning Onboarding

Handle `$guided-learning onboard` (Codex), `/guided-learning onboard` (Claude Code), or a request to set up or update learning preferences as a conversation in chat. Onboarding saves vault-level preferences; it does not require a topic, generate a roadmap, change the active topic, or reset learning progress.

## Read existing preferences

From the vault root:

```bash
python3 SKILLS/guided-learning/scripts/profile.py show
```

An absent profile returns unconfigured defaults without writing anything. If the learner already has a configured profile, briefly show its main preferences and ask what they want to change. Preserve fields they do not change. If the file is invalid, inspect the error and repair only the concrete problem; do not discard the learner's answers.

## Ask in chat

Keep the conversation short. Use existing answers from this conversation and ask for missing information in small groups. Natural-language answers are sufficient; do not make the learner fill JSON or run terminal prompts.

1. Ask what they want learning to help them achieve and what background or prior knowledge they bring. Their preferred name is optional. Infer whether the setting is personal study, workplace application, or research from their answer, asking only when unclear.
2. Ask which teaching language they prefer, how long a typical session should last, and how they like explanations presented: step by step, concise, visual, conversational, or hands on. These are presentation preferences, not claims about aptitude.
3. Ask which extras they want prioritized: worked examples, practice exercises, interactive visualizations, code examples, mini projects, writing exercises, or guided source reading. They may choose several or none. Ask for any other useful preferences, such as starting from fundamentals or tying examples to their projects.

Offer defaults when the learner is unsure: English, context selected per topic, about 20 minutes, step-by-step explanations, and worked examples, practice exercises, and interactive visuals when useful. Blank optional name/background/goals/preferences are allowed; do not invent personal details. Save defaults only when the learner accepts them or leaves those choices to you. Do not repeat questions already answered or add a separate approval step after the learner has supplied their preferences.

## Save the profile

Build a complete JSON object using the schema below. Map natural-language preferences to the closest listed values and retain other details in `preferences`. Use a temporary JSON file and a structured write; do not interpolate learner text into a shell command.

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
  "explanation_style": "step-by-step",
  "preferred_extras": ["worked_examples", "practice_exercises", "interactive_visualizations"],
  "preferences": ""
}
```

- `learning_context`: `auto`, `self-study`, `professional`, or `research`.
- `session_minutes`: an integer from 5 to 180; use it as an approximate budget, not a stopwatch.
- `explanation_style`: `step-by-step`, `concise`, `visual`, `discussion`, or `hands-on`.
- `preferred_extras`: any combination of `worked_examples`, `practice_exercises`, `interactive_visualizations`, `code_examples`, `mini_projects`, `writing_exercises`, and `source_reading`; an empty list is valid.

Save using the helper:

```bash
python3 SKILLS/guided-learning/scripts/profile.py save --input /path/to/temporary-profile.json
```

The helper validates the data, sets `configured: true`, and writes `learner-profile.json` and the readable `Learner Profile.md`. Those are the only persistent files onboarding updates. Delete the temporary input after saving. Do not save malformed data, credentials, or unrelated private material as learning preferences.

Briefly summarize the saved preferences and explain how to start or resume a subject. If a learning session is already in progress, apply the updated preferences to that session while keeping its pinned topic and current position. Running onboarding later updates preferences without replacing course goals, domain mode, checkboxes, recall dates, or journals.

## Use the profile during learning

Read the configured profile at the start of sessions and when the learner requests a preference change. Use it for language, session pacing, examples, and optional learning aids. Topic-specific goals and stored domain mode take priority over global defaults. Explicit requests in the current conversation take priority over both. Background is context for prerequisite checks, not proof that any concept has been mastered. Keep comprehension checks and spaced recall in the core session flow.
