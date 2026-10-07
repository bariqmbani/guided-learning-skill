# Component reference

Every helper in `interactive.js`, every class in `interactive.css`, and the
markup each one expects. Copy a block, change its content, and check the result
in a browser. Read [README.md](README.md) first for choosing a pattern and for
the verification checklist; this file is the API, not the method.

Load the runtime before the lesson script, and put one announcer in the body:

```html
<link rel="stylesheet" href="interactive.css">
<p class="sr-only" data-announcer role="status" aria-live="polite" aria-atomic="true"></p>
<script src="interactive.js"></script>
<script>
  (() => {
    'use strict';
    const $ = id => document.getElementById(id);
    const { fmt, math, motion } = LearningUI;
    // lesson model and component setup
  })();
</script>
```

Contents: [utilities](#utilities) · [controls](#controls) · [sequence](#sequence)
· [questions and practice](#questions-and-practice) · [mathematics](#mathematics)
· [drawing](#drawing) · [figures](#figures) · [layout classes](#layout-classes)
· [design tokens](#design-tokens) · [motion](#motion)

Components throw on a contract violation, so a mistake surfaces while you write
the lesson rather than while a learner uses it. Call each lesson component once,
after its markup exists. The shared theme button is the exception: the runtime
adds it to the first `.lesson-header` or `.header` automatically.

---

## Utilities

```js
LearningUI.clamp(value, low, high)   // bound a number
LearningUI.lerp(from, to, t)         // interpolate, t from 0 to 1
LearningUI.round(value, places)      // round for display only
```

### Number formatting

Keep full precision in the model and round only when displaying. Negative
numbers use a typographic minus (−), so a readout matches the notation beside it.

```js
fmt.num(1234.567)        // "1,234.57"   locale-aware, at most 2 decimals
fmt.num(-3, 1)           // "−3.0"       fixed decimals
fmt.int(26.4)            // "26"
fmt.fixed(0.5, 2)        // "0.50"
fmt.signed(2)            // "+2"         for a change or a slope
fmt.pct(0.625)           // "62.5%"      takes a fraction, not 62.5
fmt.unit(9.81, 'm/s²')   // "9.81 m/s²"  with a narrow space
fmt.count(1, 'round')    // "1 round"    plural only when needed
fmt.minus('-4 to -1')    // "−4 to −1"   fix a hand-written string
```

### Reproducible randomness

```js
const random = LearningUI.seededRandom(42);
random();                  // 0 ≤ value < 1
random.int(1, 6);          // integer in an inclusive range
random.pick(['H', 'T']);
random.shuffle(list);      // a new array; the input is untouched
random.reset();            // replay the same sequence from the seed
```

The same seed always replays the same sequence, which lets a learner re-run an
experiment exactly. Say so on the page, and say what it is not: reproducibility
is not physical randomness and not evidence that the model matches reality.

### Announcements

```js
LearningUI.announce('Rate set to 10 percent. Total after 10 rounds: 259.37.');
```

Debounced, polite, and sent to `[data-announcer]`. Without that element it does
nothing. Use it for a completed run, a reset, or a result worth hearing — not
for every frame of a drag. Keep the same information visible on the page.

---

## Controls

### `bindRange(input, output, options)`

```html
<div class="control-group">
  <div class="control-heading">
    <label for="rate">Growth per round, <var>r</var></label>
    <output id="rate-value" for="rate">10%</output>
  </div>
  <input id="rate" type="range" min="0" max="20" step="1" value="10" aria-describedby="rate-help">
  <div class="range-ends"><span>0%</span><span>20%</span></div>
  <p id="rate-help" class="explain">The starting amount stays fixed.</p>
</div>
```

```js
const rate = LearningUI.bindRange($('rate'), $('rate-value'), {
  format: value => value + '%',
  onInput: render,                                  // every movement
  onChange: () => LearningUI.announce(summary()),   // only when the learner lets go
  mirror: $('rate-exact')                           // optional number input, kept in sync
});
rate.get();                       // number
rate.set(15);                     // runs onInput
rate.set(15, { notify: false });  // set several controls, then render once
rate.reset();                     // back to the markup's value
```

The native input keeps its own bounds, step, and keyboard behavior. The output
also becomes `aria-valuetext`, so the value is spoken as "10%", not "10".
Initialization updates the output without calling `onInput`; render once
yourself afterwards.

### `bindChoice(container, options)`

A radio group, including the `.segmented` row. Returns the chosen value.

```html
<div class="segmented" id="view" role="radiogroup" aria-label="How to group the data">
  <label><input type="radio" name="view" value="overall" checked> Everyone</label>
  <label><input type="radio" name="view" value="split"> By group</label>
</div>
```

```js
const view = LearningUI.bindChoice($('view'), { onChange: render });
view.get();          // "overall"
view.set('split');
view.reset();
```

### `bindCheckbox(input, options)`

```js
const grid = LearningUI.bindCheckbox($('show-grid'), { onChange: render });
grid.get(); grid.set(true); grid.reset();
```

Prefer an ordinary checkbox over a custom switch. If you style the row, make the
clickable visual a `<label for="id">` so the control and its text share one target.

---

## Sequence

### `mountStepper(root, options)`

A finite, learner-paced walk through known states.

```html
<section id="trace" class="workspace" aria-labelledby="trace-title">
  <div class="controls stack">
    <h2 id="trace-title">Walk the trace</h2>
    <div class="btn-row">
      <button class="btn btn-secondary" type="button" data-back>Back</button>
      <button class="btn" type="button" data-next>Next step</button>
    </div>
    <div class="btn-row">
      <button class="btn btn-secondary" type="button" data-play>Play</button>
      <button class="btn btn-secondary" type="button" data-reset>Reset trace</button>
    </div>
    <label for="speed">Playback speed</label>
    <select id="speed" data-speed>
      <option value="0.5">0.5× · slower</option>
      <option value="1" selected>1×</option>
      <option value="2">2× · faster</option>
    </select>
    <div class="control-group">
      <div class="control-heading">
        <label for="scrub">Jump to a step</label>
        <output id="scrub-value" data-scrub-value for="scrub">1 of 7</output>
      </div>
      <input id="scrub" type="range" data-scrub value="0">
    </div>
    <div class="step-progress" data-progress aria-hidden="true"><div class="step-progress-fill"></div></div>
    <p class="step-position" data-position>Step 1 of 7</p>
  </div>
  <div class="stage stack">
    <h3 id="step-title">Start</h3>
    <p id="step-explanation" data-step-summary>Every value is still a candidate.</p>
  </div>
</section>
```

```js
const trace = LearningUI.mountStepper($('trace'), {
  count: steps.length,
  interval: 1600,                          // milliseconds between steps, minimum 200
  labels: steps.map(step => step.title),   // spoken for the scrubber
  render(index) {
    $('step-title').textContent = steps[index].title;
    $('step-explanation').textContent = steps[index].explanation;
  }
});
trace.go(2); trace.get(); trace.pause(); trace.reset(); trace.destroy();
```

| Attribute | Required | Purpose |
| --- | --- | --- |
| `data-back`, `data-next`, `data-play`, `data-reset` | yes | Buttons |
| `data-position` | yes | "Step 3 of 7" |
| `data-speed` | no | Playback multiplier `<select>` |
| `data-scrub` | no | Range input that jumps to a step |
| `data-scrub-value` | no | Output updated with "3 of 7" |
| `data-progress` | no | Wrapper holding `.step-progress-fill` |
| `data-step-list` | no | List whose items take `aria-current="step"` |
| `data-step-summary` | no | Text announced after a manual step |

Playback never starts on load, pauses in a hidden tab, and stops at the last
step. Under reduced motion, Play is disabled and Back/Next still work; the
component adds its own note saying so. Arrow keys, Home, and End step the trace
when focus is inside the root and not in a field. Call `destroy()` before
removing the markup.

---

## Questions and practice

### `mountQuestion(form, options)`

One multiple-choice check with explanatory feedback and retry.

```html
<form id="warmup" class="stack">
  <fieldset>
    <legend>Both models start at 100 units. Which leads after one round?</legend>
    <label><input type="radio" name="warmup" value="simple" required> Fixed addition</label>
    <label><input type="radio" name="warmup" value="equal"> They are equal</label>
    <label><input type="radio" name="warmup" value="compound"> Compound growth</label>
  </fieldset>
  <div class="btn-row">
    <button class="btn" type="submit" data-check>Check answer</button>
    <button class="btn btn-secondary" type="button" data-retry>Try again</button>
  </div>
  <p class="feedback" data-feedback hidden></p>
</form>
```

```js
const warmup = LearningUI.mountQuestion($('warmup'), {
  correct: 'equal',
  feedback: {
    equal: 'Yes. Both first additions are 10% of 100, so both reach 110.',
    simple: 'Work out the first addition for each rule: 10% of 100 is 10 in both.',
    compound: 'Compounding has no earlier growth to build on in round one.'
  },
  onAnswer: ({ correct, value, attempts }) => {}   // optional
});
warmup.reset();
```

Feedback explains the chosen answer rather than announcing a verdict. Give every
distractor a reason and a next action. Scope one radio group per form and use a
different `name` for each question on a page.

### `mountQuiz(root, options)`

A short retrieval set: one question at a time, feedback after each, and an
honest first-attempt summary. No score, no timing, no storage.

```html
<div id="quiz" class="stack">
  <p class="step-position" data-quiz-position>Question 1 of 4</p>
  <div class="step-progress" data-progress aria-hidden="true"><div class="step-progress-fill"></div></div>
  <form class="stack">
    <fieldset>
      <legend data-quiz-prompt></legend>
      <div data-quiz-choices></div>
    </fieldset>
    <p class="explain" data-quiz-note hidden></p>
    <div class="btn-row">
      <button class="btn" type="submit" data-check>Check answer</button>
      <button class="btn btn-secondary" type="button" data-next hidden>Next question</button>
      <button class="btn btn-secondary" type="button" data-restart>Start over</button>
    </div>
    <p class="feedback" data-feedback></p>
    <p class="callout callout--check" data-quiz-summary hidden></p>
  </form>
</div>
```

```js
LearningUI.mountQuiz($('quiz'), {
  items: [{
    prompt: 'Which statistic describes a typical ticket?',
    note: 'The same dataset, a different question.',      // optional
    choices: [{ value: 'median', label: 'The median, 12 minutes' }, /* … */],
    correct: 'median',
    feedback: { median: 'The median sits in the middle, so one long ticket cannot drag it.' }
  }],
  onComplete: ({ total, firstAttemptCorrect }) => {}
});
```

The summary reports first-attempt answers and then asks for an explanation,
because a correct selection is not a demonstration of understanding.

### `mountPrediction(form, options)`

Commit to an answer, then look. Learners who predict before seeing a result
attend to what actually happens instead of recognizing it afterwards.

```html
<form id="predict" class="stack">
  <fieldset>
    <legend>If both legs double, what happens to the hypotenuse?</legend>
    <label><input type="radio" name="predict" value="double" required> It doubles</label>
    <label><input type="radio" name="predict" value="same"> It stays the same</label>
  </fieldset>
  <div class="btn-row">
    <button class="btn" type="submit" data-check>Lock in my prediction</button>
    <button class="btn btn-secondary" type="button" data-retry hidden>Predict again</button>
  </div>
  <p class="feedback" data-tone="info" data-record hidden></p>
  <p class="explain" data-locked>Your prediction stays on this page. Nothing is sent anywhere.</p>
</form>
```

```js
const prediction = LearningUI.mountPrediction($('predict'), {
  label: 'Your prediction',
  reveal: '#worked-answer',   // optional: content hidden until the prediction is made
  gate: false,                // true also disables the form after locking
  onLock: answer => {}
});
prediction.reset();
```

A free-text `<textarea>` works in place of radios. Without `reveal`, nothing is
hidden: the prediction is recorded and exploration stays open, which is the
default the kit prefers.

Render the recorded prediction with `.feedback` and `data-tone="info"`, the
same inline response surface used by questions. Keep `data-record`: it is the
prediction helper's required hook, while `data-feedback` belongs to answer
checking. Recording a prediction does not grade it as correct or incorrect.

### `mountHints(root, options)`

```html
<div data-hints class="stack stack--tight">
  <div class="btn-row">
    <button class="btn btn-secondary btn-sm" type="button" data-hint-next>Show a hint</button>
    <span class="hint-count" data-hint-count></span>
  </div>
  <ol class="hint-list" data-hint-list></ol>
</div>
```

```js
const hints = LearningUI.mountHints(document.querySelector('[data-hints]'), {
  hints: ['Ask what the question needs.', 'Write the sorted list and mark the middle.', '…']
});
hints.reset(); hints.shown();
```

Order hints from a nudge to a near-answer. The count is shown and never scored.

### `mountSelfExplain(form, options)`

Write an explanation from memory, then compare it with a worked answer.

```html
<form id="explain" class="self-explain">
  <label for="answer">Why does the mean sit above the median here?</label>
  <textarea id="answer" data-answer rows="5"></textarea>
  <p class="char-count" data-count></p>
  <div class="btn-row"><button class="btn" type="submit" data-check>Compare with a worked answer</button></div>
  <p class="feedback" data-feedback></p>
  <div class="callout callout--note" data-reference hidden>
    <h3>A worked answer</h3>
    <p>…</p>
  </div>
</form>
```

```js
LearningUI.mountSelfExplain($('explain'), { minLength: 40, onReveal: text => {} });
```

Nothing is graded and nothing is stored. Say that on the page: a refresh clears
the text, so the learner should tell the tutor the version worth recording.

### `mountSortable(root, options)`

Put items in order. Move buttons are the primary interaction, so the task works
with a keyboard, a pointer, or touch.

```html
<div id="ordering" class="stack">
  <ol class="sortable" data-sortable aria-label="Steps to order"></ol>
  <div class="btn-row">
    <button class="btn" type="button" data-check>Check the order</button>
    <button class="btn btn-secondary" type="button" data-shuffle>Shuffle again</button>
  </div>
  <p class="feedback" data-feedback></p>
</div>
```

```js
const ordering = LearningUI.mountSortable($('ordering'), {
  items: [{ id: 'divide', label: 'Divide both sides by 3.' }, /* … */],
  correct: ['divide', 'simplify', 'subtract', 'solution', 'check'],
  feedback: { divide: 'The multiplier applies to the whole bracket.' },
  seed: 5,
  checkLabel: 'Check the order',
  onCheck: ({ placed, total, complete }) => {}
});
ordering.reset(); ordering.order();
```

The shuffle is seeded, so every learner meets the same starting order and a
retry is comparable. Feedback names the rule that decides the order, not the
position that is wrong.

### `mountMatching(root, options)`

```html
<div id="matching" class="stack">
  <div class="match-grid" data-matching></div>
  <div class="btn-row"><button class="btn" type="button" data-check>Check the matches</button></div>
  <p class="feedback" data-feedback></p>
</div>
```

```js
LearningUI.mountMatching($('matching'), {
  pairs: [{ id: 'mean', term: 'Mean', match: 'Sensitive to extreme values', why: 'Only the mean uses every value’s size.' }],
  seed: 11
});
```

Native `<select>` elements carry the choice, so the task needs no drag support.

---

## Mathematics

Notation is compiled to **MathML**, which browsers lay out with a real maths
font and assistive technology reads as mathematics. No library, no web font, no
network. MathML has been available in every major engine since January 2023;
where it is missing the same expression renders as linear notation in a maths
face, so the page still works.

### In markup

```html
<p class="equation" id="equation" data-math="y = \term{1}{m}x + \term{2}{b}" data-math-display="block"></p>
<span data-math="r^2"></span>
<p data-math="\frac{a}{b}" data-math-label="a over b"></p>
```

```js
LearningUI.math.render(document);   // compile every [data-math] on the page
```

Call `render` once after the markup exists. For a value that changes:

```js
LearningUI.math.update($('equation'), String.raw`\text{precision} = \frac{${tp}}{${tp + fp}}`);
```

In a plain string, write `\\frac`; in a template literal, use `` String.raw`\frac` ``.

### In script

```js
const node = LearningUI.math.tex('\\sqrt{a^2 + b^2}', { display: true, label: 'root of a squared plus b squared' });
element.replaceChildren(node);
LearningUI.math.toText('\\frac{a}{b}');   // "a/b", for an announcement or a label
LearningUI.math.supported;                // false only on an engine without MathML
```

### Supported notation

| Need | Write | Renders |
| --- | --- | --- |
| Powers and indices | `x^2`, `a_i`, `x_i^2` | superscript, subscript, both |
| Fractions | `\frac{a}{b}`, `\dfrac`, `\tfrac` | a stacked fraction |
| Roots | `\sqrt{x}`, `\sqrt[3]{27}` | square and nth roots |
| Sums and limits | `\sum_{i=1}^{n}`, `\prod`, `\lim_{h \to 0}`, `\max`, `\min` | limits above and below |
| Integrals | `\int_0^1`, `\iint`, `\oint` | bounds beside the sign |
| Binomials | `\binom{n}{k}` | n choose k |
| Greek | `\alpha … \omega`, `\Gamma … \Omega` | Greek letters |
| Relations | `\le \ge \ne \approx \equiv \sim \propto \ll \gg` | ≤ ≥ ≠ ≈ ≡ ∼ ∝ ≪ ≫ |
| Operators | `\cdot \times \div \pm \mp \ast \circ \oplus \otimes` | ⋅ × ÷ ± ∓ ∗ ∘ ⊕ ⊗ |
| Arrows | `\to \rightarrow \Rightarrow \iff \mapsto` | → ⇒ ⟺ ↦ |
| Sets and logic | `\in \notin \subset \subseteq \cup \cap \emptyset \forall \exists \neg \land \lor` | ∈ ∉ ⊂ ⊆ ∪ ∩ ∅ ∀ ∃ ¬ ∧ ∨ |
| Other symbols | `\infty \partial \nabla \degree \ldots \perp \angle \parallel \mid \hbar \ell` | ∞ ∂ ∇ ° … ⊥ ∠ ∥ ∣ ℏ ℓ |
| Functions | `\sin \cos \tan \log \ln \exp \det \gcd \Pr` and friends | upright function names |
| Words in a formula | `\text{precision}`, `\mathrm{d}t`, `\mathbf{v}`, `\operatorname{sign}` | upright, bold, italic, sans, mono |
| Accents | `\hat{p} \bar{x} \vec{v} \tilde{x} \dot{x} \overline{AB}` | accents and overlines |
| Grouping | `\left( … \right)`, `\left\lfloor … \right\rfloor`, `\langle \rangle` | delimiters that grow |
| Matrices | `\begin{bmatrix} a & b \\ c & d \end{bmatrix}` | also `pmatrix`, `vmatrix`, `Bmatrix`, `matrix`, `cases` |
| Spacing | `\,` `\:` `\;` `\!` `\quad` `\qquad` | thin to wide spaces |
| Escapes | `\%` `\$` `\#` `\{` `\}` | literal characters |
| Highlighted term | `\term{1}{m}` … `\term{4}{…}` | colors one part of the formula |

Anything else renders visibly as itself and logs a warning, so you see it while
authoring. Unbalanced braces and missing arguments throw, and `math.render`
falls back to the source text for that one element rather than breaking the page.

### Linking a formula to its controls

`\term{n}{…}` tints part of an expression with series color *n*. Use the same
number for the slider, the chart series, and the formula term, and add a key:

```html
<ul class="term-key" aria-label="Which color marks which parameter">
  <li data-term="1"><span class="swatch" aria-hidden="true"></span>Slope <var>m</var></li>
  <li data-term="2"><span class="swatch" aria-hidden="true"></span>Intercept <var>b</var></li>
</ul>
```

Color alone never carries the meaning: the key names each term in words.

### Notation in prose

Use `<var>` for a single symbol in a sentence — it is the semantic element and
the stylesheet renders it in the maths face: `explain what <var>m</var> controls`.
Use `.equation` for a display formula and `.equation--plain` when it sits inside
a panel that already has a border.

---

## Drawing

`LearningUI.svg` is enough to draw a diagram by hand: a construction, a circuit,
a free-body sketch, a network. Pair every drawing with text that says the same
thing.

```js
const { svg } = LearningUI;
const figure = svg.create({ width: 420, height: 300, label: 'Right triangle with a square on each side' });
const x = svg.scale({ domain: [0, 10], range: [20, 400] });   // model units to pixels
const y = svg.scale({ domain: [0, 10], range: [280, 20] });   // y grows upward
figure.append(svg.el('polygon', { points: '20,280 400,280 20,20', fill: 'var(--surface)', stroke: 'var(--text-bright)' }));
figure.append(svg.el('text', { x: x(5), y: y(5), 'text-anchor': 'middle' }, '25'));
figure.append(svg.el('path', { d: svg.path([{ x: x(0), y: y(0) }, { x: x(3), y: y(4) }]), fill: 'none', stroke: 'var(--accent)' }));
x.invert(210);     // pixels back to model units
x.ticks(4);        // evenly spaced domain values
```

Keep the drawing a function of the model: compute every point from state, then
render. To fit any state, collect the points first, take their bounding box, and
set the `viewBox` from it — the geometry template does exactly that.

---

## Figures

### `renderChart(root, options)`

One to four series on shared axes, with a keyboard-reachable data cursor and a
data table.

```js
LearningUI.renderChart($('line-chart'), {
  series: [
    { label: 'y = mx + b', points: [{ x: -4, y: -3 }, { x: 0, y: 1 }, { x: 4, y: 5 }] },
    { label: 'At x = 2', type: 'scatter', points: [{ x: 2, y: 3 }] }
  ],
  xLabel: 'Input x',
  yLabel: 'Output y',
  xDomain: [-4, 4],
  yDomain: [-16, 16],
  formatX: value => fmt.num(value),
  formatY: value => fmt.num(value),
  annotations: [{ type: 'hline', at: 0, label: 'Break-even' }],
  baseline: pinnedPoints,
  baselineLabel: 'Pinned: m = 1',
  height: 300,
  cursor: true,
  animate: true
});
```

| Option | Default | Meaning |
| --- | --- | --- |
| `series[].type` | `line` | `line`, `area`, `step`, `scatter` |
| `series[].color`, `series[].dash` | palette | Override only with a reason |
| `xDomain`, `yDomain` | data extent | Two increasing finite numbers; fix them when comparisons need one scale |
| `xTicks`, `yTicks` | 4, or 2 when narrow | Target count; actual ticks are rounded to readable steps |
| `annotations` | none | `vline`/`hline` with `at`, `band` with `from`/`to` and `axis`, `point` with `x`/`y`, `note` |
| `baseline` | none | Points, or an array of point lists, drawn faintly for comparison |
| `cursor` | `true` | Focusable chart, arrow-key readout, live region |
| `animate` | `true` | Short tween for discrete pointer comparisons; skipped for continuous ranges, keyboard actions, resize, and reduced motion |
| `height` | 300 | Pixels |

The renderer redraws on container resize, keeps the data table's open state and
focus, clips points outside the domain while keeping them in the table, and
distinguishes series by dash pattern and marker as well as color. It is a small
line-chart renderer, not a statistics package: compute bins, intervals, and
transformations in the model, and write a separate sentence saying what the
current state means.

### `renderBars(root, options)`

Categorical magnitudes as text-first bars: counts, shares, histogram bins.

```js
LearningUI.renderBars($('outcome-bars'), {
  bars: [
    { label: 'Heads', value: 7 },
    { label: 'Tails', value: 3, series: 3, note: ' so far', muted: false }
  ],
  max: 10,                                   // default: the largest value
  format: value => fmt.int(value),
  caption: 'Counts so far',
  target: { value: 5, label: 'Expected heads' },
  orientation: 'horizontal',                 // 'vertical' for many bins
  labelHeading: 'Outcome', valueHeading: 'Count',
  table: true                                // default: only for vertical
});
```

Labels and values are real text, so the figure reads correctly without an extra
alternative. Values must be at or above zero; use `renderChart` for signed data.

### `renderGrid(root, options)`

A labelled table of cells: confusion matrix, truth table, transition table,
payoff grid, heat map.

```js
LearningUI.renderGrid($('matrix'), {
  caption: 'Cases and success rate in each cell',
  corner: 'Treatment',
  columns: ['Mild', 'Severe', 'Everyone'],
  rows: ['Treatment A', 'Treatment B'],
  cells: [
    [{ value: '93%', label: '93 cases' }, { value: '73%', label: '257 cases' }, { value: '78%', tone: 'tp' }],
    [{ value: '87%', label: '264 cases' }, { value: '69%', label: '86 cases' }, { value: '82%', tone: 'tp' }]
  ]
});
```

Cells accept `value`, `label`, `tone` (`tp`, `fp`, `fn`, `tn`), `intensity`
(0–1, shaded for a heat map), and `state`. Real table semantics mean headers and
cells are announced together.

---

## Layout classes

| Class | Use |
| --- | --- |
| `.lesson` | Page wrapper with a readable measure and page padding |
| `.lesson-header`, `.eyebrow`, `.subtitle` | Title block |
| `.breadcrumb`, `.lesson-footer` | Thin context lines above and below the lesson |
| `.stage-nav` | Anchor chips linking the stages of a long page |
| `.workspace` | Controls beside evidence; stacks below 760px |
| `.workspace--wide-controls`, `.workspace--stage-first` | Variants for a heavy control panel or a stage that should lead |
| `.controls`, `.stage` | The two halves of a workspace |
| `.is-sticky` | Keep the control panel beside the evidence while scrolling |
| `.panel`, `.card`, `.prompt-card`, `.callout` (`--note`, `--check`, `--caution`) | Surfaces |
| `.notice` | Model limits and provenance |
| `.stack`, `.stack--tight`, `.cluster`, `.spread`, `.two-col`, `.three-col` | Spacing primitives |
| `.metrics-grid`, `.metric`, `.metric--boxed`, `.metric--accent` | Numeric readouts |
| `.stat-strip`, `.readout`, `.delta` | Compact value rows |
| `.btn`, `.btn-secondary`, `.btn-ghost`, `.btn-sm`, `.btn-row`, `.preset-row`, `.preset-btn` | Buttons |
| `.segmented` | Radio group styled as one row |
| `.choice` | A selectable row wrapping a radio or checkbox |
| `.feedback` | Inline answer feedback and prediction records; `data-tone` is `correct`, `retry`, or `info` |
| `.equation`, `.equation--plain`, `.equation-row`, `.term-key`, `var` | Mathematics |
| `.code-block` | Code and transcripts — never equations |
| `.data-table`, `.table-wrap` | Tables, with their own scroll container |
| `.token`, `.token-row` | Sequence and state displays |
| `.sortable`, `.match-grid`, `.hint-list`, `.self-explain` | Component markup |
| `.step-progress`, `.step-position`, `.step-list`, `.scrubber-row` | Stepper furniture |
| `.sr-only`, `.skip-link` | Screen-reader text and the skip link |

Reuse these before writing new CSS. Put anything genuinely page-specific in its
own `<style>` block; the builder leaves it alone.

---

## Design tokens

Color, spacing, and type come from custom properties, and the dark palette is
defined in the same file. Use the token, never a raw hex value, so a lesson
follows the learner's theme. The paired palette uses CSS `light-dark()` with
`color-scheme: light dark` by default; `data-theme="light"` or `"dark"` on the
document root selects a manual theme for the whole page.

Every supplied page has a **Dark mode / Light mode** button. The runtime saves
only this preference under `learning-ui-theme` in local storage. It follows
system changes until a theme is chosen, and works for the current page even if
storage is unavailable. Answers and progress are never persisted. Custom shells
can provide their own `<button type="button" data-theme-toggle></button>`.
`LearningUI.theme.mount()` binds it without duplicating controls;
`LearningUI.theme.set(null)` restores the system preference.

Secondary buttons are rectangular outline actions; presets are pill-shaped
choices, with an inset border when selected. A stage owns its surface: panels
inside it become sections with a divider, while feedback uses an inline rule
and text instead of another card. Quiz choices always occupy separate rows.

| Token | Use |
| --- | --- |
| `--bg`, `--surface`, `--card`, `--sunken` | Page, panels, control panel, insets |
| `--border`, `--border-hover`, `--border-strong` | Surfaces, hover, form-field boundaries (3:1) |
| `--text`, `--text-bright`, `--muted`, `--faint` | Body, headings, secondary, tertiary — all at 4.5:1 or better |
| `--accent`, `--accent-hover`, `--accent-dim`, `--accent-text`, `--on-accent` | The one accent and its text colors |
| `--series-1` … `--series-4`, `--series-N-soft` | Chart series and formula terms |
| `--term-1` … `--term-4`, `--term-N-bg` | Highlighted formula terms |
| `--ok`, `--warn`, `--info` | Feedback tones |
| `--tp`, `--fp`, `--fn`, `--tn` and `--*-bg` | Classification outcomes |
| `--radius`, `--radius-lg`, `--radius-pill` | Corners |
| `--font-sans`, `--font-mono`, `--font-math` | Prose, code, mathematics |
| `--shadow-sm`, `--shadow-md` | Elevation |
| `--ease-out`, `--motion-press`, `--motion-reveal`, `--motion-fade` | Shared curve and 120/180/120ms durations |

---

## Motion

```js
motion.reduced();                 // true when the visitor asked for less motion
motion.setText(element, value);   // set text and cue a discrete pointer change
motion.mark(element);             // briefly fade an element updated another way
motion.enter(element);            // reveal new content with a short fade/rise
motion.onChange(handler);         // react when the preference changes
```

Use motion for occasional feedback: a checked answer, a revealed hint, or a
worked explanation. Shared components handle these reveals. CSS transitions
retarget when interrupted, with no forced layout or animation on initial load.
Reveals use opacity and a 4px translation over 180ms; pointer presses use
`scale(.98)` over 120ms. Both use `cubic-bezier(0.23, 1, 0.32, 1)`.

Keyboard actions and continuous range updates are immediate. Under
`prefers-reduced-motion: reduce`, reveals use only a gentle 120ms opacity change,
button movement is removed, the stepper disables playback, and charts skip
tweens. Never make motion the only signal: the resulting state stays visible
as text, selection, or data.
