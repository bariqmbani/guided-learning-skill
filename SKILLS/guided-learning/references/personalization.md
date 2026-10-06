# Personalization from Learner Feedback

Use this when feedback, a correction, or a recurring difficulty suggests a lasting
change to how lessons should be taught. Propose useful adjustments proactively;
**ask before saving or adopting a new ongoing preference inferred from feedback**.
Answer the immediate request and repair an incomplete explanation without waiting
for permission to do what the learner already requested.

## Read the relevant preferences

Read the vault profile with `python3 SKILLS/guided-learning/scripts/profile.py show`.
When a topic is selected, resolve and pin its ID using `references/topic-routing.md`
and read its registered `{roadmap}`, including any **Teaching preferences** section.
This section may be absent in an existing course; that means no topic overrides.
Do not create a topic just to record a preference.

Apply current explicit requests first, then approved topic teaching preferences,
then vault defaults. Topic preferences apply even if the vault profile is still
unconfigured. Preserve the topic's learning goals and progress. A new vault
default does not silently replace an existing topic override; mention a relevant
conflict when proposing the change. Keep saved accommodations in view.

## Repair, propose, and wait

1. **Respond to the actual feedback.** Briefly acknowledge a teaching omission and
   supply the missing context or explanation. If the original input is unavailable,
   recover it or say so; never invent it to make an existing table look correct.
   Do not classify the tutor's missing explanation as a learner knowledge gap.
2. **Form a concrete preference.** Describe an observable teaching behavior, such
   as showing the full example before deriving counts. Avoid inferred personality,
   ability, or fixed learning-style labels. Check whether an approved preference
   already covers the behavior; if so, acknowledge the lapse and follow it.
3. **Propose the wording and scope in chat.** Explain how the next lesson would
   change. Offer the current topic, all topics in this vault, both when useful,
   or no saved change. A topic recommendation should remain topic-specific;
   generalize a vault proposal so it makes sense for unrelated subjects too.
4. **Wait for an explicit choice.** A complaint, silence, or agreement that an
   explanation was incomplete does not approve a saved preference. If "yes"
   leaves the scope ambiguous, ask only which scope. "Just this time" applies to
   the current explanation and is not saved. Respect a decline without repeated
   proposals. A direct instruction with clear wording and scope, such as "Always
   do that for this topic; save it", already supplies approval—do not ask again.
5. **Save only the approved change.** Use the storage rules below. Summarize what
   was saved and its scope after verifying the write. If the learner changes or
   removes a preference later, update that specific rule and preserve others.

Normal pacing, corrective feedback, and choosing examples within approved
preferences remain part of tutoring. A new lasting rule, profile value, or topic
override needs the learner's approval. Do not turn every teaching choice into a
permission question or make saving a preference a condition of continuing.

## Example: show the input before the calculation

Learner: "Why didn't you provide the full sentence earlier?"

First show the actual training sentence and explain the missing first step. Then
offer the following, adjusting wording to the current course:

> For this tokenization topic, I suggest: "Show the full training text, then word
> counts, pair counts, and merges, explaining each step."
>
> For all topics in the vault, I suggest: "Start worked examples with the original
> input or context before showing derived tables, calculations, or conclusions."
>
> Would you like me to save the topic rule, the vault rule, both, or neither?

Wait for the answer. Do not promise to use a new ongoing rule or persist either
proposal before that choice. The immediate repair belongs to this explanation;
the proposed preferences govern future lessons only if approved.

## Storage and updates

**Vault scope:** Start from the current complete profile. Map an approved change
to an existing field when it fits: `language`, `session_minutes`,
`explanation_style`, or `preferred_extras`, for example. Merge free-text teaching
rules into `preferences`, keeping unrelated rules and all unanswered fields.
Read `references/onboarding.md` for valid values; never add ad hoc schema fields.
Save with `profile.py save --input <temporary-json>` using a structured file write,
verify the result, and remove the temporary input. This updates only
`learner-profile.json` and `Learner Profile.md`.

**Topic scope:** Add or edit a small `## Teaching preferences` section in the
selected topic's registered `{roadmap}`. Store concise approved instructions as
labeled bullets, for example `- Explanation sequence: Show the full training text
before word counts, pair counts, and merges.` Language, session budget, or activity
overrides can be recorded the same way. Use the registered path for legacy courses
too. Preserve the rest of the roadmap, including its learning plan and every
checkbox. Do not write the vault profile or another topic's files.

**Both:** Apply only the wording approved for each scope; do not copy a
topic-specific sequence into the vault-wide profile as a universal rule.

For removals, explain that removing a topic override reveals the vault default;
removing a vault preference leaves explicit topic overrides in place. Ask about
both only when the request is ambiguous. Never reset an entire profile or roadmap.

Keep proposed changes in the conversation until approved. Session journals may
record actual feedback and immediate repairs, but distinguish them from approved
future preferences. Do not write personal adaptations into shared `SKILL.md`,
`PEDAGOGY.md`, or the skill's `CHANGELOG.md`. Recall dates, mastery, and course
progress are independent of preference changes.
