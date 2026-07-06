# Add Local Agent

Use this when adding or updating a canonical repo-local agent under `.agents/agents/`.

## Files To Inspect

1. `.agents/skills/agent-creator/SKILL.md` for the required workflow and file shape.
2. `.agents/skills/agent-creator/assets/agent-template.md` for new agent files.
3. `.agents/skills/agent-creator/references/schema.md` before adding frontmatter fields or section names.
4. `.agents/agents/<agent>.md` when updating an existing agent.
5. `.agents/knowledge/<agent>/` when the agent uses `memory: project`.

## Workflow

1. Draft an Agent Plan first: name, goal, boundaries, tools, skills, knowledge path, triggers, channels, starters, validation, and failure modes.
2. Wait for approval before creating or changing the agent definition.
3. Keep runtime fields in YAML frontmatter and operational instructions in the Markdown body.
4. Include the required sections: `Instructions`, `Knowledge`, `Triggers`, `Channels`, `Conversation Starters`, `Validation`, and `Maintenance Notes`.
5. If the agent appears in a runtime selector or generated profile, keep the visible description and conversation starters sourced from the Markdown file.
6. Create live Codex automations only after a separate user approval.

## Checks

```bash
pnpm run validate:agents
pnpm run test:agents
pnpm run lint
pnpm run typecheck
```

For one file:

```bash
node .agents/skills/agent-creator/scripts/validate-agent.mjs .agents/agents/<agent>.md --root .
```

## Failure Modes

- Adding provider-specific config instead of updating the canonical Markdown file leaves selectors and docs out of sync.
- Missing structured sections or empty conversation starters pass human review poorly and fail the agent validator.
