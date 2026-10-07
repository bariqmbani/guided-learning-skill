#!/usr/bin/env python3
"""Remember this Python interpreter for future sessions in an installed vault."""

import argparse
import json
from pathlib import Path
import sys


RUNTIME_FILE = "runtime.local.toml"
RUNTIME_GUIDANCE = """For Python helpers, use the `python` executable in `runtime.local.toml`.
Verify it once per session. If missing or broken, follow `INSTALLATION.md` to
find Python 3.9+ and refresh it with `scripts/configure_runtime.py`.
"""


def runtime_config():
    executable = sys.executable
    if not executable or sys.version_info < (3, 9):
        raise ValueError("A working Python 3.9+ interpreter is required")
    # JSON string quoting also produces valid TOML basic strings, including Windows paths.
    return (
        f"python = {json.dumps(executable, ensure_ascii=False)}\n"
        f"version = {json.dumps(sys.version.split()[0])}\n"
    )


def configure_runtime(vault):
    vault = vault.expanduser().resolve()
    for relative in ("AGENTS.md", "topics/registry.json", "SKILLS/learner-profile/SKILL.md"):
        if not (vault / relative).is_file():
            raise ValueError("Runtime configuration requires an existing installed vault")
    path = vault / RUNTIME_FILE
    agents = vault / "AGENTS.md"
    ignore = vault / ".gitignore"
    helper = vault / "scripts/configure_runtime.py"
    for target in (path, agents, ignore, helper, helper.parent):
        if target.is_symlink():
            raise ValueError("Refusing to update symlinked runtime configuration")
    instructions = agents.read_text(encoding="utf-8")
    ignored = ignore.read_text(encoding="utf-8") if ignore.exists() else ""
    config = runtime_config()
    # Older vaults also need durable discovery instructions and the refresh helper.
    if RUNTIME_FILE not in instructions:
        agents.write_text(RUNTIME_GUIDANCE + "\n" + instructions, encoding="utf-8")
    if "/" + RUNTIME_FILE not in ignored.splitlines():
        ignore.write_text(ignored.rstrip("\n") + "\n/" + RUNTIME_FILE + "\n", encoding="utf-8")
    if not helper.exists():
        helper.parent.mkdir(parents=True, exist_ok=True)
        helper.write_bytes(Path(__file__).read_bytes())
    path.write_text(config, encoding="utf-8")
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vault", type=Path, default=Path(__file__).resolve().parents[1],
                        help="existing vault; defaults to the vault containing this script")
    args = parser.parse_args()
    try:
        path = configure_runtime(args.vault)
    except (OSError, ValueError) as exc:
        parser.exit(1, f"Error: {exc}\n")
    print(f"Saved local Python runtime: {path}")


if __name__ == "__main__":
    main()
