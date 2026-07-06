import templatesData from "./agent-templates.json";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";

/**
 * Tabs the agent-template directory is grouped by, mirrored by the bento and
 * agent-directory surfaces. Owned here so the data layer is the single source
 * of truth; the UI components import this union rather than redeclaring it.
 */
export type AgentTemplateCategoryId =
	| "brainstorm"
	| "analyze"
	| "review"
	| "summarize"
	| "create";

export const AGENT_TEMPLATE_CATEGORY_IDS: readonly AgentTemplateCategoryId[] = [
	"brainstorm",
	"analyze",
	"review",
	"summarize",
	"create",
];

/**
 * Reasoning model preset, mirroring the `REASONING_MODE_SECTIONS` value union in
 * `components/blocks/agent-2/components/agent-2.tsx`. Templates default to a section
 * default (`quick-auto` for fast Q&A, `deep-auto` for analysis-heavy work) but a
 * specific model is allowed.
 */
export type AgentTemplateReasoningMode =
	| "quick-auto"
	| "deep-auto"
	| "gemini-flash-3"
	| "gpt-5.4"
	| "sonnet-5"
	| "opus-4.6";

/** Organizational-knowledge scope, mirroring `KNOWLEDGE_MODE_OPTIONS` in agent.tsx. */
export type AgentTemplateKnowledgeMode = "all" | "custom" | "none";

/** Memory toggle, mirroring `MEMORY_MODE_OPTIONS` in agent.tsx. */
export type AgentTemplateMemoryMode = "on" | "off";

/**
 * Authored config for one agent template. Richer than a directory agent record:
 * it carries `instructions` (the template's robust setup guidance) plus the
 * stats/attribution the directory cards render. Connected-app `sourceKeys` are
 * resolved to display sources by the component loader; skills/capabilities are
 * derived there too, so this stays pure, serializable data.
 *
 * The binding fields (`toolIds`/`skillIds`/`knowledgeIds`/`subagentIds`) hold
 * REAL catalog ids from tools.json / skills.json / knowledge.json / agents.json
 * and act as strong defaults when generating an agent from this template. The
 * `instructionsBody` is tokenized markdown whose `@[category:id]` references
 * point at those same catalog ids (see `resolve-ids.ts`).
 */
/**
 * A nested subagent owned by a parent template/agent. Subagents are NOT top-level
 * custom agents — they exist only inside their parent, are only `@`-mentionable
 * once the parent generates them, and carry their OWN smaller config (a lighter
 * subset of skills/apps/knowledge plus their own memory/reasoning). The `id` is
 * shared 1:1 with the parent's `subagentIds` so body `@[subagent:id]` tokens and
 * the escalation row resolve to this definition.
 */
export interface TemplateSubagent {
	id: string;
	name: string;
	description: string;
	/** Hexagon agent avatar path, when the subagent has one. */
	avatarSrc?: string;
	/** ADS brand logo name, when the subagent renders a product logo instead. */
	logoName?: string;
	/** Smaller skill subset (skills.json ids) the subagent runs with. */
	skillIds: readonly string[];
	/** Smaller tool/app subset (tools.json ids) the subagent can use. */
	toolIds: readonly string[];
	/** Smaller knowledge subset (knowledge.json app ids) the subagent grounds against. */
	knowledgeIds: readonly string[];
	/** Subagent memory toggle (typically off — subagents are lightweight). */
	memoryMode: AgentTemplateMemoryMode;
	/** Subagent reasoning preset (typically quick-auto — lighter than the parent). */
	reasoningMode: AgentTemplateReasoningMode;
}

export interface AgentTemplateConfig {
	id: string;
	categoryId: AgentTemplateCategoryId;
	name: string;
	description: string;
	/** Robust, structured setup/usage guidance shown in the template detail. */
	instructions: string;
	avatarSrc: string;
	publisher: string;
	attributionKind?: "company" | "team" | "person";
	publisherBrandName?: ThirdPartyLogoName;
	verified?: boolean;
	/** Keys into the component loader's connected-app SOURCE map. */
	sourceKeys?: readonly string[];
	/** Optional override for the generated "remix this template" prompt. */
	templatePrompt?: string;
	remix: string;
	updated: string;
	peopleOffset: number;
	collaboratorOverflow?: number;
	/** Real tool ids (tools.json) this template wires up by default. */
	toolIds: readonly string[];
	/** Real skill ids (skills.json) this template wires up by default. */
	skillIds: readonly string[];
	/** Real knowledge-app ids (knowledge.json) this template grounds against. */
	knowledgeIds: readonly string[];
	/** Real subagent ids (agents.json) this template can delegate to. */
	subagentIds: readonly string[];
	/**
	 * Nested subagent definitions, 1:1 with `subagentIds`. Each carries the
	 * subagent's own smaller config so the parent can generate real nested
	 * subagents (with their own apps/skills/knowledge/memory/reasoning) rather
	 * than delegating to other top-level agents. Only these become `@`-mentionable
	 * once the parent is generated.
	 */
	subagentDefinitions?: readonly TemplateSubagent[];
	/** Suggested first-turn prompts shown as conversation starters. */
	conversationStarters: readonly string[];
	/** Optional @atlaskit/icon/core names paired 1:1 with `conversationStarters`. */
	conversationStarterIcons?: readonly string[];
	/** Event phrases that should auto-invoke this agent (0-3). */
	triggers: readonly string[];
	/**
	 * Shared automation instruction shown in the trigger/automation dialog's
	 * "Agent Instructions" field — what the agent should do when any trigger fires.
	 * Applied to every generated trigger definition's `prompt`.
	 */
	triggerPrompt?: string;
	/** Short automation name shown in the trigger/automation dialog. */
	triggerAutomationName?: string;
	/** Default memory toggle for agents created from this template. */
	memoryMode: AgentTemplateMemoryMode;
	/** Default reasoning preset for agents created from this template. */
	reasoningMode: AgentTemplateReasoningMode;
	/** Default organizational-knowledge scope. */
	knowledgeMode: AgentTemplateKnowledgeMode;
	/** Tokenized markdown body; `@[category:id]` tokens reference bound catalog ids. */
	instructionsBody: string;
	/**
	 * Curated 2nd-person opening line for the instruction body. Authored per
	 * template and preserved verbatim by the body generator
	 * (`scripts/generate-agent-template-bodies.js`), which writes the rest of
	 * `instructionsBody` around it.
	 */
	bodyIntro?: string;
	/** Optional curated closing line; falls back to a category default when absent. */
	bodyOutro?: string;
}

/**
 * The complete agent-template catalog, sourced from `agent-templates.json` as the
 * single source of truth. Powers the agent-templates directory, the agent-directory
 * template tab, and the agent-bento operations tiles.
 */
export const AGENT_TEMPLATE_CONFIGS: readonly AgentTemplateConfig[] =
	templatesData as readonly AgentTemplateConfig[];

/** Convenience lookup by id. */
export function getAgentTemplateConfigById(id: string): AgentTemplateConfig | undefined {
	return AGENT_TEMPLATE_CONFIGS.find((template) => template.id === id);
}

/** All template configs in a given category, in catalog order. */
export function getAgentTemplateConfigsByCategory(
	categoryId: AgentTemplateCategoryId,
): readonly AgentTemplateConfig[] {
	return AGENT_TEMPLATE_CONFIGS.filter((template) => template.categoryId === categoryId);
}
