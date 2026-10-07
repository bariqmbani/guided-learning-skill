#!/usr/bin/env python3
"""Create compact authoring source for a new interactive from a template.

Example: python scaffold.py parameter-explorer /path/to/topic/interactives/lesson.html
The destination names the final page. Creates lesson.source.html plus shared
assets; build.py lesson.source.html produces the standalone lesson.html later.
Existing identical assets are reused; existing source, output, and customized
assets are never overwritten. No server or packages are required.
"""

import argparse
import importlib.util
from pathlib import Path
import sys


# One line per template: the pattern name and the question it answers.
TEMPLATES = {
    "parameter-explorer": "Change an input and read the relationship it drives.",
    "step-sequence": "Walk a finite process one inspectable state at a time.",
    "comparison": "Run two models on shared inputs and shared axes.",
    "probability-lab": "Sample a seeded process and separate chance from frequency.",
    "decision-scenario": "Choose an action, see its consequence, and revise.",
    "practice-set": "Retrieve answers from memory, with hints and an explanation.",
    "order-steps": "Arrange steps and justify what forces the order.",
    "system-map": "Select a node and trace what depends on what.",
    "data-explorer": "Filter a documented dataset and read what grouping changes.",
    "geometry-lab": "Drag a construction and read the quantity it changes.",
}
ASSETS = ("interactive.css", "interactive.js", "build.py")
KIT = Path(__file__).resolve().parent


def scaffold(template, destination):
    if template not in TEMPLATES:
        raise ValueError(f"Unknown template: {template}. Choose from {', '.join(TEMPLATES)}")
    destination = Path(destination).expanduser().absolute()
    if destination.suffix != ".html":
        raise ValueError("Destination must be a new .html file")
    if destination.name.endswith('.source.html'):
        raise ValueError("Name the final .html page, not its .source.html authoring file")
    authoring = destination.with_name(destination.stem + '.source.html')
    for target in (destination, authoring):
        if target.exists() or target.is_symlink():
            raise ValueError(f"Destination already exists; nothing overwritten: {target}")
    # Match the source-checkout protection used by the concept-session helper.
    # Installed vaults have their own AGENTS.md and remain valid destinations.
    for ancestor in destination.resolve().parents:
        instructions = ancestor / "AGENTS.md"
        if (instructions.is_file() and (ancestor / "scripts/create_vault.py").is_file()
                and (ancestor / "SKILLS/guided-learning/SKILL.md").is_file()
                and "# Learning vault setup repository" in
                instructions.read_text(encoding="utf-8").splitlines()):
            raise ValueError("Keep learner data outside the setup source repository; choose a learning directory")

    source = KIT / "templates" / f"{template}.html"
    html = source.read_text(encoding="utf-8")
    # A local template may already have been built for preview. Strip only its
    # marked shared blocks so scaffolding always starts with compact source.
    spec = importlib.util.spec_from_file_location('interactive_builder', KIT / 'build.py')
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    html = builder.source_view(html)
    # Templates live one directory below the assets; authoring pages sit beside
    # their local copies. Keep the source small until the final delivery build.
    html = html.replace('href="../interactive.css"', 'href="interactive.css"')
    html = html.replace('src="../interactive.js"', 'src="interactive.js"')
    assets = {}
    for name in ASSETS:
        assets[name] = (KIT / name).read_bytes()
        target = destination.parent / name
        if target.is_symlink() or (target.exists() and
                                  (not target.is_file() or target.read_bytes() != assets[name])):
            raise ValueError(f"Asset conflict; nothing overwritten: {target}. "
                             "Use a new directory or a kit matching the existing assets.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    created = []
    try:
        for name, content in assets.items():
            target = destination.parent / name
            if target.exists():
                continue
            with target.open("xb") as handle:
                created.append(target)
                handle.write(content)
        with authoring.open("x", encoding="utf-8") as handle:
            created.append(authoring)
            handle.write(html)
    except BaseException:
        for path in reversed(created):
            path.unlink(missing_ok=True)
        raise
    return authoring


def main():
    sys.stdout.reconfigure(errors="backslashreplace")
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("template", choices=tuple(TEMPLATES), metavar="template",
                        help="one of:\n" + "\n".join(f"  {name:<20} {why}"
                                                      for name, why in TEMPLATES.items()))
    parser.add_argument("destination", type=Path, help="new final .html filename in a learning workspace")
    args = parser.parse_args()
    try:
        destination = scaffold(args.template, args.destination)
    except (OSError, UnicodeError, ValueError) as exc:
        parser.exit(1, f"Error: {exc}\n")
    print(f"Created authoring source: {destination}")
    print(f'After editing, build the standalone page: pass "{destination.name}" to "{destination.parent / "build.py"}" '
          'using the same Python interpreter.')


if __name__ == "__main__":
    main()
