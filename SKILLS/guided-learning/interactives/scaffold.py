#!/usr/bin/env python3
"""Create a new standalone interactive from a reusable template in one command.

Example: python scaffold.py parameter-explorer /path/to/topic/interactives/lesson.html
Copies this kit's CSS, JavaScript, and builder beside the lesson for later edits.
Existing identical assets are reused; custom assets and existing HTML are never
overwritten. No server, packages, or network connection are required.
"""

import argparse
import importlib.util
from pathlib import Path
import sys


TEMPLATES = ("parameter-explorer", "step-sequence", "comparison",
             "probability-lab", "decision-scenario")
ASSETS = ("interactive.css", "interactive.js", "build.py")
KIT = Path(__file__).resolve().parent


def scaffold(template, destination):
    if template not in TEMPLATES:
        raise ValueError(f"Unknown template: {template}. Choose from {', '.join(TEMPLATES)}")
    destination = Path(destination).expanduser().absolute()
    if destination.suffix.lower() != ".html":
        raise ValueError("Destination must be a new .html file")
    if destination.exists() or destination.is_symlink():
        raise ValueError(f"Destination already exists; nothing overwritten: {destination}")
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
    assets = {}
    for name in ASSETS:
        assets[name] = (KIT / name).read_bytes()
        target = destination.parent / name
        if target.is_symlink() or (target.exists() and
                                  (not target.is_file() or target.read_bytes() != assets[name])):
            raise ValueError(f"Asset conflict; nothing overwritten: {target}. "
                             "Use a new directory or a kit matching the existing assets.")
    # Load only the builder beside this script, never a destination's custom code.
    spec = importlib.util.spec_from_file_location("interactive_builder", KIT / "build.py")
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    rendered, count = builder.render_html(html, KIT)
    if not count:
        raise ValueError(f"Template has no recognized interactive asset references: {source}")

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
        with destination.open("x", encoding="utf-8") as handle:
            created.append(destination)
            handle.write(rendered)
    except BaseException:
        for path in reversed(created):
            path.unlink(missing_ok=True)
        raise
    return destination


def main():
    sys.stdout.reconfigure(errors="backslashreplace")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("template", choices=TEMPLATES)
    parser.add_argument("destination", type=Path, help="new .html file in a learning workspace")
    args = parser.parse_args()
    try:
        destination = scaffold(args.template, args.destination)
    except (OSError, UnicodeError, ValueError) as exc:
        parser.exit(1, f"Error: {exc}\n")
    print(f"Created standalone interactive: {destination}")
    print(f'Rebuild after editing: pass "{destination.name}" to "{destination.parent / "build.py"}" '
          'using the same Python interpreter.')


if __name__ == "__main__":
    main()
