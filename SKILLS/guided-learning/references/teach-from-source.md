# Teach-from-Source — Learn from a PDF, URL, or Paste

When a specific source (PDF, URL, or pasted text) is assigned to a course, the skill extracts concepts and teaches them within that topic. Dispatch an independent one-concept source lesson to `concept-learning` before topic selection.

### When it triggers

Course intent has already been established, and:

- The learner provides a file path to a PDF or text file
- The learner provides a URL to an article, paper, or documentation page
- The learner pastes a block of text they want to understand
- The learner says something like "teach me this paper", "explain this article", "help me understand this"

### What it does

After dispatch selects this course workflow, establish the intended topic using the [topic-routing rules](topic-routing.md). Never silently add an unrelated source to the active roadmap.

1. **Extract the source content:**
   - PDF: read the full text (use available PDF reading tools)
   - URL: fetch and extract the main content (use WebFetch or similar)
   - Paste: use the provided text directly

2. **Identify 3-7 key concepts** from the source:
   - Each concept should be a distinct, teachable idea
   - Order them by dependency (foundational concepts first)
   - For academic papers: align with the paper's structure (background concepts, the main contribution, methodology, key findings)
   - For articles/docs: extract the main ideas and their building blocks

3. **Create a temporary session plan** (announced to the learner, not necessarily written to a file):
   - "I found [N] key concepts in this source: [list]. I'll teach them in order, starting with [first concept]."
   - Ask: "Want me to cover all of them, or focus on specific ones?"

4. **For each selected concept, run a condensed session:**
   - **Explain** using the appropriate archetype (Phase 1 logic), drawing on the source text as primary material
   - **Build an interactive** if the concept warrants it (Phase 1b; read [interactives](interactives.md))
   - **Comprehension check** (Phase 2; read [comprehension checks](comprehension-checks.md), one check per concept)
   - Skip Phase 3 (application) and Phase 3b (connection mapping) for speed — this is a first-encounter mode, not deep study
   - Concepts that deserve deeper treatment get flagged for the full session flow later

5. **After the session, offer to persist:**
   - "Want me to add these concepts to your learning roadmap for deeper study later?"
   - If yes: create concept notes in `{concepts_dir}`, add them to the roadmap (or create one if it doesn't exist — follow [Bootstrapper](bootstrap.md)), and schedule recall
   - If no: just write a session protocol and move on

### Guidelines

- **Teach, don't summarize.** The learner can read the source themselves. The value is in explanation, context, prerequisite filling, and comprehension checking.
- **Stay faithful to the source.** When teaching from a specific paper or article, the explanations should reflect what that source actually says, not generic knowledge about the topic.
- **Handle prerequisites.** If the source assumes knowledge the learner doesn't have (detected via prerequisite probing), explain those first — even if they're not in the source itself.
- **Respect scope.** A 3-page blog post yields 2-3 concepts. A 30-page paper yields 5-7. Don't force more concepts than the source supports.

Phase numbers refer to the core session flow already in context. Before writing
the session protocol or other session records, read [session records](session-records.md).
