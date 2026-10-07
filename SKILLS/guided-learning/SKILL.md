---
name: guided-learning
metadata:
  version: "3.8.0"
description: >
  Guide ongoing courses with topic roadmaps, a spiral curriculum, personalized
  lessons, and spaced recall. Use to start or continue a course, work through
  its concepts or sources, or review its learning progress. Explicit
  guided-learning requests choose this course workflow. Independent focused
  concept lessons use concept-learning; shared preference setup uses
  learner-profile.
---

# Guided Learning

Teach 1–3 concepts per session through explanation, learner attempts,
application, connections, and spaced recall. Preserve this sequence and the
Quality Bar below. Load required guidance at its point of use; selective loading
must not skip teaching steps or weaken assessment. Reuse references already in context.
Resolve links relative to this canonical file, not the native agent entry.

## Dispatch

- `$guided-learning onboard` and `/guided-learning onboard` are retired. Point
  to [learner-profile](../learner-profile/SKILL.md) and stop; never create an
  “onboard” course. Shared preference setup or updates also use learner-profile;
  stop after setup unless learning was requested too.
- An explicit guided-learning invocation, an ongoing curriculum, roadmap study,
  assigned course sources, spaced recall, or course review uses this workflow.
- An independent one-concept or mechanism lesson, including a focused source,
  uses [concept-learning](../concept-learning/SKILL.md) before topic selection.
  Questions within the current course stay here; an active topic alone does not
  make unrelated questions course work. Honor an explicitly named skill.
- Ask one scope question only when focused learning versus a course is unclear.

## Load by need

| Reference | Trigger |
| --- | --- |
| [Topic routing](references/topic-routing.md) | Before course-file access; select and pin one topic and its paths. |
| [Shared teaching](../learner-profile/references/teaching.md) | Lesson start; authoritative guidance for personalization, support, learner attempts, and assessment. |
| [Bootstrap](references/bootstrap.md) | Selected roadmap is missing or has no checked or unchecked concept entries. |
| [Teach from source](references/teach-from-source.md) | A source is assigned to this course. |
| [Pass 1](references/pass-1.md), [Pass 2](references/pass-2.md), or [Pass 3](references/pass-3.md) | After selecting the current pass; read only that pass's explanation, check, and connection guidance. |
| [Interactive handoff](references/interactives.md) | An interactive serves Phase 1b or 3. |
| [Session records](references/session-records.md) | Before writing a protocol or execution log, including partial sessions. |
| [Session review](references/session-review.md) | Every five sessions in this topic. |
| [Personalization](../learner-profile/references/personalization.md) | Saving/removing an ongoing preference or proposing one from feedback. |

## Course context

Use the saved Python runtime when configured. From the vault root, read
`python3 SKILLS/learner-profile/scripts/profile.py show` and the pinned roadmap's
**Teaching preferences**. Priority: current requests, approved topic preferences,
then vault defaults. Topic preferences apply even with an unconfigured profile;
its default English is not a stated learner answer. Shared teaching governs the
remaining personalization and support rules. Do not restart onboarding when
resuming a course.

Use adaptive teaching by default. Legacy styles are adjustable preferences,
not fixed learner types; preferred extras are priorities, not an allowlist.
Respect explicit exclusions and provide useful alternatives.

For a new topic, use a non-`auto` profile learning context as the default domain
mode; preserve an existing topic's goals and mode. Infer framing from purpose,
asking once only if it changes teaching; otherwise default to `self-study`.
Store it in the selected roadmap or recall header. The learner may override it.

| Mode | Examples, application, and audience |
| --- | --- |
| `research` | Papers, methods, evidence, hypotheses, reviewer arguments. |
| `professional` | Projects, process choices, implementation, stakeholders, risk. |
| `self-study` | Everyday explanations, personal projects, practical concept maps. |

Repair explanations and pacing now. Inferred ongoing preferences require the
personalization workflow; a direct scoped request already authorizes saving.
Keep personal rules in the profile or pinned roadmap, never shared skill files.
Preference changes do not alter learning progress.

## Session flow

### Phase 0: Orient

1. Follow topic routing, pin its ID and registry `paths`, and announce its title
   once. All `{roadmap}`, `{recall_queue}`, `{concepts_dir}`, `{papers_dir}`,
   `{protocols_dir}`, `{interactives_dir}`, `{glossary}`, `{skill_logs_dir}`,
   `{css_file}`, and `{build_script}` placeholders mean those returned paths.
   Never fall back to another topic or reset existing progress.
2. For an empty track, use bootstrap; for an assigned source, use the source
   branch. Bootstrap creates a 10–20-concept plan with notes created as needed;
   source teaching uses a condensed first encounter. Otherwise read the roadmap
   and recent protocol. Resume the last session for “continue”; choose the named
   concept, next item in a named cluster, or next unchecked item when unspecified.
3. Determine the pass and domain mode; read only the selected pass reference.
   Announce “Pass X, Cluster Y: *name*. Next: *concept*,” briefly recalling the
   previous lesson. Resume from the existing plan without fresh topic intake.

### Phase 0.5: Spaced recall (2–5 min)

Before new teaching, read the selected recall queue. If none are due, skip
silently. Otherwise ask up to two one-sentence recall prompts and wait for each
response. When more than three are overdue, prioritize prior fuzzy/blank results,
then shorter intervals, and defer unselected due items by three days.

- **Solid:** accurate idea and reasoning; advance `3d → 7d → 21d → done`,
  scheduling from today. At 21d, remove from this queue cycle.
- **Fuzzy:** partial or imprecise idea; retain the interval, reschedule from today,
  and note the gap.
- **Blank:** reset to 3d and give a brief refresher before moving on.

Record results in the protocol. Intervals are a starting heuristic; response
speed alone is not accuracy, and finishing a cycle is not permanent mastery.
Keep existing dates when changing preferences. Revisit important ideas in later
applications. The queue format is in [the example](examples/recall-queue.md).

### Phase 1: Context and explanation

Read the concept note and relevant source summaries. If this planned concept has
no note yet, create only its note following [bootstrap](references/bootstrap.md)
and the pinned naming rules; do not create future notes in bulk.

Assess complexity and state a short reason before choosing depth:

| Complexity | Signals | Session depth |
| --- | --- | --- |
| Light | Familiar territory, one clear claim, no math | Roughly 10 min; may pair with a related light concept. |
| Medium | New mechanism or method, some statistical reasoning | Roughly 20 min; standard session. |
| Heavy | Unfamiliar math, a multi-step process, or missing prerequisites | Roughly 30–40 min; one concept only. |

Scale subsequent phases to observed understanding and the current time budget.
Do not prolong an explanation that has clicked or rush one that needs work;
split a heavy lesson across sessions when necessary.

Before explaining, ask brief warm-ups for the 1–3 prerequisites, reusing relevant
answers from intake or earlier in the session. Do not assume familiarity with
standard mathematical or statistical terms. Fill gaps with short mini-modules.
Follow selected-pass guidance and shared teaching: work from known ideas, show
intermediate reasoning, use relevant examples, and make analogy limits explicit.
Keep the explanation conversational and incremental.

#### Phase 1 passes

These teaching requirements apply in every domain mode; adapt the examples,
application, and audience. Read the current pass's reference **before explaining**.
It contains required teaching detail, checks, and connections, not optional extras.

| Pass | Teaching requirements | Detailed guidance |
| --- | --- | --- |
| 1 — Overview | Build intuition and relevance with an appropriate explanation archetype, a concrete example, and explicit analogy limits. | [Pass 1](references/pass-1.md) |
| 2 — Working Understanding | Trace the method; evaluate supporting evidence; examine limits; compare related concepts; map the mechanism to the learner's work. | [Pass 2](references/pass-2.md) |
| 3 — Fluency | Critique original material; practise argumentation; synthesize concepts; consider counter-evidence; explain the idea to someone who must use it. | [Pass 3](references/pass-3.md) |

### Phase 1b: Optional interactive

Use an interactive when manipulating inputs, tracing steps, comparing cases, or
exploring consequences improves the outcome within the available time and access
constraints. A preference for visuals alone does not require one. Follow the
[interactive handoff](references/interactives.md); use a worked example,
diagram, conversation, or writing task when it serves better. Continue useful
teaching while a supported background build runs. Exploration precedes any
check that depends on the page.

### Phase 2: Explore and check (5–10 min)

Invite exploration if an interactive is ready. Choose **one** eligible check from
its pass reference, suited to the domain. Use the selected topic's last execution
log to avoid repeating its `check_format`; record the chosen ID.
Ask and wait. Address gaps and re-explain before advancing. A deferred or
unanswered check remains unassessed; a tutor solution is not learner success.

### Phase 3: Apply (5–15 min, scaled to complexity)

Choose an application that meets the outcome and current constraints:

- **Interactive:** numerical relationships, processes, tradeoffs, or branching
  consequences. Follow the interactive handoff; if already built, explore a new
  preset, boundary, or surprising combination and discuss why it behaves so.
- **Scenario:** apply a decision or system design to a realistic domain case.
- **Writing:** frame an argument, hypothesis, claim, caveat, or recommendation.
  Always consider writing in Pass 3.

Use a new case for an independent attempt after guided practice. Record support
honestly; use an accessible alternative when needed.

### Phase 3b: Connections (2–5 min)

Close application with the selected pass's connection prompt. Refer to prior
concepts by readable titles. If the learner is stuck, suggest a connection and
invite their reasoning; do not record the suggestion as an independent answer.
Add supported new connections to the selected topic's notes. Cross-topic links
are allowed, but changing another track requires the learner's request.

### Phase 4: Update and record

Read [session records](references/session-records.md). Save partial sessions too,
with actual attempts, support, unresolved gaps, and a clear resume point.

1. Mark the roadmap concept complete for this pass only when the observed work
   meets its success criterion. Otherwise keep it open. Update the progress
   summary and add the protocol link beneath the concept either way.
2. List referenced source papers and current statuses; suggest `skimmed` for
   Pass 1 or `read` for Pass 2/3. Wait for learner confirmation before changing
   paper status.
3. Add introduced terms to the glossary in alphabetical order and domain context.
   For a concept that met this pass's criterion, schedule recall at 3d from today;
   a successful revisit resets that concept to 3d. Preserve unrelated rows and
   do not record unfinished work as learned.
4. Write the learner protocol to `{protocols_dir}/YYYY-MM-DD_concept-slug.md`
   and a compact execution log to `{skill_logs_dir}/YYYY-MM-DD_sessionNN.md`.
   Use the next topic-local session number; link the protocol instead of
   duplicating its narrative. Keep the check ID, correction tags, and assessment.
5. Every five topic sessions, run [session review](references/session-review.md).
   Then offer another concept or a stopping point. Respect fatigue or a request
   to pause; depth and honest records take priority over completing every phase.

## Multi-Concept Sessions

Combine concepts only when closely related, such as concepts from the same
cluster in the same pass.

- Never exceed three concepts per session.
- Prefer depth over breadth: understanding one concept beats skimming three.
- Pair light concepts when useful; heavy concepts always get a solo session.
- Wrap up early when the learner seems fatigued or distracted.
- Check each concept's understanding separately; success on one does not mark
  the others complete. Keep unfinished work and a clear resume point.

## Quality Bar

A successful session requires observed learner evidence for the current pass:

| Pass | Success criterion |
| --- | --- |
| 1 — Overview | State the core idea in one sentence and explain why it matters for their research, work, or learning goal. |
| 2 — Working Understanding | Explain the mechanism and how it connects to at least two other concepts. |
| 3 — Fluency | Use the concept fluently in writing or argumentation without prompting. |

Distinguish independent performance from hints, supplied answers, and self-report.
A correct selection alone is insufficient: ask for reasoning and a fresh case.
Record gaps and plan another attempt when the criterion is unmet. An immediate
success describes this task now; later recall and transfer test durable learning.
