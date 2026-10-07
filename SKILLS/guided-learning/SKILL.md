---
name: guided-learning
metadata:
  version: "3.7.0"
description: >
  Guide ongoing courses with topic roadmaps, a spiral curriculum, personalized
  lessons, and spaced recall. Use to start or continue a course, work through
  its concepts or sources, or review its learning progress. Explicit
  guided-learning requests choose this course workflow. Independent focused
  concept lessons use concept-learning; shared preference setup uses
  learner-profile.
---

# Guided Learning — Spiral Curriculum Sessions

Teach 1–3 concepts per session through a literature-backed spiral curriculum:
explanation, learner attempts, application, connections, and spaced recall.
Keep the full teaching sequence below; load specialized details only when needed.

## Dispatch before topic selection

- **Retired command:** `$guided-learning onboard` and `/guided-learning onboard`
  are unsupported. Point to `$learner-profile` or `/learner-profile` and stop;
  do not start setup or create an “onboard” course.
- **Shared preferences:** Requests to set up/update shared preferences follow
  [learner-profile](../learner-profile/SKILL.md). Stop after setup unless learning
  was also requested. Do not select a topic or create/reset learning records.
- **Courses:** Explicit `$guided-learning` or `/guided-learning` selects this
  workflow, even with a concept name. Continuing a roadmap, studying its concepts
  or assigned sources, spaced recall, quizzes, and course progress reviews belong
  here. Honor an explicitly named skill.
- **Focused lessons:** Independent one-concept or mechanism requests, including
  a source aimed at that concept, follow [concept-learning](../concept-learning/SKILL.md)
  before topic resolution. A question within the current course stays in its
  pinned topic; an active topic alone does not make an unrelated question course work.
- **Ambiguous scope:** Ask one short scope question only when focused learning
  versus an ongoing course is unclear. A broad subject plus a curriculum request
  selects this course workflow.

## References and topic selection

Read the indicated reference before its action. Reuse guidance already available
in context; do not reload it at each phase or read every reference at startup.
Links are relative to their containing canonical file, not a native agent entry.
References use the same pinned paths and phase numbers as this core flow.

| Reference | Required when |
| --- | --- |
| [Topic routing](references/topic-routing.md) | After course dispatch, before any course-file access; covers selection, pinned paths, and registry recovery. |
| [Shared teaching](../learner-profile/references/teaching.md) | At lesson start: adaptive support, learner attempts, and honest assessment. |
| [Bootstrapper](references/bootstrap.md) | The selected roadmap is missing or has no checked or unchecked concept entries. |
| [Teach from source](references/teach-from-source.md) | A PDF, URL, file, or pasted source is assigned to this course. |
| [Comprehension checks](references/comprehension-checks.md) | Selecting the Phase 2 check for the current pass and domain. |
| [Interactives](references/interactives.md) | Before launching or building an interactive in Phase 1b or 3. |
| [Session records](references/session-records.md) | Before writing the session protocol or execution log, including partial sessions. |
| [Session review](references/session-review.md) | After every five sessions in this topic. |
| [Personalization](../learner-profile/references/personalization.md) | Feedback suggests a lasting adjustment, or the learner asks to save/remove one. |

Use `python3 SKILLS/guided-learning/scripts/topics.py` from the vault root as
directed by topic routing. An
explicit topic takes priority over the active default. Pin the returned topic ID
and registry `paths` for the whole session. All `{roadmap}`, `{recall_queue}`,
`{concepts_dir}`, `{papers_dir}`, `{protocols_dir}`, `{interactives_dir}`,
`{glossary}`, `{skill_logs_dir}`, `{css_file}`, and `{build_script}` placeholders
refer to those paths. Resolve them before access. Never use another topic as a
fallback or reset existing progress. Registry recovery follows topic routing.
The bootstrapper creates missing course scaffolding; manual starter templates
are in `examples/` and must be adapted to the pinned paths.

## Personalization and domain modes

Read `python3 SKILLS/learner-profile/scripts/profile.py show` from the vault root
and the selected roadmap's **Teaching preferences**. Use the saved Python runtime
when configured. Priority: current requests, approved topic preferences, then
vault defaults. Topic overrides apply even when the global profile is unconfigured.

For a configured profile, apply its language (including bilingual preferences) to
explanations, recall, questions, exercises, and new lesson prose. Apply the time
budget and access constraints. Background and broad goals guide examples and
prerequisite probes, never establish mastery. Use non-`auto` learning context as
a default for a new topic; preserve an existing topic's goals and mode.

Choose methods from the task, observed responses, and constraints. `adaptive` is
the default; legacy styles remain adjustable preferences, not fixed learner types.
Preferred extras are priorities, not an allowlist. An empty list does not prohibit
practice or visuals; explicit exclusions require usable alternatives. Worked
examples, practice, feedback, and recall need no extra approval merely because an
aid was not selected. Respect pauses and deferred checks; split heavy concepts
rather than exceed the budget.

If the profile is absent or unconfigured, offer `$learner-profile` or
`/learner-profile` without blocking the lesson. Ask language and immediate time
constraints only when needed; default English is not a learner answer. Bootstrap
uses topic intake for missing goals and starting knowledge. Resume existing
courses from their plan and recent protocol without rerunning intake. After an
early lesson, invite one actionable adjustment to pace, difficulty, or examples
unless feedback was already given.

Repair current explanations immediately. For an inferred ongoing preference,
follow the personalization reference: propose concrete wording and scope (topic,
vault, or both), then wait for approval before saving or adopting it. A direct
scoped request already authorizes the change. Store personal rules in the profile
or selected roadmap, never shared skill files. Preference changes never mark or
reset progress.

**Domain mode** changes question framing, application context, and connection
prompts; retain the Phase 1 explanation methods in every mode.

| Mode | Context and framing |
| --- | --- |
| `research` | Papers, citations, research questions; conference/advisor pitches, Related Work, reviewer defense, hypotheses, dissertation argument maps. |
| `professional` | Industry/project/process material; team or stakeholder briefings, design decisions, risk assessments, current projects, team knowledge dependencies. |
| `self-study` | Personal or mixed material; everyday explanations, blog drafts, skeptic responses, practical/portfolio projects, personal concept maps. |

During the first session, infer mode from the roadmap, concept notes, and purpose.
If ambiguous and framing needs clarification, ask once whether to use academic,
workplace, or personal framing; self-study is the default when purpose remains
unclear. Store the choice in the roadmap or recall queue header and reuse it.
The learner can override it at any time.

## Session flow

### Phase 0: Orient (1 min)

1. Resolve and pin the course through topic routing; announce its title once.
   A new subject starts/resumes its own track. Read the bootstrapper for an empty
   selected track or teach-from-source for an assigned source; follow that branch
   instead of the standard flow. Bootstrap retains the 10–20-concept roadmap and
   per-concept stubs; source teaching retains its condensed first-encounter flow.
2. Read the roadmap and approved preferences. With no input, choose the next
   unchecked concept; with a cluster, its next item; with a concept, that item.
   For "continue", resume from the last session.
3. Determine pass (1 Overview, 2 Working Understanding, 3 Fluency) and recall the
   saved domain mode or establish it as above.
4. Announce: "We're in **Pass X**, Cluster Y: *cluster name*. Next up: *concept*."
   Briefly recall the previous lesson when resuming. Use the plan and current time
   constraints; an older course lacking a plan does not need fresh intake.

### Phase 0.5: Spaced Recall Check (2-5 min)

**Before teaching anything new, check whether any previously learned concepts are due for recall.**

1. Read the recall queue. Find all entries where `next_recall` is today or earlier.
2. If there are due items, pick up to 2 for this session. **If more than 3 are overdue**, prioritize previously "fuzzy" or "blank" items, then those with the lowest interval. Defer the rest by 3 days — don't let recall crowd out new learning. Ask the learner a **one-sentence recall prompt** for each selected item:
   - "Quick recall — what's the core claim of *[concept name]*?"
   - Or: "In one sentence, why does *[concept name]* matter for your research?"
3. **Evaluate the response:**
   - **Solid** — the learner accurately recalls the core idea. Judge accuracy and reasoning, not response speed or fluency alone. Advance to the next interval (3d -> 7d -> 21d -> done). If already at 21d, remove from this queue cycle; this is evidence of recall at this delay, not permanent mastery.
   - **Fuzzy** — the learner gets the gist but is imprecise or misses a key nuance. Keep the same interval and reschedule. Add a brief note about what was fuzzy.
   - **Blank** — the learner can't recall the core idea. Reset to 3d interval. Flag the concept for a brief refresher (2-3 sentences) before moving on.
4. If no items are due, skip this phase silently.
5. Log recall results in the session protocol under "## Recall checks".

**Recall queue format** (`{recall_queue}`):

```markdown
# Recall Queue

| concept | learned | interval | next_recall | last_result | notes |
|---------|---------|----------|-------------|-------------|-------|
| [[concept-slug]] | YYYY-MM-DD | 7d | YYYY-MM-DD | solid | — |
| [[concept-slug]] | YYYY-MM-DD | 3d | YYYY-MM-DD | fuzzy | missed key implication |
```

These intervals are a practical starting heuristic, not universally optimal. Keep existing recall dates intact when applying onboarding preferences. Revisit important ideas in later application and transfer tasks even after a queue cycle is complete.

### Phase 1: Context & Explain

**Read the concept note** and its source paper summaries silently.

**Assess concept complexity** before deciding session depth:

| Complexity | Signals | Session depth |
|------------|---------|---------------|
| **Light** | Familiar territory, single clear claim, no math | ~10 min total, can pair with another concept |
| **Medium** | New mechanism or method, some statistical reasoning | ~20 min, standard session |
| **Heavy** | Unfamiliar math, multi-step process, requires prerequisites the learner doesn't have | ~30-40 min, single concept only |

Announce the assessment: "This one is [light/medium/heavy] — [one-line reason]." Adjust all subsequent phases proportionally. Don't spend 20 min on a concept that clicks in 5. Don't rush a concept that needs 35.

**Prerequisite probe (before explaining):**
Before launching into the main concept, identify its 1-3 key prerequisites — the terms or ideas
the learner must already understand for the explanation to land. Ask a brief warm-up question
about each prerequisite. If they are shaky on any, cover it first as a mini-module before the main
explanation. Don't assume familiarity with statistical or mathematical terms even if they seem standard.
Reuse relevant responses already observed during topic intake or this session instead of asking the same questions again. Starting at the right level avoids false-start explanations that need to be rebuilt from scratch.

**Pass 1 (Overview) — adaptive explanation:**

The goal is for the learner to understand the core idea and why it matters for their research. Different concepts call for different narrative shapes — don't use the same structure every time. Choose the approach that fits the concept, and vary your style across sessions so each one feels fresh.

**Explanation archetypes** (pick the best fit, or blend two):

- **Misconception flip** — Start with the common/surface understanding, reveal why it's incomplete, rebuild correctly. Best for concepts where the obvious interpretation is wrong.
- **Problem-first** — Open with a concrete problem the learner faces in their research, then show how this concept solves it. Best for practical or design concepts where motivation matters more than mechanism.
- **Contrast** — "You already know X from [prior concept]. This is like X except..." Best when building on prior knowledge, especially within the same cluster.
- **Historical narrative** — "People tried A, then B, then this concept emerged because..." Best for field-evolution concepts where the journey illuminates why the destination matters.
- **Worked example** — Walk through concrete numbers from the learner's domain, let the pattern emerge from the math before naming it. Best for statistical and mathematical concepts.

**Guardrails across all approaches:**

- Start from what the learner already knows — connect to prior sessions, their existing work, or everyday intuition
- One analogy maximum. If it breaks at the edges, say where: "This analogy stops working when..."
- Land it specifically in the learner's research — their system, their hypotheses, their experimental design, their next paper. Not generic consequences.
- Build incrementally. No skipped steps, no "it's obvious that..."
- Keep it conversational — paragraphs that flow, not bullet walls. Warm, curious, a little irreverent.

**Pass 2 (Working Understanding):**

The learner already has the intuition from Pass 1. Now go deeper into *how* and *how well*.

- **Method walkthrough**: Step through the algorithm, process, or framework with concrete numbers from the learner's domain. Don't just describe — trace execution on a realistic example. Show the moving parts.
- **Evidence evaluation**: Walk through the key study behind this concept. Cover sample size, study design, effect sizes, and statistical tests used. Don't just report findings — evaluate them: "This effect size is [strong/modest], based on [N] participants, in [domain], which means..."
- **Limitations and boundary conditions**: Where does this concept break? Under what sample sizes, domains, or conditions does the finding not hold?
- **Cross-concept comparison**: Explicitly compare with related concepts already covered. What does this add that the other doesn't? Where do they agree, where do they conflict?
- **Application mapping**: Where exactly does this concept appear (or should appear) in the learner's work — submitted papers, experimental designs, system architecture?

**Pass 3 (Fluency):**

The learner understands the concept and its mechanism. Now they need to wield it in academic discourse — writing, argumentation, and synthesis.

- **Paper reading**: Read the key sections of the original paper together. Discuss methodology choices: what did the authors do well? What are the weak points?
- **Argumentation practice**: The learner writes a paragraph that deploys this concept in an argument — Related Work, Discussion, or Limitations section. Then stress-test it with reviewer simulation.
- **Synthesis**: How does this concept combine with 2-3 others to form a larger argument? The learner should articulate the argument chain.
- **Counter-evidence and honest limitations**: Name the strongest objection to this concept. Identify papers or findings that weaken it.
- **Teaching test**: Explain this concept to a hypothetical student who needs to implement it.

### Phase 1b: Launch interactive during explanation

Immediately after explaining, apply Phase 3's selection criteria. Check access
constraints, tools, and time first; a visual preference alone does not require an
interactive. Use a static explanation or worked example for text-only preferences,
inaccessible controls, or insufficient time. Otherwise read
[interactives](references/interactives.md), choose a reusable template, and build
with the concept and pinned asset paths. Use a background helper only when the
host supports it; otherwise build directly or use a suitable worked example.
Continue useful explanation or ask a warm-up question while a background build
runs. The main agent must run the selected builder and review the page before
announcing it ready; do not promise completion before the learner responds.
The learner explores it before a comprehension check that depends on the page.
Skip this phase when a conversation or writing exercise better serves the goal.

### Phase 2: Explore and check comprehension (5–10 min)

If built, announce the interactive and invite exploration first. Then read
[comprehension checks](references/comprehension-checks.md) and ask **one** question
suited to the pass and domain. Do not reuse the previous session's `check_format`;
record the chosen ID in the execution log. Wait for the learner's answer, address
gaps, and re-explain those parts before moving on. Honor a request to defer or stop
without inventing demonstrated understanding.

### Phase 3: Apply (5–15 min, scaled to complexity)

Apply the topic outcome, profile constraints, and current budget before choosing:

- **Interactive HTML:** Prefer for numbers, processes, and tradeoffs, including
  distributions, ROC/calibration curves, Bayesian posteriors, adaptive testing,
  probabilistic models, cost-quality spaces, and system pipelines/routing.
  The kit also supports branching decision scenarios. Follow
  [interactives](references/interactives.md) for template selection and construction. If already
  built, guide deeper exploration of a preset or parameter combination showing
  a non-obvious insight or edge case, then discuss observations.
- **Scenario:** For decisions or system design, ask how to apply the concept to
  a realistic domain scenario; connect to actual research questions or data when possible.
- **Writing:** For framing, argumentation, or positioning, draft Related Work,
  write a hypothesis, critique a claim with counter-evidence, or strengthen a weak
  draft claim. Always consider writing in Pass 3.

Use an accessible alternative when tools or interactives are excluded,
inaccessible, or too costly for the available session.

### Phase 3b: Connection Mapping (2-5 min)

**After the application exercise, always close with connections.** This is not optional — linking new knowledge to existing knowledge is what makes it stick.

**Pass 1:** "Which 1-2 concepts you've already learned does this remind you of, support, or tension with?" Keep it lightweight. If the learner draws a blank, suggest one connection and ask if they see it. When listing previously covered concepts, use human-readable titles, not raw wikilink slugs.

**Pass 2:** "How does this concept change or strengthen your understanding of [[specific-previously-learned-concept]]?" Pick a specific concept from an earlier cluster that relates.

**Pass 3** (use the variant matching the configured `domain_mode`):
- **research:** "If you were drawing the argument map for your dissertation, where does this concept sit? What does it support, and what supports it?"
- **professional:** "If you were mapping the knowledge architecture for your team, where does this concept sit? What decisions does it inform, and what prerequisites does it need?"
- **self-study:** "If you were drawing a concept map of everything you've learned in this area, where does this sit? What supports it, and what does it enable?"

The learner should identify at least 2 upstream and 1 downstream connection.

If new connections are discovered that aren't in the concept notes, update the selected topic's concept files. Cross-topic references are allowed when useful, but do not change another topic's notes, progress, recall queue, or glossary without the learner requesting that change.

### Phase 4: Update & Log (2 min)

Read [session records](references/session-records.md) for both templates,
correction tags, and formatting. Write only observed evidence; keep unfinished
assessment distinct from success.

1. **Update roadmap**: Check off the concept in the learning roadmap
2. **Link protocol from roadmap**: Add an indented protocol link below the checked-off concept:
   ```
   - [x] [[concept-slug]]
       - [[{protocols_dir}/YYYY-MM-DD_concept-slug|protocol]]
   ```
3. **Suggest paper status update**: List all source papers referenced in this session and their current `status`. Suggest updating them to `skimmed` (Pass 1) or `read` (Pass 2/3). Wait for the learner to confirm before changing any status.
4. **Update progress summary** at the top of the roadmap
5. **Update glossary**: Add any key terms introduced during the session to the glossary (alphabetical order, with research-domain context)
6. **Schedule recall**: Add the concept to the recall queue with `interval: 3d` and `next_recall` set to today + 3 days. If the concept is already in the queue (Pass 2/3 revisit), reset its interval to 3d.
7. **Write session protocol** to `{protocols_dir}/YYYY-MM-DD_concept-slug.md` (use the session-records template)
8. **Write execution log** to `{skill_logs_dir}/YYYY-MM-DD_sessionNN.md` (use the session-records template; categorize corrections and record `check_format`)
9. **Ask**: "Want to do another concept, or is this a good stopping point?"
10. **Every five sessions**, read [session review](references/session-review.md)
    and review only this topic's logs; propose persistent adaptations for approval.


## Multi-Concept Sessions

If concepts are closely related (e.g., two from the same cluster in the same pass), they can be covered in a single session. Rules:
- Never exceed 3 concepts per session
- Depth over breadth — it's better to deeply understand 1 concept than to skim 3
- If the learner seems fatigued or distracted, wrap up early
- **Light** complexity concepts can be paired; **heavy** concepts always get a solo session

---

## Quality Bar

A session is successful when the learner can:

| Pass | Success Criterion |
|------|-------------------|
| **Pass 1** | State the core idea in one sentence and say why it matters for their research |
| **Pass 2** | Explain the mechanism AND identify how it connects to >=2 other concepts |
| **Pass 3** | Use the concept fluently in writing or argumentation without prompting |
