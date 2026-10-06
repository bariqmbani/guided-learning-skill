# Learning Vault Setup

Create an Obsidian vault with guided learning in Codex or Claude Code. Each topic keeps
its own roadmap, concept notes, practice, recall queue, and session history.

## Install with an agent

Copy this prompt into Codex, Claude Code, or another agent that can run terminal
commands. Replace `<vault-path>` with your new vault's location, such as
`~/Documents/my-learning`.

```text
Create a fresh, empty Obsidian learning vault at <vault-path>, named "My Learning".

1. Check that Git and Python 3.9 or newer are available. Report any missing
   prerequisite. If the destination already exists, keep it intact and ask me
   for a different path.
2. Choose a new temporary directory for <temporary-template-directory>, then
   clone the setup repository from main there:

   git clone --branch main --single-branch --depth 1 https://github.com/bariqmbani/guided-learning-skill.git <temporary-template-directory>

3. Read the cloned README and installer. Create my vault with:

   python3 "<temporary-template-directory>/scripts/create_vault.py" "<vault-path>" --name "My Learning"

   On Windows, use py -3 if python3 is unavailable. Keep the template checkout
   separate from my learning vault.
4. Verify that the vault has Obsidian settings and guided-learning skill entries
   for Codex and Claude Code. Confirm topics/registry.json has active_topic: null
   and topics: [], and learner-profile.json has configured: false. Confirm there
   are no course notes, learning history, or copied Git repository in the vault.
5. Report the completed vault path and tell me how to open it in Obsidian.
   Tell me to run Codex or Claude Code from that folder and start with
   $guided-learning onboard in Codex or /guided-learning onboard in Claude Code.

Leave the learner profile unconfigured until onboarding. Do not create a topic,
generate a roadmap, or start a lesson during installation.
```

The clone command selects main, which contains the setup files. The installer
creates a separate vault with fresh learning data; onboarding happens in your
learning chat afterward.

## Install an empty vault

This repository contains the installer, skill, documentation, and reusable
templates. Learner profiles, topics, roadmaps, and session history belong in a
separate installed vault. Create your own empty vault with:

```sh
./scripts/install_vault.sh ../my-learning --name "My Learning"
```

Or run `python3 scripts/create_vault.py ../my-learning` directly. Python 3.9 or
newer is required. Interactive HTML builds use Bash; on Windows, use WSL or Git
Bash for those builds. The destination must be a new directory.

Open the new folder in Obsidian. Run `codex` or `claude` from that folder, then
start onboarding in the learning chat. The installer does not ask learning questions.

## Onboarding example

Run `$guided-learning onboard` in Codex, or `/guided-learning onboard` in Claude
Code. Answer the tutor's questions in your own words. You can also include your
answers in the first message:

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

## Continue learning

Say **Continue [topic]** to resume a course or **I want to learn [new topic]** to
start a separate subject. Updating your profile does not reset course progress.
A topic's plan and your current requests take priority over vault defaults.

The [skill instructions](SKILLS/guided-learning/SKILL.md) define the teaching
flow. The [onboarding research rationale](SKILLS/guided-learning/references/onboarding-evidence.md)
explains the question design and its limits.

## Share a fresh vault

```sh
./scripts/install_vault.sh dist/learning-starter --zip dist/learning-starter.zip
```

The destination and ZIP must be new paths. Send the ZIP to a friend; they extract
it, open the folder in Obsidian, and start onboarding. The export contains setup
files, an empty topic registry, and an unconfigured profile. It excludes existing
courses, journals, learner answers, and Git history. Keep your learning vault
outside this repository. Deleting working files does not erase old Git commits.

This setup builds on the [WSE Research guided-learning skill](https://github.com/WSE-research/guided-learning-skill).
Its [MIT license](LICENSE) and pinned upstream attribution are retained.
