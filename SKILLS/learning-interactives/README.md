# Learning Interactives

An offline authoring skill shared by Guided Learning and Concept Learning.
Ten working templates use HTML, shared CSS/JavaScript, and Python 3.9+ helpers;
no framework, package manager, CDN, account, or server is required.

Invoke `$learning-interactives` in Codex or `/learning-interactives` in Claude Code
with a learning outcome and destination. Teaching skills can also hand off a
scoped activity during a lesson. The skill builds the artifact; its caller owns
teaching, assessment, and learning records.

| Need | Read or open |
| --- | --- |
| Build or adapt an activity | [Skill workflow](SKILL.md) |
| Select a template | [Pattern selector](references/patterns.md) |
| Preview the activities | [Catalog](index.html) |
| Use a helper or style | Relevant section of [COMPONENTS.md](COMPONENTS.md) |
| See component markup | [Component gallery](components.html) |
| Adapt content or preserve local customizations | [Authoring details](references/authoring.md) |
| Translate runtime labels | [Localization](references/localization.md) |
| Check a completed page | [Verification](references/verification.md) |
| Understand the research and its limits | [Evidence](references/evidence.md) |

Edit compact `*.source.html` files; build standalone `*.html` files for delivery.
The canonical workflow contains the commands and overwrite protections. Read only
references needed for the current task, and inspect source rather than compiled
pages or the entire shared runtime.

This directory contains reusable assets, never learner records. Installation
makes independent local copies at `SKILLS/learning-interactives/` and
`learning/interactives/`. Use the installed kit for lessons in the learner's
workspace. Preserve [the MIT license](LICENSE) and attribution.

For repository maintenance, update the installer's explicit asset allowlist when
adding files. Run `python3 -m unittest discover -s tests -v` after helper/installer
changes; generated vaults must remain empty. Optional browser checks use
`node tests/interactive_browser_smoke.cjs` with a development Playwright/browser
installation. `LEARNING_PLAYWRIGHT_PATH` and `LEARNING_BROWSER_EXECUTABLE` can point
to existing installations; learner pages have no dependency on them.
