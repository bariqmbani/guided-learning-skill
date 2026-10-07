#!/usr/bin/env python3
"""Check a finished interactive for the mistakes a browser would not report.

    python3 verify.py /absolute/path/to/lesson.html [more.html ...]

Errors are contract violations: a broken label, a duplicate id, a network
request in an offline page, a missing runtime. Warnings are likely authoring
slips: no static fallback, leftover template text, an announcement with nowhere
to go. Exit status is 1 when any error is found, so this can gate a handoff.

This reads the file only. It cannot run the page, so it never replaces opening
the lesson in a browser, checking the model against a known result, or testing
with a keyboard. Its silence is not evidence that the teaching is correct.
"""

import argparse
from html.parser import HTMLParser
from pathlib import Path
import re
import sys


VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}
# Phrases that ship with the reusable templates and should not reach a learner.
TEMPLATE_MARKERS = (
    "Slope & intercept", "Binary search · Step sequence", "Two growth rules",
    "Chance & frequency", "Follow the evidence · Decision scenario",
    "Choosing a summary statistic", "Solving an equation · Order the steps",
    "Build pipeline · System map", "Grouped rates · Data explorer",
    "Right triangles · Geometry lab",
)
PLACEHOLDERS = ("lorem ipsum", "todo:", "tbd", "replace this", "your text here", "xxx")


class Page(HTMLParser):
    """Collect the structure the checks need, with source line numbers."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.elements = []          # (tag, attrs dict, line)
        self.ids = {}               # id -> [lines]
        self.headings = []          # (level, line, text)
        self.text_by_tag = {}       # tag -> accumulated text
        self.scripts = []           # (text, line, position in the document)
        self.script_sources = []    # (position, src) for every <script> tag
        self.position = 0           # document order, since a page may be one line
        self.open_tags = []
        self._collecting = None
        self._buffer = []
        self._buffer_line = 0

    def handle_starttag(self, tag, attrs):
        attributes = {name: (value or "") for name, value in attrs}
        line = self.getpos()[0]
        self.position += 1
        self.elements.append((tag, attributes, line))
        if "id" in attributes:
            self.ids.setdefault(attributes["id"], []).append(line)
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.headings.append([int(tag[1]), line, ""])
        if tag == "script":
            self.script_sources.append((self.position, attributes.get("src", "")))
        if tag in {"script", "style", "title", "noscript"}:
            self._collecting = tag
            self._buffer = []
            self._buffer_line = line
            self._buffer_position = self.position
        if tag not in VOID:
            self.open_tags.append(tag)

    def handle_endtag(self, tag):
        if self._collecting == tag:
            text = "".join(self._buffer)
            if tag == "script":
                self.scripts.append((text, self._buffer_line, self._buffer_position))
            self.text_by_tag.setdefault(tag, []).append(text)
            self._collecting = None
        if tag in self.open_tags:
            while self.open_tags and self.open_tags.pop() != tag:
                pass

    def handle_data(self, data):
        if self._collecting:
            self._buffer.append(data)
        elif self.headings and self.open_tags and self.open_tags[-1].startswith("h"):
            self.headings[-1][2] += data


def find(page, tag):
    return [item for item in page.elements if item[0] == tag]


def without_kit_theme_storage(script):
    """Exempt only the display preference in an exact copy of our runtime.

    A comment or a shared key name is not an opt-out. Other storage in the
    runtime or in lesson-authored scripts must still fail the privacy check.
    """
    try:
        runtime = Path(__file__).with_name("interactive.js").read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return script
    # Match the builder's escaping of a closing script literal.
    runtime = re.sub(r"</script", lambda match: "<\\/" + match.group(0)[2:],
                     runtime, flags=re.IGNORECASE)
    if script.strip() != runtime.strip():
        return script
    for expression in (
        "global.localStorage.getItem(themeKey)",
        "global.localStorage.setItem(themeKey, value)",
        "global.localStorage.removeItem(themeKey)",
    ):
        script = script.replace(expression, "", 1)
    return script


def check(path, html):
    """Return (errors, warnings) as lists of 'line: message' strings."""
    errors, warnings = [], []
    page = Page()
    page.feed(html)
    page.close()
    scripts = "\n".join(entry[0] for entry in page.scripts)
    storage_scripts = "\n".join(without_kit_theme_storage(entry[0]) for entry in page.scripts)
    lowered = html.lower()

    def error(line, message):
        errors.append(f"{line}: {message}")

    def warn(line, message):
        warnings.append(f"{line}: {message}")

    # --- document shell -----------------------------------------------------
    roots = find(page, "html")
    if not roots:
        error(1, "No <html> element; this does not look like a complete page.")
    elif not roots[0][1].get("lang"):
        error(roots[0][2], "<html> needs a lang attribute so speech and hyphenation are correct.")
    if not page.text_by_tag.get("title"):
        error(1, "No <title>; the browser tab and any link to this lesson will be unnamed.")
    if not any(tag == "meta" and attrs.get("name") == "viewport" for tag, attrs, _ in page.elements):
        error(1, "No viewport meta; the lesson will not reflow on a phone.")
    for tag, attrs, line in page.elements:
        if tag == "meta" and attrs.get("name") == "viewport":
            content = attrs.get("content", "")
            if "user-scalable=no" in content or "maximum-scale=1" in content:
                error(line, "The viewport blocks zoom; remove user-scalable=no and maximum-scale.")

    headings = page.headings
    h1s = [item for item in headings if item[0] == 1]
    if not h1s:
        error(1, "No <h1>; every lesson needs one page title.")
    elif len(h1s) > 1:
        error(h1s[1][1], f"{len(h1s)} <h1> elements; keep one page title and use <h2> for sections.")
    previous = 0
    for level, line, _ in headings:
        if previous and level > previous + 1:
            warn(line, f"Heading jumps from h{previous} to h{level}; keep the outline readable.")
        previous = level

    # --- identifiers and label wiring ---------------------------------------
    for value, lines in page.ids.items():
        if len(lines) > 1:
            error(lines[1], f'Duplicate id "{value}" (also on line {lines[0]}); labels and scripts will bind to the wrong element.')
    known = set(page.ids)
    for tag, attrs, line in page.elements:
        for attribute in ("for", "aria-labelledby", "aria-describedby", "aria-controls"):
            if attribute not in attrs:
                continue
            if attribute == "for" and tag not in {"label", "output"}:
                continue
            for target in attrs[attribute].split():
                if target not in known:
                    error(line, f'<{tag} {attribute}="{target}"> points at an id that does not exist.')
        if tag == "a" and attrs.get("href", "").startswith("#"):
            target = attrs["href"][1:]
            if target and target not in known:
                warn(line, f'Link to "#{target}" has no matching id on this page.')

    # --- controls -----------------------------------------------------------
    labelled = {attrs["for"] for tag, attrs, _ in page.elements if tag == "label" and "for" in attrs}
    wrapped = "<label" in lowered
    for tag, attrs, line in page.elements:
        if tag not in {"input", "select", "textarea"}:
            continue
        kind = attrs.get("type", "text").lower()
        if kind in {"hidden", "submit", "button", "reset"}:
            continue
        has_name = (attrs.get("id") in labelled or attrs.get("aria-label")
                    or attrs.get("aria-labelledby") or (kind in {"radio", "checkbox"} and wrapped))
        if not has_name:
            error(line, f"<{tag}{' type=' + kind if tag == 'input' else ''}> has no label, aria-label, or aria-labelledby.")
        # A stepper scrubber gets its bounds from mountStepper at runtime.
        if kind == "range" and "data-scrub" not in attrs:
            for bound in ("min", "max"):
                if bound not in attrs:
                    warn(line, f"Range input has no {bound}; the browser default may not match the model.")
    for tag, attrs, line in page.elements:
        if tag == "img" and "alt" not in attrs:
            error(line, "<img> has no alt attribute; use alt=\"\" when it is decorative.")
        if tag == "button" and not attrs.get("type"):
            warn(line, "<button> without type submits the form it sits in; add type=\"button\" unless that is intended.")

    # --- offline and privacy guarantees -------------------------------------
    for tag, attrs, line in page.elements:
        for attribute in ("src", "href"):
            value = attrs.get(attribute, "")
            if re.match(r"(?:https?:)?//", value) and tag != "a":
                error(line, f"<{tag} {attribute}> loads {value} over the network; a lesson must work offline.")
    for pattern, message, source in (
        (r"\bfetch\s*\(", "fetch() needs the network; keep the lesson self-contained.", scripts),
        (r"\bXMLHttpRequest\b", "XMLHttpRequest needs the network; keep the lesson self-contained.", scripts),
        (r"\b(?:localStorage|sessionStorage|indexedDB)\b",
         "Browser storage must not retain learner data; only the shared runtime's theme preference is allowed.",
         storage_scripts),
        (r"\bnavigator\.(?:geolocation|mediaDevices)\b", "Device APIs do not belong in a lesson page.", scripts),
    ):
        for match in re.finditer(pattern, source):
            line = page.scripts[0][1] + source[:match.start()].count("\n")
            error(line, message)
            break

    # --- runtime contracts --------------------------------------------------
    uses_runtime = "LearningUI" in scripts
    has_runtime = ("interactive.js" in lowered) or ("global.LearningUI" in scripts) or ("window.LearningUI" in scripts)
    if uses_runtime and not has_runtime:
        error(1, "The lesson calls LearningUI but the runtime is neither linked nor inlined.")
    if uses_runtime and has_runtime:
        # Compare scripts in document order: prose and code samples mention the
        # name too, and a whole page can sit on one line.
        runtime_at = [position for position, src in page.script_sources if "interactive.js" in src]
        runtime_at += [entry[2] for entry in page.scripts
                       if "global.LearningUI" in entry[0] or "window.LearningUI" in entry[0]]
        using = [(entry[2], entry[1]) for entry in page.scripts
                 if "LearningUI" in entry[0] and "global.LearningUI" not in entry[0]
                 and "window.LearningUI" not in entry[0]]
        if runtime_at and using and min(using)[0] < min(runtime_at):
            error(min(using)[1], "LearningUI is used before the runtime is loaded; put interactive.js first.")
    if "LearningUI.announce" in scripts and "data-announcer" not in lowered:
        warn(1, "announce() is called but no [data-announcer] element exists, so nothing is announced.")
    if "data-math" in lowered and "math.render" not in scripts:
        error(1, "data-math attributes are present but math.render() is never called, so the notation stays blank.")
    stepper_required = ("data-back", "data-next", "data-play", "data-reset", "data-position")
    if "mountStepper" in scripts:
        for attribute in stepper_required:
            if attribute not in lowered:
                error(1, f"mountStepper needs a [{attribute}] control; it is missing.")
    if "mountQuestion" in scripts or "mountQuiz" in scripts:
        for attribute in ("data-check", "data-feedback"):
            if attribute not in lowered:
                error(1, f"A question needs a [{attribute}] element; it is missing.")
    if re.search(r"\.innerHTML\s*=", scripts):
        warn(1, "innerHTML assignment found; build nodes or use textContent so model text cannot become markup.")

    # --- teaching completeness ---------------------------------------------
    if uses_runtime and "<noscript" not in lowered:
        warn(1, "No <noscript> fallback; a learner without JavaScript sees an empty activity.")
    if "skip-link" not in lowered and "skip to" not in lowered:
        warn(1, "No skip link; keyboard users tab through the header on every visit.")
    if uses_runtime and "renderChart" in scripts and "data-table" not in lowered and "details" not in lowered:
        warn(1, "A chart with no table or disclosure nearby; give the figure a text alternative.")
    # Only the page's own title and heading, so a catalog may name the templates.
    named = " ".join(page.text_by_tag.get("title", []) + [text for level, _, text in page.headings if level == 1])
    for marker in TEMPLATE_MARKERS:
        if marker in named:
            warn(1, f'Template text "{marker}" is still the page title; replace the example lesson with yours.')
            break
    for placeholder in PLACEHOLDERS:
        if placeholder in lowered:
            warn(1, f'Placeholder text "{placeholder}" is still on the page.')
            break
    return errors, warnings


def main():
    sys.stdout.reconfigure(errors="backslashreplace")
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("files", nargs="+", type=Path, help="lesson HTML files to check")
    parser.add_argument("--quiet", action="store_true", help="print errors only")
    arguments = parser.parse_args()
    failed = False
    for path in arguments.files:
        try:
            html = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            print(f"{path}: cannot read: {exc}")
            failed = True
            continue
        errors, warnings = check(path, html)
        print(f"{path.name}: {len(errors)} error(s), {len(warnings)} warning(s)")
        for item in errors:
            print(f"  error  {item}")
        if not arguments.quiet:
            for item in warnings:
                print(f"  warn   {item}")
        failed = failed or bool(errors)
    if not arguments.quiet:
        print("Static checks only. Open the page, check the model against a known "
              "result, and use the keyboard before handing it to a learner.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
