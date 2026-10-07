# Install a fresh vault from PowerShell 5.1 or newer; Bash is not required.
# Usage: .\scripts\install_vault.ps1 "C:\Learning\My Vault" --name "My Learning"
# Arguments are forwarded unchanged to the canonical Python generator.
$ErrorActionPreference = 'Stop'
$vaultArguments = $args
$vaultProbe = 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)'

if ($env:VAULT_PYTHON) {
    $vaultCandidates = @(@{ Executable = $env:VAULT_PYTHON; Prefix = @() })
} else {
    $vaultCandidates = @(
        @{ Executable = 'py'; Prefix = @('-3') },
        @{ Executable = 'python3'; Prefix = @() },
        @{ Executable = 'python'; Prefix = @() }
    )
}

foreach ($vaultCandidate in $vaultCandidates) {
    $vaultExecutable = $vaultCandidate.Executable
    $vaultPrefix = $vaultCandidate.Prefix
    try {
        & $vaultExecutable @vaultPrefix -c $vaultProbe *> $null
        $vaultUsable = $LASTEXITCODE -eq 0
    } catch {
        $vaultUsable = $false
    }
    if ($vaultUsable) {
        & $vaultExecutable @vaultPrefix (Join-Path $PSScriptRoot 'create_vault.py') @vaultArguments
        exit $LASTEXITCODE
    }
}

[Console]::Error.WriteLine('Python 3.9 or newer is required; no vault was created.')
[Console]::Error.WriteLine('Install Python from https://www.python.org/downloads/ or your OS package manager, then rerun.')
[Console]::Error.WriteLine('For an existing interpreter, set VAULT_PYTHON to its executable path (without arguments).')
[Console]::Error.WriteLine('See INSTALLATION.md for missing dependencies and PowerShell instructions.')
exit 1
