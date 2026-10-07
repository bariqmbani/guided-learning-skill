#!/usr/bin/env python3
"""Inline interactive.css into adjacent HTML files; optionally name specific files."""

import argparse
from pathlib import Path
import re
import sys


LINK = re.compile(r'<link\s+rel=[\"\']stylesheet[\"\']\s+href=[\"\']interactive\.css[\"\']\s*/?>')
INJECTED = re.compile(r'<!-- interactive\.css:start -->.*?<!-- interactive\.css:end -->', re.DOTALL)


def build(directory, filenames):
    css = (directory / "interactive.css").read_text(encoding="utf-8").rstrip("\n")
    block = f"<!-- interactive.css:start -->\n<style>\n{css}\n</style>\n<!-- interactive.css:end -->"
    files = [directory / name for name in filenames] if filenames else sorted(directory.glob("*.html"))
    for path in files:
        html = path.read_text(encoding="utf-8")
        pattern = INJECTED if INJECTED.search(html) else LINK
        updated, count = pattern.subn(lambda _: block, html)
        if not count:
            print(f"  skip: no link tag or injected block found in {path.name}")
            continue
        if updated != html:
            path.write_text(updated, encoding="utf-8")
        print(f"  done: {path.name}")


def main():
    # Keep the terminal's encoding, but escape filenames it cannot represent.
    # A diagnostic must not abort an otherwise successful batch build.
    sys.stdout.reconfigure(errors="backslashreplace")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="*", help="HTML paths relative to this builder's directory")
    args = parser.parse_args()
    try:
        build(Path(__file__).resolve().parent, args.files)
    except (OSError, UnicodeError) as exc:
        parser.exit(1, f"Error: {exc}\n")


if __name__ == "__main__":
    main()
