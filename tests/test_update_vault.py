"""Check vault updates preserve learner data and local edits to setup files."""

import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("update_vault", ROOT / "scripts/update_vault.py")
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)
setup = updater.setup

SKILL = "SKILLS/guided-learning/SKILL.md"
REFERENCE = "SKILLS/guided-learning/references/pass-1.md"
SCRIPT = "SKILLS/learning-interactives/interactive.js"


class UpdateVaultTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="vault-update-")
        self.addCleanup(temporary.cleanup)
        self.base = Path(temporary.name)
        self.source = self.base / "setup"
        for relative in [*setup.ASSETS, "SKILLS/guided-learning/UPSTREAM.json"]:
            target = self.source / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / relative, target)
        shutil.copy2(ROOT / "scripts/create_vault.py", self.source / "scripts/create_vault.py")
        self.vault = (self.base / "learning").resolve()
        setup.create_vault(self.source, self.vault, "My Learning")
        self.setup_files = {relative for relative in setup.make_files(self.source, "My Learning")
                            if setup.is_managed(relative)}

    def change_source(self, relative, text="\nChanged by a newer setup.\n"):
        path = self.source / relative
        path.write_bytes(path.read_bytes() + text.encode("utf-8"))
        return path.read_bytes()

    def update(self, **options):
        return updater.update_vault(self.source, self.vault, **options)

    def actions(self, result):
        return {relative: action for action, relative, _ in result["plan"]}

    def add_learning(self):
        topics = self.vault / "SKILLS/guided-learning/scripts/topics.py"
        result = subprocess.run([sys.executable, str(topics), "--vault", str(self.vault),
                                 "create", "physics", "--title", "Physics"], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        profile = {**setup.profiles.default_profile(), "name": "Existing learner"}
        setup.profiles.save_profile(self.vault, profile)
        for relative, text in {
            "concept-sessions/2026-10-07_sorting/note.md": "My notes",
            "attachments/diagram.txt": "Attachment",
            "learning/interactives/my-lesson.html": "Private lesson",
            ".obsidian/app.json": '{"custom": true}\n',
        }.items():
            (self.vault / relative).parent.mkdir(parents=True, exist_ok=True)
            (self.vault / relative).write_text(text)

    def learner_snapshot(self):
        return {path: path.read_bytes() for path in self.vault.rglob("*")
                if path.is_file() and path.relative_to(self.vault).as_posix() not in self.setup_files
                and path.name not in (setup.MANIFEST_FILE, "runtime.local.toml")
                and updater.UPDATES_DIR not in path.parts}

    def test_install_records_commit_and_manifest_of_setup_files_only(self):
        manifest = json.loads((self.vault / setup.MANIFEST_FILE).read_text())
        self.assertEqual(manifest["name"], "My Learning")
        self.assertIn(SKILL, manifest["files"])
        self.assertIn("learning/interactives/interactive.js", manifest["files"])
        for learner in ("learner-profile.json", "Learner Profile.md", "topics/registry.json",
                        "topics/README.md", "concept-sessions/README.md", ".obsidian/app.json"):
            self.assertNotIn(learner, manifest["files"])
        # A copied setup without Git history has no known commit.
        self.assertNotIn("source_commit", (self.vault / "runtime.local.toml").read_text())
        if shutil.which("git") and (ROOT / ".git").exists():
            vault = self.base / "from-checkout"
            setup.create_vault(ROOT, vault, "Checkout")
            record = setup.runtime.read_record(vault / "runtime.local.toml")
            self.assertRegex(record["source_commit"], r"^[0-9a-f]{40}(-dirty)?$")
            self.assertEqual(record["python"], sys.executable)

    def test_unedited_files_update_and_learner_data_is_untouched(self):
        self.add_learning()
        before = self.learner_snapshot()
        runtime_before = setup.runtime.read_record(self.vault / "runtime.local.toml")
        new_skill = self.change_source(SKILL)
        new_script = self.change_source(SCRIPT)
        result = self.update()
        actions = self.actions(result)
        self.assertEqual(actions[SKILL], "update")
        self.assertEqual(actions["learning/interactives/interactive.js"], "update")
        self.assertEqual((self.vault / SKILL).read_bytes(), new_skill)
        self.assertEqual((self.vault / "learning/interactives/interactive.js").read_bytes(), new_script)
        self.assertEqual(self.learner_snapshot(), before)
        self.assertIn("physics", (self.vault / "topics/README.md").read_text())
        self.assertEqual(setup.runtime.read_record(self.vault / "runtime.local.toml")["python"],
                         runtime_before["python"])
        self.assertIsNone(result["review"])
        self.assertFalse((self.vault / updater.UPDATES_DIR).exists())
        # A second run finds nothing to do.
        self.assertEqual(set(self.actions(self.update()).values()), {"current", "learner"})

    def test_local_edits_are_kept_and_conflicts_are_staged_for_review(self):
        edited = b"My own teaching rules\n"
        (self.vault / SKILL).write_bytes(edited)
        (self.vault / REFERENCE).write_bytes(edited)
        incoming = self.change_source(SKILL)
        result = self.update()
        actions = self.actions(result)
        self.assertEqual(actions[SKILL], "conflict")
        self.assertEqual(actions[REFERENCE], "kept")
        self.assertEqual((self.vault / SKILL).read_bytes(), edited)
        self.assertEqual((self.vault / REFERENCE).read_bytes(), edited)
        self.assertEqual((result["review"] / "incoming" / SKILL).read_bytes(), incoming)
        self.assertTrue(result["review"].is_relative_to(self.vault / updater.UPDATES_DIR))
        self.assertIn("/.vault-updates/", (self.vault / ".gitignore").read_text())
        # The staged conflict is not raised again until the setup changes the file again.
        again = self.update()
        self.assertEqual(self.actions(again)[SKILL], "kept")
        self.assertIsNone(again["review"])
        self.change_source(SKILL, "\nAnother change.\n")
        self.assertEqual(self.actions(self.update())[SKILL], "conflict")
        self.assertEqual((self.vault / SKILL).read_bytes(), edited)

    def test_overwrite_modified_backs_up_the_learners_copy(self):
        edited = b"My own teaching rules\n"
        (self.vault / SKILL).write_bytes(edited)
        incoming = self.change_source(SKILL)
        result = self.update(overwrite_modified=True)
        self.assertEqual(self.actions(result)[SKILL], "replace")
        self.assertEqual((self.vault / SKILL).read_bytes(), incoming)
        self.assertEqual((result["review"] / "backup" / SKILL).read_bytes(), edited)

    def test_deleted_files_stay_deleted_unless_the_setup_changed_them(self):
        (self.vault / REFERENCE).unlink()
        (self.vault / SKILL).unlink()
        incoming = self.change_source(SKILL)
        result = self.update()
        actions = self.actions(result)
        self.assertEqual(actions[REFERENCE], "deleted")
        self.assertEqual(actions[SKILL], "conflict")
        self.assertFalse((self.vault / REFERENCE).exists())
        self.assertFalse((self.vault / SKILL).exists())
        self.assertEqual((result["review"] / "incoming" / SKILL).read_bytes(), incoming)

    def test_files_dropped_from_the_setup_are_removed_only_when_unedited(self):
        manifest_path = self.vault / setup.MANIFEST_FILE
        manifest = json.loads(manifest_path.read_text())
        for relative, content in {"SKILLS/old/unedited.md": b"old", "SKILLS/old/edited.md": b"old"}.items():
            (self.vault / relative).parent.mkdir(parents=True, exist_ok=True)
            (self.vault / relative).write_bytes(content)
            manifest["files"][relative] = setup.file_digest(content)
        (self.vault / "SKILLS/old/edited.md").write_bytes(b"learner edit")
        manifest_path.write_text(json.dumps(manifest))
        result = self.update()
        actions = self.actions(result)
        self.assertEqual(actions["SKILLS/old/unedited.md"], "remove")
        self.assertEqual(actions["SKILLS/old/edited.md"], "orphaned")
        self.assertFalse((self.vault / "SKILLS/old/unedited.md").exists())
        self.assertEqual((result["review"] / "backup/SKILLS/old/unedited.md").read_bytes(), b"old")
        self.assertEqual((self.vault / "SKILLS/old/edited.md").read_bytes(), b"learner edit")
        self.assertNotIn("SKILLS/old/edited.md", json.loads(manifest_path.read_text())["files"])

    def test_vault_without_manifest_treats_differences_as_local_edits(self):
        self.add_learning()
        (self.vault / setup.MANIFEST_FILE).unlink()
        (self.vault / "concept-sessions/README.md").unlink()
        (self.vault / REFERENCE).unlink()
        original = (self.vault / SKILL).read_bytes()
        incoming = self.change_source(SKILL)
        before = {p: c for p, c in self.learner_snapshot().items() if p.name != "README.md"}
        result = self.update()
        actions = self.actions(result)
        self.assertFalse(result["baseline"])
        self.assertEqual(actions[SKILL], "conflict")
        self.assertEqual(actions[REFERENCE], "add")
        self.assertEqual(actions["concept-sessions/README.md"], "add")
        self.assertEqual(actions["learner-profile.json"], "learner")
        self.assertEqual((self.vault / SKILL).read_bytes(), original)
        self.assertEqual((result["review"] / "incoming" / SKILL).read_bytes(), incoming)
        self.assertTrue((self.vault / "concept-sessions/README.md").is_file())
        self.assertEqual(json.loads((self.vault / setup.MANIFEST_FILE).read_text())["name"], "My Learning")
        after = {p: c for p, c in self.learner_snapshot().items() if p.name != "README.md"}
        self.assertEqual(after, before)

    def test_dry_run_writes_nothing(self):
        (self.vault / SKILL).write_text("Edited")
        self.change_source(SKILL)
        self.change_source(SCRIPT)
        before = {p: p.read_bytes() for p in self.vault.rglob("*") if p.is_file()}
        result = self.update(dry_run=True)
        self.assertEqual(self.actions(result)[SKILL], "conflict")
        self.assertEqual({p: p.read_bytes() for p in self.vault.rglob("*") if p.is_file()}, before)

    @unittest.skipUnless(os.name == "posix", "Uses POSIX symlinks")
    def test_symlinked_setup_files_and_learner_folders_are_not_written_through(self):
        outside = self.base / "outside.md"
        outside.write_text("Keep me")
        (self.vault / SKILL).unlink()
        (self.vault / SKILL).symlink_to(outside)
        shared_topics = self.base / "shared-topics"
        shutil.move(str(self.vault / "topics"), shared_topics)
        (self.vault / "topics").symlink_to(shared_topics, target_is_directory=True)
        self.change_source(SKILL)
        result = self.update()
        actions = self.actions(result)
        self.assertEqual(actions[SKILL], "blocked")
        self.assertEqual(actions["topics/registry.json"], "learner")
        self.assertEqual(outside.read_text(), "Keep me")
        self.assertTrue((self.vault / SKILL).is_symlink())

    def test_refuses_non_vaults_and_the_vault_as_its_own_source(self):
        with self.assertRaisesRegex(ValueError, "Not an installed learning vault"):
            updater.update_vault(self.source, self.source)
        with self.assertRaisesRegex(ValueError, "newer setup"):
            updater.update_vault(self.vault, self.vault)

    def test_command_line_reports_changes_and_vault_copy_can_update_another_vault(self):
        self.change_source(SKILL)
        result = subprocess.run([sys.executable, str(self.source / "scripts/update_vault.py"), str(self.vault)],
                                text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Updated: ", result.stdout)
        self.assertIn(SKILL, result.stdout)
        self.assertIn("were not changed", result.stdout)
        other = self.base / "older"
        setup.create_vault(ROOT, other, "Older")
        result = subprocess.run([sys.executable, str(self.vault / "scripts/update_vault.py"), str(other)],
                                text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((other / SKILL).read_bytes(), (self.vault / SKILL).read_bytes())
        self.assertIn("# Older", (other / "Home.md").read_text())


if __name__ == "__main__":
    unittest.main()
