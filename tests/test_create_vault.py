"""Check empty exports, topic bootstrapping, overwrite protection, and ZIP portability."""

import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("create_vault", ROOT / "scripts/create_vault.py")
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)


class CreateVaultTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="learning-starter-test-")
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name)

    def helper(self, vault, *arguments, success=True):
        result = subprocess.run([
            sys.executable, str(vault / "SKILLS/guided-learning/scripts/topics.py"),
            "--vault", str(vault), *arguments,
        ], capture_output=True, text=True)
        self.assertEqual(result.returncode == 0, success, result.stderr)
        return json.loads(result.stdout) if success else result.stderr

    def test_export_is_empty_and_does_not_copy_source_learning(self):
        source = self.base / "source"
        for relative in [*setup.ASSETS, "SKILLS/guided-learning/UPSTREAM.json"]:
            target = source / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / relative, target)
        private = "PERSONAL_LEARNING_MUST_NOT_BE_EXPORTED"
        for relative in [
            "topics/private/concepts/note.md", "topics/private/logs/session.md",
            "learning/learning-roadmap.md", "attachments/private.txt", ".git/config",
            ".obsidian/workspace.json", "AGENTS.md", "Home.md", "README.md",
            "topics/registry.json", "SKILLS/guided-learning/logs/session.md",
            "learning/interactives/private-lesson.html",
            "learner-profile.json", "Learner Profile.md",
        ]:
            target = source / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(private, encoding="utf-8")
        destination = self.base / "friend learning"
        setup.create_vault(source, destination, "Friend Learning")
        registry = json.loads((destination / "topics/registry.json").read_text())
        self.assertEqual(registry, {"schema_version": 1, "active_topic": None, "topics": []})
        self.assertEqual({p.name for p in (destination / "topics").iterdir()}, {"README.md", "registry.json"})
        self.assertEqual({p.name for p in (destination / "learning/interactives").iterdir()}, {"build.sh", "interactive.css"})
        self.assertFalse((destination / "SKILLS/guided-learning/interactives").exists())
        self.assertEqual((destination / "LICENSE").read_bytes(), (ROOT / "LICENSE").read_bytes())
        self.assertFalse((destination / ".git").exists())
        self.assertEqual(list((destination / "attachments").iterdir()), [])
        for path in destination.rglob("*"):
            if path.is_file():
                content = path.read_text(encoding="utf-8")
                self.assertNotIn(private, content, str(path))
                self.assertNotIn(str(ROOT), content, str(path))
                self.assertNotIn("topics/private/", content, str(path))
        self.assertIn("# Friend Learning", (destination / "Home.md").read_text())
        self.assertIn("No active topic", self.helper(destination, "resolve", success=False))
        profile = json.loads((destination / "learner-profile.json").read_text())
        self.assertFalse(profile["configured"])
        self.assertEqual(profile["name"], "")
        self.assertEqual(profile["explanation_style"], "adaptive")
        self.assertEqual(profile["preferred_extras"], [])
        for reference in ["onboarding-evidence.md", "topic-intake.md"]:
            self.assertTrue((destination / "SKILLS/guided-learning/references" / reference).is_file())
        self.assertIn("$guided-learning onboard", (destination / "Home.md").read_text())

    def test_generated_vault_can_create_and_switch_independent_topics(self):
        vault = self.base / "learning"
        setup.create_vault(ROOT, vault, "Learning")
        first = self.helper(vault, "create", "japanese", "--title", "日本語")
        self.assertEqual(self.helper(vault, "resolve", "日本語")["id"], "japanese")
        roadmap = vault / first["paths"]["roadmap"]
        roadmap.write_text("# Japanese\n\n- [x] [[topics/japanese/concepts/japanese--word-order|Word order]]\n")
        queue = vault / first["paths"]["recall_queue"]
        queue.write_text(queue.read_text() + "\n| japanese--word-order | 2026-10-06 | 3d | 2026-10-09 | solid | |\n")
        before = {p: hashlib.sha256(p.read_bytes()).hexdigest()
                  for p in (vault / "topics/japanese").rglob("*") if p.is_file()}
        second = self.helper(vault, "create", "physics", "--title", "Physics")
        self.assertEqual(self.helper(vault, "resolve")["id"], "physics")
        self.assertEqual(self.helper(vault, "select", "japanese")["id"], "japanese")
        self.assertEqual(self.helper(vault, "resolve")["id"], "japanese")
        self.assertNotEqual(first["paths"]["recall_queue"], second["paths"]["recall_queue"])
        for path, digest in before.items():
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), digest)
        self.assertIn("[[topics/physics/learning/learning-roadmap|Roadmap]]", (vault / "topics/README.md").read_text())

    def test_refuses_existing_destinations_and_archives(self):
        destination = self.base / "existing"
        destination.mkdir()
        sentinel = destination / "keep.md"
        sentinel.write_text("Keep existing progress.")
        with self.assertRaisesRegex(ValueError, "Destination already exists"):
            setup.create_vault(ROOT, destination, "Learning")
        self.assertEqual(sentinel.read_text(), "Keep existing progress.")
        archive = self.base / "existing.zip"
        archive.write_bytes(b"Do not overwrite")
        new = self.base / "new"
        with self.assertRaisesRegex(ValueError, "ZIP already exists"):
            setup.create_vault(ROOT, new, "Learning", archive)
        self.assertFalse(new.exists())
        self.assertEqual(archive.read_bytes(), b"Do not overwrite")
        with self.assertRaisesRegex(ValueError, "outside"):
            setup.create_vault(ROOT, new, "Learning", new / "nested.zip")
        self.assertFalse(new.exists())

    def test_missing_assets_and_invalid_names_leave_no_vault(self):
        destination = self.base / "new"
        with self.assertRaisesRegex(ValueError, "asset missing"):
            setup.create_vault(self.base / "missing-source", destination, "Learning")
        self.assertFalse(destination.exists())
        with self.assertRaisesRegex(ValueError, "single line"):
            setup.create_vault(ROOT, destination, "Bad\nName")
        self.assertFalse(destination.exists())

    @unittest.skipUnless(shutil.which("bash"), "Bash entry point requires Bash")
    def test_shell_installer_handles_spaces_and_initializes_skills(self):
        destination = self.base / "new learning vault"
        result = subprocess.run([
            "bash", str(ROOT / "scripts/install_vault.sh"), str(destination),
            "--name", "My Learning",
        ], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.helper(destination, "list")["topics"], [])
        for agent in [".agents", ".claude"]:
            entry = destination / agent / "skills/guided-learning/SKILL.md"
            self.assertTrue(entry.is_file())
            self.assertFalse(entry.is_symlink())
            self.assertIn("SKILLS/guided-learning/SKILL.md", entry.read_text())
        self.assertIn("# My Learning", (destination / "Home.md").read_text())

    def test_zip_keeps_hidden_skill_entries_and_can_generate_another_empty_vault(self):
        destination = self.base / "first"
        archive = self.base / "starter.zip"
        setup.create_vault(ROOT, destination, "Learning", archive)
        extracted = self.base / "extracted"
        with zipfile.ZipFile(archive) as bundle:
            self.assertIn("first/.agents/skills/guided-learning/SKILL.md", bundle.namelist())
            self.assertIn("first/.claude/skills/guided-learning/SKILL.md", bundle.namelist())
            self.assertIn("first/attachments/", bundle.namelist())
            self.assertFalse(any("/.git/" in name for name in bundle.namelist()))
            bundle.extractall(extracted)
        portable = extracted / "first"
        self.assertFalse(any(p.is_symlink() for p in portable.rglob("*")))
        css = portable / "learning/interactives/interactive.css"
        css.write_text(css.read_text() + "\n/* Shared theme customization. */\n")
        self.assertEqual(self.helper(portable, "list")["topics"], [])
        self.helper(portable, "create", "biology", "--title", "Biology")
        profile = setup.profiles.default_profile()
        profile["name"] = "Original Owner"
        setup.profiles.save_profile(portable, profile)
        another = self.base / "second"
        result = subprocess.run([
            sys.executable, str(portable / "scripts/create_vault.py"), str(another),
        ], text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.helper(another, "list")["topics"], [])
        self.assertFalse((another / "topics/biology").exists())
        fresh_profile = json.loads((another / "learner-profile.json").read_text())
        self.assertFalse(fresh_profile["configured"])
        self.assertEqual(fresh_profile["name"], "")
        self.assertEqual((another / "learning/interactives/interactive.css").read_bytes(), css.read_bytes())
        self.assertFalse((another / "SKILLS/guided-learning/interactives").exists())

    def test_conversational_profile_save_and_updates_preserve_course_progress(self):
        vault = self.base / "learning"
        setup.create_vault(ROOT, vault, "Learning")
        topic = self.helper(vault, "create", "physics", "--title", "Physics")
        roadmap = vault / topic["paths"]["roadmap"]
        roadmap.write_text('# Physics\n\n- [x] [[physics--force]]\n')
        course_before = {p: p.read_bytes() for p in (vault / "topics").rglob('*') if p.is_file()}
        profile = setup.profiles.default_profile()
        profile.update({
            "name": "Ayu", "background": "Backend engineer", "goals": "Build better systems",
            "language": "Bahasa Indonesia", "learning_context": "professional",
            "session_minutes": 25, "explanation_style": "hands-on",
            "preferred_extras": ["worked_examples", "code_examples", "mini_projects"],
        })
        input_path = self.base / "answers.json"
        input_path.write_text(json.dumps(profile))
        result = subprocess.run([
            sys.executable, str(vault / "SKILLS/guided-learning/scripts/profile.py"),
            "--vault", str(vault), "save", "--input", str(input_path),
        ], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        saved = json.loads(result.stdout)
        self.assertTrue(saved['configured'])
        self.assertEqual(saved['language'], 'Bahasa Indonesia')
        self.assertIn('Mini projects', (vault / 'Learner Profile.md').read_text())
        self.assertEqual(setup.profiles.read_profile(vault), saved)
        for path, contents in course_before.items():
            self.assertEqual(path.read_bytes(), contents)
        saved['session_minutes'] = 15
        saved['preferred_extras'] = []
        setup.profiles.save_profile(vault, saved)
        self.assertEqual(setup.profiles.read_profile(vault)['preferred_extras'], [])
        for path, contents in course_before.items():
            self.assertEqual(path.read_bytes(), contents)

    def test_invalid_profile_is_rejected_before_any_preference_or_course_write(self):
        vault = self.base / "learning"
        setup.create_vault(ROOT, vault, "Learning")
        before = {p: p.read_bytes() for p in vault.rglob('*') if p.is_file()}
        profile = setup.profiles.default_profile()
        for field, value in [("session_minutes", 0), ("preferred_extras", ["unknown"]), ("language", "")]:
            invalid = {**profile, field: value}
            with self.assertRaises(ValueError):
                setup.profiles.save_profile(vault, invalid)
        for path, contents in before.items():
            self.assertEqual(path.read_bytes(), contents)

    def test_existing_profile_preserves_legacy_preferences_and_bilingual_constraints(self):
        vault = self.base / "learning"
        setup.create_vault(ROOT, vault, "Learning")
        profile = setup.profiles.default_profile()
        profile.update({
            "configured": True, "name": "Existing learner",
            "language": "Bahasa Indonesia with English technical terms",
            "explanation_style": "step-by-step",
            "preferred_extras": ["worked_examples", "interactive_visualizations"],
            "preferences": "Text-only for now; screen reader; no local code execution.",
        })
        path = vault / "learner-profile.json"
        path.write_text(json.dumps(profile, ensure_ascii=False), encoding="utf-8")
        before = {p: p.read_bytes() for p in vault.rglob('*') if p.is_file()}
        loaded = setup.profiles.read_profile(vault)
        self.assertEqual(loaded, profile)
        for file, content in before.items():
            self.assertEqual(file.read_bytes(), content, "Reading must not migrate or rewrite files")
        updated = {**loaded, "session_minutes": 15}
        saved = setup.profiles.save_profile(vault, updated)
        self.assertEqual(saved, updated)
        self.assertEqual(setup.profiles.read_profile(vault), updated)
        for file, content in before.items():
            if file.name not in ["learner-profile.json", "Learner Profile.md"]:
                self.assertEqual(file.read_bytes(), content)
        markdown = (vault / "Learner Profile.md").read_text(encoding="utf-8")
        self.assertIn(profile["language"], markdown)
        self.assertIn(profile["preferences"], markdown)

    def test_absent_profile_read_is_unconfigured_and_does_not_create_files(self):
        vault = self.base / "learning"
        vault.mkdir()
        profile = setup.profiles.read_profile(vault)
        self.assertEqual(profile, setup.profiles.default_profile())
        self.assertFalse(profile["configured"])
        self.assertEqual(list(vault.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
