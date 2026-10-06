"""Focused sessions preserve learner work and cannot write through unsafe paths."""

from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / "SKILLS/concept-learning/scripts/sessions.py"


class ConceptSessionTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="concept-session-test-")
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name)
        self.vault = self.base / "my learning"
        self.vault.mkdir()

    def helper(self, *arguments, success=True, vault=None):
        result = subprocess.run(
            [sys.executable, str(HELPER), "--vault", str(vault or self.vault), *arguments],
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode == 0, success, result.stderr)
        return json.loads(result.stdout) if success else result.stderr

    def create(self, slug="bubble-sort", title="Bubble sort", session_date="2026-10-07"):
        return self.helper("create", slug, "--title", title, "--date", session_date)

    def snapshot(self):
        return {str(path.relative_to(self.vault)): hashlib.sha256(path.read_bytes()).hexdigest()
                for path in self.vault.rglob("*") if path.is_file()}

    def test_standalone_session_creates_three_linked_records_without_courses_or_profile(self):
        session = self.create(title='Urutan: "gelembung" 日本語')
        self.assertEqual(session["root"], "concept-sessions/2026-10-07_bubble-sort")
        self.assertEqual(set(session["paths"]), {"note", "mentor_feedback", "practice"})
        self.assertEqual({path.name for path in (self.vault / session["root"]).iterdir()},
                         {"note.md", "mentor-feedback.md", "practice.md"})
        self.assertEqual({path.name for path in self.vault.iterdir()}, {"concept-sessions"})
        for relative in session["paths"].values():
            content = (self.vault / relative).read_text(encoding="utf-8")
            frontmatter = content.split("---", 2)[1]
            fields = {line.split(": ", 1)[0]: json.loads(line.split(": ", 1)[1])
                      for line in frontmatter.splitlines() if ": " in line}
            self.assertEqual(fields["title"], 'Urutan: "gelembung" 日本語')
            self.assertEqual(fields["status"], "in-progress")
            self.assertEqual(fields["assessment"], "not-yet-assessed")
            self.assertEqual(fields["session"], session["id"])
            for filename in {"note.md", "mentor-feedback.md", "practice.md"} - {Path(relative).name}:
                self.assertIn(f"]({filename})", content)

    def test_repeated_sessions_and_resume_preserve_every_existing_record(self):
        first = self.create()
        note = self.vault / first["paths"]["note"]
        note.write_text(note.read_text() + "\nLearner's own explanation: ...\n")
        before = self.snapshot()
        second = self.create()
        third = self.create()
        self.assertEqual(second["id"], first["id"] + "-02")
        self.assertEqual(third["id"], first["id"] + "-03")
        for relative, digest in before.items():
            self.assertEqual(self.snapshot()[relative], digest)
        complete = self.snapshot()
        self.assertEqual(self.helper("resolve", first["root"]), first)
        listed = self.helper("list")["sessions"]
        self.assertEqual({entry["root"] for entry in listed}, {first["root"], second["root"], third["root"]})
        self.assertEqual(self.snapshot(), complete)

    def test_concurrent_creators_use_distinct_session_directories(self):
        with ThreadPoolExecutor(max_workers=4) as pool:
            sessions = list(pool.map(lambda _: self.create(), range(4)))
        self.assertEqual(len({item["root"] for item in sessions}), 4)
        for item in sessions:
            self.assertEqual(self.helper("resolve", item["root"]), item)

    def test_list_is_read_only_and_ignores_installer_guide(self):
        self.assertEqual(self.helper("list"), {"sessions": []})
        self.assertEqual(list(self.vault.iterdir()), [])
        directory = self.vault / "concept-sessions"
        directory.mkdir()
        (directory / "README.md").write_text("How to start a lesson.")
        before = self.snapshot()
        self.assertEqual(self.helper("list"), {"sessions": []})
        self.assertEqual(self.snapshot(), before)

    def test_invalid_inputs_leave_learning_directory_untouched(self):
        arguments = [
            ("create", "../outside", "--title", "Example", "--date", "2026-10-07"),
            ("create", "Bubble Sort", "--title", "Example", "--date", "2026-10-07"),
            ("create", "example", "--title", "Bad\nTitle", "--date", "2026-10-07"),
            ("create", "example", "--title", " ", "--date", "2026-10-07"),
            ("create", "example", "--title", "Example", "--date", "2026-02-30"),
            ("create", "example", "--title", "Example", "--date", "20261007"),
            ("create", "example", "--title", "Example"),
            ("resolve", "../outside"),
            ("resolve", "concept-sessions/../../outside"),
            ("resolve", "concept-sessions\\2026-10-07_bubble-sort"),
        ]
        for args in arguments:
            with self.subTest(args=args):
                self.helper(*args, success=False)
                self.assertEqual(list(self.vault.iterdir()), [])

    def test_rejects_source_checkout_and_nested_course_destinations(self):
        source = self.base / "source"
        for filename in ["scripts/create_vault.py", "SKILLS/guided-learning/SKILL.md"]:
            target = source / filename
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text("source marker")
        (source / "AGENTS.md").write_text("# Learning vault setup repository\n")
        nested = source / "scratch"
        nested.mkdir()
        for destination in [source, nested, ROOT]:
            error = self.helper("create", "example", "--title", "Example", "--date", "2026-10-07",
                                vault=destination, success=False)
            self.assertIn("source repository", error)
            self.assertFalse((destination / "concept-sessions").exists())
        topics = self.vault / "topics"
        course = topics / "algorithms"
        course.mkdir(parents=True)
        (topics / "registry.json").write_text("{}")
        error = self.helper("create", "example", "--title", "Example", "--date", "2026-10-07",
                            vault=course, success=False)
        self.assertIn("vault root", error)
        self.assertFalse((course / "concept-sessions").exists())

    def test_a_git_managed_installed_vault_remains_usable(self):
        for filename in [".git/config", "scripts/create_vault.py", "SKILLS/guided-learning/SKILL.md"]:
            target = self.vault / filename
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text("installed asset")
        (self.vault / "AGENTS.md").write_text("# Learning vault\n")
        (self.vault / ".obsidian").mkdir()
        (self.vault / "topics").mkdir()
        (self.vault / "topics/registry.json").write_text('{"topics": [], "active_topic": null}')
        before = self.snapshot()
        session = self.create()
        self.assertEqual(self.helper("resolve", session["root"]), session)
        after = self.snapshot()
        for relative, digest in before.items():
            self.assertEqual(after[relative], digest)

    def test_missing_root_is_not_created(self):
        destination = self.base / "missing"
        self.helper("create", "example", "--title", "Example", "--date", "2026-10-07",
                    vault=destination, success=False)
        self.assertFalse(destination.exists())

    def test_incomplete_session_is_reported_without_resetting_it(self):
        session = self.create()
        (self.vault / session["paths"]["practice"]).unlink()
        before = self.snapshot()
        self.assertIn("record is missing", self.helper("resolve", session["root"], success=False))
        self.assertEqual(self.snapshot(), before)

    def test_title_substitution_is_literal_and_does_not_expand_inserted_markers(self):
        title = "Concept {{session_json}} [example]"
        session = self.create(title=title)
        content = (self.vault / session["paths"]["note"]).read_text()
        title_line = next(line for line in content.splitlines() if line.startswith("title: "))
        self.assertEqual(json.loads(title_line.removeprefix("title: ")), title)

    @unittest.skipUnless(hasattr(Path, "symlink_to"), "Symlinks unavailable")
    def test_session_root_symlinks_are_rejected_even_within_the_vault(self):
        for target in [self.base / "outside", self.vault / "topics"]:
            with self.subTest(target=target):
                target.mkdir()
                (self.vault / "concept-sessions").symlink_to(target, target_is_directory=True)
                self.assertIn("symlinked", self.helper(
                    "create", "example", "--title", "Example", "--date", "2026-10-07", success=False))
                self.assertIn("symlinked", self.helper("list", success=False))
                self.assertEqual(list(target.iterdir()), [])
                (self.vault / "concept-sessions").unlink()

    @unittest.skipUnless(hasattr(Path, "symlink_to"), "Symlinks unavailable")
    def test_symlinked_session_or_record_cannot_be_resumed(self):
        session = self.create()
        outside = self.base / "outside.md"
        outside.write_text("Must not be read or changed.")
        practice = self.vault / session["paths"]["practice"]
        practice.unlink()
        practice.symlink_to(outside)
        self.assertIn("symlinked", self.helper("resolve", session["root"], success=False))
        self.assertEqual(outside.read_text(), "Must not be read or changed.")
        alias = self.vault / "concept-sessions/2026-10-07_alias"
        alias.symlink_to(self.vault / session["root"], target_is_directory=True)
        self.assertIn("symlinked", self.helper("resolve", "concept-sessions/2026-10-07_alias", success=False))


if __name__ == "__main__":
    unittest.main()
