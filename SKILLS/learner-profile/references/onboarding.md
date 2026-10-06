# Shared Learner Setup

Handle `$learner-profile` (Codex), `/learner-profile` (Claude Code), a request to set up or update shared learning preferences, or the compatibility alias `guided-learning onboard` as a conversation in chat. This sets reusable vault preferences. It supports both guided-learning and concept-learning. It does not require a topic, select a course, create a concept session, generate a roadmap, or change learning progress.

Act like a thoughtful one-to-one tutor getting to know a learner. **Optional means offer the question and accept a skip, not omit the question.** Guide the learner through every editable field in `learner-profile.json`, explaining how answers can shape lessons. The rationale and evidence are in [onboarding-evidence.md](onboarding-evidence.md). Detailed course goals and starting knowledge belong to [topic intake](../../guided-learning/references/topic-intake.md). A focused concept session keeps its own objective and starting-point evidence in `note.md`. Neither belongs in the global profile.

## Read existing preferences

From the vault root:

```bash
python3 SKILLS/learner-profile/scripts/profile.py show
```

An absent profile returns unconfigured defaults without writing anything. Preserve every unanswered field, including older presentation and extras preferences. Never replace a configured profile with new defaults. If invalid, inspect the error and repair only the concrete problem; do not discard answers.

For a bare `learner-profile` or legacy `onboard` request, briefly acknowledge saved choices, then guide the learner through the remaining optional fields. `configured: true` means preferences were saved; it does not prove every field was offered. If the learner requests a specific update only, make that update without restarting the full conversation. Respect requests to keep all other fields unchanged. Do not restart onboarding during ordinary lessons.

## Guide the conversation

Open briefly: "Let's shape these lessons around you. I'll ask one small question at a time; every answer is optional. You can say 'skip', 'you choose', or 'finish' whenever you like. Your preferences are saved in this vault; the chat uses your chosen AI service."

**Keep one question outstanding at a time and wait for its answer.** Two closely related questions are acceptable if the learner requests a faster flow. Use natural language, not a JSON form or a long questionnaire. A request to onboard is enough to begin; do not add an initial permission question. Briefly introduce the flow, then ask the first unanswered question using the host's interactive question tool as described below.

Keep a conversation checklist of fields that are answered, explicitly skipped, or still pending. Information explicitly supplied in the request or saved profile can answer a question already; acknowledge it and move on. Unconfigured defaults are placeholders, not learner answers. Do not finish after asking only language and time, or after one broad "anything else?" question. Offer each pending field below unless the learner says to finish or skip the rest. Do not persist this checklist as extra JSON fields.

### Use the harness question UI

Prefer the current agent harness's native user-question tool when it is available
and permitted in the current mode. Depending on the host, this may be named
`request_user_input`, `request_user_input_async`, or `AskUserQuestion`. Follow the
actual exposed tool schema and restrictions; these names are examples, not a
guarantee that a particular client provides them.

- **Ask through the tool, then continue.** With a blocking tool, read the returned
  answer, acknowledge it briefly, and call the tool for the next pending field in
  the same ongoing interaction. Do not end with a final chat question between
  tool calls. Finish with a saved-profile summary only when onboarding completes.
- **For an asynchronous tool, keep one question pending.** Use the host's waiting
  or yielding mechanism until the response arrives. Do not repeat the question in
  a final reply or queue more questions while that answer is pending.
- **Use free text for personal context.** Name, background, goals, and open-ended
  preferences should accept the learner's own words. For language, time, context,
  explanation style, and activities, short choice suggestions may help, but keep
  a custom-answer path. Use multi-select for activity priorities if supported.
- **Keep every field optional.** Offer a Skip choice or explain how to type
  "skip", "you choose", or "finish". Follow the tool's limits on options; use its
  built-in custom-answer control instead of adding a duplicate Other choice.
  If a choice is initially selected by the UI, wait for the learner to submit it.
  A preselection, timeout, or missing response is not an answer or approval to save.
- **Fall back when needed.** If the host lacks a usable question tool, the tool
  is restricted to another mode, or it cannot accept the needed free-text answer,
  ask that question in chat and wait for the next learner message. Do not switch
  modes merely to unlock a tool or launch a separate CLI to collect answers.
  Continue with the same optional-field checklist; the delivery method does not
  change what is saved or authorize defaults on the learner's behalf.

The question belongs in the tool's question field; introductory commentary should
be brief and should not duplicate it. Follow the learner's chosen language in
question text, labels, and suggested answers. Pausing or cancelling remains valid
regardless of which UI delivers the question.

### Optional profile questions

Use these prompts as a guide, adapting the wording to earlier answers:

| Field | Optional invitation | How to use the answer |
| --- | --- | --- |
| `language` | "Which language would you like us to use? A bilingual mix is welcome, or you can skip." | Use it immediately for the remaining conversation and future lessons. Never infer it from name, location, or locale. Keep bilingual wording verbatim. If skipped, disclose the English starting default. |
| `name` | "What would you like me to call you? A nickname is fine, and you can leave this blank." | Address the learner naturally, without repeating their name in every reply. |
| `background` | "What experience or interests could I draw on when explaining new ideas? A little context is enough, or we can skip." | Choose familiar examples and analogies. Do not require an employer, degree, job title, or personal history, or treat self-report as proof of mastery. |
| `goals` | "Broadly, what would you like learning to help you do? It's fine to be exploring." | Tailor encouragement and relevance. Accept broad aims; leave detailed outcomes for the course plan or focused session note. |
| `learning_context` | "Is this mainly for personal curiosity, work, research, or a mix? We can also decide per course or concept session." | Map to `self-study`, `professional`, `research`, or `auto`. Reuse an explicitly stated purpose instead of asking twice. Mixed or undecided purposes use `auto`. |
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
- `learning_context`: `auto`, `self-study`, `professional`, or `research`; use the learner's stated purpose. Each course or concept session may differ.
- `name`, `background`, `goals`: optional general context. Store a particular course's goal and evidence of starting knowledge in that course, and a focused lesson's goal in its session note, not as universal facts about the learner.

Write a complete object to a temporary JSON file using a structured write; do not interpolate learner text into a shell command. Save it:

```bash
python3 SKILLS/learner-profile/scripts/profile.py save --input /path/to/temporary-profile.json
```

The helper validates before writing, sets `configured: true`, and updates only `learner-profile.json` and `Learner Profile.md`. Delete the temporary input. Explain that preferences are stored in these local vault files; the learning chat runs through the learner's chosen AI service. Do not request credentials or unrelated private material.

Read the saved result and summarize the resulting teaching plan in a few sentences, connecting answers to specific choices of examples, pace, explanation, practice, and feedback. Identify retained defaults and skipped details without presenting them as personal facts. Give an illustrative lesson approach, not a fabricated completed lesson. Explain that `$concept-learning <concept>` / `/concept-learning <concept>` starts a focused session, while `$guided-learning <topic>` / `/guided-learning <topic>` starts or continues a course, and setup can be revisited anytime. If a session is already in progress, apply the preferences while preserving its pinned topic or concept-session path and current position. Setup never edits course goals, checkboxes, recall dates, journals, or concept-session records.

## Apply and refine

Read the configured profile at session start. Current explicit requests take priority, then approved preferences in the selected course or current concept session, then vault defaults. A standalone concept session never inherits the active course's preferences implicitly. Choose explanations and aids by the concept, observed responses, and constraints; preferences are useful input, not evidence of mastery. Use worked examples when helpful, then reduce scaffolding as the learner succeeds independently. Provide accessible alternatives when an aid cannot be used.

For a course, also read approved overrides in the selected roadmap's **Teaching preferences** section. For focused learning, read the current session note and its recorded preferences, without resolving an unrelated active topic. For an ongoing adjustment inferred from feedback, follow
[personalization.md](personalization.md): propose the wording and scope, and wait
for approval before changing future preferences. Explicit onboarding answers and
direct requests to save a scoped preference already provide authorization.

Briefly explain that lessons include trying an answer or task and corrective feedback. Courses also include later recall; focused sessions offer later review without enrolling the learner or scheduling recall automatically. Respect requests to pause, defer, or change the form of a check. Keep these learning activities in the method rather than presenting them as optional extras to purchase or select.

If absent or unconfigured, offer learner-profile setup without blocking a course or concept request; ask about language and immediate time constraints when needed. After an early lesson, invite one actionable adjustment, such as "Should we adjust pace, difficulty, or examples next time?" Skip this if the learner has already given feedback. Infer mastery from explanations and task performance over time, including delayed recall, not from preference answers or satisfaction alone.
