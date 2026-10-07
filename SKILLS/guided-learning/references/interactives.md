# Interactive Construction

## Launch during explanation

**Immediately after delivering the Phase 1 explanation**, check whether this concept warrants an interactive HTML visualization (use the core flow's Phase 3 selection criteria). If yes:

First check the profile's access constraints and available tools. For text-only preferences, inaccessible controls, or a tight session budget, use a static explanation or worked example that serves the same learning goal. A visual presentation preference alone does not make an interactive necessary.

1. **Launch a background subagent** (Agent tool, `run_in_background: true`) to build the interactive HTML file.
   - Pass the subagent the full concept content, pinned CSS and build script paths, output filename, and this reference's construction guidelines.
   - The subagent should follow all Interactive HTML Guidelines below without loading unrelated teaching references.
2. **Do not wait** — proceed immediately to Phase 2 (Comprehension Check). The learner reads your explanation while the interactive builds.
3. When the subagent completes, **announce it** before the learner answers the comprehension check prompt: *"The interactive is ready — open `{interactives_dir}/YYYY-MM-DD_concept-slug.html` and explore it before answering."*
4. If the concept does not warrant an interactive (e.g., it's a writing or scenario exercise), skip this phase entirely.

**Learning order:** The interactive reinforces the explanation visually *before* the learner has to reproduce the concept — not after. Seeing the model in motion gives them something concrete to reason about during the comprehension check.

## Page content

Create a self-contained HTML file with interactive controls (sliders, toggles,
input fields), a real-time visualization, brief explanation, and "What to notice"
prompts. Use realistic domain values and save it to
`{interactives_dir}/YYYY-MM-DD_concept-slug.html`.

## Interactive HTML Guidelines

When creating interactive HTML pages:

- **Shared design system**: Every interactive uses the universal stylesheet from `{css_file}`. New interactives should link it via:
  ```html
  <link rel="stylesheet" href="interactive.css">
  ```
  Run the Python `build_script` to inline CSS for Obsidian, using the interpreter
  in `runtime.local.toml`. From the vault root, for example in PowerShell:
  ```powershell
  & 'C:\path\to\python.exe' "{build_script}"
  ```
  Append a filename to build just that file; paths are relative to the builder.
  For an older `build.sh` registration, use its sibling `build.py`. If absent,
  copy the reusable `SKILLS/guided-learning/interactives/build.py` beside the
  selected topic's CSS first. Keep its existing CSS and learning records.
  The script replaces the `<link>` tag with an inline `<style>` block wrapped in `<!-- interactive.css:start -->` / `<!-- interactive.css:end -->` markers. It's idempotent — re-running after CSS edits updates all HTML files. Page-specific styles go in a separate inline `<style>` block.
- **Class conventions**: Use the standard classes from `interactive.css`:
  - Layout: `.layout` (sidebar+main), `.two-col`, `.container`, `.page-padding`
  - Surfaces: `.panel`, `.card`, `.notice`, `.notice--bar`
  - Controls: `.slider-row`, `.slider-label`, `.slider-val`, `.control-group`
  - Buttons: `.btn`, `.btn-secondary`, `.btn-sm`, `.btn-row`, `.preset-row`, `.preset-btn`
  - Metrics: `.metric` (inline), `.metric-row` + `.metric-bar-bg` + `.metric-bar-fill` (bar)
  - Navigation: `.nav`, `.tab-content`, `.header`, `.bottom-nav`
  - Content: `.formula`, `.explain`, `.prompt-box`, `.copy-btn`, `.tag`
  - Colors: use CSS vars (`var(--accent)`, `var(--green)`, etc.) or utility classes (`.color-tp`, `.color-cyan`, etc.)
- **Educational**: Not a tech demo — designed to teach. Include "What to notice" prompts and guided exploration steps.
- **Parameter exploration**: Let the user change inputs and see what happens in real time.
- **Domain-contextualized**: Use realistic values from the learner's research domain.
- **Mobile-friendly**: Should work in any modern browser.
- **Visually clean**: Use a simple, readable design. No flashy animations — clarity over aesthetics.
- **Cross-tab data provenance**: When an interactive has multiple tabs where later tabs depend on data configured in earlier tabs, always make this dependency explicit. Label the source tab as the shared data source, add a live summary at the end of the source tab previewing what flows into later tabs, and reference the source tab by name in later tabs' introductions. Never assume the learner tracks implicit state across tabs.
- **Toggle/switch components**: Custom toggles must use `<label for="inputId">` for the clickable track element, not `<div>`. The hidden-checkbox + styled-sibling pattern requires the visual element to be a `<label>` with a `for` attribute. CSS selectors targeting labels inside control rows must use the direct-child combinator (`>`) to avoid styling nested labels (e.g., `.toggle-row > label` not `.toggle-row label`).
- **Build verification**: After the interactive subagent completes, the main agent MUST run the selected topic's Python builder to inline CSS and check its exit status. Do not rely on the subagent to do this.
- **Store in**: `{interactives_dir}` with naming scheme `YYYY-MM-DD_concept-slug.html`.
