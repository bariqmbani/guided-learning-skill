# Guided Learning Onboarding

Handle `$guided-learning onboard` (Codex), `/guided-learning onboard` (Claude Code), or a request to set up or update learning preferences as a conversation in chat. This sets reusable vault preferences. It does not require a topic, select a course, generate a roadmap, or change learning progress.

Act like a thoughtful one-to-one tutor getting to know a learner. **Optional means offer the question and accept a skip, not omit the question.** Guide the learner through every editable field in `learner-profile.json`, explaining how answers can shape lessons. The rationale and evidence are in [onboarding-evidence.md](onboarding-evidence.md). Detailed topic goals and starting knowledge belong to [topic-intake.md](topic-intake.md), when the learner starts a subject.

## Read existing preferences

From the vault root:

```bash
python3 SKILLS/guided-learning/scripts/profile.py show
```

An absent profile returns unconfigured defaults without writing anything. Preserve every unanswered field, including older presentation and extras preferences. Never replace a configured profile with new defaults. If invalid, inspect the error and repair only the concrete problem; do not discard answers.

For a bare `onboard` request, briefly acknowledge saved choices, then guide the learner through the remaining optional fields. `configured: true` means preferences were saved; it does not prove every field was offered. If the learner requests a specific update only, make that update without restarting the full conversation. Respect requests to keep all other fields unchanged. Do not restart onboarding during ordinary lessons.

## Guide the conversation

Open briefly: "Let's shape these lessons around you. I'll ask one small question at a time; every answer is optional. You can say 'skip', 'you choose', or 'finish' whenever you like. Your preferences are saved in this vault; the chat uses your chosen AI service."

**Ask one question per turn and wait for the learner's answer.** Two closely related questions are acceptable if the learner requests a faster flow. Use natural language, not a JSON form or a long questionnaire. A request to onboard is enough to begin; do not add an initial permission question. Ask the first unanswered question in your opening response, rather than only explaining onboarding or saving defaults.

Keep a conversation checklist of fields that are answered, explicitly skipped, or still pending. Information explicitly supplied in the request or saved profile can answer a question already; acknowledge it and move on. Unconfigured defaults are placeholders, not learner answers. Do not finish after asking only language and time, or after one broad "anything else?" question. Offer each pending field below unless the learner says to finish or skip the rest. Do not persist this checklist as extra JSON fields.

Use these prompts as a guide, adapting the wording to earlier answers:

| Field | Optional invitation | How to use the answer |
| --- | --- | --- |
| `language` | "Which language would you like us to use? A bilingual mix is welcome, or you can skip." | Use it immediately for the remaining conversation and future lessons. Never infer it from name, location, or locale. Keep bilingual wording verbatim. If skipped, disclose the English starting default. |
| `name` | "What would you like me to call you? A nickname is fine, and you can leave this blank." | Address the learner naturally, without repeating their name in every reply. |
| `background` | "What experience or interests could I draw on when explaining new ideas? A little context is enough, or we can skip." | Choose familiar examples and analogies. Do not require an employer, degree, job title, or personal history, or treat self-report as proof of mastery. |
| `goals` | "Broadly, what would you like learning to help you do? It's fine to be exploring." | Tailor encouragement and relevance. Accept broad aims; leave detailed course outcomes for topic intake. |
| `learning_context` | "Is this mainly for personal curiosity, work, research, or a mix? We can also decide per topic." | Map to `self-study`, `professional`, `research`, or `auto`. Reuse an explicitly stated purpose instead of asking twice. Mixed or undecided purposes use `auto`. |
| `session_minutes` | "How much time usually feels comfortable for a lesson? We can start around 20 minutes if you're unsure." | Set a realistic scope. For a range, use a representative integer and keep the range in `preferences`. |
| `explanation_style` | "What would feel helpful: a careful step-by-step explanation, a short overview, a back-and-forth discussion, or having me adapt as we go? Other suggestions are welcome." | Offer an adjustable presentation preference. Visual and hands-on requests are also valid; explain unfamiliar options with a short example if asked. |
| `preferred_extras` | "Would you enjoy more worked examples, practice challenges, or small projects? You can choose several, suggest something else, or let me choose as we go." | Offer two or three concrete aids suited to what they shared. Code, interactive visuals, writing, and guided source reading are also available. Avoid requiring a catalog selection. |
| `preferences` | "What else would make these lessons work better for you—for example, gentler correction, analogies, sources with explanations, shorter chunks, or tools or formats to avoid? It's fine to skip." | Save free-text requests and functional needs. Ask only for the accommodation, not a diagnosis or unrelated private information. |

After an answer, acknowledge it in one sentence and, where useful, give a concrete teaching consequence: "I'll draw on your cooking experience for examples and check where each analogy stops working." Then ask the next pending question. Avoid canned praise, personality labels, and unsupported claims about how the learner learns best. If they are unsure, offer a small example or an adaptive starting choice rather than pressing for an answer.

Handle learner control consistently:

- **Skip / prefer not to say:** leave that field unchanged, mark it skipped for this conversation, and continue. Never store the word "skip" as their name or background.
- **You choose:** use an appropriate default and explain it. Do not invent a name, background, or goal.
- **Finish / skip the rest / start learning:** save the answers collected so far and preserve the remaining values. Choosing to skip everything is valid. Move to a lesson only when the learner also requests one.
- **Pause / cancel:** respect it. On cancel without saving, leave files unchanged. On pause, ask only if it is unclear whether the learner wants the collected answers saved.
- **No reply:** wait. Silence never completes onboarding or authorizes a write.

Personalized lessons mean adapting to the learner's interests, pace, goals, and responses. Do not promise the chat is private or offline: profile files are local to the vault, while the chat uses the learner's chosen AI service. A nickname and non-identifying examples are enough.

## Save the profile

Save after every pending field has been answered or explicitly skipped, or when the learner chooses to finish early or requests a targeted update. Do not require a separate confirmation of answers already provided. Start from the result of `show` and update only answered fields. For first setup, use `adaptive` explanations and no aid priorities unless the learner states otherwise. Keep the existing schema and saved choices compatible with earlier vaults. `schema_version` and `configured` are system metadata; never ask the learner to fill them in. All nine learner-facing fields are optional; the complete JSON object retains valid defaults for skipped choices.

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
- `learning_context`: `auto`, `self-study`, `professional`, or `research`; use the learner's stated purpose. Each topic may differ.
- `name`, `background`, `goals`: optional general context. Store a particular course's goal and evidence of starting knowledge in that course, not as universal facts about the learner.

Write a complete object to a temporary JSON file using a structured write; do not interpolate learner text into a shell command. Save it:

```bash
python3 SKILLS/guided-learning/scripts/profile.py save --input /path/to/temporary-profile.json
```

The helper validates before writing, sets `configured: true`, and updates only `learner-profile.json` and `Learner Profile.md`. Delete the temporary input. Explain that preferences are stored in these local vault files; the learning chat runs through the learner's chosen AI service. Do not request credentials or unrelated private material.

Read the saved result and summarize the resulting teaching plan in a few sentences, connecting answers to specific choices of examples, pace, explanation, practice, and feedback. Identify retained defaults and skipped details without presenting them as personal facts. Give an illustrative lesson approach, not a fabricated completed lesson. Explain **I want to learn [topic]** or **Continue [topic]**, and that onboarding can be revisited anytime. If a session is already in progress, apply the preferences while preserving its pinned topic and current position. Onboarding never edits course goals, checkboxes, recall dates, or journals.

## Apply and refine

Read the configured profile at session start. Current explicit requests take priority, then the selected topic's plan, then vault defaults. Choose explanations and aids by the concept, observed responses, and constraints; preferences are useful input, not evidence of mastery. Use worked examples when helpful, then reduce scaffolding as the learner succeeds independently. Provide accessible alternatives when an aid cannot be used.

Briefly explain that lessons include trying an answer or task, corrective feedback, and later recall. Respect requests to pause, defer, or change the form of a check. Keep these learning activities in the method rather than presenting them as optional extras to purchase or select.

If absent or unconfigured, offer onboarding without blocking a topic request; ask about language and immediate time constraints when needed. After an early lesson, invite one actionable adjustment, such as "Should we adjust pace, difficulty, or examples next time?" Skip this if the learner has already given feedback. Infer mastery from explanations and task performance over time, including delayed recall, not from preference answers or satisfaction alone.
