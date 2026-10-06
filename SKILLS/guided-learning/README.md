# Guided Learning Skill

The tutor can propose ongoing preferences from your feedback and asks before
saving them. Choose the current topic, the whole vault, both, or neither. See
[personalization from feedback](references/personalization.md) for the flow and
how topic preferences override vault defaults.

> [!info] Setup repository: multiple learning topics
> The installed skill uses version `3.5.0` with independent learning tracks. This repository contains reusable setup files, not a learner's course data. Follow the installation prompt below to create a separate vault, then read [topic-routing.md](references/topic-routing.md) for the learning flow. The upstream installation examples later in this file describe a single-track vault.
>
> In the installed vault, say **Continue [topic]** to resume an existing course, or **I want to learn [a new subject]** to create a separate course. Each track has its own roadmap, recall queue, notes, glossary, journals, and logs. To share the setup, read [the sharing instructions](../../SHARING.md).
>
> Start with **$guided-learning onboard** (Codex) or **/guided-learning onboard** (Claude Code) for a guided conversation covering every profile field. Each answer is optional; skip any question or finish early. Each new topic gets its own goal and starting point. Run onboarding again to update preferences while retaining progress. Read [the research rationale](references/onboarding-evidence.md) for the question design and its limits.

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skill that turns any markdown-based knowledge vault into a structured learning environment. It runs interactive sessions using a **spiral curriculum** — three passes of increasing depth, with spaced recall, comprehension checks, and auto-generated interactive HTML visualizations.

Three ways to start: name a topic and the skill **bootstraps a full roadmap** from scratch, drop a **PDF or URL** and learn from it immediately, or continue an **existing roadmap**. Three domain modes (research, professional, self-study) are detected automatically. Built for anyone who wants to actually retain what they read.

## Install with an agent

Copy this prompt into an agent with terminal access. Replace `<vault-path>` with
an absolute path to a new folder.

```text
Create an empty Obsidian learning vault at "<vault-path>" using:
https://github.com/bariqmbani/guided-learning-skill

Clone main into a temporary folder, then follow AGENTS.md and SHARING.md to
install into the destination. If it already exists, ask for another path.

Verify Codex and Claude Code skills are installed, with no topics and an
unconfigured learner profile. Report the vault path and how to open it in
Obsidian and start guided-learning onboard.
```

## Onboarding example

Run `$guided-learning onboard` in Codex, or `/guided-learning onboard` in Claude
Code. The tutor guides you one question at a time through language, preferred
name, background, broad goals, learning context, session time, explanation style,
preferred activities, and other preferences. Every answer is optional: say
**skip**, **you choose**, or **finish**. You never need to edit JSON yourself.

When the host supports it, questions appear in its interactive question UI and
the tutor continues after each answer. Hosts without a usable question tool use
regular chat messages. The example below shows the wording of that conversation.

For example, the beginning of a guided conversation might be:

> **Tutor:** Which language would you like us to use? A bilingual mix is welcome.
>
> **Learner:** English.
>
> **Tutor:** We'll use English. What would you like me to call you? A nickname is fine, or we can skip.
>
> **Learner:** Skip.
>
> **Tutor:** Of course. What experience or interests could I use for familiar examples?
>
> **Learner:** I work on backend systems and enjoy cooking.
>
> **Tutor:** I'll draw on those for examples and explain where each analogy stops working. Broadly, what would you like learning to help you do?

The tutor continues through the remaining optional fields and finishes with a
short plan for how your answers will shape lessons. A saved profile can be
revisited to fill gaps; preferences already provided are preserved.

You can also supply preferences up front, or request only a specific update:

```text
$guided-learning onboard

I prefer learning in Russian. A typical session can take about 20 minutes.
Please save these preferences for future learning sessions:

- Every explanation should include source references and links.
- Base explanations on verified facts. Distinguish established facts from
  uncertainty, inference, and illustrative examples. Do not invent references.
- Give one analogy for every new abstract concept, and explain where the
  analogy stops working.
- Use STE-style writing: short, direct sentences, familiar words, and defined
  technical terms. Apply these plain-language principles to Russian explanations.
- Give a practical challenge for every concept. Wait for my answer before
  giving feedback or revealing a solution.

Keep any existing profile fields I have not changed. This is onboarding only;
do not create a topic, start a lesson, or change any learning progress.
```

The tutor saves Russian as the teaching language, the session budget, and your
detailed requests in the learner profile. It summarizes the saved choices and
does not ask again for information you already supplied. Custom requests do not
need to fit a preset menu.

| Preference | How it changes a lesson |
| --- | --- |
| Russian | Explanations, questions, exercises, and new lesson prose use Russian. |
| References and facts | Explanations include relevant sources. Unverified claims and uncertainty are identified; references are never fabricated. |
| Analogy for each abstract concept | The tutor gives one analogy and states its limits. The analogy illustrates the concept; it is not evidence for a factual claim. |
| STE-style writing | The tutor uses short, direct sentences and explains technical terms. |
| Challenge for each concept | The tutor gives a task or question, waits for your attempt, then provides feedback. It can reuse the comprehension check rather than add a second exercise. |

Here, STE means [Simplified Technical English](https://www.asd-ste100.org/STE_faq.html).
STE is an English writing standard. For Russian, this example requests its
plain-language principles; it does not claim that Russian prose conforms to STE.

Onboarding updates only `learner-profile.json` and `Learner Profile.md`. These
preferences apply across topics, and you can change them later by running
onboarding again. To start a subject after setup, say:

```text
I want to learn probability so I can make better decisions under uncertainty.
I am starting from the basics and can return three times a week.
```

The tutor then records a separate plan for that topic and starts a useful lesson.

## What It Does

**From zero to learning in under 5 minutes:**

```
You: "I want to learn about reinforcement learning"
Skill: creates 15 concept notes, a dependency-ordered roadmap, recall queue → starts teaching
```

```
You: "teach me this paper" [drops PDF]
Skill: extracts 5 key concepts → explains each with comprehension checks → offers to add to roadmap
```

**Or continue a structured roadmap:**

1. **Picks the next concept** from your learning roadmap
2. **Checks recall** of previously learned concepts (spaced repetition: 3d → 7d → 21d)
3. **Explains the concept** using adaptive archetypes (misconception flip, problem-first, contrast, historical narrative, worked example)
4. **Builds an interactive HTML visualization** in the background (for quantitative/visual concepts)
5. **Runs a comprehension check** from a pool of 18 formats (never the same two sessions in a row)
6. **Applies the concept** via interactive exploration, scenario exercise, or writing exercise
7. **Maps connections** to previously learned concepts
8. **Logs everything** — session protocol, execution log, recall queue, glossary updates

The spiral curriculum means you visit each concept up to three times:

| Pass | Goal | Depth |
|------|------|-------|
| **Pass 1: Overview** | "What is this and why does it matter?" | ~10-20 min |
| **Pass 2: Working Understanding** | "How does it work? Can I evaluate and apply it?" | ~20-30 min |
| **Pass 3: Fluency** | "Can I write and argue with this in a paper?" | ~30-45 min |

## Domain Modes

| Mode | Best for | Comprehension checks sound like... |
|------|----------|-----------------------------------|
| `research` | PhD students, postdocs, researchers | "Write the Related Work sentence", "Reviewer 2 says..." |
| `professional` | Industry professionals, L&D, consultants | "Brief your manager", "Write the decision memo" |
| `self-study` | Independent learners, career changers | "Explain at dinner", "Write a blog post opener" |

The skill detects the right mode automatically from your concept notes and roadmap content. If it's ambiguous, it asks once during the first session. No configuration needed.

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (CLI, desktop, or IDE extension)
- A folder for your notes (Obsidian vault, markdown folder, or any text-based system)
- That's it. The skill creates everything else.

## Quick Start

### The fast way (no setup)

```bash
# 1. Clone the repo
git clone https://github.com/wse-research/guided-learning-skill.git

# 2. Copy the skill into your vault
mkdir -p YOUR_VAULT/SKILLS/guided-learning/logs
cp guided-learning-skill/SKILL.md YOUR_VAULT/SKILLS/guided-learning/
cp guided-learning-skill/CHANGELOG.md YOUR_VAULT/SKILLS/guided-learning/

# 3. Copy the interactive design system (optional but recommended)
mkdir -p YOUR_VAULT/learning/interactives
cp guided-learning-skill/interactives/interactive.css YOUR_VAULT/learning/interactives/
cp guided-learning-skill/interactives/build.sh YOUR_VAULT/learning/interactives/
chmod +x YOUR_VAULT/learning/interactives/build.sh
```

Then open Claude Code in your vault and say:

```
"I want to learn about [your topic]"
```

The skill bootstraps a learning roadmap with 10-20 concepts, creates stub concept notes, sets up the recall queue, and starts teaching. No manual roadmap creation needed.

Or drop a source directly:

```
"Teach me this paper: /path/to/paper.pdf"
"Explain this: https://example.com/article"
```

The skill extracts key concepts from the source, teaches them with comprehension checks, and offers to add them to your roadmap for spaced recall.

### The manual way (full control)

If you prefer to build your own roadmap and concept notes from scratch, see `examples/` for templates:

- `examples/learning-roadmap.md` — roadmap format with clusters and passes
- `examples/concept-note.md` — concept note format with core claim, evidence, implications
- `examples/recall-queue.md` — empty recall queue
- `examples/session-protocol.md` — what a session log looks like

Copy these into your vault, fill them in, and say `/guided-learning` or "continue my roadmap".

### Invoking the skill

If you're using a skill system (e.g., Superpowers), the skill description handles auto-triggering. Otherwise invoke directly:

```
/guided-learning
```

Or just say: "teach me the next concept", "let's do a learning session", "I want to learn about X", "explain this paper".

## Vault Structure

After setup, your vault should look like this:

```
your-vault/
├── SKILLS/
│   └── guided-learning/
│       ├── PEDAGOGY.md       ← the method, tool-independent (read this first if you want to understand the approach)
│       ├── SKILL.md          ← the skill definition
│       ├── CHANGELOG.md
│       ├── logs/             ← execution logs (auto-generated)
│       └── references/
├── learning/
│   ├── learning-roadmap.md   ← your concept order
│   ├── recall-queue.md       ← spaced repetition tracker
│   ├── protocols/            ← session journals (auto-generated)
│   └── interactives/
│       ├── interactive.css   ← shared design system
│       ├── build.sh          ← CSS inliner for Obsidian
│       └── *.html            ← generated visualizations
├── concepts/                 ← your concept notes
├── literature/papers/        ← paper summaries
└── research/
    └── glossary.md           ← domain glossary
```

## How Sessions Work

### The Spiral

Concepts are organized into **clusters** (groups of related ideas) and visited in **three passes**:

- **Pass 1** gives you the intuition. You should be able to explain the concept in one sentence and say why it matters.
- **Pass 2** gives you working knowledge. You trace the method with real numbers, evaluate the evidence, find the boundary conditions, and connect it to other concepts.
- **Pass 3** gives you fluency. You read the original paper critically, write arguments using the concept, handle reviewer objections, and teach it to others.

### Spaced Recall

Every concept you learn enters the recall queue. Before each new session, the skill checks if any concepts are due for recall and quizzes you:

- **Solid** → interval advances (3d → 7d → 21d → removed)
- **Fuzzy** → same interval, try again next time
- **Blank** → reset to 3d, brief refresher before continuing

### Interactive Visualizations

For quantitative concepts (statistics, metrics, tradeoff spaces, sequential processes), the skill generates self-contained HTML files with:

- Sliders and controls to explore parameter spaces
- Real-time charts and visualizations
- Preset configurations for key scenarios
- "What to notice" prompts for guided exploration

These open directly in Obsidian or any browser. The dark-theme design system (`interactive.css`) keeps them visually consistent.

### Comprehension Checks

18 different formats across three passes — conference pitches, devil's advocate challenges, spot-the-flaw exercises, reviewer simulations, writing tasks. The skill never uses the same format two sessions in a row.

### Struggle Pattern Tracking

The skill tracks recurring correction types across sessions using six tags (`implication-gap`, `terminology-confusion`, `math-gap`, `scope-creep`, `shallow-framing`, `connection-blind`). Every 5 sessions, it reviews the pattern and adapts its teaching style if any tag is trending.

## Using Without Obsidian

The pedagogical method is tool-agnostic. Read `PEDAGOGY.md` for the full framework — spiral curriculum, spaced recall, comprehension check design, and struggle pattern tracking — independent of any specific tool.

`SKILL.md` automates this method for Claude Code + Obsidian, but the approach works with any note system. If you use a different setup:

- **Linking syntax:** Replace `[[wikilinks]]` with whatever your note system uses (e.g., `[text](path)` for standard Markdown).
- **Interactive build:** Skip `build.sh` (it inlines CSS for Obsidian compatibility). Store generated HTML files as standalone files anywhere and open them in a browser.
- **Recall queue:** The spaced recall tracker is just a markdown table with concept names, dates, and intervals. It works in any text editor.

## Customization

### Adapting to Your Domain

The skill is domain-agnostic — it works with any research field. To make it work well for yours:

1. **Write good concept notes.** The richer your concept notes (core claim, evidence, implications, connections), the better the explanations.
2. **Order your roadmap by dependency.** Concepts that build on earlier ones should come later in the roadmap.
3. **Use realistic examples.** When the skill asks for "realistic values from the learner's domain," it draws from your concept notes and paper summaries.

### Changing Paths

All vault paths are listed in the **Configuration** section at the top of `SKILL.md`. Change them to match your vault structure.

### Adding Explanation Archetypes

The five archetypes (misconception flip, problem-first, contrast, historical narrative, worked example) are defined in Phase 1. You can add new ones by extending that section.

### Custom Comprehension Checks

The check pool in Phase 2 can be extended with domain-specific formats. Just add them under the appropriate pass level.

## Design Decisions

**Why a spiral curriculum?** Single-pass learning doesn't stick. Revisiting concepts at increasing depth builds layered understanding — first intuition, then mechanics, then fluency. This mirrors how experts actually learn.

**Why interactive HTML instead of static diagrams?** Parameter exploration builds intuition that reading can't. When you drag a slider and watch the ROC curve shift, you understand the tradeoff viscerally. The HTML files are self-contained (no server needed) and work in Obsidian's built-in browser.

**Why spaced recall?** Practice testing and distributed practice support retention across many studied contexts ([Dunlosky et al., 2013](https://doi.org/10.1177/1529100612453266)). The 3/7/21-day schedule is a practical starting heuristic, not a universally optimal schedule or proof of permanent retention.

**Why struggle pattern tracking?** Recurring correction types help identify gaps. If you keep missing implications, the skill adds concrete application examples. It adapts support from observed responses, without assigning a fixed learning style.

**Why execution logs + session protocols?** Logs are operational (machine-readable YAML for the skill's self-improvement loop). Protocols are human-readable journals for your own review. Both serve different purposes.

## Version History

See [CHANGELOG.md](CHANGELOG.md) for the full version history. This skill has been through 12+ iterations based on real session feedback, with changes driven by execution log analysis.

## License

MIT. See [LICENSE](LICENSE).

## Credits

Developed by [Jonas Gwozdz](https://github.com/jonasgwozdz) at the [WSE Research Group](https://github.com/wse-research), HTWK Leipzig, with support from [Netresearch DTT GmbH](https://www.netresearch.de). Born from the need to actually remember what you read.
