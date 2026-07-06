import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import type { StudioAgentVersionRecord } from "./types";

export type StudioAgentChangeStatus = "Added" | "Removed" | "Modified";

export interface StudioAgentChangeSection {
	id: string;
	label: string;
	status: StudioAgentChangeStatus;
	addedCount?: number;
	removedCount?: number;
}

export interface StudioAgentChangeSummary {
	count: number;
	sections: readonly StudioAgentChangeSection[];
}

type AgentResult = RovoDataParts["agent-result"];

const STUDIO_SESSION_AGENT_PUBLISHER_NAME = "Venn Soh";

interface ChangeGroup {
	id: string;
	label: string;
	fields: readonly (keyof AgentResult)[];
}

const CHANGE_GROUPS: readonly ChangeGroup[] = [
	{ id: "profile", label: "Agent profile", fields: ["name", "description", "summary", "byline", "sourceLabel"] },
	{ id: "instructions", label: "Instructions", fields: ["instructions", "contextDescription", "guardrail", "reasoningMode"] },
	{ id: "icon", label: "Icon", fields: ["avatarSrc", "avatarFallback"] },
	{ id: "triggers", label: "Automations", fields: ["automationRules"] },
	{ id: "memory", label: "Memory", fields: ["memoryMode"] },
	{ id: "knowledge", label: "Knowledge", fields: ["knowledge", "knowledgeMode"] },
	{ id: "skills", label: "Skills", fields: ["skills"] },
	{ id: "tools", label: "Apps", fields: ["tools", "apps"] },
	{ id: "subagents", label: "Subagents", fields: ["subagents", "subagentPrompts"] },
	{ id: "conversationStarters", label: "Conversation starters", fields: ["conversationStarters", "conversationStarterIcons"] },
];

function stringifyForComparison(value: unknown): string {
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function hasValue(value: unknown): boolean {
	if (Array.isArray(value)) {
		return value.length > 0;
	}
	if (typeof value === "string") {
		return value.trim().length > 0;
	}
	return value !== undefined && value !== null;
}

function getGroupPresence(result: AgentResult | null, group: ChangeGroup): boolean {
	if (!result) {
		return false;
	}
	return group.fields.some((field) => hasValue(result[field]));
}

function countArrayItems(value: unknown): number {
	return Array.isArray(value) ? value.length : hasValue(value) ? 1 : 0;
}

function getGroupItemCount(result: AgentResult | null, group: ChangeGroup): number {
	if (!result) {
		return 0;
	}
	return group.fields.reduce((total, field) => total + countArrayItems(result[field]), 0);
}

function getGroupSnapshot(result: AgentResult | null, group: ChangeGroup): Record<string, unknown> {
	const snapshot: Record<string, unknown> = {};
	for (const field of group.fields) {
		snapshot[field] = result?.[field];
	}
	return snapshot;
}

function getChangeStatus(before: AgentResult | null, after: AgentResult, group: ChangeGroup): StudioAgentChangeSection | null {
	const beforeSnapshot = getGroupSnapshot(before, group);
	const afterSnapshot = getGroupSnapshot(after, group);
	if (stringifyForComparison(beforeSnapshot) === stringifyForComparison(afterSnapshot)) {
		return null;
	}

	const beforePresent = getGroupPresence(before, group);
	const afterPresent = getGroupPresence(after, group);
	const beforeCount = getGroupItemCount(before, group);
	const afterCount = getGroupItemCount(after, group);

	if (!beforePresent && afterPresent) {
		return { id: group.id, label: group.label, status: "Added", addedCount: Math.max(afterCount, 1) };
	}
	if (beforePresent && !afterPresent) {
		return { id: group.id, label: group.label, status: "Removed", removedCount: Math.max(beforeCount, 1) };
	}

	return {
		id: group.id,
		label: group.label,
		status: "Modified",
		addedCount: Math.max(afterCount - beforeCount, 0) || undefined,
		removedCount: Math.max(beforeCount - afterCount, 0) || undefined,
	};
}

export function getStudioAgentChangeSummary(
	before: AgentResult | null,
	after: AgentResult,
): StudioAgentChangeSummary {
	const sections = CHANGE_GROUPS
		.map((group) => getChangeStatus(before, after, group))
		.filter((section): section is StudioAgentChangeSection => Boolean(section));

	return {
		count: sections.length,
		sections,
	};
}

export function areStudioAgentResultsEqual(
	before: AgentResult | null,
	after: AgentResult | null,
): boolean {
	return stringifyForComparison(before) === stringifyForComparison(after);
}

function getStudioAgentVersionLabel(
	kind: StudioAgentVersionRecord["kind"],
	changeCount: number,
): string {
	if (kind === "publish") {
		return "Agent published";
	}
	if (kind === "rollback") {
		return "Rollback prepared";
	}
	return changeCount === 1 ? "1 update" : `${changeCount} changes`;
}

export function createStudioAgentVersionRecord({
	before,
	createdAt,
	createdBy = STUDIO_SESSION_AGENT_PUBLISHER_NAME,
	id,
	kind,
	snapshot,
	version,
}: {
	before: AgentResult | null;
	createdAt: number;
	createdBy?: string | null;
	id: string;
	kind: StudioAgentVersionRecord["kind"];
	snapshot: AgentResult;
	version: number;
}): StudioAgentVersionRecord {
	const changeSummary = getStudioAgentChangeSummary(before, snapshot);

	return {
		id,
		label: getStudioAgentVersionLabel(kind, changeSummary.count),
		version,
		kind,
		createdAt,
		createdBy: createdBy || STUDIO_SESSION_AGENT_PUBLISHER_NAME,
		snapshot,
		changeSummary,
	};
}
