# Session Records

Read before writing the session protocol or execution log. Use only the pinned
topic paths. Phase 4 in the core flow controls progress, recall, and paper-status
updates; these templates capture the actual session, including partial results.

## Session Protocol

After each session, write a human-readable protocol to `{protocols_dir}/YYYY-MM-DD_concept-slug.md`. This is the learning journal — it captures what worked, what needed correction, and what to revisit. Unlike the execution log (which is operational), the protocol is written for the learner to review later.

```markdown
---
date: "YYYY-MM-DD"
topic: "<selected-topic-id>"
pass: <1|2|3>
cluster: "<cluster name>"
concept: "<concept wikilink slug>"
complexity: "<light|medium|heavy>"
duration: "~XX min"
comprehension: "<passed|partial|needs-revisit>"
---

# Session: <concept title in plain language>

## Recall checks
- <concept recalled>: <solid|fuzzy|blank> — <brief note if fuzzy/blank>
- <omit this section if no recalls were due>

## What we covered
- <bullet points: key ideas explained>

## How we learned it
- <which methods were used: conversational explanation, interactive HTML, scenario exercise, writing exercise, connection mapping>

## Artifacts
- <link to any interactives created, e.g. `[[{interactives_dir}/YYYY-MM-DD_concept-slug.html]]`>
- <omit this section if no artifacts were created>

## What worked well
- <which moments, presets, examples, or methods produced "aha" moments>

## Corrections given
- <any terminology fixes, misconceptions addressed, or gaps filled during the comprehension check>

## Connections made
- <which concepts the learner linked this to, and how>

## Next up
- <what concept comes next on the roadmap>
```

---

## Obsidian Formatting

Use Obsidian Flavored Markdown to make learning protocols rich:

- **LaTeX**: `$formula$` and `$$block$$` for mathematical notation — essential when concepts involve statistics, probability, or metrics
- **Callouts**: `> [!question]` for comprehension checks, `> [!tip]` for key insights, `> [!example]` for worked examples
- **Mermaid diagrams**: process flows, concept relationship maps, decision trees
- **Highlights**: `==key insight==` for the "aha" moments worth remembering

## Execution Logging

After each session, write a log to `{skill_logs_dir}/YYYY-MM-DD_sessionNN.md` (where NN is the next session number):

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
application_method: "<html-interactive|scenario|writing|connection-mapping>"
check_format: "<selected format ID>"
artifacts_created:
  - "<path to interactive HTML or other output>"
comprehension_check: "<passed|partial|needs-revisit>"
recall_results:
  - concept: "<concept-slug>"
    result: "<solid|fuzzy|blank>"
struggle_tags:
  - "<implication-gap|terminology-confusion|math-gap|scope-creep|shallow-framing|connection-blind>"
session_duration_minutes: "<approximate, e.g. ~20>"
status: "<completed|partial|needs-followup>"
issues: "<any problems encountered>"
user_corrections: "<any feedback the learner gave about the process>"
---

## Session Notes

<Brief narrative: what was covered, what clicked, what needs revisit>
```

## Correction tags

**In every execution log**, categorize each correction given during the session using one or more of these tags:

| Tag | Meaning | Example |
|-----|---------|---------|
| `implication-gap` | Understands the mechanism but misses the "so what" for their system | "Undersold the routing implication" |
| `terminology-confusion` | Confuses or misuses a technical term | "Used 'calibration' when meaning 'correlation'" |
| `math-gap` | Lacks prerequisite statistical/mathematical knowledge | "Didn't know what Cohen's kappa measures" |
| `scope-creep` | Explains too broadly, loses the specific claim | "Described all of Bayesian stats instead of the specific method" |
| `shallow-framing` | Describes the algorithm but not why it matters or when to use it | "Described EM steps but couldn't say when DS beats MV" |
| `connection-blind` | Fails to see how this concept relates to previously learned ones | "Didn't connect annotation quality to uncertainty quantification" |

Use the selected ID from [comprehension checks](comprehension-checks.md) for
`check_format`; retain existing IDs in older logs. When no check was attempted,
record that fact without inventing a format or successful result.
