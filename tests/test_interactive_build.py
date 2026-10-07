"""Exercise portable CSS/JavaScript builds and safe template scaffolding."""

import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


SOURCE = Path(__file__).resolve().parents[1] / "SKILLS/guided-learning/interactives"
POWERSHELL = shutil.which("pwsh") or shutil.which("powershell")
HTML = '<link rel="stylesheet" href="interactive.css"><style>.local { color: red; }</style><p>日本語</p>'


class InteractiveBuildTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="interactive build ")
        self.addCleanup(temporary.cleanup)
        self.base = Path(temporary.name)
        self.directory = self.base / "topic interactives"
        self.directory.mkdir()
        shutil.copy2(SOURCE / "build.py", self.directory / "build.py")
        self.css = self.directory / "interactive.css"
        self.css.write_text('.note::before { content: "\\2713 日本語"; }\n', encoding="utf-8")
        self.html = self.directory / "Lesson with spaces.html"
        self.html.write_text(HTML, encoding="utf-8")

    def run_builder(self, *arguments, env=None):
        return subprocess.run([sys.executable, str(self.directory / "build.py"), *arguments],
                              env={**os.environ, **(env or {})},
                              cwd=self.base, text=True, capture_output=True)

    def test_unicode_filenames_do_not_abort_build_with_legacy_stdout(self):
        self.html = self.html.rename(self.directory / "a-日本語.html")
        skipped = self.directory / "b-日本語.html"
        skipped.write_bytes(b"<p>No stylesheet</p>\r\n")
        later = self.directory / "z-final.html"
        later.write_text(HTML, encoding="utf-8")

        for encoding in ("cp1252", "ascii"):
            with self.subTest(encoding=encoding):
                result = self.run_builder(env={"PYTHONIOENCODING": encoding + ":strict"})
                self.assertEqual(result.returncode, 0, result.stderr)
                for path in (self.html, later):
                    content = path.read_text(encoding="utf-8")
                    self.assertIn("interactive.css:start", content)
                    self.assertIn(self.css.read_text(encoding="utf-8").strip(), content)
                    self.assertIn("<p>日本語</p>", content)
                self.assertEqual(skipped.read_bytes(), b"<p>No stylesheet</p>\r\n")
                for path in (self.html, skipped):
                    display = path.name.encode(encoding, errors="backslashreplace").decode(encoding)
                    self.assertIn(display, result.stdout)
                self.assertIn("done: z-final.html", result.stdout)

    def test_all_files_unicode_css_refresh_and_idempotency(self):
        skipped = self.directory / "unrelated.html"
        skipped.write_bytes(b"<p>Leave this alone</p>\r\n")
        result = self.run_builder()
        self.assertEqual(result.returncode, 0, result.stderr)
        built = self.html.read_text(encoding="utf-8")
        self.assertIn(self.css.read_text(encoding="utf-8").strip(), built)
        self.assertIn('<style>.local { color: red; }</style><p>日本語</p>', built)
        self.assertNotIn('<link', built)
        self.assertEqual(skipped.read_bytes(), b"<p>Leave this alone</p>\r\n")
        before = self.html.read_bytes()
        self.assertEqual(self.run_builder().returncode, 0)
        self.assertEqual(self.html.read_bytes(), before)
        self.css.write_text("body { color: blue; }", encoding="utf-8")
        self.assertEqual(self.run_builder().returncode, 0)
        rebuilt = self.html.read_text(encoding="utf-8")
        self.assertEqual(rebuilt.count("<!-- interactive.css:start -->"), 1)
        self.assertIn("body { color: blue; }", rebuilt)
        self.assertNotIn(".note::before", rebuilt)

    def test_selected_file_is_relative_to_builder_not_working_directory(self):
        other = self.directory / "other.html"
        other.write_text(HTML, encoding="utf-8")
        result = self.run_builder(self.html.name)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("interactive.css:start", self.html.read_text(encoding="utf-8"))
        self.assertEqual(other.read_text(encoding="utf-8"), HTML)

    def test_javascript_is_optional_refreshable_and_preserves_lesson_code(self):
        script = self.directory / "interactive.js"
        script.write_text('window.kit = "日本語";\n', encoding="utf-8")
        self.html.write_text(HTML + '<script src="interactive.js"></script>'
                             '<script>window.lesson = 42;</script>', encoding="utf-8")
        self.assertEqual(self.run_builder().returncode, 0)
        built = self.html.read_text(encoding="utf-8")
        self.assertIn('window.kit = "日本語";', built)
        self.assertIn('<script>window.lesson = 42;</script>', built)
        self.assertNotIn('src="interactive.js"', built)
        before = self.html.read_bytes()
        self.assertEqual(self.run_builder().returncode, 0)
        self.assertEqual(self.html.read_bytes(), before)
        script.write_text("window.kit = 2;", encoding="utf-8")
        self.assertEqual(self.run_builder().returncode, 0)
        rebuilt = self.html.read_text(encoding="utf-8")
        self.assertEqual(rebuilt.count("<!-- interactive.js:start -->"), 1)
        self.assertIn("window.kit = 2;", rebuilt)
        self.assertNotIn('window.kit = "日本語";', rebuilt)

    def test_nested_template_and_reordered_attributes_use_only_known_assets(self):
        templates = self.directory / "templates"
        templates.mkdir()
        lesson = templates / "example.html"
        (self.directory / "interactive.js").write_text("window.kit = true;", encoding="utf-8")
        external = ('<link rel="stylesheet" href="https://example.com/interactive.css">'
                    '<script src="https://example.com/interactive.js"></script>'
                    '<script src="../../interactive.js"></script>')
        lesson.write_text("<link href='../interactive.css' rel='stylesheet' />"
                          "<script src='../interactive.js'></script>" + external, encoding="utf-8")
        result = self.run_builder("templates/example.html")
        self.assertEqual(result.returncode, 0, result.stderr)
        built = lesson.read_text(encoding="utf-8")
        self.assertIn("interactive.css:start", built)
        self.assertIn("interactive.js:start", built)
        self.assertIn(external, built)

    def test_missing_javascript_fails_before_changing_any_batch_file(self):
        dependent = self.directory / "z-dependent.html"
        dependent.write_text(HTML + '<script src="interactive.js"></script>', encoding="utf-8")
        before = {path: path.read_bytes() for path in (self.html, dependent)}
        result = self.run_builder()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Referenced asset is missing:", result.stderr)
        self.assertIn("interactive.js", result.stderr)
        for path, content in before.items():
            self.assertEqual(path.read_bytes(), content)

    def test_javascript_closing_tag_literal_cannot_end_inline_script(self):
        (self.directory / "interactive.js").write_text('window.tag = "</script>";', encoding="utf-8")
        self.html.write_text('<script src="interactive.js"></script>', encoding="utf-8")
        result = self.run_builder()
        self.assertEqual(result.returncode, 0, result.stderr)
        built = self.html.read_text(encoding="utf-8")
        self.assertIn('window.tag = "<\\/script>";', built)
        self.assertEqual(built.count("</script>"), 1)

    def test_missing_inputs_fail_and_empty_directory_succeeds(self):
        result = self.run_builder("missing.html")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.html.read_text(encoding="utf-8"), HTML)
        self.css.unlink()
        result = self.run_builder()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("interactive.css", result.stderr)
        self.assertEqual(self.html.read_text(encoding="utf-8"), HTML)
        self.css.write_text("body {}", encoding="utf-8")
        self.html.unlink()
        self.assertEqual(self.run_builder().returncode, 0)

    @unittest.skipUnless(POWERSHELL, "Requires PowerShell")
    def test_powershell_build_without_bash_or_python_on_path(self):
        empty = self.base / "empty-path"
        empty.mkdir()
        command = "& " + " ".join("'" + arg.replace("'", "''") + "'" for arg in
                                   [sys.executable, str(self.directory / "build.py"), self.html.name])
        result = subprocess.run([POWERSHELL, "-NoProfile", "-Command", command],
                                env={**os.environ, "PATH": str(empty)}, cwd=self.base,
                                text=True, capture_output=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("interactive.css:start", self.html.read_text(encoding="utf-8"))


class InteractiveScaffoldTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="interactive scaffold ")
        self.addCleanup(temporary.cleanup)
        self.base = Path(temporary.name)
        self.kit = self.base / "trusted kit"
        (self.kit / "templates").mkdir(parents=True)
        for name in ("build.py", "scaffold.py"):
            shutil.copy2(SOURCE / name, self.kit / name)
        (self.kit / "interactive.css").write_text("body { color: navy; }", encoding="utf-8")
        (self.kit / "interactive.js").write_text("window.kit = true;", encoding="utf-8")
        (self.kit / "templates/parameter-explorer.html").write_text(
            '<!doctype html><link rel="stylesheet" href="../interactive.css">'
            '<p>Example model</p><script src="../interactive.js"></script>'
            '<script>window.lesson = true;</script>', encoding="utf-8")
        self.destination = self.base / "learning workspace/2026-10-07_日本語.html"

    def run_scaffold(self, template="parameter-explorer", destination=None):
        return subprocess.run([sys.executable, str(self.kit / "scaffold.py"), template,
                               str(destination or self.destination)], cwd=self.base,
                              text=True, capture_output=True)

    def test_one_command_copies_assets_and_builds_shareable_html(self):
        result = self.run_scaffold()
        self.assertEqual(result.returncode, 0, result.stderr)
        built = self.destination.read_text(encoding="utf-8")
        for name in ("interactive.css", "interactive.js"):
            self.assertIn(f"<!-- {name}:start -->", built)
            self.assertIn((self.kit / name).read_text(encoding="utf-8"), built)
            self.assertNotIn(f'="../{name}"', built)
        self.assertIn("window.lesson = true;", built)
        for name in ("interactive.css", "interactive.js", "build.py"):
            self.assertEqual((self.destination.parent / name).read_bytes(), (self.kit / name).read_bytes())
        # Rebuilding works from an unrelated working directory and needs no kit.
        shutil.rmtree(self.kit)
        result = subprocess.run([sys.executable, str(self.destination.parent / "build.py"), self.destination.name],
                                cwd=self.base, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.destination.read_text(encoding="utf-8"), built)

    def test_existing_lesson_and_custom_assets_are_preserved_before_any_write(self):
        self.destination.parent.mkdir()
        self.destination.write_text("Existing learner work", encoding="utf-8")
        result = self.run_scaffold()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Destination already exists", result.stderr)
        self.assertEqual(self.destination.read_text(encoding="utf-8"), "Existing learner work")
        self.assertEqual(len(list(self.destination.parent.iterdir())), 1)
        self.destination.unlink()
        for name in ("interactive.css", "interactive.js", "build.py"):
            with self.subTest(asset=name):
                custom = self.destination.parent / name
                custom.write_text("Custom asset; preserve it", encoding="utf-8")
                result = self.run_scaffold()
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("Asset conflict", result.stderr)
                self.assertEqual(custom.read_text(encoding="utf-8"), "Custom asset; preserve it")
                self.assertEqual(len(list(self.destination.parent.iterdir())), 1)
                custom.unlink()

    def test_second_lesson_reuses_identical_assets(self):
        self.assertEqual(self.run_scaffold().returncode, 0)
        before = {name: (self.destination.parent / name).stat().st_mtime_ns
                  for name in ("interactive.css", "interactive.js", "build.py")}
        result = self.run_scaffold(destination=self.destination.with_name("another.html"))
        self.assertEqual(result.returncode, 0, result.stderr)
        for name, modified in before.items():
            self.assertEqual((self.destination.parent / name).stat().st_mtime_ns, modified)

    def test_invalid_template_or_missing_asset_does_not_create_destination(self):
        self.assertNotEqual(self.run_scaffold("../private").returncode, 0)
        self.assertFalse(self.destination.parent.exists())
        (self.kit / "interactive.js").unlink()
        result = self.run_scaffold()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("interactive.js", result.stderr)
        self.assertFalse(self.destination.parent.exists())

    def test_source_checkout_is_rejected_without_writing(self):
        destination = SOURCE / "not-a-learner-session.html"
        result = self.run_scaffold(destination=destination)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("outside the setup source repository", result.stderr)
        self.assertFalse(destination.exists())


if __name__ == "__main__":
    unittest.main()
