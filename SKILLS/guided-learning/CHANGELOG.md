# Guided Learning — Changelog

## [3.8.0] — 2026-10-07

### Changed

- Extract interactive authoring into the shared `learning-interactives` skill;
  keep course timing, pinned paths, learner assessment, and records here.
- Load only the current pass's explanation, checks, and connection guidance.
  Consolidate shared teaching and topic routing to reduce repeated instructions.
- Retain the explicit Phase 1 pass overview, multi-concept rules, and Quality Bar;
  selected-pass guidance remains required before teaching.
- Preserve concrete Obsidian formatting guidance and every check's underlying
  task; clarify course routing and record unattempted application honestly.
- Keep the 10–20-concept roadmap, creating concept notes when approached instead
  of generating every stub upfront. Roadmap-only requests create no notes.
- Store session narrative once in the learner protocol; compact execution logs
  retain review metadata and link to that evidence, including observed attempts,
  support, and what helped. Preserve older records.
- Make unassessed and assisted work explicit; unfinished work does not mark a
  roadmap concept complete or enter recall as a learned concept.

## [3.7.1] — 2026-10-07

### Added — Notation, components, and five more activity patterns

- Set mathematics as mathematics: `LearningUI.math` compiles a TeX subset to
  native MathML, so fractions, exponents, roots, sums, and matrices use the
  browser's math font and are read aloud as mathematics, with no library and no
  network. `\term{n}{…}` ties one part of a formula to the control or series that
  moves it, always alongside a key that names the term in words.
- Add five templates — practice set, order the steps, system map, data explorer,
  and geometry lab — covering retrieval, construction, structure, reading data,
  and justifying a formula. The catalog now offers ten complete activities.
- Add components for the ways learners actually practise: `mountQuiz`,
  `mountPrediction`, `mountHints`, `mountSelfExplain`, `mountSortable`, and
  `mountMatching`, plus `bindChoice`, `bindCheckbox`, and formatting, seeded
  randomness, and change-highlight helpers.
- Extend figures: area, step, and scatter series, reference lines and bands, an
  explicit baseline curve for before-and-after comparison, rounded axis steps,
  and a chart cursor reachable with the arrow keys that reports values through a
  live region. Add `renderBars` for counts and `renderGrid` for matrices, truth
  tables, and heat maps, and `LearningUI.svg` for diagrams drawn by hand.
- Add `verify.py`, a standard-library checker that reports broken labels,
  duplicate ids, network requests in an offline page, missing runtime or stepper
  controls, unrendered notation, and leftover template text, and exits non-zero.
- Add `COMPONENTS.md`, a full contract for every helper and class, and
  `components.html`, which shows each one working beside its markup.

### Changed — Readability, motion, and theme

- Rebuild the stylesheet around design tokens and add a dark palette. Measured
  every rendered text pair in both themes: the secondary text token now reaches
  4.7:1, and form-field boundaries reach 4.1:1 for the 3:1 non-text criterion.
- Give the step sequence a progress bar, a scrubber, a step list, and arrow-key
  stepping; give sliders a filled track and a value chip.
- Make motion carry meaning only: values flash when they change, charts tween
  between states, and every effect is skipped under reduced motion.
- Replace monospace equations across the templates and the worked example with
  rendered notation, including live fractions in precision and recall.
- Expand the research note with prediction-before-observation evidence, the
  MathML decision, and chart text alternatives; expand the taxonomy to the ten
  patterns. Add verifier tests and extend the optional browser smoke test to
  twelve pages, the chart cursor, ordering, notation, and the dark palette.

## [3.7.0] — 2026-10-07

### Added — Reusable interactive learning toolkit

- Add five complete, offline templates for parameter exploration, step sequences,
  comparisons, probability experiments, and decision scenarios, with a browser gallery.
- Add shared JavaScript components for labeled controls, feedback and retry,
  finite playback, and responsive charts with table alternatives. Improve layout,
  keyboard access, focus visibility, reset behavior, and reduced-motion support.
- Add `scaffold.py` to create standalone HTML from a template while protecting
  existing pages and customized assets. Extend `build.py` to inline shared CSS
  and optional JavaScript, with idempotent refresh and batch validation.
- Add an authoring guide, component recipes, pattern selection, and cited research
  rationale to reduce tutor setup work. Use “Warm up,” “Test your knowledge,” and
  “Check answer” labels suited to each activity.

### Changed — Examples, teaching workflow, and local installation

- Rebuild the precision/recall example around an inspectable sample dataset,
  including undefined precision when nothing is flagged and a transfer question.
- Make background building depend on host capabilities and require review before
  announcing an activity ready; remove assumptions about tool names and timing.
- Package the complete toolkit in fresh vaults and copy CSS, JavaScript, and the
  Python builder into new topics. Keep installations as independent local copies;
  remove repository-upgrade guidance and obsolete shell-builder handling.
- Expand installer and builder tests, verify that installed tools work after the
  source copy is removed, and add optional browser checks for all six lessons.
  Fresh vaults retain empty learner records, with license and attribution preserved.

## [3.6.4] — 2026-10-07

### Changed — Onboarding instruction overhead

- Retire `$guided-learning onboard` and `/guided-learning onboard`; direct users to learner-profile without starting setup or creating a course.
- Remove alias advertising from generated vault guidance and break the topic-routing/personalization reference loop. Preserve teaching and course behavior.

## [3.6.3] — 2026-10-07

### Changed — Instruction organization

- Keep the complete teaching flow and quality gates in the core skill; load bootstrap, source teaching, comprehension questions, interactive construction, session records, and five-session review details when needed.
- Deduplicate shared questions while retaining domain variants, pass eligibility, and existing check-format identifiers.
- Shorten generated vault instructions and package every new reference for portable installations. Teaching, recall, bootstrap, and learning-record contracts remain unchanged.

### Changed — Portable interactive builds

- Replace the Bash CSS builder with `build.py`, using the vault's saved Python interpreter on Windows, macOS, and Linux. Update installer assets, topic scaffolding, and the modular interactive instructions together.
- Escape filenames that the terminal cannot represent so progress messages do not abort a build. Keep CSS and HTML content in UTF-8; test Unicode filenames with strict CP1252 and ASCII output encodings.

## [3.6.2] — 2026-10-07

### Fixed — Portable vault installation

- Accept canonical skill frontmatter from Windows CRLF checkouts and export Python and shell scripts with LF line endings. Include Git attributes that preserve executable-script line endings in source and installed vaults.
- Reject installation inside the source setup or vault before writing files, preventing nested vaults whose concept-session helper refuses to run. Move the documented export staging directory outside the checkout.
- Keep Home and the course dashboard introductions accurate as courses and concept sessions are created.
- Add regression coverage for CRLF installation and rejection of nested destinations without modifying the source.

## [3.6.1] — 2026-10-07

### Fixed — Shared reference cleanup

- Point personalization and onboarding research links directly to the maintained learner-profile references in source documentation and generated vaults.
- Remove the four obsolete onboarding and personalization forwarding documents from guided-learning and its installer assets. The `guided-learning onboard` command and legacy profile-helper path remain supported.
- Remove the unused session-log template; the execution-log schema remains in `SKILL.md`.

## [3.6.0] — 2026-10-07

### Added — Focused concept learning and shared learner profiles

- Added `concept-learning` for personalized lessons on one concept, with worked examples, learner attempts, feedback, and an independent understanding check.
- Each concept session writes `note.md`, `mentor-feedback.md`, and `practice.md` under `concept-sessions/YYYY-MM-DD_slug/`; interactives and resource lists are added when useful.
- Ordinary concept sessions leave course topics, roadmaps, and recall queues unchanged. An explicit request can promote a session into a guided-learning course while preserving its documents.
- Added `learner-profile` as the shared entry point for optional profile setup and targeted updates. Both learning skills use the same root profile files; the former `guided-learning onboard` command and profile-helper path remain compatibility aliases.
- New vaults register all three skills for Codex and Claude Code, with an unconfigured profile, an empty topic registry, and no learner concept sessions.
- Updated installation and method documentation to distinguish focused understanding from course revisitation. Same-session performance does not establish lasting mastery, and supporting research does not validate these exact agent skills as complete interventions.

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
