# Adapt an activity

Use an inviting question as the title and a short statement of purpose beneath
it. Put controls near the evidence they change. Make the first view usable with
sensible defaults; do not begin with an empty chart or a wall of instructions.
Reveal optional detail with native `<details>` rather than forcing everyone
through it. Keep a small number of important controls visible; add an advanced
section only when the concept needs it.

The recommended sequence is **warm up → explore → explain → transfer**. This is
the kit's instructional design choice informed by [research evidence](evidence.md), not a
validated universal sequence. Accept spoken or chat answers; an on-page
textarea is optional. Do not force an answer before enabling exploration unless
the actual lesson requires it. Ask for a new-case explanation after exploration
instead of treating a correct multiple-choice answer as permanent mastery.

Use **Warm up** for the opening question, **Test your knowledge** for concept
checks, and **Check answer** when a submit button checks correctness. Use
**Submit answer** for an ungraded warm-up response, **Your answer** for its
recorded label, and **Answer again** to retry. Keep questions concrete: ask what
changes, which step comes next, or which choice fits the case.

For beginners, offer one clearly named contrast and a hint. For experienced
learners, expose a boundary case or competing explanation. Use the learner's
language and relevant domain without inventing facts about their background.
Do not duplicate the tutor's entire lesson inside the page.

## What to edit and what to reuse

Each template marks lesson markup with `<!-- EDIT: ... -->` and model code with
`// EDIT: ...` / `// END EDIT`. Search for `EDIT` to find starting points, then read
the rest of the short script: domain labels and checks must stay consistent.

| Change together | Preserve unless the task requires an extension |
| --- | --- |
| Page title, purpose, language, warm-up question, exploration, explanation, transfer | Semantic landmarks, skip link, heading order, mobile layout, focus styles |
| Input names, units, bounds, defaults, presets, validation | Native controls, label associations, output associations |
| Model calculations or states and display rounding | Shared component implementation in `interactive.js` |
| Axis labels/domains, legend, numerical/text alternative | Chart fallback table and clear series labels |
| Correct answers, distractor feedback, assumptions, sources | Retry/reset behavior and honest feedback language |
| Static initial example and `<noscript>` explanation | A useful non-JavaScript fallback |

Keep the model separate from rendering: calculate from current state, then update
the view. Derive charts, metrics, and tables from the same results. Update existing
controls rather than replacing their containing DOM on each input; replacing a
focused control can disrupt keyboard use. Insert learner-supplied text with
`textContent`, never concatenate it into `innerHTML`.

## Preserve local customizations

New topics receive the vault's local CSS, JavaScript runtime, and `build.py`.
Inspect the pinned assets before scaffolding. If local customizations cause an
asset conflict, preserve them: copy the chosen local template to a new `.source.html`
filename, use adjacent `interactive.css` and `interactive.js` references, and
adapt its component calls to those local assets. Add lesson-specific styling in
a separate `<style>` block. Build that source into its delivery `.html` and check the result. Never replace existing pages or shared customizations to make
scaffolding succeed.

## Language and extensions

Translate the lesson prose and configure runtime strings through
[localization](localization.md). Do not copy or translate the runtime itself.
For specialized models, use the extension guidance in [patterns](patterns.md).
Use [COMPONENTS.md](../COMPONENTS.md) for shared markup, styling, and motion contracts.
