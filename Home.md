# Learning

Your personal learning vault.

## Start learning

1. In Obsidian, choose **Open folder as vault** and select this `learning` folder.
2. Open a terminal here and run `claude` or `codex`.
3. Ask **Continue tokenization** to resume your current course, or **I want to learn about [a new topic]** to create an independent track with its own roadmap and notes.

In Claude Code, you can also invoke `/guided-learning`. In Codex, invoke `$guided-learning` or ask for a guided learning session. Restart an existing agent session to discover the installed skill.

You can also ask **Teach me this paper: /path/to/paper.pdf**, provide an article URL, or say **Continue my roadmap** after you have started learning.

## Learning dashboard

- [[topics/README|All learning topics]] — choose a course or start a new subject.

The links below belong to your existing **Tokenizers and Tokenization** course. Its files remain in their original locations. New subjects have independent folders under `topics/`.

- [[learning/learning-roadmap|Learning roadmap]] — topics, clusters, and three passes.
- [[learning/recall-queue|Recall queue]] — reviews scheduled after sessions.
- [[research/glossary|Glossary]] — terms collected as you learn.
- Session journals are saved in `learning/protocols/`.
- Concept notes are saved in `concepts/`; paper summaries in `literature/papers/`.
- [Example interactive: precision and recall](learning/interactives/example-interactive.html) — open in a browser to explore.

## Templates and skill

Use Obsidian's **Templates: Insert template** command for a [[Templates/Concept|concept note]] or [[Templates/Session Protocol|session journal]].

The [guided-learning skill](https://github.com/WSE-research/guided-learning-skill) lives in `SKILLS/guided-learning/`, including its method, references, examples, and license. Both agent skill directories point to this same copy.

For the existing tokenization course, after generating or editing interactive HTML, run:

```sh
cd learning/interactives
./build.sh
```

This inlines the shared CSS for portable HTML files. Open the files in a browser if your Obsidian setup does not display HTML.

For other topics, use that topic's registered build script. Restart your agent session after the multi-topic skill update, or ask it to reread the skill and topic-routing instructions before continuing.
