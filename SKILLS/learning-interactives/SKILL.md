---
name: learning-interactives
metadata:
  version: "1.0.0"
description: >
  Build or adapt an offline interactive learning activity with shared accessible
  components and tested lesson templates. Use when a learner or teaching skill
  requests an explorable model, process trace, scenario, or practice activity.
  Owns artifact construction and verification; the teaching skill owns learner
  assessment, course progress, and session records.
---

# Learning Interactives

Make an activity that reveals a useful relationship or tests an explanation.
Use a conversation, static diagram, or table when interaction adds no learning
value. This skill can serve a course, a focused concept session, or a standalone
authoring request; it never selects a course or writes learning records.

## Scope and inputs

Reuse the caller's brief: outcome, prerequisites or misconception, model and
sources, language/access/time constraints, and absolute output destination.
Course outputs use the selected topic's `interactives_dir`; concept outputs stay
in the pinned session bundle. For independent authoring, use the user's chosen
workspace. Never create learner artifacts in the setup checkout or shared kit.
Ask only for a missing decision that materially blocks the build.

Use the installed vault's own assets and configured Python interpreter. Commands
below use `python3` as a placeholder and run from this kit directory. The kit is
installed at both `SKILLS/learning-interactives/` and `learning/interactives/`;
each copy has self-contained relative references. No network is needed to build.

## Authoring workflow

1. Pick the simplest pattern that exposes the model. If undecided, read
   [pattern selection](references/patterns.md). Load one selected template and
   only the relevant [component sections](COMPONENTS.md), not the entire runtime,
   gallery, or all references.
2. Scaffold a compact editing source:

   ```sh
   python3 scaffold.py parameter-explorer /absolute/workspace/lesson.html
   ```

   This creates `lesson.source.html` and missing adjacent shared assets. It
   refuses existing source/delivery files and conflicting assets. Preserve local
   customizations; see [adaptation](references/authoring.md) if a conflict occurs.
3. Edit `lesson.source.html`: search its `EDIT` markers, then read its short
   lesson script. Change content, calculations, bounds, units, answers, and text
   alternatives together. Preserve the working semantic shell and component
   behavior. Use **warm up → explore → explain → transfer** as a compact default;
   do not block exploration on an answer unless the lesson requires it.
4. Validate the model independently at a known value and a boundary. Derive
   visuals and accessible summaries from the same results. Label synthetic data,
   assumptions, sources, and limits. Use the learner's language; runtime strings
   use the small [locale dictionary](references/localization.md).
5. Build the portable delivery page and check it:

   ```sh
   python3 /absolute/workspace/build.py lesson.source.html
   python3 verify.py /absolute/workspace/lesson.html
   ```

   The builder preserves the compact source and writes `lesson.html` with shared
   CSS/JavaScript embedded. Never read that generated file wholesale for editing.
   When only a compiled page exists, `build.py --source-view /absolute/workspace/lesson.html`
   prints its compact authored content without changing files. Save edits under
   a new basename such as `revised.source.html`, preserving the original page.
   Always use the workspace's adjacent builder and customized shared assets.
6. Apply the [verification checklist](references/verification.md): working
   controls, coherent reset/retry, keyboard use, narrow view, both themes,
   reduced motion, and offline delivery. Report checks actually performed and
   any unavailable browser or assistive-technology checks.

Return the source and delivery paths, the learner task, and validation results
to the caller. Link the delivery HTML for opening in a browser. The tutor uses
observed attempts to assess understanding and maintain its own records; page
interactions do not update progress or establish mastery. The kit stores only a
theme preference by default. Preserve that boundary unless storage is explicitly
part of the requested design.

Read [research evidence](references/evidence.md) only for rationale or research
questions. Delegation uses the same brief and pinned paths; the caller remains
responsible for the completed artifact and must not promise an unfinished build.
