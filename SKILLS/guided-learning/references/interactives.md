# Interactive construction

Use an interactive when manipulating inputs, tracing a process, comparing cases,
sampling outcomes, or exploring consequences helps the learner reach the current
outcome. Check access constraints, time, and available tools first. A visual
preference alone does not require a simulation; a static diagram, table, worked
example, or conversation can serve the same goal.

## Choose and build

Start with **Start here** and **Choose the interaction** in the
[interactive kit guide](../interactives/README.md), then load only the relevant
working template. Read component recipes or local-asset guidance as needed;
there is no need to load every example. The [browser catalog](../interactives/index.html)
previews ten patterns:

| Need | Template |
| --- | --- |
| Change an input and inspect the relationship | `parameter-explorer` |
| Trace an algorithm, mechanism, or ordered process | `step-sequence` |
| Compare models or tradeoffs under shared conditions | `comparison` |
| Explore samples, chance, and variability | `probability-lab` |
| Choose an action and reason about consequences | `decision-scenario` |
| Practise retrieval with hints and an explanation | `practice-set` |
| Arrange steps and justify the order | `order-steps` |
| Select a part and trace what depends on it | `system-map` |
| Regroup a documented dataset and read the change | `data-explorer` |
| Drag a construction and read the quantity it changes | `geometry-lab` |

1. Pin `{interactives_dir}`, `{css_file}`, and `{build_script}` from the selected
   topic; inspect existing assets and preserve customizations. Use the Python
   interpreter recorded in `runtime.local.toml` when configured.
2. Define the outcome, model/assumptions, input bounds, expected result, one edge
   case, and **warm up → explore → explain → transfer** prompts. Adapt to the
   learner's language, domain, and access needs.
3. Use `SKILLS/guided-learning/interactives/scaffold.py` with the pattern name
   and absolute output path:

   ```sh
   python3 SKILLS/guided-learning/interactives/scaffold.py step-sequence /absolute/pinned/interactives/YYYY-MM-DD_concept-slug.html
   ```

   The scaffolder supplies missing assets and builds a standalone page. It
   refuses overwrites and conflicting assets. For customized topic assets,
   follow the guide's **Local assets and customizations** workflow and preserve
   the topic's stylesheet and learner files.
4. Customize the marked lesson and model sections; keep reusable controls,
   playback, feedback, and chart/table components. Validate the teaching model
   independently of its visual presentation.
5. The main tutor runs the selected topic's `build.py` for the completed filename
   and checks its exit status, including after delegated work. Filenames are
   relative to the Python builder's directory. Then run `verify.py` on the built
   file and fix every error it reports:

   ```sh
   python3 SKILLS/guided-learning/interactives/verify.py /absolute/pinned/interactives/YYYY-MM-DD_concept-slug.html
   ```
6. Open the result in a browser when available. Check baseline/extreme values,
   reset/retry, keyboard use, narrow-screen layout, reduced motion, notation that
   renders as mathematics, and the text or table alternative. A clean `verify.py`
   run checks structure, not teaching or arithmetic. Report unavailable checks
   honestly.

The installed vault uses its own local kit, independent of the source repository.
The kit needs no external UI library or JavaScript build tool. Set every equation
with `LearningUI.math`, which compiles a TeX subset to native MathML, and keep
`.code-block` for code. `COMPONENTS.md` beside the guide lists each helper, its
markup, and its options; `components.html` shows them running. Shared CSS and
optional `interactive.js` are inlined by the builder; page-specific styles/code
stay separate. All learner pages belong in the installed workspace, never this
source repository. The full guide covers API recipes, domain extensions,
dependencies, data provenance, and verification.

## Fit the activity into the lesson

After Phase 1's explanation, use a background helper only if the host provides
that capability. Pass the helper the concept/model, pattern, learner constraints,
pinned paths, and kit guide. Continue useful explanation or ask a warm-up question
while it builds. If delegation is unavailable, build directly or use an accessible
worked example within the session budget. Do not invent an Agent tool, flags,
or a completion-time guarantee.

Announce the interactive only after it is built and checked. Invite exploration
before an assessment that depends on the page; do not hold up an independent
learner response because a background build is unfinished. Provide a browser-openable
path and a specific first action, then ask for the learner's reasoning. Inlining
assets does not enable scripts in Obsidian's note rendering; link the HTML from
the note and open it in a browser.

Keep motion purposeful, finite, learner-controlled, and compatible with reduced
motion. Native controls need visible labels and useful feedback. Every visual
needs an equivalent explanation/table, and every drag interaction needs a
keyboard/click alternative. If views share data, label the source, show its live
summary, and explain the dependency in each dependent view.

The page does not persist responses or update course progress. Record only work
actually observed through the teaching workflow. Inspecting an animation or
selecting the correct option does not establish lasting understanding. Use a new
case or explanation and later recall where appropriate. See the
[research rationale](interactive-evidence.md) for the evidence and its limits.
