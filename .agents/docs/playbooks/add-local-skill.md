# Add Local Skill

Use this when adding or updating a repo-local skill under `.agents/skills/`.

## Files To Touch

1. `.agents/skills/<skill>/SKILL.md`.
2. `.agents/skills/<skill>/scripts/` only when the skill needs executable helpers.
3. `.agents/skills/<skill>/references/` for long reference material.
4. `.rovo/skills` only through `pnpm run sync:rovo:skills` when runtime overlay sync is required.

## Workflow

1. Keep `SKILL.md` as the entrypoint and link to references instead of embedding long manuals.
2. Declare purpose, inputs, outputs, required tools, validation command, generated artifacts, and failure modes.
3. Resolve script dependencies from the repo root and print setup errors instead of crashing with module resolution traces.
4. Do not add provider-only paths unless they are documented as provider-specific.

## Checks

```bash
pnpm run validate:skills
pnpm run test:skills
pnpm run lint
pnpm run typecheck
```

## Failure Modes

- Skill scripts that assume global dependencies fail in fresh worktrees.
- Rovo overlay drift leaves `.agents/skills` correct but runtime skill files stale.
