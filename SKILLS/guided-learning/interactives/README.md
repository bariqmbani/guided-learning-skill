# Interactive learning kit

Build a focused learning activity by adapting a working template. The kit uses
HTML, shared CSS, classic JavaScript, and a Python 3.9+ builder. It has no package
manager, framework, CDN, account, or network requirement. Open [the catalog](index.html)
in a browser to try the examples before choosing one.

This directory contains reusable source assets, not learner records. In an
installed vault, the same kit is available at `learning/interactives/`. Save course
activities in the selected topic's registered `interactives_dir`; a focused
concept lesson can use its own workspace's session directory. Never create
learner lessons in this source checkout.

Installation is a one-time copy. The vault uses its own local kit and stays
independent of this repository; creating lessons requires no remote connection.

## Start here

1. State what the learner should be able to explain or do afterward. Identify one
   misconception or open question the interaction will explore.
2. Choose a template from the table below. Read only that template and the
   relevant component contract; there is no need to load every example.
3. Scaffold into the learner's workspace, edit its marked lesson/model sections,
   rebuild, and verify it. Keep the working interaction shell.
4. Ask a warm-up question, explore one contrast, ask for an explanation, then try a
   new case. The page supports the conversation; operating a slider is not
   evidence that the learner understands its model.

From an installed vault, using its configured Python interpreter:

```sh
python3 SKILLS/guided-learning/interactives/scaffold.py parameter-explorer /absolute/path/to/topic/learning/interactives/YYYY-MM-DD_linear-change.html
```

PowerShell example:

```powershell
& 'C:\path\to\python.exe' 'SKILLS/guided-learning/interactives/scaffold.py' parameter-explorer 'C:\Learning\My Vault\topics\algebra\learning\interactives\YYYY-MM-DD_linear-change.html'
```

Replace the destination and date with the pinned workspace path and today's
date. The scaffolder creates a standalone HTML page, supplies missing shared
assets beside it, and refuses to overwrite the destination or conflicting
assets. For a topic with customized assets, follow **Local assets and
customizations** below.

Edit the generated page's `EDIT` sections. Leave the marked shared CSS/JS blocks
alone; their next build replaces them. Rebuild after changes to shared assets:

```sh
python3 /absolute/path/to/topic/learning/interactives/build.py YYYY-MM-DD_linear-change.html
```

Filenames are relative to the builder's directory, regardless of the current
shell directory. With no filenames, it processes adjacent `*.html` files. Check
the command's exit status, then open the resulting HTML in a browser. A successful
build is not a test of the lesson's mathematics or behavior.

## Choose the interaction that answers the question

These are practical authoring families, not measured rankings of learner demand.
Use a text explanation, table, or static diagram when changing or stepping through
something would not reveal useful information.

| Learner need | Start with | Included example | Adaptation contract |
| --- | --- | --- | --- |
| “What happens if I change this?” | [Parameter explorer](templates/parameter-explorer.html) | Slope and intercept in `y = mx + b` | Change the equation, control bounds, output units, chart domains, and warm-up question together. |
| “Show me how it works, one step at a time.” | [Step sequence](templates/step-sequence.html) | Binary search through a sorted list | Supply a finite sequence of states with an action, visible state, and explanation for every transition. |
| “When would I choose A over B?” | [Comparison](templates/comparison.html) | Simple and compound growth | Keep inputs and axes shared; change the two models, assumptions, and comparison question. |
| “Why are results different each time?” | [Probability lab](templates/probability-lab.html) | Seeded coin trials and running frequency | Replace the generator and statistic; define the seed, sample limit, theoretical target, and restart behavior. |
| “What should I do next, and why?” | [Decision scenario](templates/decision-scenario.html) | Investigating a missing user name | Replace the scenario states, choices, consequences, and explanation prompts; keep routes reachable and restartable. |

The [precision and recall example](example-interactive.html) remains a domain
example. The five templates are complete activities, not empty mockups: preserve
their working behaviors while replacing their teaching content.

Useful extensions need not introduce another framework:

| Requested activity | Recipe using the kit | Essential additional care |
| --- | --- | --- |
| Algebra, geometry, physics, supply/demand, sensitivity analysis | Parameter explorer + labeled SVG + numeric summary | State constraints, units, and what is held constant; keep scale changes explicit. |
| Sorting, recursion, protocols, cellular processes, historical sequences | Step sequence + state table or ordered list | Distinguish simulated time from playback speed; expose state and the reason for each change. |
| Bayesian updates, sampling, queues, reliability | Probability lab + parameter controls or step sequence | Validate distributions and independence assumptions; a seed is reproducibility, not proof of realism. |
| Models, policies, architectures, grammatical constructions | Comparison + common input + visible comparison criteria | Avoid arbitrary “winner” scores; explain tradeoffs and what the example omits. |
| Debugging, case reasoning, argument critique, language choices | Decision scenario + explanatory feedback | Multiple answers can be defensible; explain criteria and consequences rather than claiming universal correctness. |
| Classification, matching, retrieval, vocabulary | Radio/select controls + question feedback + new-case prompt | Provide rationale and retry; for free text let the tutor assess reasoning, not keyword matching. |
| Pipelines, networks, causal maps | Step sequence or node-selection buttons + SVG + adjacency table | Give a linear/text route through the graph; distinguish association from causal claims. |
| Spatial construction or rearranging items | Native selects/buttons to choose and move an item; optional drag enhancement | Every drag action needs an equivalent keyboard/click action. Avoid drag-only assessment. |
| Real data exploration | Parameter/comparison shell + documented embedded data | Name the source, units, missing-data treatment, and limits; do not silently upload learner data. |

Complex 3D, specialized numerical solvers, or large datasets may justify an
additional library. First identify the capability the native kit lacks. Prefer
one local, pinned dependency with its license and an offline bundle; test its
keyboard/text alternative and startup cost. Do not add a UI framework just to
obtain buttons, tabs, cards, or sliders. A simple diagram or table may be the
better representation.

## Design the learning activity

Write this brief before coding; it is also a compact handoff to a helper agent:

```text
Outcome: After exploring, the learner can ...
Prerequisites and likely misconception: ...
Pattern and template: ...
Model: equation/state transitions/data, units, assumptions, valid bounds, source
Learner choices: inputs they may change; what remains fixed
Evidence: visual change plus equivalent text/table; meaningful edge case
Warm up: one question to invite an initial answer before manipulating the model
Explore: two contrasting settings or paths, with a reset baseline
Explain: ask for the mechanism behind the observation
Transfer: a new input or context that requires the same idea
Constraints: language, access needs, time, device, offline requirements
Paths: pinned output, CSS, JS (if used), Python builder
Verification: known result, extremes, reset/retry, keyboard, narrow viewport
```

Use an inviting question as the title and a short statement of purpose beneath
it. Put controls near the evidence they change. Make the first view usable with
sensible defaults; do not begin with an empty chart or a wall of instructions.
Reveal optional detail with native `<details>` rather than forcing everyone
through it. Keep a small number of important controls visible; add an advanced
section only when the concept needs it.

The recommended sequence is **warm up → explore → explain → transfer**. This is
the kit's instructional design choice informed by the evidence below, not a
validated universal sequence. Accept spoken or chat answers; an on-page
textarea is optional. Do not force an answer before enabling exploration unless
the actual lesson requires it. Ask for a new-case explanation after exploration
instead of treating a correct multiple-choice answer as permanent mastery.

Use **Warm up** for the opening question, **Test your knowledge** for concept
checks, and **Check answer** for a submit button. Keep questions concrete: ask
what changes, which step comes next, or which choice fits the case.

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

## Shared components and recipes

Include the runtime **before** the lesson script. Source templates use relative
paths to shared assets; generated topic pages use adjacent files. The builder
replaces these references with marked inline blocks for portability:

```html
<link rel="stylesheet" href="interactive.css">
<!-- Page-specific styles belong in a separate style element. -->
<!-- Put one announcer inside the body, before the scripts. -->
<p class="sr-only" data-announcer aria-live="polite" aria-atomic="true"></p>
<script src="interactive.js"></script>
<script>
  // Page model and component setup go here, after the relevant HTML.
</script>
```

Use one `LearningUI` global; no module loader is needed. Build-time markers are
`<!-- interactive.css:start -->` / `<!-- interactive.css:end -->` and equivalent
`interactive.js` markers. Rebuilding replaces marked blocks idempotently and
preserves page-specific code. Only shared CSS and optional shared JS are inlined;
external images, fonts, data files, or new libraries are not automatically bundled.

### Labeled range and output

```html
<label for="rate">Growth per round</label>
<input id="rate" type="range" min="0" max="20" step="1" value="5">
<output id="rate-value" for="rate">5%</output>
<p id="rate-help">The initial amount stays fixed.</p>
```

```js
const rateInput = document.querySelector('#rate');
rateInput.setAttribute('aria-describedby', 'rate-help');
const rate = LearningUI.bindRange(rateInput, document.querySelector('#rate-value'), {
  format: value => `${value}%`,
  onInput: value => render(value),
  onChange: value => LearningUI.announce(`Growth set to ${value}%`)
});
render(rate.get());
// Preset button: rate.set(10); Reset button: rate.reset();
```

`get()` returns the numeric value. `set(number, {notify: true})` updates it;
`notify: false` is useful when setting several inputs before one combined render.
Initialization updates the output without calling `onInput`; explicitly render
the model once afterward. `set()` invokes `onInput` by default, but `onChange`
runs only for a native user change. The native range enforces its bounds and
step. `reset()` restores the initial value. Keep a readable value next to the input and
use a select/number input instead when exact entry is important. Use `onInput`
for visual updates and `onChange` for a concise spoken result; do not announce
every point during a continuous drag.

### Finite step playback

```html
<section id="trace" aria-label="Worked trace">
  <p data-position></p>
  <p id="trace-explanation" data-step-summary></p>
  <div class="btn-row">
    <button type="button" class="btn btn-secondary" data-back>Back</button>
    <button type="button" class="btn" data-next>Next step</button>
    <button type="button" class="btn btn-secondary" data-play>Play</button>
    <button type="button" class="btn btn-secondary" data-reset>Reset</button>
  </div>
</section>
```

```js
const states = ['Start at the input.', 'Apply the operation.', 'Inspect the result.'];
const trace = LearningUI.mountStepper(document.querySelector('#trace'), {
  count: states.length,
  interval: 900,
  render: index => {
    document.querySelector('#trace-explanation').textContent = states[index];
  }
});
// trace.go(1); trace.pause(); trace.reset(); trace.destroy();
```

Indices start at zero; `interval` is milliseconds between steps, not model time,
and must be at least 200. Playback starts only on request, pauses in a hidden tab,
and stops at the last step. `data-speed` is an optional multiplier select (for
example `0.5`, `1`, `2`); copy its markup from the step-sequence template.
With reduced motion enabled, Play is disabled and Back/Next remain usable.
`data-step-summary` supplies meaning for the announcement after a manual step.
Call `destroy()` before removing or
replacing a mounted component. Do not use infinite autoplay to demonstrate an
algorithm that has a finite trace.

### Question with explanatory feedback

```html
<form id="check">
  <fieldset>
    <legend>With y = 2x, what happens to y when x doubles?</legend>
    <label><input type="radio" name="answer" value="double"> It doubles</label>
    <label><input type="radio" name="answer" value="same"> It stays the same</label>
  </fieldset>
  <button class="btn" type="submit" data-check>Check answer</button>
  <button class="btn btn-secondary" type="button" data-retry>Try again</button>
  <p data-feedback role="status"></p>
</form>
```

```js
const check = LearningUI.mountQuestion(document.querySelector('#check'), {
  correct: 'double',
  feedback: {
    double: 'Yes. Multiplying x by 2 also multiplies 2x by 2.',
    same: 'Hold the multiplier at 2: compare x = 3 and x = 6, then try again.'
  }
});
// check.reset();
```

Scope one radio group to each question form and use unique group names if multiple
questions share a page. Missing selection must produce a helpful prompt. Feedback
should explain the choice, suggest an action when wrong, and allow retry. This
component checks one selected value; use scenario branches or tutor discussion
for open-ended reasoning, partial credit, and genuinely multiple valid answers.

### Chart with data alternative

```html
<div id="growth-chart"></div>
<p id="growth-summary">Doubling x doubles y in this example.</p>
```

```js
LearningUI.renderChart(document.querySelector('#growth-chart'), {
  series: [{label: 'y = 2x', points: [{x: 0, y: 0}, {x: 1, y: 2}, {x: 2, y: 4}]}],
  xLabel: 'Input x', yLabel: 'Output y',
  xDomain: [0, 2], yDomain: [0, 4],
  formatX: value => String(value), formatY: value => String(value)
});
```

The renderer accepts one to four nonempty series and supplies an SVG with
distinct line patterns/markers, a legend, and a data table in a details
disclosure. It redraws for container resizing. Supply a separate short interpretation tied to the current state;
table values alone do not explain the relationship. Domains and formatters are
optional. Explicit domains must contain two increasing finite numbers. Use fixed
domains when comparisons require a shared scale, and label any intentional
change of scale. Points outside the domain are clipped visually while remaining
in the table; explain clipping when it matters. Supply finite numeric points in meaningful order.
This is a small line-chart renderer, not a statistical package: calculate and
validate uncertainty, bins, or transformations in the model before rendering.

`LearningUI.announce(message)` sends a short, debounced polite announcement to
the page's `[data-announcer]` element; without that element it does nothing.
Use it for completed runs, reset, or meaningful changed results. Keep visible
text as well; do not rely on a live region as the only explanation.

The runtime's generated control labels, announcements, and feedback prefixes
currently use English. Translating only the template prose does not translate
those strings. For another teaching language, translate a lesson-local runtime
copy and inline that copy in place of the shared runtime, in its own unmarked
script block. Remove the original shared script/reference so it is not loaded
twice; keep the translated source for future edits. The builder preserves
unmarked lesson code. Translate visible and spoken strings together and verify
the full interaction; do not overwrite the canonical kit for a learner's language.

### Layout and styling

Reuse `interactive.css` before adding local rules. Its layout and surface
classes include `.container`, `.layout`, `.two-col`, `.panel`, `.card`,
`.notice`, `.control-group`, `.btn`, `.btn-secondary`, `.btn-row`, `.preset-row`,
`.formula`, and `.explain`. Copy lesson shell, chart, stepper, and feedback
markup from the working templates rather than reconstructing it from memory.
Use the shared color and spacing variables. Give colors redundant text labels
or distinct line styles; red/green alone must not encode correctness.

Default to one page with visible sections. Tabs cost keyboard/focus/state logic;
use them only when separating genuinely different views helps. A custom tab UI
must implement its full keyboard and focus behavior. If later views use earlier
inputs, label the source view, show a live input summary, and state the dependency
in every dependent view. Do not hide data provenance behind navigation.

## Motion, access, and correctness

Animate a meaningful change: which item moved, which step changed state, or how
a quantity evolves. Prefer short transitions and explicit finite playback. Never
animate an unrelated decoration, flash a success banner, or run a timer that
grades response speed. Respect `prefers-reduced-motion` in both CSS and scripted
playback; the same result must remain available through immediate updates or
manual steps. If adding custom timers, stop them on reset and when the page is
hidden. A Pause button must actually stop progression.

Use native `<button>`, `<input>`, `<select>`, `<fieldset>/<legend>`, and
`<details>/<summary>`. Pair each input with a visible label, provide units and
help text, retain focus outlines, and keep visual and reading order aligned.
Prefer ordinary checkboxes over custom switches. If styling a checkbox track,
make the clickable visual a `<label for="id">`; scope row-label CSS to direct
children so nested labels do not inherit unrelated layout rules.

Support keyboard operation, touch, narrow screens, and browser zoom. Aim for
generous targets around 44 CSS pixels as a kit design preference; WCAG 2.2's AA
minimum target criterion is 24 pixels with specified exceptions. Allow text to
wrap. Give wide tables their own scroll container instead of making the entire
page overflow. A chart needs a name, a current-state explanation, and a useful
table/text alternative. Canvas and SVG are representations, not automatic
accessibility guarantees. Check assistive technology behavior when available;
do not describe an unchecked page as WCAG compliant.

Validate the model before polishing its visuals. Document illustrative/synthetic
data, assumptions, simplifications, source links, units, and valid ranges. Test a
known result and a boundary case by hand. Handle zero denominators and empty
states honestly; use “undefined” with an explanation instead of inventing a
percentage. Do not imply causality from correlation, calibrated probabilities
from scores, or convergence after every additional random sample. Show rounding
only in the display and preserve calculation precision.

The supplied pages do not send or persist responses. Keep that default. A learner
may write reflections locally, but refreshing the page can discard them; say so
when relevant. Adding storage or export requires an explicit design for what is
saved and how it is cleared. Browser interactions do not silently update a
roadmap, recall queue, profile, or session record. The tutor records only observed
work through the owning teaching workflow.

## Local assets and customizations

New topics receive the vault's local CSS, JavaScript runtime, and `build.py`.
Inspect the pinned assets before scaffolding. If local customizations cause an
asset conflict, preserve them: copy the chosen local template to a new lesson
filename, use adjacent `interactive.css` and `interactive.js` references, and
adapt its component calls to those local assets. Add lesson-specific styling in
a separate `<style>` block. Then run the topic's builder for that filename and
check the result. Never replace existing pages or shared customizations to make
scaffolding succeed.

## Open the activity

Open the completed `.html` directly in a browser, or use an available browser
preview. Inlining removes adjacent-asset dependencies; it does not make Obsidian
execute arbitrary scripts in notes or HTML previews. Link to the HTML from the
lesson note and explain that it opens in a browser. No local server should be
needed for supplied templates; if an extension uses network fetches/modules,
reconsider whether it still meets the offline standalone requirement.

## Verify before handing it to the learner

- **Teaching:** One clear outcome, focused warm-up question, meaningful contrast,
  explanation prompt, new case, and visible model limits; no placeholder text.
- **Model:** Baseline and boundary values agree with independent calculations.
  Metrics, chart, table, captions, and answers all describe the same state.
- **Behavior:** Every control works; reset restores a coherent baseline; retry
  clears stale feedback; changing a scenario/input cannot leave stale evidence.
  Playback stops at its end and pauses/resets correctly. A seeded run is repeatable.
- **Access:** Tab through the page, operate controls without a pointer, and check
  a narrow viewport and zoom. Verify reduced motion, text/table alternatives,
  visible focus, meaningful labels, and feedback without color dependence.
- **Delivery:** Run the selected Python builder and check its exit status. Open
  the built page from a different directory or offline; check console errors if
  browser tools exist. Source review alone is not browser verification.

When a tool is unavailable, record that limit and use a feasible check; do not
claim to have tested a browser or screen reader you did not use. The main tutor
is responsible for the final build and review even when another agent creates
the page. Use background work only if the host supports it. Do not promise that
a build will finish before the learner answers; continue useful explanation and
provide the page when it is actually ready.

## Evidence and maintenance

The research rationale and direct bibliography are in
`SKILLS/guided-learning/references/interactive-evidence.md` at the vault/repository
root. PhET's simulation-design research informs bounded exploration, learner-paced
multimedia research informs manual step controls, and retrieval research informs
the explanation/transfer prompt. These sources support design principles; they
do not validate this exact kit, its taxonomy, or individual generated lessons.

For development in the setup repository, change canonical assets here and update
the installer allowlist/tests for new files. Run
`python3 -m unittest discover -s tests -v` after helper or installer changes and
verify that generated vaults contain reusable examples but no learner topics,
concept sessions, roadmaps, recall entries, or journals. Preserve the repository
license and attribution.

For repository development, an optional browser smoke test is available as
`node tests/interactive_browser_smoke.cjs`. It needs Playwright and a browser in
the development environment, not in an installed vault or a learner's page.
`LEARNING_PLAYWRIGHT_PATH` can point to an existing Playwright module and
`LEARNING_BROWSER_EXECUTABLE` can select an existing browser executable. The
test exercises standalone/offline pages, narrow layouts, model controls, reset,
playback, and reduced motion. Keep this separate from the standard-library Python
test suite; a missing optional browser tool does not make the kit depend on npm.
