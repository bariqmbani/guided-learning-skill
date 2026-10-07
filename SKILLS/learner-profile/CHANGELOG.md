# Changelog

## [1.0.1] — 2026-10-07

### Changed — Instruction organization

- Separate profile fields, validation, and saving into an on-demand schema reference so targeted updates do not load the onboarding questionnaire.
- Preserve all nine optional onboarding invitations, the existing profile schema, saved preferences, and compatibility helper entry points.

## [1.0.0] — 2026-10-07

### Added

- Dedicated `learner-profile` skill for shared preferences used by guided-learning
  courses and concept-learning sessions.
- Conversational setup that offers optional fields one question at a time,
  accepts skips and early completion, and supports targeted updates.
- Canonical onboarding, personalization, and common tutoring references, with
  course goals and focused-session objectives kept outside the global profile.

### Compatibility

- Preserve the existing `learner-profile.json` schema and `Learner Profile.md`
  output. Existing answers, legacy presentation preferences, and approved topic
  overrides remain valid; no repeat onboarding is required.
- Keep `guided-learning onboard` as an alias and the previous profile helper
  path as a CLI and Python API compatibility entry point.
- Setup remains optional for either learning workflow. Profile writes require an
  installed vault and do not create courses, concept sessions, or learning progress.

The shared resources retain the upstream WSE Research Group MIT attribution in
[LICENSE](LICENSE).
