# Create and share an empty learning vault

Use Python 3.9 or newer. The generator uses only the standard library.

From this repository:

```sh
./scripts/install_vault.sh ../friend-learning
```

The new folder has Obsidian settings, templates, guided-learning, and shared
interactive assets. Its topic registry has `active_topic: null` and `topics: []`.
No course is selected and no personal learning content is copied.

To create a ZIP at the same time:

```sh
./scripts/install_vault.sh dist/learning-starter --zip dist/learning-starter.zip
```

Send the ZIP to your friend. They extract it, open the extracted folder in
Obsidian, and run `claude` or `codex` from that folder. Their first prompt can be:

```text
$guided-learning onboard
```

In Claude Code use `/guided-learning onboard`. The tutor first asks which
language the learner wants explanations and questions in, including a bilingual
option, then asks about typical session time and optional constraints or explicit
preferences. It saves a learner profile without creating topics or changing progress.
There is no required style quiz or catalog of extras to select.

After onboarding, start a subject with **I want to learn about [topic]**. The tutor
asks only for missing information about a useful outcome, starting knowledge,
and realistic opportunities for practice. Those answers stay in that topic's
learning plan, so different subjects can have different goals and starting points.
Exploration without a fixed goal or schedule is welcome. Lessons include attempts,
feedback, and later recall; presentation preferences can be adjusted as you learn.
Running the onboard command again updates preferences in an existing vault.
The installer itself creates files without asking learning questions.

They need Python 3.9 or newer for topic creation and either Claude Code or Codex
for learning sessions. Interactive HTML builds use Bash; Windows users can use
WSL or Git Bash for those builds. On Windows, `py -3` can replace `python3`.

The Bash entry point delegates to `scripts/create_vault.py`. You can also run
`python3 scripts/create_vault.py /path/to/new-vault` directly; on Windows use
`py -3 scripts/create_vault.py C:/path/to/new-vault`. The installer initializes
both agent skill entries and the empty topic registry inside the new vault.

An optional `--name "My Learning"` changes the heading in the generated Home
note. The destination and ZIP must be new paths; existing files are never
overwritten. The ZIP must be outside the new vault.

The generator copies an explicit list of reusable assets. Current topics,
roadmaps, recall history, journals, attachments, logs, account-specific agent
instructions, `.git`, and Obsidian workspace state are excluded. Obsidian
configuration and agent instructions are generated fresh. No Git repository is
initialized in the new vault.

An exported vault also starts with an unconfigured learner profile. The owner's
saved profile is never copied when generating another empty vault.

Native skill entries load a single canonical skill without symlinks, so they
survive ZIP extraction. The generated vault includes the generator and can
produce more empty vaults after your friend has started learning.

Upstream attribution and the MIT license are retained. Keep those files when
sharing the setup. The ZIP contains only generated setup files; sharing a clone
of this repository would also share the courses and history tracked here.

## Preparing a public repository

Publish a generated starter with fresh Git history, rather than changing the
visibility of this personal learning repository. Generate it into a new directory:

```sh
./scripts/install_vault.sh dist/learning-public-starter --name "Learning"
```

Review that folder's files and initialize a new repository there. It contains
the installer, empty registry, unconfigured profile, skill, examples, research
rationale, and MIT license; it contains no source-vault Git history. Keep the
public template checkout separate from your study vault. Someone cloning that
template should run its installer to create their own vault outside the checkout
before onboarding or learning.

The question design and evidence limits are documented in
[onboarding-evidence.md](SKILLS/guided-learning/references/onboarding-evidence.md).
The research supports teaching principles, not a guarantee that this LLM tutor
improves learning. Initial user evaluation should check whether answers affect
teaching and whether learners can later explain or apply their target skill.
