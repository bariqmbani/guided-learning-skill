"""Exercise entry points without assuming Git, Bash, or a python3 command."""

import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile


ROOT = Path(__file__).resolve().parents[1]
POWERSHELL = shutil.which("pwsh") or shutil.which("powershell")


class InstallerTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="vault installers ")
        self.addCleanup(temporary.cleanup)
        self.base = Path(temporary.name)
        self.destination = self.base / "My learning vault"
        self.env = dict(os.environ)
        self.env.pop("VAULT_PYTHON", None)

    def assert_empty_vault(self):
        registry = json.loads((self.destination / "topics/registry.json").read_text())
        self.assertEqual(registry, {"schema_version": 1, "active_topic": None, "topics": []})
        profile = json.loads((self.destination / "learner-profile.json").read_text())
        self.assertFalse(profile["configured"])
        self.assertEqual(profile["name"], "")
        runtime = (self.destination / "runtime.local.toml").read_text(encoding="utf-8")
        self.assertIn("version = ", runtime)
        self.assertEqual({p.name for p in (self.destination / "concept-sessions").iterdir()}, {"README.md"})
        for agent in (".agents", ".claude"):
            for skill in ("learner-profile", "concept-learning", "guided-learning", "learning-interactives"):
                self.assertTrue((self.destination / agent / "skills" / skill / "SKILL.md").is_file())
        for asset in ("scripts/install_vault.ps1", "scripts/install_vault.sh", "INSTALLATION.md"):
            self.assertTrue((self.destination / asset).is_file())

    def run_installer(self, command, *arguments):
        return subprocess.run(
            [*command, str(self.destination), *arguments], env=self.env,
            cwd=self.base, capture_output=True, text=True, timeout=30,
        )

    def isolated_path(self):
        folder = self.base / "bin"
        folder.mkdir()
        self.env["PATH"] = str(folder)
        # POSIX wrapper needs dirname, but neither Git nor Bash is provided.
        (folder / "dirname").symlink_to(shutil.which("dirname"))
        return folder

    def executable(self, path, body):
        path.write_text("#!/bin/sh\n" + body)
        path.chmod(0o755)

    @unittest.skipUnless(os.name == "posix" and shutil.which("sh"), "Requires POSIX shell")
    def test_posix_detection_without_git_bash_or_python3(self):
        folder = self.isolated_path()
        (folder / "python").symlink_to(sys.executable)
        archive = self.base / "My starter.zip"
        result = self.run_installer([shutil.which("sh"), str(ROOT / "scripts/install_vault.sh")],
                                    "--name", "My Learning", "--zip", str(archive))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assert_empty_vault()
        self.assertIn("# My Learning", (self.destination / "Home.md").read_text())
        with zipfile.ZipFile(archive) as bundle:
            self.assertIn("My learning vault/scripts/install_vault.ps1", bundle.namelist())

    @unittest.skipUnless(os.name == "posix" and shutil.which("sh"), "Requires POSIX shell")
    def test_posix_rejects_unusable_python3_and_tries_python(self):
        folder = self.isolated_path()
        self.executable(folder / "python3", "echo 'Python 3.8'\nexit 1\n")
        (folder / "python").symlink_to(sys.executable)
        result = self.run_installer([shutil.which("sh"), str(ROOT / "scripts/install_vault.sh")])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assert_empty_vault()

    @unittest.skipUnless(os.name == "posix" and shutil.which("sh"), "Requires POSIX shell")
    def test_posix_supports_py_launcher(self):
        folder = self.isolated_path()
        self.executable(folder / "py", 'test "$1" = "-3" || exit 2\nshift\nexec ' +
                        shlex.quote(sys.executable) + ' "$@"\n')
        result = self.run_installer([shutil.which("sh"), str(ROOT / "scripts/install_vault.sh")])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assert_empty_vault()

    @unittest.skipUnless(os.name == "posix" and shutil.which("sh"), "Requires POSIX shell")
    def test_posix_missing_python_leaves_destination_absent(self):
        self.isolated_path()
        result = self.run_installer([shutil.which("sh"), str(ROOT / "scripts/install_vault.sh")])
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Python 3.9 or newer", result.stderr)
        self.assertIn("https://www.python.org/downloads/", result.stderr)
        self.assertFalse(self.destination.exists())

    def wrapper_commands(self):
        if shutil.which("sh"):
            yield [shutil.which("sh"), str(ROOT / "scripts/install_vault.sh")]
        if POWERSHELL:
            yield [POWERSHELL, "-NoProfile", "-File", str(ROOT / "scripts/install_vault.ps1")]

    def test_explicit_interpreter_and_generator_failure_propagation(self):
        # A path with spaces must remain a single executable argument.
        interpreter = self.base / "Python directory" / Path(sys.executable).name
        interpreter.parent.mkdir()
        if os.name == "posix":
            interpreter.symlink_to(sys.executable)
        else:
            # Avoid moving python.exe away from its DLLs on Windows.
            interpreter = Path(sys.executable)
        self.env["VAULT_PYTHON"] = str(interpreter)
        for command in self.wrapper_commands():
            with self.subTest(command=command):
                result = self.run_installer(command, "--name", "My Learning")
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assert_empty_vault()
                runtime = (self.destination / "runtime.local.toml").read_text(encoding="utf-8")
                self.assertEqual(json.loads(runtime.splitlines()[0].split(" = ", 1)[1]), str(interpreter))
                before = {p: p.read_bytes() for p in self.destination.rglob("*") if p.is_file()}
                result = self.run_installer(command)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("already exists", result.stderr)
                self.assertEqual(before, {p: p.read_bytes() for p in self.destination.rglob("*") if p.is_file()})
                shutil.rmtree(self.destination)

    def test_invalid_override_does_not_fall_back_or_write(self):
        self.env["VAULT_PYTHON"] = str(self.base / "missing python")
        for command in self.wrapper_commands():
            with self.subTest(command=command):
                result = self.run_installer(command)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("VAULT_PYTHON", result.stderr)
                self.assertFalse(self.destination.exists())

    @unittest.skipUnless(POWERSHELL, "Requires PowerShell")
    def test_powershell_detects_python_and_forwards_zip_arguments(self):
        archive = self.base / "My starter.zip"
        result = self.run_installer(
            [POWERSHELL, "-NoProfile", "-File", str(ROOT / "scripts/install_vault.ps1")],
            "--name", "My Learning", "--zip", str(archive),
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assert_empty_vault()
        self.assertIn("# My Learning", (self.destination / "Home.md").read_text())
        self.assertTrue(archive.is_file())

    @unittest.skipUnless(POWERSHELL and os.name == "posix", "Requires PowerShell on POSIX for command stubs")
    def test_powershell_skips_broken_launchers_and_handles_missing_python(self):
        folder = self.isolated_path()
        self.executable(folder / "py", "exit 1\n")
        self.executable(folder / "python3", "exit 1\n")
        (folder / "python").symlink_to(sys.executable)
        command = [POWERSHELL, "-NoProfile", "-File", str(ROOT / "scripts/install_vault.ps1")]
        result = self.run_installer(command)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assert_empty_vault()
        shutil.rmtree(self.destination)
        (folder / "python").unlink()
        result = self.run_installer(command)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Python 3.9 or newer", result.stderr)
        self.assertFalse(self.destination.exists())


if __name__ == "__main__":
    unittest.main()
