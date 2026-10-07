"""Check runtime handoff across sessions without copying machine paths to exports."""

import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("runtime_setup", ROOT / "scripts/create_vault.py")
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)


class RuntimeTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="vault-runtime-")
        self.addCleanup(temporary.cleanup)
        self.base = Path(temporary.name)
        self.vault = self.base / "learning"

    def test_new_sessions_are_directed_to_persisted_runtime(self):
        setup.create_vault(ROOT, self.vault, "Learning")
        record = (self.vault / "runtime.local.toml").read_text()
        self.assertEqual(json.loads(record.splitlines()[0].split(" = ", 1)[1]), sys.executable)
        self.assertIn(sys.version.split()[0], record)
        self.assertIn("runtime.local.toml", (self.vault / "AGENTS.md").read_text())
        self.assertIn("@AGENTS.md", (self.vault / "CLAUDE.md").read_text())
        for agent in (".agents", ".claude"):
            for skill in setup.SKILL_NAMES:
                entry = self.vault / agent / "skills" / skill / "SKILL.md"
                self.assertIn("runtime.local.toml", entry.read_text())
        self.assertIn("/runtime.local.toml", (self.vault / ".gitignore").read_text())

    @unittest.skipUnless(sys.version_info >= (3, 11), "Standard TOML parser requires Python 3.11+")
    def test_runtime_is_valid_toml_with_windows_paths(self):
        import tomllib
        executable = r"C:\Users\Learner's Folder\Python\python.exe"
        with patch.object(setup.runtime.sys, "executable", executable):
            config = setup.runtime.runtime_config()
        self.assertEqual(tomllib.loads(config), {"python": executable, "version": sys.version.split()[0]})

    @unittest.skipUnless(os.name == "posix", "Uses a POSIX interpreter symlink")
    def test_saved_python_works_in_a_new_process_without_python_on_path(self):
        # Preserve executable paths containing spaces, apostrophes and dollars.
        interpreter = self.base / "Python's $runtime" / "python"
        interpreter.parent.mkdir()
        interpreter.symlink_to(sys.executable)
        installed = subprocess.run(
            [str(interpreter), str(ROOT / "scripts/create_vault.py"), str(self.vault)],
            text=True, capture_output=True,
        )
        self.assertEqual(installed.returncode, 0, installed.stderr)
        record = (self.vault / "runtime.local.toml").read_text()
        empty_path = self.base / "empty-path"
        empty_path.mkdir()
        env = {**os.environ, "PATH": str(empty_path)}
        env.pop("VAULT_PYTHON", None)
        executable = json.loads(record.splitlines()[0].split(" = ", 1)[1])
        self.assertEqual(executable, str(interpreter))
        result = subprocess.run(
            [executable, "SKILLS/learner-profile/scripts/profile.py", "show"],
            cwd=self.vault, env=env, text=True, capture_output=True, timeout=30,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse(json.loads(result.stdout)["configured"])
        self.assertEqual({p.name for p in (self.vault / "topics").iterdir()}, {"registry.json", "README.md"})
        self.assertEqual({p.name for p in (self.vault / "concept-sessions").iterdir()}, {"README.md"})

    def test_refresh_stale_or_missing_record_preserves_every_other_file(self):
        setup.create_vault(ROOT, self.vault, "Learning")
        runtime = self.vault / "runtime.local.toml"
        runtime.write_text("An interpreter which no longer exists")
        profile = setup.profiles.default_profile()
        profile["name"] = "Existing learner"
        setup.profiles.save_profile(self.vault, profile)
        existing_note = self.vault / "concept-sessions/existing/note.md"
        existing_note.parent.mkdir()
        existing_note.write_text("Existing learning must survive runtime repair")
        before = {p: p.read_bytes() for p in self.vault.rglob("*") if p.is_file() and p != runtime}
        # The source helper can repair older vaults without reinstalling them.
        for missing in (False, True):
            with self.subTest(missing=missing):
                if missing:
                    runtime.unlink()
                result = subprocess.run(
                    [sys.executable, str(ROOT / "scripts/configure_runtime.py"), "--vault", str(self.vault)],
                    text=True, capture_output=True,
                )
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(json.loads(runtime.read_text().splitlines()[0].split(" = ", 1)[1]), sys.executable)
                after = {p: p.read_bytes() for p in self.vault.rglob("*") if p.is_file() and p != runtime}
                self.assertEqual(before, after)

    def test_refresh_keeps_the_recorded_setup_commit(self):
        setup.create_vault(ROOT, self.vault, "Learning")
        setup.runtime.record_source(self.vault, "abc123")
        setup.runtime.configure_runtime(self.vault)
        record = setup.runtime.read_record(self.vault / "runtime.local.toml")
        self.assertEqual(record["source_commit"], "abc123")
        self.assertEqual(record["python"], sys.executable)

    def test_zip_has_no_machine_record_and_can_configure_after_extraction(self):
        archive = self.base / "starter.zip"
        setup.create_vault(ROOT, self.vault, "Learning", archive)
        with zipfile.ZipFile(archive) as bundle:
            self.assertNotIn("learning/runtime.local.toml", bundle.namelist())
            bundle.extractall(self.base / "extracted")
        extracted = self.base / "extracted/learning"
        result = subprocess.run(
            [sys.executable, str(extracted / "scripts/configure_runtime.py")],
            cwd=self.base, text=True, capture_output=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads((extracted / "runtime.local.toml").read_text().splitlines()[0].split(" = ", 1)[1]), sys.executable)
        self.assertFalse(json.loads((extracted / "learner-profile.json").read_text())["configured"])

    def test_runtime_configuration_refuses_source_checkout(self):
        with self.assertRaisesRegex(ValueError, "existing installed vault"):
            setup.runtime.configure_runtime(ROOT)
        self.assertFalse((ROOT / "runtime.local.toml").exists())

    def test_older_vault_gets_runtime_discovery_without_reinstallation(self):
        setup.create_vault(ROOT, self.vault, "Learning")
        (self.vault / "scripts/configure_runtime.py").unlink()
        (self.vault / "runtime.local.toml").unlink()
        instructions = "# Existing vault\n\nKeep these custom instructions.\n"
        (self.vault / "AGENTS.md").write_text(instructions)
        (self.vault / ".gitignore").write_text("custom-ignore\n")
        before = {p: p.read_bytes() for p in self.vault.rglob("*") if p.is_file()}
        setup.runtime.configure_runtime(self.vault)
        self.assertIn("runtime.local.toml", (self.vault / "AGENTS.md").read_text())
        self.assertTrue((self.vault / "AGENTS.md").read_text().endswith(instructions))
        self.assertIn("custom-ignore\n", (self.vault / ".gitignore").read_text())
        self.assertIn("/runtime.local.toml", (self.vault / ".gitignore").read_text())
        self.assertTrue((self.vault / "scripts/configure_runtime.py").is_file())
        for path, content in before.items():
            if path.name not in ("AGENTS.md", ".gitignore"):
                self.assertEqual(path.read_bytes(), content)

    @unittest.skipUnless(os.name == "posix", "Uses a POSIX symlink")
    def test_runtime_configuration_refuses_symlinked_record(self):
        setup.create_vault(ROOT, self.vault, "Learning")
        target = self.base / "private.txt"
        target.write_text("Keep me")
        record = self.vault / "runtime.local.toml"
        record.unlink()
        record.symlink_to(target)
        with self.assertRaisesRegex(ValueError, "symlinked"):
            setup.runtime.configure_runtime(self.vault)
        self.assertEqual(target.read_text(), "Keep me")


if __name__ == "__main__":
    unittest.main()
