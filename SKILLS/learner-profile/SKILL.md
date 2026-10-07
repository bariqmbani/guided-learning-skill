---
name: learner-profile
metadata:
  version: "1.0.2"
description: >
  Set up or update shared teaching preferences for guided-learning courses and
  concept-learning sessions in an installed learning vault. Use for learner
  onboarding, language, pace, background, access needs, or lasting teaching
  preferences. Does not create a course or a concept session.
---

# Shared Learner Profile

Set up or update general preferences shared by both teaching skills. Save only
`learner-profile.json` and `Learner Profile.md` in an installed vault.

## Choose one flow

| Request | Read and follow |
| --- | --- |
| `$learner-profile`, `/learner-profile`, or general setup | [Onboarding](references/onboarding.md): offer all unanswered fields, accepting skips and early finish. |
| Targeted update | [Schema and saving](references/profile-schema.md): merge only requested changes; no questionnaire or redundant approval. |
| Ongoing preference inferred from feedback | [Personalization](references/personalization.md): repair the current explanation, then obtain wording/scope approval before saving. |

Read only the selected flow and its required references. Reuse guidance already
in context. Onboarding reads the schema when validating or saving; the schema
never starts another workflow. Examples and evidence are optional: read
[example wording](references/onboarding-example.md) only when requested or needed
to clarify a question, and [research rationale](references/onboarding-evidence.md)
only to explain the evidence or its limits. Ordinary setup needs neither.

## Boundaries

- Setup is optional; do not turn a lesson into onboarding without a request.
- Save general preferences here. Course goals/progress belong to the selected
  topic; focused objectives/attempts belong to its concept-session note.
- Current requests override approved topic/session preferences, then vault
  defaults. Topic overrides apply even with an unconfigured global profile;
  independent concept lessons never inherit the active course's preferences.
- Preserve existing answers, language, and access needs. Background and preferred
  styles are context, not evidence of mastery or fixed learner types.
- Do not install a vault, create a course/session, or write learner data in this
  checkout to save preferences. Outside an installed vault, use conversation
  preferences and report any requested save that cannot be made.

The shared resources retain the WSE Research Group attribution in [LICENSE](LICENSE).
