# Change Chat Streaming

Use this when changing `/api/chat-sdk`, `/api/rovo/chat`, streaming data parts, cancellation, deferred tools, or plan approval behavior.

## Files To Inspect

1. `backend/server.js` while chat extraction is still in progress.
2. Future extracted helpers under `backend/chat/`.
3. `backend/lib/rovo-gateway.js`, `backend/lib/rovo-client.js`, and deferred-tool helpers.
4. `app/api/chat-sdk/route.ts` for the Next proxy contract.
5. `app/contexts/context-rovo-chat.tsx` and `components/projects/rovo-core/lib/rovo-app-streaming-assistant.ts`.

## Workflow

1. Preserve existing `stageTrace.mark(...)` names; they are telemetry contracts.
2. Add or update contract tests before moving stream code.
3. Keep streaming headers, SSE event order, cancellation behavior, and backend-unavailable bodies stable.
4. Prefer pure helper extraction before changing orchestration.

## Checks

```bash
node --test backend/server-runtime-security.test.js
pnpm run test:backend
pnpm run test:rovo-core
pnpm run lint
pnpm run typecheck
```

## Failure Modes

- Renaming a data part or stage mark breaks frontend consumers without a type error.
- Treating deferred-tool resume like a fresh chat turn can re-trigger 409 conflicts.
