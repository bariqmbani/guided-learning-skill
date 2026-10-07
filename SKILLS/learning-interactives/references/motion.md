# Build an animated explanation

Read this for an animation request or a relationship that movement can clarify.
Motion must make an operation observable: what moves or changes, relative to
what, and why. A timer, changing caption, highlight, or page entrance is not
enough. Static reading and answer controls need no extra motion.

## Choose the representation

| Relationship to explain | Starting template | Visible evidence |
| --- | --- | --- |
| Positions, boundaries, ordering, a discrete procedure | [Step sequence](../templates/step-sequence.html) | Persistent objects move; a range contracts; an item enters or leaves before the result changes. |
| Flow, dependencies, messages, matter or energy transfer | [System map](../templates/system-map.html) | A marker follows the actual edge or route, then the receiving state changes. Label symbolic transfers; do not invent timing or causality. |
| Geometric construction, rearrangement, size or shape | [Geometry lab](../templates/geometry-lab.html) | Coordinates follow the construction throughout the change, on a stable scale. |
| Rotation, waves, oscillation, accumulation, evolution over time | [Motion explainer](../templates/motion-explainer.html) | A continuous model parameter drives an SVG/Canvas scene and linked readout on every frame. |
| Changes in measured or simulated data | [Motion explainer](../templates/motion-explainer.html) for playback; [parameter explorer](../templates/parameter-explorer.html) for input comparisons | Model tweens drive a persistent drawing during playback. The shared chart has short discrete pointer transitions, not scene playback. Do not imply observations between discrete samples. |

These are reusable mechanisms, not a list of supported subjects. Combine them
when necessary. Keep physical motion faithful to the model: a rotating point
follows an arc, diffusion is not a directed stream, and historical sequences do
not establish causality merely because an arrow connects them.

## Plan the explanation before drawing

1. Write the learner's question and the one relationship the motion reveals.
2. For a discrete process, map each teaching operation to **before → visible
   action → after → reason** in a short source comment. For each operation,
   name the moving entity and the scene primitive that shows it. A change in
   membership or quantity needs the item/amount visibly entering or leaving,
   not only a moving boundary or a new caption. Combine `transfer`, `to`, and
   `tween` as the operations require; copying one template effect for the whole
   explanation is insufficient. For a continuous process, define the model parameter,
   units, path, invariant, and useful inspection checkpoints. Choose the simplest
   valid model for the question and apply its stated approximations consistently.
3. Keep entities identifiable across frames and connect the changing visual to
   the equation, count, or explanation. Name entering/leaving/changed parts in
   words as well as color. Distinguish values being computed from completed
   results. Derive quantities and equations from that same state: after a
   removal, show the remaining quantity before moving on to another operation.
   Do not maintain separate hardcoded captions and totals that can disagree.
   Never fabricate intermediate model states by interpolating labels.

## Reuse the scene, own the model

Read `createScene` and `mountStepper` in [COMPONENTS.md](../COMPONENTS.md).
Use `LearningUI.createScene` for pose changes (`to`), transfers (`transfer`),
or model parameters (`tween`); give that scene to `mountStepper` for playback.
Adapt the chosen template's working controls and drawing. Do not duplicate
timers, animation loops, reduced-motion detection, or pause/resume logic.
Preserve its `.scene-toolbar` player controls while translating the labels; customize
the model and scene rather than rebuilding the toolbar. Back and Next animate
between checkpoints, completing the outgoing operation before changing steps.
Use the render context's `fromIndex` and `direction` to derive the transition:
Back reverses the operation being left toward the earlier checkpoint; it must
not replay that earlier checkpoint's forward transfer. Derive entering/leaving
items and live values from these two states. Reset and scrubbing settle immediately.

Retain scene elements across frames. Prefer transform/opacity for object motion;
use a numeric model tween when SVG geometry or Canvas drawing must change.
Physical constant-rate motion uses linear model time. Playback speed changes
viewing time, never the underlying model or its answer. Direct dragging/sliders
follow the learner immediately; discrete preset changes can animate.

Compose one compact observation area: the moving scene, the quantity needed to
understand that movement, and a short operation label. Put that evidence inside
`.motion-scene`, before the toolbar; put full explanations and secondary model
diagnostics after the toolbar. Preserve its transport group, seek row, and
visible speed and movement controls. At 320×568, budget about 420 px for the observation
area, leaving room for the primary buttons. Check the longest caption during
motion, not just the initial state. If it does not fit, simplify the composition
and move secondary detail below; do not crop content, hide essential evidence,
or shrink labels below 12 rendered px. This is a composition budget, not a fixed
CSS height. HTML labels are often clearer than shrinking SVG text. Preserve
coordinate scale; add a labeled close-up or linked readout if the important
change becomes too small to inspect. A phone user must see the operation and
its evidence while operating the controls. Offer a finite replayable example,
not an endless decorative loop.
Start on request, pause when the tab hides, and keep keyboard actions equivalent.
Use shared theme tokens for fills, strokes, and tracks. Check essential graphic
contrast against its actual background (at least 3:1) and text (4.5:1) in both
themes; custom colors need the same checks. For animated quantities, reuse
`.bar-track` / `.bar-fill` with a left transform origin and model-driven scale.

Scene animation starts **on**, with a clearly labeled `[data-motion]` checkbox
to turn it off and inspect still checkpoints. Keep Play enabled in either
mode; neither the checkbox nor the page load starts playback. The scene choice
is local, independent of the device preference for decorative motion. Include
an accurate summary/table in the HTML that works without JavaScript, and do not
announce every animation frame.

## Prove the motion works

Check every operation's intermediate values as well as the final result at a
known value and boundary. Then observe a frame between
start and end. Verify the actual object/path/geometry changes and the readout
agrees with that frame. Check intermediate motion in both directions, including
reverse transfers and continuous paths. Pause mid-motion, resume, change speed,
interrupt with Back/Next, scrub, reset, and replay. Test both system motion preferences: scenes
start enabled, can be turned off, and can be re-enabled. Test a narrow viewport
with long labels.
For cyclic or piecewise models, independently check position and direction at
every checkpoint, continuity immediately before/after each join, and return to
the initial position and direction after a full cycle. A conserved total alone
does not prove the path correct. These model checks do not require a browser.
An animation API in source or two different endpoint screenshots is not proof
of visible motion. Report unavailable browser checks honestly.
