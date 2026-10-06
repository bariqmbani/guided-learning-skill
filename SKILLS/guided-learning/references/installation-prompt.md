## Install with an agent

Copy this prompt into an agent with terminal access. Replace `<vault-path>` with
a new folder, such as `~/Documents/my-learning`. Its folder name becomes the vault title.

```text
Install a fresh Obsidian guided-learning vault at "<vault-path>".

1. Resolve the destination to an absolute path before changing directories.
   If it already exists, preserve it and ask for a new path. Check Git and
   Python 3.9+; on Windows, use py -3 if python3 is unavailable.
2. Clone the setup into a new temporary directory outside the destination:

   git clone --branch main --single-branch --depth 1 https://github.com/bariqmbani/guided-learning-skill.git "<temp>/setup"

   Choose <temp> yourself. Read the checkout's AGENTS.md and README.md, then
   use its installer to create the separate vault:

   python3 "<temp>/setup/scripts/create_vault.py" "<absolute-vault-path>"

3. Verify the new vault contains Home.md, .obsidian/, the canonical skill at
   SKILLS/guided-learning/SKILL.md, and both agent entries at
   .agents/skills/guided-learning/SKILL.md and
   .claude/skills/guided-learning/SKILL.md. Confirm topics/registry.json has
   active_topic: null and topics: [], learner-profile.json has configured: false,
   and the vault has no .git directory. Report any installation or verification
   failure before claiming success.
4. Report the vault's absolute path, explain how to open it as a vault in
   Obsidian, and give the exact command to launch Codex or Claude Code there.
   Tell me to run $guided-learning onboard in Codex or /guided-learning onboard
   in Claude Code. Onboarding and lessons happen afterward; leave the installed
   vault empty and the learner profile unconfigured.
```
