# Guided Learning Skill

Guided-learning runs courses with a spiral curriculum, independent topic tracks,
comprehension checks, practice, and spaced recall. It is one of three skills in
this setup:

| Skill | Purpose | Main records |
| --- | --- | --- |
| `learner-profile` | Optional shared preference setup and targeted updates | Root `learner-profile.json` and `Learner Profile.md` |
| `concept-learning` | A focused, personalized lesson on one concept | A bundle under `concept-sessions/` |
| `guided-learning` | Start or resume a course and revisit its concepts | A topic's roadmap, notes, recall queue, journals, and logs |

Use `$skill-name` in Codex or `/skill-name` in Claude Code. For example,
`$concept-learning bubble sort` starts a focused lesson, while
`$guided-learning probability` starts or resumes a course. Both teaching skills
use the same profile and can begin before optional setup is complete.

This repository contains reusable setup files. Learning records belong in a
separate installed vault or learning workspace. Follow the installation prompt
below, or [the sharing instructions](../../SHARING.md).

## Install with an agent

Copy this prompt into an agent with terminal access. Replace `<vault-path>` with
an absolute path to a new folder.

```text
Create an empty Obsidian learning vault at "<vault-path>" using:
https://github.com/bariqmbani/guided-learning-skill

Get main via Git or a source ZIP. Follow INSTALLATION.md for prerequisites,
shell-specific setup, installation, and verification. Honor AGENTS.md and
SHARING.md. Use a new destination outside the source directory; never overwrite.

Report the vault path, working Python command, and how to open it in Obsidian.
Briefly explain the three skills and their Codex and Claude Code invocations.
```

For terminal installation, run from this setup repository:

```sh
sh scripts/install_vault.sh ../my-learning --name "My Learning"
```

In PowerShell, use `./scripts/install_vault.ps1 'C:\Learning\My Vault'`.
See [installation and dependency recovery](../../INSTALLATION.md) for archive
downloads without Git, missing Python, and direct Python invocation when
PowerShell script execution is blocked.

The destination must be new and outside the source setup or vault directory tree.
Python 3.9 or newer is required, including for interactive HTML builds on Windows,
macOS, and Linux. Open the generated folder
in Obsidian and run `codex` or `claude` there. All three skills are registered for
both agents; the new vault has an empty topic registry, an unconfigured profile,
and no learner concept sessions.

## Shared learner preferences

Run `$learner-profile` in Codex or `/learner-profile` in Claude Code to set up
preferences. Every answer is optional, and you can skip questions or finish
early. For later changes, request only the fields you want to update.
See [the full onboarding example](../../README.md#onboarding-example).

Both learning skills read the root `learner-profile.json` and `Learner Profile.md`.
The canonical helper is `SKILLS/learner-profile/scripts/profile.py`; the old
`SKILLS/guided-learning/scripts/profile.py` path remains a compatibility alias.
Profile updates preserve unrelated preferences and existing learning records.

Current requests take priority over saved preferences. Within a course, approved
preferences in the selected roadmap override vault defaults. The tutor repairs
an explanation immediately and asks before saving an inferred ongoing adjustment;
see [personalization from feedback](../learner-profile/references/personalization.md).

## Choose a focused concept lesson

Use `$concept-learning bubble sort` or `/concept-learning bubble sort` when your
goal is one concept. The tutor sets a concrete outcome, checks the necessary
starting knowledge, explains with a worked example, and gives you an attempt and
feedback. It can add an interactive when useful for the concept and accessible
to you.

Every session creates these documents in the learning workspace:

```text
concept-sessions/YYYY-MM-DD_slug/
  note.md
  mentor-feedback.md
  practice.md
```

`interactive.html` and `resources.md` are conditional additions. The records
capture actual attempts and remaining gaps, including incomplete sessions.
Ordinary concept lessons do not create or modify course topics, roadmaps, or
recall queues. An explicit request to continue as a course hands off to
guided-learning and preserves the session bundle.

This route can teach intuition and mechanism in one session. A correct answer
shows performance at that moment; it does not prove lasting retention. See
[concept-learning's instructions](../concept-learning/SKILL.md) for the flow.

## Start or resume a course

Use `$guided-learning` in Codex or `/guided-learning` in Claude Code. Three course
entry points are supported:

- **A new subject:** state your goal and starting point. The tutor creates a
  starter roadmap of 10–20 concepts and begins a useful first lesson.
- **An existing topic:** say **Continue [topic]** or **Continue my roadmap** to
  resume the intended track.
- **A source:** provide a PDF, URL, or pasted text. The tutor resolves the intended
  topic, teaches the selected source concepts, and offers to add them to the roadmap.

Each topic has an independent plan, domain mode, roadmap, notes, recall queue,
glossary, protocols, and logs. New subjects do not silently extend another
course. Existing progress and recall dates are preserved. Topic resolution and
registered paths are defined in [topic-routing.md](references/topic-routing.md).

## How course sessions work

1. Resolve the topic and select the next concept or requested concept.
2. Check up to two concepts due for spaced recall.
3. Probe relevant prerequisites and explain at the current pass's depth.
4. Use a comprehension check and practice with feedback.
5. Connect the concept to existing knowledge.
6. Record the session and update the topic's course records and recall queue.

Concepts are grouped into related clusters and revisited across three passes:

| Pass | Intended outcome |
| --- | --- |
| Overview | State the core idea and why it matters |
| Working understanding | Trace the mechanism, apply it, and identify limitations |
| Fluency | Use the concept in writing, argumentation, synthesis, or relevant work |

The `research`, `professional`, and `self-study` domain modes adapt examples and
checks to the learner's purpose. Teaching uses observed responses, task needs,
time, and access constraints; presentation preferences are adjustable preferences,
not fixed learner types.

Recall uses a 3 → 7 → 21 day starting schedule. Accurate recall advances the
interval; a fuzzy response repeats it; a blank response resets it with a brief
refresher. These intervals are a practical heuristic, not universally optimal.
Completing a queue cycle is evidence at those delays, not permanent mastery.

Interactive HTML can make algorithms, parameter changes, or tradeoffs easier to
inspect. Course interactives use the selected topic's CSS and builder; static
examples or other exercises are appropriate when an interactive is unnecessary
or inaccessible. Notes and protocols also work without Obsidian; use Markdown
links appropriate to your note system.

## Learning workspace structure

The installer starts with empty learning state. As you study, records are added
under separate roots:

```text
your-vault/
  SKILLS/
    learner-profile/
    concept-learning/
    guided-learning/
  learner-profile.json
  Learner Profile.md
  learning/interactives/       # reusable shared assets
  concept-sessions/            # created by concept lessons
    YYYY-MM-DD_slug/
      note.md
      mentor-feedback.md
      practice.md
  topics/
    registry.json
    README.md
    <topic-id>/                # created for a course
      learning/
        learning-roadmap.md
        recall-queue.md
        protocols/
        interactives/
      concepts/
      literature/papers/
      research/glossary.md
      logs/
```

Existing or migrated courses retain their registered paths. Do not edit the
shared skill to store personal preferences, and do not use this source checkout
as a learner workspace.

## Method and evidence

[PEDAGOGY.md](PEDAGOGY.md) describes the spiral method and how it relates to focused
concept sessions. [The research rationale](../learner-profile/references/onboarding-evidence.md)
links the teaching principles to research and explains their limits. The evidence
does not establish that these exact agent skills or their assessment judgments
are validated learning interventions. Evaluate explanation accuracy, independent
application, and later recall as well as learner feedback.

See [SKILL.md](SKILL.md) for course instructions and [CHANGELOG.md](CHANGELOG.md)
for version history. Preserve the existing license and attribution when adapting
the setup.

## License and credits

MIT. See [LICENSE](LICENSE).

The original guided-learning skill was developed by
[Jonas Gwozdz](https://github.com/jonasgwozdz) at the
[WSE Research Group](https://github.com/wse-research), HTWK Leipzig, with support
from [Netresearch DTT GmbH](https://www.netresearch.de). This setup builds on
[WSE Research's guided-learning skill](https://github.com/WSE-research/guided-learning-skill).
The pinned upstream version is recorded in [UPSTREAM.json](UPSTREAM.json).
