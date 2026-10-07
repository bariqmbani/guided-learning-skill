# Verify the activity

Validate the model before polishing its visuals. Document illustrative/synthetic
data, assumptions, simplifications, source links, units, and valid ranges. Test a
known result and a boundary case by hand. Handle zero denominators and empty
states honestly; use “undefined” with an explanation instead of inventing a
percentage. Do not imply causality from correlation, calibrated probabilities
from scores, or convergence after every additional random sample. Show rounding
only in the display and preserve calculation precision.

The supplied pages save only a light/dark preference in browser storage; no
responses or progress are sent or persisted. Keep that default. A learner
may write reflections locally, but refreshing the page can discard them; say so
when relevant. Adding storage or export requires an explicit design for what is
saved and how it is cleared. Browser interactions do not silently update a
roadmap, recall queue, profile, or session record. The tutor records only observed
work through the owning teaching workflow.

- **Teaching:** One clear outcome, focused warm-up question, meaningful contrast,
  explanation prompt, new case, and visible model limits; no placeholder text.
- **Model:** Baseline and boundary values agree with independent calculations.
  Metrics, chart, table, captions, and answers all describe the same state.
- **Behavior:** Every control works; reset restores a coherent baseline; retry
  clears stale feedback; changing a scenario/input cannot leave stale evidence.
  Playback stops at its end and pauses/resets correctly. A seeded run is repeatable.
- **Access:** Tab through the page, operate controls without a pointer, and check
  a narrow viewport and zoom. Check both themes, reduced motion, text/table alternatives,
  visible focus, meaningful labels, and feedback without color dependence.
- **Notation:** Equations render as mathematics, not as monospace code. Symbols
  in prose use `<var>`. Every highlighted term is also named in words.
- **Delivery:** Follow the build and static-check commands in [SKILL.md](../SKILL.md).
  Open the page from a different directory or offline; check console errors if
  browser tools exist. Source review alone is not browser verification.

When a tool is unavailable, record that limit and use a feasible check; do not
claim to have tested a browser or screen reader you did not use.

Open the delivery HTML directly in a browser; link to it from the lesson note.
Inlining shared assets does not make Obsidian execute scripts in notes or previews.
Additional fonts, images, data, and libraries are not bundled automatically.
