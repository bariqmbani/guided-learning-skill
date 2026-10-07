# Bootstrapper — Start a New Topic

After topic selection, when the selected track has no concept checklist entries yet, the skill bootstraps everything needed to start learning immediately.

### When it triggers

- Topic routing has selected the intended existing or newly created track.
- Its roadmap does not exist or has no concept checklist entries (checked or unchecked).
- Dispatch selected an ongoing course (for example, "build me a reinforcement learning curriculum" or `/guided-learning UX research methods`). An independent single-concept request has already routed to `concept-learning`.

### What it does

1. **Gather a short topic plan** using [topic intake](topic-intake.md): ask only for missing information about a useful outcome, starting knowledge, and realistic practice opportunities. Infer domain mode from the purpose; if unclear, use self-study. Optional deadlines and materials affect scope. Accept exploratory goals and skipped optional answers. Keep these decisions in the selected topic, separate from the global profile.

2. **Generate a starter roadmap** with 10-20 concepts organized into 3-5 clusters:
   - Use the learner's stated goal to pick relevant sub-topics
   - Order clusters by dependency (foundations first)
   - Each concept gets one line in the roadmap checklist
   - Write the roadmap to `{roadmap}`
   - Include a short **Learning plan** with the outcome, success demonstration, provisional starting point, practice opportunities, and domain mode. Unknowns stay unknown; do not invent a deadline or infer mastery.

3. **Generate stub concept notes** for each concept in the roadmap:
   - Create one file per concept in `{concepts_dir}`. For new tracks, use `<topic-id>--<concept-slug>.md` filenames and vault-relative wikilinks with display titles. Preserve existing legacy filenames and links.
   - Each stub has: title, a 2-3 sentence core claim (from the agent's knowledge), empty Evidence and Implications sections, and placeholder source links
   - These are starting points, not finished notes — the learner (or other skills like literature-intake) can enrich them later

4. **Create the recall queue** only if missing and the `{protocols_dir}` directory if missing. Preserve all existing recall rows and files.

5. **Create the glossary** if missing, then add the first few key terms from the topic without replacing any existing entries

6. **Announce what was created**: Briefly show the outcome, clusters, and concept count. Explain that the learner can adjust the plan as they learn.

7. **Start the first useful lesson** when the learner asked to learn. Give a short prerequisite prompt, explanation, and an attempt with feedback within the available time. Use the response to refine support; do not add a separate entrance test or redundant approval to begin. If they requested only a roadmap, stop after presenting it.

### Quality guidelines

- **Don't over-generate.** 10-20 concepts is enough for a solid foundation. The learner can always add more later. Breadth over exhaustiveness.
- **Name concepts clearly.** Use descriptive titles that make sense in isolation: "Cohen's Kappa" not "Metric 3", "Retrieval-Augmented Generation" not "Advanced Technique".
- **Cluster names should be meaningful.** "Statistical Foundations" not "Cluster 1".
- **Calibrate the starting point.** Use self-report to choose an initial level, then adjust from a brief prerequisite task and subsequent attempts. A claim to know the basics does not by itself mark foundational concepts mastered. Reuse intake evidence rather than repeating the same probes.
- **Stub notes should be useful, not empty.** The core claim should be accurate enough that the agent can teach from it in Pass 1. It's OK to use training knowledge for stubs — they'll be enriched with sources later.

Use the pinned paths from [topic routing](topic-routing.md). Starter formats are
in the sibling `../examples/` directory; adapt their paths to the selected topic.
