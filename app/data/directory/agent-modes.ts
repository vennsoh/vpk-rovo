/**
 * Canonical allowed values for the agent "mode" selectors, in the data layer so
 * both the generation prompt (`studio-agent-creation-context`) and the ingest
 * validator (`repair-agent-result`) share one source of truth. The UI option
 * lists in `components/blocks/agent-2/components/agent-2.tsx` (MEMORY_MODE_OPTIONS /
 * KNOWLEDGE_MODE_OPTIONS / REASONING_MODE_SECTIONS) carry the display labels;
 * these are the bare values, kept in lockstep with them.
 */
export const MEMORY_MODE_VALUES = ["on", "off"] as const;
export const KNOWLEDGE_MODE_VALUES = ["all", "custom", "none"] as const;
export const REASONING_MODE_VALUES = [
	"quick-auto",
	"deep-auto",
	"gemini-flash-3",
	"gpt-5.4",
	"sonnet-5",
	"opus-4.6",
] as const;

export type AgentMemoryMode = (typeof MEMORY_MODE_VALUES)[number];
export type AgentKnowledgeMode = (typeof KNOWLEDGE_MODE_VALUES)[number];
export type AgentReasoningMode = (typeof REASONING_MODE_VALUES)[number];

const MEMORY_SET: ReadonlySet<string> = new Set(MEMORY_MODE_VALUES);
const KNOWLEDGE_SET: ReadonlySet<string> = new Set(KNOWLEDGE_MODE_VALUES);
const REASONING_SET: ReadonlySet<string> = new Set(REASONING_MODE_VALUES);

export function isMemoryMode(value: unknown): value is AgentMemoryMode {
	return typeof value === "string" && MEMORY_SET.has(value);
}
export function isKnowledgeMode(value: unknown): value is AgentKnowledgeMode {
	return typeof value === "string" && KNOWLEDGE_SET.has(value);
}
export function isReasoningMode(value: unknown): value is AgentReasoningMode {
	return typeof value === "string" && REASONING_SET.has(value);
}
