---
name: learner-profile
metadata:
  version: "1.0.1"
description: >
  Set up or update shared teaching preferences for guided-learning courses and
  concept-learning sessions in an installed learning vault. Use for learner
  onboarding, language, pace, background, access needs, or lasting teaching
  preferences. Does not create a course or a concept session.
---

# Shared Learner Profile

Guide setup or a targeted preference update in chat. Save reusable preferences
in the existing vault-level `learner-profile.json` and `Learner Profile.md`.
Both learning skills read the same schema; existing answers remain valid and
never require repeat onboarding just because the skills have been separated.

## Choose the flow

- For `$learner-profile`, `/learner-profile`, or a general setup request, read
  [onboarding.md](references/onboarding.md). Offer each unanswered editable field
  one question at a time, wait for the answer, accept skips and early finishing,
  and save only supplied answers merged into the existing profile. Unconfigured
  defaults are not answers. The legacy `$guided-learning onboard` and
  `/guided-learning onboard` commands forward to this same flow before any topic
  selection.
- For a targeted update, read [profile schema and saving](references/profile-schema.md),
  read the current profile, change only the requested fields, validate and save.
  Do not run a full questionnaire or ask again for
  permission the learner's scoped instruction already provides. Preserve
  unrelated answers and compatible older preferences.
- For an adjustment inferred from feedback, read
  [personalization.md](references/personalization.md). Repair the immediate
  explanation, then propose wording and scope before persisting a future rule.
  Ordinary adaptive tutoring does not require a saved preference or approval.

For every profile write, use [profile schema and saving](references/profile-schema.md)
for the complete field contract, helper commands, and verification. Reuse references
already available in context. The former guided-learning profile helper remains
compatible.

## Shared boundaries

- A course's goal, prerequisite evidence, and progress belong to its registered
  topic. A focused lesson's objective, attempts, and feedback belong to its
  `concept-sessions/<session-id>/` documents. Save only general preferences here.
- Current requests take priority, followed by approved preferences for the
  selected course or current concept session, followed by vault defaults.
  Keep course overrides active even when the global profile is unconfigured.
  Do not import the active topic's overrides into an independent concept lesson.
- Apply language, budget, interests, and functional needs to actual teaching.
  Background and stated preferences do not establish mastery or fixed learner
  types. [teaching.md](references/teaching.md) describes the common tutoring
  principles used by both learning skills.
- Full setup is optional. Either learning skill can begin with available
  context and ask only for missing information relevant to the current lesson.
  Do not turn a lesson into onboarding without a request.
- Profile writes require an installed vault. The helper refuses other
  destinations. Do not create course scaffolds, install a vault, or write learner
  data in this source repository merely to save preferences. If focused learning
  runs elsewhere, use conversation preferences until a profile destination is
  available; report any requested save that could not be made.

For example wording, read [onboarding-example.md](references/onboarding-example.md).
For the research rationale and its limits, read
[onboarding-evidence.md](references/onboarding-evidence.md). These onboarding and
teaching resources are adapted from guided-learning; the accompanying
[MIT license](LICENSE) preserves the WSE Research Group attribution.
