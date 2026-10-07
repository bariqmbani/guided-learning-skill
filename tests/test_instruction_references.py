"""Keep operational reference loading acyclic and the documented schema valid."""

import importlib.util
import json
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]


class InstructionReferenceTests(unittest.TestCase):
    def test_operational_reference_links_have_no_cycles(self):
        # Actual Markdown links are the dependency source of truth. Historical
        # docs and skill entry-point handoffs are outside references/; optional
        # examples and research evidence are not operational instructions.
        informational = {"onboarding-example.md", "onboarding-evidence.md"}
        paths = {p.resolve() for p in (ROOT / "SKILLS").glob("*/references/*.md")
                 if p.name not in informational}
        graph = {}
        for path in paths:
            content = re.sub(r"```.*?```", "", path.read_text(), flags=re.DOTALL)
            links = re.findall(r"\]\(([^)\n]+)\)", content)
            graph[path] = set()
            for link in links:
                if "://" in link or link.startswith("#"):
                    continue
                target = (path.parent / link.split("#", 1)[0]).resolve()
                if target in paths:
                    graph[path].add(target)

        visited, active = set(), []

        def visit(path):
            if path in active:
                cycle = active[active.index(path):] + [path]
                self.fail("Circular instruction references: " + " -> ".join(
                    str(item.relative_to(ROOT)) for item in cycle))
            if path in visited:
                return
            active.append(path)
            for target in sorted(graph[path]):
                visit(target)
            active.pop()
            visited.add(path)

        for path in sorted(paths):
            visit(path)

    def test_profile_schema_example_matches_helper_defaults(self):
        directory = ROOT / "SKILLS/learner-profile"
        spec = importlib.util.spec_from_file_location(
            "documented_profile", directory / "scripts/profile.py")
        profile = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(profile)
        schema = (directory / "references/profile-schema.md").read_text()
        example = re.search(r"```json\s*\n(.*?)\n```", schema, flags=re.DOTALL)
        self.assertIsNotNone(example)
        documented = json.loads(example.group(1))
        self.assertEqual(documented, profile.default_profile())
        profile.validate_profile(documented)


if __name__ == "__main__":
    unittest.main()
