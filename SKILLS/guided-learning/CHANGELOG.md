# Guided Learning — Changelog

## [3.5.0] — 2026-10-06

### Changed — Harness questions during onboarding

- Prefer the host's available interactive question tool, continuing after each answer with one question outstanding at a time.
- Keep free-text answers, skips, and early completion available; UI preselection does not count as an answer.
- Fall back to chat questions when the current host or mode cannot provide the needed interaction.

## [3.4.0] — 2026-10-06

### Added — Approved personalization from feedback

- Propose concrete teaching adjustments and ask for topic, vault, both, or no saved change before adopting an inferred ongoing preference.
- Store vault defaults in the learner profile and approved topic overrides in the registered roadmap's Teaching preferences section.
- Repair current explanations immediately when requested, preserve course progress, and keep personal adaptations out of the shared skill source.

## [3.3.0] — 2026-10-06

### Changed — Guided optional onboarding

- Offer all nine editable learner-profile fields one question at a time, including preferred name, background, goals, explanation style, and activity priorities.
- Treat every answer as optional; support skips, delegated choices, targeted updates, and early completion without inventing personal details.
- Use answers to explain how examples, pacing, practice, and feedback will be tailored; preserve existing profiles and course progress.
- Copy the example interactive into fresh vaults' shared interactive folder and link it from Home.

## [3.2.0] — 2026-10-06

### Added — Shareable setup

- Converted the repository to setup files only: removed learner courses and state, moved reusable interactive assets into the skill, and kept generated vaults separate.
- Installation prompts clone `main`; generated vaults start with an empty registry and unconfigured profile.
- First onboarding explicitly asks the preferred teaching language, accepts bilingual preferences, and applies the saved choice throughout learning sessions.
- Refined onboarding from learning research: three vault prompts for language, time, and optional constraints; per-topic intake for outcomes, starting knowledge, and feasible practice.
- Default explanations adapt to the task and observed responses. Existing saved styles and aids remain valid; an empty aid list no longer restricts teaching methods. Explicit exclusions stay in text preferences.
- Added a cited research rationale and public-template publishing guidance; clarified that recall intervals and this exact onboarding flow are design choices, not validated guarantees.
- Added `scripts/create_vault.py` to generate empty vaults and shareable ZIPs from an explicit list of reusable assets.
- Fresh registries have no active topic; agent instructions and Obsidian settings are generated without account-specific paths or existing course references.
- Exported setups retain their generator and register both agents without requiring symlinks.
- Topic registry locking supports Windows and POSIX; topic metadata uses UTF-8 consistently.
- Added tests for empty exports, ZIP extraction, independent topics, repeated generation, and overwrite protection.
- Added conversational `guided-learning onboard` with learner background, goals, teaching preferences, and optional aids; validated profile storage updates preferences without touching courses.

## [3.1.0] — 2026-10-06

### Added
- Independent topic selection and registered paths for multiple learning tracks in one vault.
- Non-overwriting topic creation and switching helper; serialized registry updates and atomic saves.
- Qualified links and topic-prefixed note filenames for new tracks to protect legacy short links.
- Topic-specific mode detection, recall, journals, execution logs, and learning-history analysis.
- Topic dashboard and updated vault instructions.


## [3.0.0] — 2026-05-13

### Changed — Public release
- **Generalized for any research domain.** Removed all references to specific PhD topics, advisor names, and project-specific systems. The skill now uses "learner" and generic research domain language.
- **Added Configuration section.** All vault paths are listed at the top of SKILL.md for easy customization.
- **Added Prerequisites section.** Documents the expected vault structure before first use.
- **Version bump to 3.0.0** — public standalone release, breaking change from vault-embedded versions.

### Added
- **README with tutorial.** Step-by-step setup guide, vault structure documentation, design rationale.
- **Example files.** Starter templates for learning roadmap, recall queue, concept notes, and session protocols.
- **Standalone interactive CSS design system.** Dark-theme design system (`interactive.css`) and CSS inliner (`build.sh`) included in the repo.

---

## [2.3.0] — 2026-03-29

### Changed
- **Pass 1 explanation: Feynman template -> explanation archetypes.** Replaced the rigid 6-step Feynman structure with five adaptive archetypes: misconception flip, problem-first, contrast, historical narrative, worked example. Same quality guardrails, but the narrative shape varies by concept type.
- **Pass 2 expanded** to structured guidance: method walkthrough with concrete numbers, evidence evaluation (sample size, effect sizes, statistical tests), limitations and boundary conditions, cross-concept comparison, application mapping.
- **Pass 3 expanded** to structured guidance: paper reading with methodology critique, argumentation practice with reviewer stress-testing, multi-concept synthesis chains, counter-evidence and honest limitation writing, teaching test.
- **Paper status update now requires confirmation.** Phase 4 suggests updates and waits for learner to confirm.
- **Recall queue overflow handling.** When >3 items are overdue, prioritize previously fuzzy/blank items, defer the rest by 3 days.

### Removed
- **Method diversity rule** — removed all vestiges. Replaced by topic-fit selection.

### Fixed
- **Log filename** format: changed to `YYYY-MM-DD_sessionNN.md`.
- **Session log template**: updated to v2.3.0 schema with all new fields.

## [2.2.1] — 2026-03-28

### Added
- **Obsidian formatting guidance** — callouts, embeds, highlights, Mermaid diagrams, LaTeX for session protocols.

## [2.2.0] — 2026-03-28

### Added
- **Toggle/switch component rule**: custom toggles must use `<label for="inputId">`, not `<div>`.
- **build.sh responsibility rule**: main agent must run `build.sh` after subagent completes.

## [2.0.0] — 2026-03-21

### Added
- **Phase 0.5: Spaced Recall Check** — 3/7/21-day spaced repetition before teaching new content.
- **Concept complexity assessment** — Light/Medium/Heavy classification scaling session depth.
- **Diverse comprehension check pool** — 18 formats across 3 passes, no consecutive repeats.
- **Phase 3b: Connection Mapping** — mandatory post-application step linking new to known.
- **Struggle pattern tracking** — 6 tagged correction types reviewed every 5 sessions.

### Changed
- Session protocol template expanded with recall checks, connections, complexity fields.
- Execution log template expanded with new tracking fields.

## [1.2.0] — 2026-03-19

### Added
- **Prerequisite probe** before main explanation to catch missing foundational knowledge.

## [1.1.0] — 2026-03-18

### Changed
- **Phase 1b**: Interactive HTML launched as background subagent *during* explanation, not after.
- **Phase 2**: Interactive exploration precedes comprehension check (explore-then-test order).
- **Cross-tab data provenance** rule for multi-tab interactives.

## [1.0.0] — 2026-03-16

### Added
- Initial skill definition with spiral curriculum (3 passes: Overview -> Working Understanding -> Fluency)
- Four application methods: Interactive HTML, Scenario Exercise, Writing Exercise, Connection Mapping
- Session flow: Orient -> Explain -> Comprehension Check -> Apply -> Update & Log
- Interactive HTML guidelines
- Execution logging and self-improvement loop
