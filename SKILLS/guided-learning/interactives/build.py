#!/usr/bin/env python3
"""Inline local interactive CSS and optional JavaScript into portable HTML files.

Run with no arguments to build adjacent HTML, or name files relative to this
script (including templates/name.html). Only interactive.css / interactive.js
and their ../ forms are recognized; external URLs and other assets are untouched.
Re-running refreshes the marked blocks without changing lesson-specific code.
"""

import argparse
from pathlib import Path
import re
import sys


LINK = re.compile(
    r'<link\b(?=[^>]*\srel=[\"\']stylesheet[\"\'])'
    r'(?=[^>]*\shref=[\"\'](?:\.\./)?interactive\.css[\"\'])[^>]*>', re.IGNORECASE)
SCRIPT = re.compile(
    r'<script\b(?=[^>]*\ssrc=[\"\'](?:\.\./)?interactive\.js[\"\'])'
    r'[^>]*>\s*</script\s*>', re.IGNORECASE)


def render_html(html, directory):
    """Return HTML with referenced kit assets embedded, plus replacement count.

    Read only from the trusted kit directory, never from HTML-provided paths.
    Lessons only embed the CSS and JavaScript assets they reference.
    """
    count = 0
    for name, tag, reference in (("interactive.css", "style", LINK),
                                 ("interactive.js", "script", SCRIPT)):
        injected = re.compile(
            rf'<!-- {re.escape(name)}:start -->.*?<!-- {re.escape(name)}:end -->', re.DOTALL)
        pattern = re.compile(f"(?:{injected.pattern})|(?:{reference.pattern})",
                             re.DOTALL | re.IGNORECASE)
        if not pattern.search(html):
            continue
        asset = directory / name
        if not asset.is_file():
            raise ValueError(f"Referenced asset is missing: {asset}")
        content = asset.read_text(encoding="utf-8").rstrip("\n")
        # A closing script string in JS must not end the enclosing HTML tag.
        if tag == "script":
            content = re.sub(r"</script", lambda match: "<\\/" + match.group(0)[2:],
                             content, flags=re.IGNORECASE)
        block = f"<!-- {name}:start -->\n<{tag}>\n{content}\n</{tag}>\n<!-- {name}:end -->"
        html, replacements = pattern.subn(lambda _: block, html)
        count += replacements
    return html, count


def build(directory, filenames):
    files = [directory / name for name in filenames] if filenames else sorted(directory.glob("*.html"))
    prepared = []
    # Validate the entire batch before changing any lesson.
    for path in files:
        html = path.read_text(encoding="utf-8")
        updated, count = render_html(html, directory)
        prepared.append((path, html, updated, count))
    for path, html, updated, count in prepared:
        if not count:
            print(f"  skip: no kit asset reference or injected block found in {path.name}")
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
    except (OSError, UnicodeError, ValueError) as exc:
        parser.exit(1, f"Error: {exc}\n")


if __name__ == "__main__":
    main()
