# Installation and dependency recovery

Installation and the learning helpers require **Python 3.9 or newer**, with no
third-party Python packages. Git is optional. Interactive HTML builds use the
same Python interpreter; Bash is not required. PowerShell 5.1+ can install and
run the Python helpers directly.

The installer creates an independent local vault. Its copied skills, helpers,
and templates remain available without the source checkout or a connection to
the repository remote. Repository changes do not update the installed copy.

## Agent preflight

1. Identify the OS and actual terminal shell. Use its native syntax, quote paths,
   and check each command's exit status before continuing. PowerShell 5.1 does
   not support Bash's `&&`, heredocs, or `export` syntax.
2. Choose a new, writable destination outside the source directory tree. Never
   overwrite an existing directory, including an empty one. Do not create it
   in advance: the generator creates it after validation.
3. Probe an actual interpreter, not just a command name or version banner.
   Try `python3`, `python`, or `py -3` as appropriate, with:
   `-c "import sys; print(sys.executable); print(sys.version); sys.exit(0 if sys.version_info >= (3, 9) else 1)"`.
   A Windows app alias or launcher without a runtime is not sufficient. Use a
   known interpreter path if discovery commands fail; in PowerShell invoke a
   quoted executable with `&`. The generator saves the actual interpreter in
   `runtime.local.toml` so future sessions do not depend on this conversation.
4. Obtain the source using Git or the archive route below. If the source is
   already extracted locally, use it directly. Read its repository instructions.
5. Run the generator through the matching wrapper or verified Python command.
   Check its exit status, then verify the empty vault as described below.

If downloads fail or the computer is offline, use a local source archive and
an installed interpreter. Otherwise report exactly which prerequisite is
unavailable and how to supply it. Do not report installation success or create a
handmade substitute vault when the generator has not succeeded.

## No Git installed

Download the public `main` source ZIP from
[GitHub](https://github.com/bariqmbani/guided-learning-skill/archive/refs/heads/main.zip)
and extract it into a fresh temporary directory. No Git installation or GitHub
account is needed. A source ZIP is not an installed learning vault; still run
the generator to create the separate destination.

PowerShell, including systems without Python yet:

```powershell
$vaultStage = Join-Path ([IO.Path]::GetTempPath()) ('learning-setup-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $vaultStage -ErrorAction Stop | Out-Null
$vaultZip = Join-Path $vaultStage 'source.zip'
Invoke-WebRequest -Uri 'https://github.com/bariqmbani/guided-learning-skill/archive/refs/heads/main.zip' -OutFile $vaultZip -UseBasicParsing -ErrorAction Stop
Expand-Archive -LiteralPath $vaultZip -DestinationPath $vaultStage -ErrorAction Stop
Set-Location (Join-Path $vaultStage 'guided-learning-skill-main')
```

POSIX shell, after verifying `python3` (substitute the verified interpreter):

```sh
vault_stage="$(mktemp -d)" || exit 1
curl --fail --location 'https://github.com/bariqmbani/guided-learning-skill/archive/refs/heads/main.zip' --output "$vault_stage/source.zip" || exit 1
python3 -m zipfile -e "$vault_stage/source.zip" "$vault_stage" || exit 1
cd "$vault_stage/guided-learning-skill-main" || exit 1
```

If `curl`, `mktemp`, or an extractor is unavailable, use the agent's download/file
tools, `wget`, or a browser and the OS archive extractor. Preserve hidden files
such as `.gitattributes`. Never assume a second missing command is available.
Keep the temporary source until verification succeeds; clean up only the staging
directory created for this installation.

## No compatible Python installed

Python is required during learning too: the profile, topic, and concept-session
helpers are Python programs. Downloading the source or receiving an exported
vault does not remove this dependency.

Use an existing interpreter outside `PATH` if available. Otherwise install a
currently supported Python 3 release from [Python.org](https://www.python.org/downloads/)
or the OS's trusted package manager. Use an available, authorized user-level
installation when possible. Do not assume `winget`, Homebrew, `apt`, administrator
access, or internet access exists. Follow the host's permission rules if a
dependency installation requires elevated access or additional authorization.

- **Windows:** use the official [Python installation instructions](https://docs.python.org/3/using/windows.html).
  With the Python Install Manager already installed, `py install 3.14` installs
  a runtime; the older Python launcher does not support that subcommand. The
  official Python downloads also provide a setup route when no manager exists.
- **macOS:** use the Python.org macOS installer or an already available package
  manager. Do not assume the OS includes a usable Python interpreter.
- **Linux:** use the distribution's Python 3 package, for example
  `sudo apt-get install python3` on Debian/Ubuntu when sudo access is authorized,
  or an available user-level Python manager. Other distributions use different
  package managers.

After installation, open a new terminal if needed for `PATH` changes, or invoke
the new interpreter by absolute path. Repeat the executable/version probe before
creating the vault. If installation is unavailable, stop with the concrete
dependency and setup instructions; do not silently skip the generator.

## Run in the available shell

From the source directory, POSIX shell (including Bash, dash, or zsh):

```sh
sh scripts/install_vault.sh "/absolute/path/My Learning" --name "My Learning"
```

PowerShell:

```powershell
.\scripts\install_vault.ps1 'C:\Learning\My Vault' --name 'My Learning'
```

Both wrappers probe compatible Python commands and forward the generator's
arguments and exit status. `--zip` accepts a new ZIP path outside the new vault.
Use `$LASTEXITCODE` to check native program results in PowerShell.

If PowerShell execution policy blocks `.ps1` files, invoke Python directly;
there is no need to weaken the machine's execution policy or install Bash:

```powershell
py -3 .\scripts\create_vault.py 'C:\Learning\My Vault' --name 'My Learning'
```

To select an interpreter at a path containing spaces:

```powershell
$env:VAULT_PYTHON = 'C:\Path With Spaces\Python\python.exe'
.\scripts\install_vault.ps1 'C:\Learning\My Vault'
# Direct invocation also works if script execution is blocked:
& $env:VAULT_PYTHON .\scripts\create_vault.py 'C:\Learning\My Vault'
```

In a POSIX shell, use
`VAULT_PYTHON='/path with spaces/python3' sh scripts/install_vault.sh '/path/to/new-vault'`.
`VAULT_PYTHON` is one executable path, without arguments; do not set it to `py -3`.
An invalid override fails explicitly instead of silently selecting another Python.
See Microsoft's [PowerShell command invocation documentation](https://learn.microsoft.com/en-us/powershell/scripting/learn/shell/running-commands)
for the `&` call operator.

## Verify before reporting success

- Use the saved Python in `runtime.local.toml` to run the profile helper's `show`
  command from the vault root; confirm the recorded Python works.
- All four skills have regular `SKILL.md` entries under both `.agents/skills/`
  and `.claude/skills/`, and their canonical files are under `SKILLS/`.
- `topics/registry.json` has `active_topic: null` and `topics: []`;
  `topics/` contains only `README.md` and `registry.json`.
- `learner-profile.json` is unconfigured with default values.
- `concept-sessions/` contains only its explanatory `README.md`.
- The source checkout contains no learner data, and licenses remain in the vault.

Report the vault path and working Python invocation for future helpers. Open
the destination folder as a vault in Obsidian. Run Codex or Claude Code there;
profile setup and learning begin only when requested.

## Python in a new session or an existing vault

`runtime.local.toml` stores `python` (the executable path), `version` (that
Python's version, not a skill version), and,
when installed from a Git checkout, the setup's `source_commit` (suffixed
`-dirty` if the checkout had uncommitted changes). Quote that path when running helpers; PowerShell requires `&` before it.
If the interpreter moves, or the file is absent after ZIP extraction, verify
Python as above and use it to run `scripts/configure_runtime.py` from the vault.
The record is ignored by Git and excluded from generated ZIPs.

## Update an installed vault

Updating is optional and never automatic. Get a newer setup with Git (`git pull`)
or a fresh source ZIP, then run its updater against the existing vault, using the
Python recorded in the vault's `runtime.local.toml`:

```sh
python3 scripts/update_vault.py "/absolute/path/My Learning" --dry-run
python3 scripts/update_vault.py "/absolute/path/My Learning"
```

In PowerShell, use `py -3 .\scripts\update_vault.py 'C:\Learning\My Vault'`.
`--dry-run` lists the planned changes without writing anything.

Installation records a hash of every setup file in `.vault-manifest.json`, so the
updater can tell your edits apart from changes in the setup:

| Your copy | The setup | Result |
| --- | --- | --- |
| Unedited | Changed | Replaced with the new version. |
| Edited | Unchanged | Your edit is kept. |
| Edited | Changed | Your edit is kept; the new version is saved under `.vault-updates/<time>/incoming/` for review. |
| Deleted | Unchanged | Stays deleted. |
| Deleted | Changed | Stays deleted; the new version is saved for review. |
| Missing | New file | Added. |
| Unedited | Removed | Removed; a backup is saved under `.vault-updates/<time>/backup/`. |
| Edited | Removed | Kept, and no longer tracked as a setup file. |

`--overwrite-modified` replaces edited setup files instead, saving each previous
copy under `.vault-updates/<time>/backup/`. Symlinked setup files are never
written through. A vault installed before manifests existed has no baseline:
every differing file is treated as your edit until you review it or rerun with
`--overwrite-modified`.

The updater never modifies learner data: `learner-profile.json`,
`Learner Profile.md`, `topics/`, `concept-sessions/`, `attachments/`,
`.obsidian/`, your own files under `learning/`, and the interpreter in
`runtime.local.toml`. It only recreates a missing scaffold such as
`concept-sessions/README.md`. The vault title in `Home.md` is kept unless you
pass `--name`. Afterwards, `runtime.local.toml` records the new `source_commit`.
An interrupted update can be rerun safely. `.vault-updates/` is ignored by Git;
delete it once you have reviewed its contents.
