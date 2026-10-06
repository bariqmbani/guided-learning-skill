#!/usr/bin/env python3
"""Read or save preferences collected by the guided-learning onboarding conversation."""

import argparse
import json
from pathlib import Path
import tempfile


CONTEXTS = ["auto", "self-study", "professional", "research"]
STYLES = ["step-by-step", "concise", "visual", "discussion", "hands-on"]
EXTRAS = {
    "worked_examples": "Worked examples",
    "practice_exercises": "Practice exercises",
    "interactive_visualizations": "Interactive visualizations",
    "code_examples": "Code examples",
    "mini_projects": "Mini projects",
    "writing_exercises": "Writing exercises",
    "source_reading": "Guided source reading",
}


def default_profile():
    return {
        "schema_version": 1,
        "configured": False,
        "name": "",
        "background": "",
        "goals": "",
        "language": "English",
        "learning_context": "auto",
        "session_minutes": 20,
        "explanation_style": "step-by-step",
        "preferred_extras": ["worked_examples", "practice_exercises", "interactive_visualizations"],
        "preferences": "",
    }


def validate_profile(profile):
    if not isinstance(profile, dict) or set(profile) != set(default_profile()):
        raise ValueError("Learner profile has missing or unknown fields")
    if profile["schema_version"] != 1 or type(profile["configured"]) is not bool:
        raise ValueError("Unsupported learner profile schema")
    for field in ["name", "background", "goals", "language", "preferences"]:
        if not isinstance(profile[field], str):
            raise ValueError(f"Learner profile {field} must be text")
    if not profile["language"].strip():
        raise ValueError("Preferred language must not be empty")
    if profile["learning_context"] not in CONTEXTS or profile["explanation_style"] not in STYLES:
        raise ValueError("Unknown learning context or explanation preference")
    minutes = profile["session_minutes"]
    if type(minutes) is not int or not 5 <= minutes <= 180:
        raise ValueError("Session length must be between 5 and 180 minutes")
    extras = profile["preferred_extras"]
    if not isinstance(extras, list) or any(not isinstance(item, str) or item not in EXTRAS for item in extras):
        raise ValueError("Unknown preferred learning extra")
    if len(extras) != len(set(extras)):
        raise ValueError("Preferred learning extras must not repeat")
    return profile


def read_profile(vault):
    path = vault / "learner-profile.json"
    return validate_profile(json.loads(path.read_text(encoding="utf-8"))) if path.exists() else default_profile()


def profile_markdown(profile):
    validate_profile(profile)
    intro = ("Your tutor uses these preferences as defaults. Each topic keeps its own goals and progress."
             if profile["configured"] else
             "Start onboarding in your learning chat with `$guided-learning onboard` (Codex) or `/guided-learning onboard` (Claude Code).")
    values = [
        ("Name", profile["name"] or "Not provided"),
        ("Background", profile["background"] or "Not provided"),
        ("Goals", profile["goals"] or "Not provided"),
        ("Teaching language", profile["language"]),
        ("Learning context", profile["learning_context"]),
        ("Session length", f"{profile['session_minutes']} minutes"),
        ("Explanation preference", profile["explanation_style"]),
        ("Preferred extras", ", ".join(EXTRAS[key] for key in profile["preferred_extras"]) or "None"),
        ("Other preferences", profile["preferences"] or "Not provided"),
    ]
    return "# Learner Profile\n\n" + intro + "\n\n" + "\n".join(f"- **{label}:** {value}" for label, value in values) + "\n"


def atomic_write(path, content):
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        temporary = Path(handle.name)
        handle.write(content)
    try:
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def save_profile(vault, profile):
    if not (vault / "topics/registry.json").is_file() or not (vault / ".obsidian").is_dir():
        raise ValueError("Choose an installed learning vault with --vault")
    profile = {**validate_profile(profile), "configured": True}
    markdown = profile_markdown(profile)
    atomic_write(vault / "learner-profile.json", json.dumps(profile, indent=2, ensure_ascii=False) + "\n")
    atomic_write(vault / "Learner Profile.md", markdown)
    return profile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vault", type=Path, default=Path(__file__).resolve().parents[3])
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("show")
    save = commands.add_parser("save")
    save.add_argument("--input", type=Path, required=True, help="JSON file with the profile collected in chat")
    args = parser.parse_args()
    vault = args.vault.expanduser().resolve()
    try:
        if args.command == "show":
            profile = read_profile(vault)
        else:
            profile = save_profile(vault, json.loads(args.input.read_text(encoding="utf-8")))
    except (ValueError, OSError) as exc:
        parser.exit(1, f"Error: {exc}\n")
    print(json.dumps(profile, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
