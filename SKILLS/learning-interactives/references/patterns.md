# Choose a pattern

These are practical authoring families, not measured rankings of learner demand.
Use a text explanation, table, or static diagram when changing or stepping through
something would not reveal useful information.

| Learner need | Start with | Included example | Adaptation contract |
| --- | --- | --- | --- |
| “What happens if I change this?” | [Parameter explorer](../templates/parameter-explorer.html) | Slope and intercept in a linear equation | Change the equation, control bounds, output units, chart domains, and warm-up question together. |
| “Show me how it works, one step at a time.” | [Step sequence](../templates/step-sequence.html) | Binary search through a sorted list | Supply a finite sequence of states with an action, visible state, and explanation for every transition. |
| “When would I choose A over B?” | [Comparison](../templates/comparison.html) | Simple and compound growth | Keep inputs and axes shared; change the two models, assumptions, and comparison question. |
| “Why are results different each time?” | [Probability lab](../templates/probability-lab.html) | Seeded coin trials and running frequency | Replace the generator and statistic; define the seed, sample limit, theoretical target, and restart behavior. |
| “What should I do next, and why?” | [Decision scenario](../templates/decision-scenario.html) | Investigating a missing user name | Replace the scenario states, choices, consequences, and explanation prompts; keep routes reachable and restartable. |
| “Quiz me, and tell me why I was wrong.” | [Practice set](../templates/practice-set.html) | Choosing mean, median, mode, or range | Replace the items, distractor feedback, hint ladder, and the worked answer the learner compares against. |
| “Help me put this in the right order.” | [Order the steps](../templates/order-steps.html) | Solving a bracketed linear equation | Replace the steps and the rule that orders them; every misplacement needs a reason, not a verdict. |
| “Show me how these parts connect.” | [System map](../templates/system-map.html) | Dependencies in a build pipeline | Replace nodes and edges; keep the graph acyclic, the table complete, and every arrow readable in both directions. |
| “What does this data actually say?” | [Data explorer](../templates/data-explorer.html) | A rate reversal when a grouping is ignored | Replace the dataset and grouping; name the source, the units, and what the data cannot support. |
| “Why is that formula true?” | [Geometry lab](../templates/geometry-lab.html) | Squares on the sides of a right triangle | Replace the construction and the quantity it measures; keep the drawing, the numbers, and the claim in agreement. |

The [precision and recall example](../example-interactive.html) remains a domain
example. The ten templates are complete activities, not empty mockups: preserve
their working behaviors while replacing their teaching content. The
[component gallery](../components.html) shows every control, figure, and notation
feature on one page, with the markup beside each one.

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
