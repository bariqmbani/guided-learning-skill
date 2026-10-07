# Learning Interactives changelog

## [1.1.0] - 2026-10-08

- Share explanatory scene controls for object movement, transfers, and continuous
  model drawing, including interruption, speed, pause, and local motion choice.
- Start scene animation enabled, with explicit playback and an off switch for
  still checkpoints. Keep decorative UI motion responsive to device preferences.
- Group playback controls into an aligned, responsive toolbar with compact seeking
  and visible speed/movement controls; keep the moving scene and essential values beside it.
- Animate Back as well as Next, with directional model context for reverse transfers
  and the same pause/resume and speed controls in either direction.
- Add a continuous-motion template and animate process, dependency, and geometry
  templates with the same runtime. Route animation requests through focused
  motion guidance without loading it for static activities.
- Keep learner-initiated step playback available under reduced motion, with
  manual controls, pause, finite completion, and replay intact.
- Clarify that requested animation needs visible, inspectable operation-level
  motion; a stepper or changing captions alone do not provide it.
- Check playback with reduced motion both on load and after preference changes.

## [1.0.0] - 2026-10-07

- Extract the shared activity kit into an on-demand skill for course and concept lessons.
- Keep compact authoring sources separate from portable HTML delivery files.
- Provide a locale dictionary for runtime wording without translating shared JavaScript.
- Consolidate pattern selection, authoring, component contracts, and verification references.
