#!/bin/sh
# Install a fresh vault, initialize both agents' skill entries, and optionally ZIP it.
# Usage: ./scripts/install_vault.sh /path/to/new-vault [--name "My Learning"] [--zip /path/to/share.zip]
set -eu

vault_script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
vault_probe='import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)'
if [ -n "${VAULT_PYTHON:-}" ]; then
  if "$VAULT_PYTHON" -c "$vault_probe" >/dev/null 2>&1; then
    exec "$VAULT_PYTHON" "$vault_script_dir/create_vault.py" "$@"
  fi
else
  for vault_python in python3 python; do
    if "$vault_python" -c "$vault_probe" >/dev/null 2>&1; then
      exec "$vault_python" "$vault_script_dir/create_vault.py" "$@"
    fi
  done
  if py -3 -c "$vault_probe" >/dev/null 2>&1; then
    exec py -3 "$vault_script_dir/create_vault.py" "$@"
  fi
fi
printf '%s\n' 'Python 3.9 or newer is required; no vault was created.' \
  'Install Python from https://www.python.org/downloads/ or your OS package manager, then rerun.' \
  'For an existing interpreter, set VAULT_PYTHON to its executable path (without arguments).' \
  'See INSTALLATION.md for missing dependencies and PowerShell instructions.' >&2
exit 1
