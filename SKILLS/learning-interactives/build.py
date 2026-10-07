#!/usr/bin/env python3
"""Inline local interactive CSS and optional JavaScript into portable HTML files.

Author in lesson.source.html; building writes lesson.html without changing the
source. Run with no arguments to build adjacent pages, or name files relative to
this script. Ordinary .html files retain the legacy in-place build behavior.
Use --source-view FILE to read authored markup without embedded shared assets.
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
GENERATED = '<!-- learning-interactives:generated -->'
SOURCE_SUFFIX = '.source.html'


def source_view(html):
    """Return compact authored markup, leaving lesson-specific code intact."""
    for name, reference in (
        ('interactive.css', '<link rel="stylesheet" href="interactive.css">'),
        ('interactive.js', '<script src="interactive.js"></script>'),
    ):
        block = re.compile(
            rf'<!-- {re.escape(name)}:start -->.*?<!-- {re.escape(name)}:end -->', re.DOTALL)
        html = block.sub(lambda match: reference, html)
    return html.removeprefix(GENERATED + '\n')


def output_path(source):
    if source.name.endswith(SOURCE_SUFFIX):
        return source.with_name(source.name[:-len(SOURCE_SUFFIX)] + '.html')
    return source


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
    sources = {output_path(path) for path in files if path.name.endswith(SOURCE_SUFFIX)}
    # A compiled sibling is an output, never another input in the same batch.
    files = [path for path in files if path not in sources]
    prepared = []
    # Validate the entire batch before changing any lesson.
    for path in files:
        target = output_path(path)
        if path.is_symlink() or target.is_symlink():
            raise ValueError(f"Refusing a symlinked lesson source or output: {path}")
        html = path.read_text(encoding="utf-8")
        updated, count = render_html(html, directory)
        if target != path:
            if not count:
                raise ValueError(f"Source has no recognized kit assets: {path}")
            if target.exists() and not target.read_text(encoding="utf-8").startswith(GENERATED + '\n'):
                raise ValueError(f"Output already exists and is not a generated lesson: {target}")
            updated = GENERATED + '\n' + updated
        prepared.append((path, target, html, updated, count))
    for path, target, html, updated, count in prepared:
        if not count:
            print(f"  skip: no kit asset reference or injected block found in {path.name}")
            continue
        if target != path or updated != html:
            target.write_text(updated, encoding="utf-8")
        print(f"  done: {target.name}")


def main():
    # Keep the terminal's encoding, but escape filenames it cannot represent.
    # A diagnostic must not abort an otherwise successful batch build.
    sys.stdout.reconfigure(errors="backslashreplace")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="*", help="HTML paths relative to this builder's directory")
    parser.add_argument("--source-view", metavar="FILE", help="print authored HTML without embedded kit assets; do not write")
    args = parser.parse_args()
    try:
        directory = Path(__file__).resolve().parent
        if args.source_view:
            if args.files:
                parser.error('--source-view cannot be combined with build filenames')
            # This is file content, not a diagnostic: escaped non-ASCII would
            # corrupt a localized lesson when the output is saved as source.
            sys.stdout.reconfigure(encoding='utf-8', errors='strict')
            print(source_view((directory / args.source_view).read_text(encoding='utf-8')), end='')
        else:
            build(directory, args.files)
    except (OSError, UnicodeError, ValueError) as exc:
        parser.exit(1, f"Error: {exc}\n")


if __name__ == "__main__":
    main()
