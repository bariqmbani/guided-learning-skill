# Pass 1 — Overview

Read only for the current Overview pass. The goal is to state the core idea and
why it matters in the learner's domain.

## Explain

Choose a narrative that fits the concept, or blend two. Vary the structure across
sessions when appropriate rather than forcing every concept into the same shape:

- **Misconception flip:** surface the plausible but incomplete view and rebuild it.
- **Problem first:** start with a concrete need, then show what this idea solves.
- **Contrast:** connect to an understood concept and explain the key difference.
- **Historical narrative:** trace earlier approaches when their limits explain
  why the present concept emerged.
- **Worked example:** trace concrete numbers or steps before naming the pattern.

Build from existing knowledge toward the learner's actual work or purpose. Use
at most one analogy and state where it breaks. Follow shared teaching for
incremental explanation, attempts, feedback, and adjusted support.

## Check comprehension

Choose one format below for the current domain; do not repeat the previous
session's `check_format`. Retain its ID in the execution log and adapt wording
to the actual concept and language while retaining the underlying task. Let the
learner explore a relevant interactive first, then ask and wait. Address gaps
before advancing.

| Shared ID | Prompt |
| --- | --- |
| `predict-outcome` | If [variable] changes from X to Y, what happens and why? |
| `spot-flaw` | What's wrong with this deliberately flawed claim: “[statement]”? |
| `analogy-check` | Give your own analogy, different from the tutor's. |
| `what-breaks` | If we ignored this concept, what would go wrong? Research: in your system; professional: in production; self-study: what problems would remain unsolved? |

Choose either shared formats above or a domain variant below:

| Task | Research | Professional | Self-study |
| --- | --- | --- | --- |
| Explain to an audience | `conference-pitch`: Explain to a fellow researcher at a poster session. | `team-standup`: Explain to your team in 30 seconds. | `dinner-table`: Explain to a curious friend over dinner. |
| Explain the value | `elevator-pitch`: In 30 seconds, sell its relevance to your research. | `stakeholder-pitch`: Your VP asks why this matters for the product. | `elevator-pitch`: In one sentence, why should anyone care? |

## Connections

Ask which one or two earlier concepts this supports, resembles, or conflicts
with. Keep it light. If the learner draws a blank, suggest one connection and
invite their explanation. Use readable concept titles.
