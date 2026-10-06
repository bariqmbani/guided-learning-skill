# Changelog

## [1.0.1] — 2026-10-07

### Fixed

- Link shared teaching, personalization, profile setup, research rationale, and
  course-routing references directly from the skill, with explicit read triggers.
- Make session versus vault preference handling discoverable without relying on
  an indirect link through teaching guidance. Preserve standalone lesson support
  and require an explicit request before course handoff.

## [1.0.0] — 2026-10-07

- Introduce guided, personalized single-concept sessions that work independently
  of course enrollment and reuse shared learner preferences when available.
- Teach through worked examples, fading support, self-explanation, and an
  independent check, adapting to actual learner responses and time constraints.
- Automatically maintain `note.md`, `mentor-feedback.md`, and `practice.md` in
  a separate `concept-sessions/` folder, with honest progress and assessment
  states and optional `interactive.html` or `resources.md` artifacts.
- Add a standard-library helper to create unique dated sessions and list or
  resolve existing sessions without overwriting learner work or changing courses.
- Preserve source-repository, path, and symlink boundaries, and support explicit
  course handoff without resetting existing progress.
