# Aro Studio Cursor Rules Kit

These rules govern how changes are planned and executed in this repo.

## Rule editing policy

Cursor MUST NOT edit any files inside `.cursor/rules/` unless the user explicitly instructs it to.
If a rule appears outdated, Cursor must propose a change and wait for approval.

## Workflow expectations

- Work in small, reviewable steps.
- After each milestone, stop and request a review checkpoint.
- Prefer minimal diffs over refactors.
- Preserve existing structure unless this kit instructs otherwise.

## Repo intent

Aro Studio is a suite. Desktop-first now, platform-agnostic long term.
Core logic must remain portable across Electron and web.
