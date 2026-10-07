"""Exercise the portable CSS builder, including PowerShell invocation."""

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


if __name__ == "__main__":
    unittest.main()
