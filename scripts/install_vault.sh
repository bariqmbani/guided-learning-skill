#!/usr/bin/env bash
# Install a fresh vault, initialize both agents' skill entries, and optionally ZIP it.
# Usage: ./scripts/install_vault.sh /path/to/new-vault [--name "My Learning"] [--zip /path/to/share.zip]
set -euo pipefail

vault_script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null && pwd)"
vault_python="${VAULT_PYTHON:-python3}"
if ! command -v "$vault_python" >/dev/null 2>&1; then
  printf '%s\n' 'Python 3.9 or newer is required. Install it, or set VAULT_PYTHON to its executable.' >&2
  exit 1
fi
exec "$vault_python" "$vault_script_dir/create_vault.py" "$@"
