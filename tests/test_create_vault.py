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

    def session_helper(self, vault, *arguments):
        result = subprocess.run([
            sys.executable, str(vault / "SKILLS/concept-learning/scripts/sessions.py"),
            "--vault", str(vault), *arguments,
        ], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)

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
            ".obsidian/workspace.json", "AGENTS.md", "Home.md",
            "topics/registry.json", "SKILLS/guided-learning/logs/session.md",
            "learning/interactives/private-lesson.html",
            "learner-profile.json", "Learner Profile.md",
            "concept-sessions/2026-10-07_private/note.md",
            "concept-sessions/2026-10-07_private/mentor-feedback.md",
            "concept-sessions/2026-10-07_private/practice.md",
            "SKILLS/concept-learning/logs/private.md",
        ]:
            target = source / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(private, encoding="utf-8")
        destination = self.base / "friend learning"
        setup.create_vault(source, destination, "Friend Learning")
        registry = json.loads((destination / "topics/registry.json").read_text())
        self.assertEqual(registry, {"schema_version": 1, "active_topic": None, "topics": []})
        self.assertEqual({p.name for p in (destination / "topics").iterdir()}, {"README.md", "registry.json"})
        self.assertEqual({p.name for p in (destination / "concept-sessions").iterdir()}, {"README.md"})
        self.assertEqual({p.name for p in (destination / "learning/interactives").iterdir()}, {"build.sh", "interactive.css", "example-interactive.html"})
        self.assertEqual(
            (destination / "learning/interactives/example-interactive.html").read_bytes(),
            (ROOT / "SKILLS/guided-learning/interactives/example-interactive.html").read_bytes(),
        )
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
        for reference in [
            "SKILLS/learner-profile/references/onboarding-evidence.md",
            "SKILLS/guided-learning/references/topic-intake.md",
        ]:
            self.assertTrue((destination / reference).is_file())
        self.assertIn("$guided-learning onboard", (destination / "Home.md").read_text())
        self.assertEqual(self.session_helper(destination, "list"), {"sessions": []})

    def test_focused_sessions_preserve_courses_and_shared_preferences(self):
        vault = self.base / "learning"
        setup.create_vault(ROOT, vault, "Learning")
        self.helper(vault, "create", "physics", "--title", "Physics")
        profile = {**setup.profiles.default_profile(), "language": "Bahasa Indonesia"}
        setup.profiles.save_profile(vault, profile)
        before = {p: p.read_bytes() for p in vault.rglob("*") if p.is_file()}

        first = self.session_helper(vault, "create", "bubble-sort", "--title", "Bubble Sort",
                                    "--date", "2026-10-07")
        session = vault / first["root"]
        self.assertEqual(session.parent, vault / "concept-sessions")
        self.assertEqual({p.name for p in session.iterdir()}, {"note.md", "mentor-feedback.md", "practice.md"})
        note = vault / first["paths"]["note"]
        note.write_text(note.read_text() + "\nActual learner attempt: [1, 4, 2, 5].\n")
        original_note = note.read_bytes()

        second = self.session_helper(vault, "create", "bubble-sort", "--title", "Bubble Sort",
                                     "--date", "2026-10-07")
        self.assertNotEqual(first["root"], second["root"])
        self.assertEqual(note.read_bytes(), original_note)
        self.assertEqual(self.session_helper(vault, "resolve", first["root"]), first)
        self.assertEqual(len(self.session_helper(vault, "list")["sessions"]), 2)
        for path, contents in before.items():
            self.assertEqual(path.read_bytes(), contents, str(path.relative_to(vault)))
        self.assertEqual(self.helper(vault, "resolve")["id"], "physics")

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

    def test_skill_versions_and_release_history_survive_installation(self):
        vault = self.base / "versioned"
        setup.create_vault(ROOT, vault, "Versioned")
        versions = {"guided-learning": "3.6.1", "concept-learning": "1.0.1", "learner-profile": "1.0.0"}
        for name, version in versions.items():
            source = ROOT / "SKILLS" / name
            installed = vault / "SKILLS" / name
            header = (source / "SKILL.md").read_text().split("---", 2)[1]
            self.assertIn(f'  version: "{version}"', header)
            self.assertEqual((installed / "CHANGELOG.md").read_bytes(), (source / "CHANGELOG.md").read_bytes())
            self.assertIn(f"## [{version}]", (installed / "CHANGELOG.md").read_text())
            for agent in [".agents", ".claude"]:
                entry = vault / agent / "skills" / name / "SKILL.md"
                self.assertEqual(entry.read_text().split("---", 2)[1], header)
        upstream = json.loads((vault / "SKILLS/guided-learning/UPSTREAM.json").read_text())
        self.assertEqual(upstream["local_version"], versions["guided-learning"])

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
            for name in ["learner-profile", "concept-learning", "guided-learning"]:
                entry = destination / agent / "skills" / name / "SKILL.md"
                self.assertTrue(entry.is_file())
                self.assertFalse(entry.is_symlink())
                self.assertIn(f"SKILLS/{name}/SKILL.md", entry.read_text())
                self.assertTrue((destination / "SKILLS" / name / "SKILL.md").is_file())
        self.assertIn("# My Learning", (destination / "Home.md").read_text())

    def test_zip_keeps_hidden_skill_entries_and_can_generate_another_empty_vault(self):
        destination = self.base / "first"
        archive = self.base / "starter.zip"
        setup.create_vault(ROOT, destination, "Learning", archive)
        extracted = self.base / "extracted"
        with zipfile.ZipFile(archive) as bundle:
            for name in ["learner-profile", "concept-learning", "guided-learning"]:
                self.assertIn(f"first/.agents/skills/{name}/SKILL.md", bundle.namelist())
                self.assertIn(f"first/.claude/skills/{name}/SKILL.md", bundle.namelist())
            self.assertIn("first/attachments/", bundle.namelist())
            self.assertIn("first/learning/interactives/example-interactive.html", bundle.namelist())
            self.assertFalse(any("/.git/" in name for name in bundle.namelist()))
            bundle.extractall(extracted)
        portable = extracted / "first"
        self.assertFalse(any(p.is_symlink() for p in portable.rglob("*")))
        self.assertEqual(self.helper(portable, "list")["topics"], [])
        self.helper(portable, "create", "biology", "--title", "Biology")
        profile = setup.profiles.default_profile()
        profile["name"] = "Original Owner"
        setup.profiles.save_profile(portable, profile)
        session = self.session_helper(portable, "create", "private-concept", "--title", "Private concept",
                                      "--date", "2026-10-07")
        (portable / session["paths"]["mentor_feedback"]).write_text("Private learner feedback")
        another = self.base / "second"
        result = subprocess.run([
            sys.executable, str(portable / "scripts/create_vault.py"), str(another),
        ], text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.helper(another, "list")["topics"], [])
        self.assertFalse((another / "topics/biology").exists())
        self.assertEqual(self.session_helper(another, "list"), {"sessions": []})
        self.assertEqual({p.name for p in (another / "concept-sessions").iterdir()}, {"README.md"})
        self.assertEqual(
            (another / "learning/interactives/example-interactive.html").read_bytes(),
            (ROOT / "SKILLS/guided-learning/interactives/example-interactive.html").read_bytes(),
        )
        fresh_profile = json.loads((another / "learner-profile.json").read_text())
        self.assertFalse(fresh_profile["configured"])
        self.assertEqual(fresh_profile["name"], "")

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

    def test_finishing_onboarding_with_all_questions_skipped_saves_valid_defaults(self):
        vault = self.base / "learning"
        setup.create_vault(ROOT, vault, "Learning")
        before = {p: p.read_bytes() for p in vault.rglob("*") if p.is_file()}
        saved = setup.profiles.save_profile(vault, setup.profiles.read_profile(vault))
        self.assertEqual(saved, {**setup.profiles.default_profile(), "configured": True})
        self.assertEqual(setup.profiles.read_profile(vault), saved)
        changed = {str(p.relative_to(vault)) for p, content in before.items() if p.read_bytes() != content}
        self.assertEqual(changed, {"learner-profile.json", "Learner Profile.md"})

    def test_canonical_and_legacy_profile_helpers_share_one_profile(self):
        vault = self.base / "learning"
        setup.create_vault(ROOT, vault, "Learning")
        profile = {**setup.profiles.default_profile(), "language": "日本語", "session_minutes": 15}
        input_path = self.base / "profile.json"
        input_path.write_text(json.dumps(profile))
        for skill in ["learner-profile", "guided-learning"]:
            command = [sys.executable, str(vault / "SKILLS" / skill / "scripts/profile.py"),
                       "--vault", str(vault)]
            saved = subprocess.run([*command, "save", "--input", str(input_path)], capture_output=True, text=True)
            self.assertEqual(saved.returncode, 0, saved.stderr)
            loaded = subprocess.run([*command, "show"], capture_output=True, text=True)
            self.assertEqual(loaded.returncode, 0, loaded.stderr)
            self.assertEqual(json.loads(loaded.stdout), {**profile, "configured": True})
        self.assertEqual(self.helper(vault, "list")["topics"], [])
        self.assertEqual(self.session_helper(vault, "list"), {"sessions": []})

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
