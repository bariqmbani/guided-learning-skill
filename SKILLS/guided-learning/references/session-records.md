# Session Records

Read before writing the session protocol or execution log. Use only the pinned
topic paths. Phase 4 in the core flow controls progress, recall, and paper-status
updates; these templates capture the actual session, including partial results.

## Session Protocol

After each session, write a protocol to
`{protocols_dir}/YYYY-MM-DD_concept-slug.md`. Keep one concise learner-readable
account of explanations, actual attempts, support, corrections, and next steps.
Retain which method, example, or preset helped or remained ineffective when
supported by an observed response or explicit learner feedback. This evidence
supports later teaching adjustments; do not infer effectiveness from tutor intent.
Omit empty sections; do not repeat that narrative in the execution log. Preserve
existing protocols, adding a suffix when a filename would collide with another
session rather than overwriting it.

```markdown
---
date: "YYYY-MM-DD"
topic: "<selected-topic-id>"
pass: <1|2|3>
cluster: "<cluster name>"
concept: "<concept wikilink slug>"
complexity: "<light|medium|heavy>"
duration: "~XX min"
comprehension: "<not-yet-assessed|passed|partial|needs-revisit>"
---

# Session: <concept title in plain language>

## Recall checks
- <concept recalled>: <solid|fuzzy|blank> — <brief note if fuzzy/blank>
- <omit this section if no recalls were due>

## What we covered
- <bullet points: key ideas explained>

## Attempts and feedback
- <prompt, actual learner reasoning/result, support used, and corrective feedback>
- <distinguish independent work from assisted or tutor-supplied work>
- <when observed: which approach/example helped or did not, and the response or learner feedback supporting that judgment>

## Artifacts
- <link to any interactives created, e.g. `[[{interactives_dir}/YYYY-MM-DD_concept-slug.html]]`>
- <omit this section if no artifacts were created>

## Connections made
- <which concepts the learner linked this to, and how>

## Next up
- <unresolved gap and resume point, or next concept when this pass's criterion was met>
```

---

## Obsidian Formatting

Use Obsidian Flavored Markdown so the learner can review the reasoning, examples,
and connections in their vault. Choose formatting that clarifies the content:

- **Mathematics:** use `$formula$` inline and `$$` on separate lines around a
  display equation. Define symbols and show meaningful intermediate steps;
  do not put mathematical notation in a code block.
- **Callouts:** use `> [!question]` for a comprehension prompt, `> [!tip]` for a
  key insight, and `> [!example]` for a worked example. Prefix each line of the
  callout body with `>`. Keep the learner's actual answer and the tutor's
  feedback distinct; an unanswered question remains unanswered in the record.
- **Diagrams:** use a fenced `mermaid` block for a process flow, concept map, or
  decision tree when its relationships are clearer visually. Include a short
  prose explanation so the meaning is still available without the diagram.
- **Highlights:** use `==key insight==` sparingly for a takeaway worth revisiting;
  do not label a tutor-supplied statement as the learner's discovery.
- **Links:** use `[[vault-relative-note-path|Readable concept title]]` for notes
  and connections. Link an interactive's delivery `.html` in **Artifacts** and
  explain that it opens in a browser; Obsidian note previews do not run its
  scripts. Keep every artifact path in the pinned topic.

## Execution Logging

After each session, write a log to `{skill_logs_dir}/YYYY-MM-DD_sessionNN.md`
using the next topic-local session number. Keep the metadata needed for reviews
and link the protocol for evidence. Do not rewrite older logs into this format.

**YAML quoting rule:** Always quote all string values in frontmatter. This avoids ambiguous scalar types and punctuation in Obsidian's YAML parser. Only leave numeric and boolean values unquoted.

```yaml
---
skill: "guided-learning"
version: "<metadata.version from the loaded skill>"
topic: "<selected-topic-id>"
trigger: "<how the session was initiated>"
pass: <1|2|3>
cluster: "<cluster name>"
concepts_covered:
  - "<concept-1>"
  - "<concept-2>"
complexity: "<light|medium|heavy>"
application_method: "<not-attempted|html-interactive|scenario|writing|connection-mapping>"
check_format: "<selected format ID>"
artifacts_created:
  - "<path to interactive HTML or other output>"
comprehension_check: "<not-yet-assessed|passed|partial|needs-revisit>"
recall_results:
  - concept: "<concept-slug>"
    result: "<solid|fuzzy|blank>"
struggle_tags:
  - "<implication-gap|terminology-confusion|math-gap|scope-creep|shallow-framing|connection-blind>"
session_duration_minutes: "<approximate, e.g. ~20>"
status: "<completed|partial|needs-followup>"
issues: "<any problems encountered>"
user_corrections: "<any feedback the learner gave about the process>"
protocol: "<vault-relative path to this session protocol>"
---

[[<vault-relative protocol path>|Session evidence and next step]]
```

## Correction tags

In each log, tag corrections that actually occurred; use `struggle_tags: []`
when none did. The protocol holds the underlying attempts and feedback.

| Tag | Meaning | Example |
|-----|---------|---------|
| `implication-gap` | Understands the mechanism but misses the "so what" for their system | "Undersold the routing implication" |
| `terminology-confusion` | Confuses or misuses a technical term | "Used 'calibration' when meaning 'correlation'" |
| `math-gap` | Lacks prerequisite statistical/mathematical knowledge | "Didn't know what Cohen's kappa measures" |
| `scope-creep` | Explains too broadly, loses the specific claim | "Described all of Bayesian stats instead of the specific method" |
| `shallow-framing` | Describes the algorithm but not why it matters or when to use it | "Described EM steps but couldn't say when DS beats MV" |
| `connection-blind` | Fails to see how this concept relates to previously learned ones | "Didn't connect annotation quality to uncertainty quantification" |

Use the selected pass's check ID for `check_format`; retain existing IDs in older
logs. With no attempted check, use `check_format: "not-attempted"` and
`comprehension_check: "not-yet-assessed"`. Session `status` describes whether
the agreed work finished, not whether the learner succeeded. Keep the protocol
assessment and log consistent; a deferred check cannot be marked passed.
Use `application_method: "not-attempted"` when the session ended before
application; do not record a planned activity as performed.
