#!/usr/bin/env python3
"""Compatibility entry point for the shared learner-profile helper.

Existing installed commands and Python callers retain the same public API.
"""

import importlib.util
from pathlib import Path


_shared_path = Path(__file__).resolve().parents[2] / "learner-profile/scripts/profile.py"
_spec = importlib.util.spec_from_file_location("shared_learner_profile", _shared_path)
_shared = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_shared)

# Re-export the original public API so existing installers and integrations work.
CONTEXTS = _shared.CONTEXTS
STYLES = _shared.STYLES
EXTRAS = _shared.EXTRAS
default_profile = _shared.default_profile
validate_profile = _shared.validate_profile
read_profile = _shared.read_profile
profile_markdown = _shared.profile_markdown
atomic_write = _shared.atomic_write
save_profile = _shared.save_profile
main = _shared.main


if __name__ == "__main__":
    main()
