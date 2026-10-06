## Install with an agent

Copy this prompt into Codex, Claude Code, or another agent that can run terminal
commands. Replace `<vault-path>` with your new vault's location, such as
`~/Documents/my-learning`.

```text
Create a fresh, empty Obsidian learning vault at <vault-path>, named "My Learning".

1. Check that Git and Python 3.9 or newer are available. Report any missing
   prerequisite. If the destination already exists, keep it intact and ask me
   for a different path.
2. Choose a new temporary directory for <temporary-template-directory>, then
   clone the setup repository from main there:

   git clone --branch main --single-branch --depth 1 https://github.com/bariqmbani/guided-learning-skill.git <temporary-template-directory>

3. Read the cloned README and installer. Create my vault with:

   python3 "<temporary-template-directory>/scripts/create_vault.py" "<vault-path>" --name "My Learning"

   On Windows, use py -3 if python3 is unavailable. Keep the template checkout
   separate from my learning vault.
4. Verify that the vault has Obsidian settings and guided-learning skill entries
   for Codex and Claude Code. Confirm topics/registry.json has active_topic: null
   and topics: [], and learner-profile.json has configured: false. Confirm there
   are no course notes, learning history, or copied Git repository in the vault.
5. Report the completed vault path and tell me how to open it in Obsidian.
   Tell me to run Codex or Claude Code from that folder and start with
   $guided-learning onboard in Codex or /guided-learning onboard in Claude Code.

Leave the learner profile unconfigured until onboarding. Do not create a topic,
generate a roadmap, or start a lesson during installation.
```

The clone command selects main, which contains the setup files. The installer
creates a separate vault with fresh learning data; onboarding happens in your
learning chat afterward.
