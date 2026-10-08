# Learning Vault Setup

Create an Obsidian learning vault for Codex or Claude Code. Use a shared learner
profile, study one concept in a focused session, or follow a course with a spiral
curriculum and spaced recall.

| What you want | Codex | Claude Code |
| --- | --- | --- |
| Set or update shared learning preferences | `$learner-profile` | `/learner-profile` |
| Understand one concept | `$concept-learning bubble sort` | `/concept-learning bubble sort` |
| Start or continue a course | `$guided-learning probability` | `/guided-learning probability` |
| Build an interactive activity | `$learning-interactives` | `/learning-interactives` |

Profile setup is optional. Both teaching skills use the same saved preferences
and can begin before the profile is configured.

Current releases: [learner-profile 1.0.2](SKILLS/learner-profile/CHANGELOG.md),
[concept-learning 1.1.0](SKILLS/concept-learning/CHANGELOG.md),
[guided-learning 3.8.0](SKILLS/guided-learning/CHANGELOG.md), and
[learning-interactives 1.0.0](SKILLS/learning-interactives/CHANGELOG.md). Versions are recorded
in each skill's `metadata.version`; generated vaults preserve those versions and
the complete changelogs.

## Install with an agent

Copy this prompt into an agent with terminal access. Replace `<vault-path>` with
an absolute path to a new folder outside the source setup directory.

```text
Create an empty Obsidian learning vault at "<vault-path>" using:
https://github.com/bariqmbani/obsidian-learning-vault

Get main via Git or a source ZIP. Follow INSTALLATION.md for prerequisites,
shell-specific setup, installation, and verification. Honor AGENTS.md and
SHARING.md. Use a new destination outside the source directory; never overwrite.

Report the vault path, working Python command, and how to open it in Obsidian.
Briefly explain the four skills and their Codex and Claude Code invocations.
```

## Install an empty vault

This repository contains the installer, four skills, documentation, and reusable
templates. Learner profiles, topics, roadmaps, and concept-session documents belong
in a separate installed vault or learning workspace. Create your own empty vault with:

```sh
sh scripts/install_vault.sh ../my-learning --name "My Learning"
```

In PowerShell:

```powershell
.\scripts\install_vault.ps1 'C:\Learning\My Vault' --name 'My Learning'
```

The wrappers detect a compatible Python interpreter. Or run
`python3 scripts/create_vault.py ../my-learning` directly; on Windows,
`py -3 scripts/create_vault.py 'C:\Learning\My Vault'` also works when `.ps1`
execution is blocked. Python 3.9 or newer is required for installation and learning
helpers. Git is optional: a source ZIP works too. See
[installation and dependency recovery](INSTALLATION.md) for missing Git, missing
Python, offline setup, and shell-specific commands.

Installation is a one-time copy. The vault keeps its own local skills, helpers,
and templates and operates independently of this checkout and its remote.
Later repository changes do not update installed vaults or sync with their data.
To adopt a newer setup, run `python3 scripts/update_vault.py <vault-path>` from
an updated checkout. It never changes your profile, courses, or concept sessions,
and it keeps setup files you edited. See
[updating an installed vault](INSTALLATION.md#update-an-installed-vault).

The installer remembers Python in `runtime.local.toml` for future sessions.
See [runtime configuration](INSTALLATION.md#python-in-a-new-session-or-an-existing-vault)
to refresh it or configure a shared ZIP.

Interactive HTML builds use Python on all platforms. The destination must be a
new directory outside the source
setup directory, including all its subdirectories. When generating another vault
from an installed vault, choose a destination outside that source vault as well.

The [interactive learning kit](SKILLS/learning-interactives/README.md)
includes ten runnable templates, reusable controls/charts, and an offline HTML
scaffolder. [Open its catalog](SKILLS/learning-interactives/index.html) in a
browser to explore the patterns. Installed vaults receive the kit under
`learning/interactives/`. Its on-demand skill serves both teaching workflows.
Tutors edit compact `.source.html` files in the learner's workspace and build
standalone `.html` pages for delivery. Locale dictionaries translate runtime
labels without copying the shared implementation.

Open the new folder in Obsidian. Run `codex` or `claude` from that folder, then
choose a skill from the table above. The installer registers all four skills
for both agents without asking learning questions or creating learner sessions.

## Onboarding example

Run `$learner-profile` in Codex, or `/learner-profile` in Claude
Code. The tutor guides you one question at a time through language, preferred
name, background, broad goals, learning context, session time, explanation style,
preferred activities, and other preferences. Every answer is optional: say
**skip**, **you choose**, or **finish**. You never need to edit JSON yourself.
You can also request a targeted update without repeating the full conversation.

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
$learner-profile

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

Profile setup updates only the workspace-root `learner-profile.json` and
`Learner Profile.md`. Both teaching skills use these preferences. The shared
helper lives at `SKILLS/learner-profile/scripts/profile.py`; its former
`SKILLS/guided-learning/scripts/profile.py` path remains a compatibility alias.
Updating preferences preserves your course progress and concept-session documents.

## Learn one concept

For a focused lesson, use `$concept-learning bubble sort` in Codex or
`/concept-learning bubble sort` in Claude Code. The tutor establishes what you
want to do, checks relevant prerequisites, works through an example, and lets you
try a new example with feedback. It adapts to your shared profile and current
requests. A visual or interactive is used when it helps the task.

Every concept-learning session saves a bundle in the learning workspace:

```text
concept-sessions/YYYY-MM-DD_slug/
  note.md               # explanation and worked examples
  mentor-feedback.md    # observed attempts, feedback, and remaining gaps
  practice.md           # practice tasks and recorded attempts
  interactive.html      # when useful
  resources.md          # when useful
```

The three Markdown documents are always created; partial sessions record what
actually happened and what remains. This route does not create or modify course
topics, roadmaps, or recall queues during ordinary use. If you explicitly ask to
continue as a course, guided-learning can create or extend the intended track
while preserving the concept-session bundle.

A successful attempt shows understanding in that session. It does not establish
lasting retention; return to practice or choose a course when that is your goal.

## Follow a course

Use `$guided-learning` in Codex or `/guided-learning` in Claude Code. To start a
subject, say:

```text
I want to learn probability so I can make better decisions under uncertainty.
I am starting from the basics and can return three times a week.
```

The tutor records a separate plan for that topic and starts a useful lesson.
Each topic keeps its own roadmap, concept notes, practice, recall queue, and
session history. The spiral curriculum revisits concepts at increasing depth.

## Continue learning

Say **Continue [topic]** to resume a course or **I want to learn [new topic]** to
start a separate subject with guided-learning. Updating your profile does not reset course progress.
A topic's plan and your current requests take priority over vault defaults.

Feedback can shape future lessons. For example, after "Why didn't you show the
full sentence first?", the tutor can propose showing the original input before
deriving counts. It asks before saving the change, and you choose **this topic**,
**the whole vault**, **both**, or **neither** when a course topic is selected. Vault preferences are saved in your
learner profile; topic preferences stay in that topic's roadmap. See
[personalization from feedback](SKILLS/learner-profile/references/personalization.md).

Read [SHARING.md](SHARING.md) for installation, public-template sharing, and setup
maintenance. The [skill instructions](SKILLS/guided-learning/SKILL.md) define the
course flow. See [concept-learning](SKILLS/concept-learning/SKILL.md) for the focused
lesson contract and [learner-profile](SKILLS/learner-profile/SKILL.md) for shared
preferences. The [onboarding research rationale](SKILLS/learner-profile/references/onboarding-evidence.md)
explains the question design and its limits. Research informs the teaching
principles; it does not validate these exact agent skills as learning interventions.

This setup builds on the [WSE Research guided-learning skill](https://github.com/WSE-research/guided-learning-skill).
Its [MIT license](SKILLS/guided-learning/LICENSE) and upstream attribution are retained.
