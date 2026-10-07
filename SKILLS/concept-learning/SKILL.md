---
name: concept-learning
metadata:
  version: "1.1.0"
description: >
  Guide a personalized lesson on one concept with worked examples, supported practice,
  and an independent understanding check. Automatically save a session note, mentor
  feedback, and practice record under concept-sessions/. Use for a focused concept
  lesson or to resume one; use guided-learning for ongoing courses and spaced recall,
  and learner-profile for shared preference setup or updates.
---

# Concept Learning

Teach one concept through a guided conversation, adapting to the learner's actual
responses. Keep a useful learning record throughout the session. This skill works
without a course, topic registry, or completed onboarding.

## Shared references — read when relevant

The full vault installation includes shared guidance in sibling skill folders.
Resolve these links relative to this canonical skill directory, not the native
agent entry. Read only the reference needed for the current action:

| Reference | When to read it |
| --- | --- |
| [teaching.md](../learner-profile/references/teaching.md) | At lesson start, for shared personalization, adaptive support, and evidence-based assessment principles. |
| [personalization.md](../learner-profile/references/personalization.md) | When learner feedback suggests a lasting teaching adjustment, or the learner asks to retain or remove one. Follow its session/vault scope and saving rules. |
| [learner-profile/SKILL.md](../learner-profile/SKILL.md) | When the learner requests shared setup or a targeted profile update. That skill loads its onboarding reference as needed; an ordinary lesson does not start onboarding. |
| [onboarding-evidence.md](../learner-profile/references/onboarding-evidence.md) | When explaining the rationale or evidence limits of the teaching and personalization choices. |
| [learning-interactives/SKILL.md](../learning-interactives/SKILL.md) | Only when an interactive helps this lesson's outcome; owns artifact construction and verification. No course setup is needed. |
| [topic-routing.md](../guided-learning/references/topic-routing.md) | Only after an explicit request to connect this session to a course, together with [guided-learning/SKILL.md](../guided-learning/SKILL.md). Never use it to select an active topic for a focused lesson. |

For an independent installation without these sibling skills, use the teaching
loop and boundaries below. Repair explanations and adapt support immediately.
Before turning inferred feedback into an ongoing preference, propose concrete
wording and ask which scope should retain it; an explicit scoped request already
authorizes that change. Save approved session preferences in `note.md`. Shared
profile updates or course handoffs require the corresponding installed skill;
report an unavailable capability without inventing profile or topic files.

## Start or resume

1. Resolve the learner's installed vault or explicitly chosen learning directory.
   Use that root throughout the session. Never write learner data in the setup
   source repository or treat a course's `topics/<id>/` as the vault root. If no
   learning directory is known, ask for one before creating records; do not
   silently use the skill installation directory.
2. For a new lesson, identify a single concept from the request. If it is too broad,
   propose a useful first concept and ask one focused question. Once the concept
   is identified, create the three records before teaching, using the helper
   relative to this skill directory:

   ```bash
   python3 scripts/sessions.py --vault /path/to/learning create bubble-sort --title "Bubble sort" --date YYYY-MM-DD
   ```

   Use the learner's local date from the host context; the helper requires an
   explicit date and never guesses it. Choose a short lowercase ASCII slug with
   hyphens; the title can use the learner's language. The JSON response pins the
   session root and document paths. Creation automatically uses `-02`, `-03`, etc.
   for repeated sessions on the same concept and date, preserving earlier work.
3. For a request to resume, resolve the explicitly identified session:

   ```bash
   python3 scripts/sessions.py --vault /path/to/learning resolve concept-sessions/YYYY-MM-DD_bubble-sort
   ```

   Read all three records, reuse their objective, prior attempts, and next step,
   and continue without recreating files. `list` returns available session paths
   without writing anything; use it to disambiguate a vague resume request, not
   to choose silently between plausible sessions. Link an earlier session when
   revisiting the same concept in a new session.

## Personalize the lesson

When the shared skill is installed, read the profile with
`python3 ../learner-profile/scripts/profile.py --vault /path/to/learning show`.
Read the shared teaching guidance listed above when available. If the shared
skill is absent, read the existing vault-level
`learner-profile.json` if present, using its saved language, background, goals,
time budget, and functional constraints as context. If the profile is missing,
unconfigured, or unreadable, continue from the current conversation and ordinary
adaptive defaults; mention an unreadable profile without replacing it. A default
English value in an unconfigured profile is not a stated language preference.

Priority is current requests, then explicitly approved session preferences, then
vault defaults. Do not inherit an active course's preferences or assume its
prerequisites. Background and self-report suggest examples; they do not establish
mastery. Presentation preferences are adjustable aids, not fixed learning types.
Respect explicit accessibility constraints and exclusions, while choosing useful
practice or visuals even if they were not listed as preferred extras.

Ask only for missing information that affects this lesson: desired use, starting
knowledge, language, or time. Ask one question at a time and reuse answers already
given. Make a modest, revisable assumption when optional context is unavailable.
Offer `/learner-profile` or `$learner-profile` for broader setup without making it
a prerequisite. Keep concept-specific goals and adaptations in `note.md`.

When feedback suggests a lasting adjustment, read the personalization reference
listed above before proposing or saving it. Record approved session preferences
in `note.md` under **Teaching preferences**; use the shared profile skill only
for explicitly requested vault-wide changes. Ordinary corrections, examples,
and pacing adjustments remain part of the current lesson.

## Guided teaching loop

1. **Set a concrete outcome.** State what the learner should be able to do by the
   end, scaled to their time and purpose. For bubble sort, this might be tracing
   a fresh array and explaining what one pass guarantees. Agree on a smaller
   outcome if prerequisites or time make the original goal unrealistic.
2. **Probe briefly.** Ask for a small prediction, explanation, or attempt relevant
   to the next step. Wait for the answer. Provide a short prerequisite explanation
   when needed instead of turning the lesson into an entrance test.
3. **Model the reasoning.** Give a small worked example in an appropriate context,
   explaining decisions as well as results. Make analogies' limits explicit.
4. **Fade support.** Ask the learner to predict or complete a meaningful next step.
   Keep only one question or attempt outstanding and **wait for the learner before
   evaluating it or advancing**. Record the actual attempt and help used. Offer a
   hint, then a partial step, then a clear explanation when useful; do not keep a
   stuck novice guessing. After showing an answer, use a fresh attempt to check
   understanding. A request for direct explanation authorizes giving it.
5. **Invite self-explanation.** Ask why the step works, what it guarantees, or how
   it connects to something the learner knows. Respond to the reasoning, including
   partial success and misconceptions, and adapt the next example or support.
6. **Check independently.** Use a new example or application, with no solution or
   hints shown in advance. Wait for the response. If help is needed, record the
   check as assisted and use another example if time permits. Never label an
   unseen, skipped, or tutor-solved answer as independent success.
7. **Close with evidence.** Summarize what the learner demonstrated, what remains
   uncertain, and one useful next step. A successful immediate check establishes
   performance in this session, not durable mastery or long-term retention.

Let the learner pause, skip practice, change depth or pace, request examples, or
finish early. Reduce scope instead of exceeding the budget. If a check is deferred
or the conversation ends early, preserve an incomplete assessment and a clear
resume point. Never manufacture learner answers to finish a workflow.

## Session documents

Always create and maintain these three documents inside the pinned session folder:

| Document | What to capture |
| --- | --- |
| `note.md` | Outcome, relevant context and preferences, starting point, explanations, worked examples, key takeaways, sources, and continuation point. |
| `mentor-feedback.md` | Evidence-based strengths, misconceptions, support or hints needed, independent-check result, and actionable next step. Until responses exist, say **not yet assessed**. |
| `practice.md` | Prompts, actual learner attempts, hints, feedback, and the independent check. Distinguish tutor examples from learner work. |

Update the records after meaningful teaching or learner responses and before
ending each turn at a question; do not defer all persistence until completion.
Keep them readable in the teaching language and link the documents to one another.
Capture relevant reasoning without copying unnecessary personal disclosures.
Do not prefill solutions to outstanding exercises in any visible session artifact.
Add solutions after an attempt or on request, clearly separating them from the
learner's response. Preserve previous attempts and corrections during updates.

Use `status: "in-progress"` initially, `"paused"` for an explicit pause,
`"incomplete"` for an early ending with unfinished work, and `"completed"` when
the agreed session scope is finished. Track assessment separately as
`"not-yet-assessed"`, `"partial"`, or `"demonstrated"`; completion alone does not
imply success. Keep status and assessment consistent across all three records.

Create other documents only when they add value:

- **`interactive.html`** for useful manipulation, exploration, or practice. Read
  [learning-interactives](../learning-interactives/SKILL.md) when installed and
  pass the outcome, model, language/access needs, time budget, and the pinned
  session destination. Keep compact authoring source and supporting local assets
  inside that session; deliver its offline page as `interactive.html`. This uses
  no course assets, topic registry, or progress records. Announce the artifact
  after build and review, give a first action, then invite exploration before
  dependent assessment. Record only learner work actually observed. If the
  authoring skill is unavailable, a small activity may still be authored directly
  as self-contained HTML with embedded CSS/JavaScript, visible labels, keyboard
  controls, a reset, a clear exploration prompt, and a text alternative. Validate
  its model and behavior with available tools; do not invent toolkit commands or
  claim unperformed checks. Use a worked example or accessible diagram when time,
  tools, or access constraints cannot support a useful interactive.
- **`resources.md`** for a substantial annotated set of supporting sources. Keep a
  short source list in `note.md`; distinguish material actually consulted from
  optional further reading and never invent citations.

Before updating or adding files, confirm the session directory and targets remain
inside the pinned `concept-sessions/` directory and are not symlinks. The helper's
`resolve` validates standard records; inspect conditional targets as well. Preserve
unrelated files and every earlier session. Do not reset records when resuming.

## Boundaries and handoff

Creating a focused session does not create or alter a topic, roadmap, glossary,
recall queue, execution log, or learner profile. There is no automatic spaced
recall. For a direct request to change persistent shared preferences, use the
shared [learner-profile workflow](../learner-profile/SKILL.md); otherwise keep
the adjustment in this session.

If the learner explicitly requests adding the lesson to a course or starting a
course, read [guided-learning](../guided-learning/SKILL.md) and its
[topic routing](../guided-learning/references/topic-routing.md). Carry forward
the requested outcome, source-session link, actual attempts, and remaining gaps.
Preserve the original session and existing course progress; do not turn a focused
lesson into completed course mastery or reset a roadmap/recall queue. If the
course skill is unavailable, keep the lesson intact and explain the missing
capability instead of inventing topic files. Link the selected course from
`note.md` once the requested handoff is completed.
