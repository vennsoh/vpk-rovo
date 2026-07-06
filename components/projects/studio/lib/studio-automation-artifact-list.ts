import type { ArtifactListItem } from "@/components/ui-custom/artifact-list";
import { getAllDataParts, type RovoDataParts, type RovoRenderableUIMessage } from "@/lib/rovo-ui-messages";

export const STUDIO_AUTOMATION_ARTIFACT_LIST_TYPE = "studio-automation-artifact-list";

interface StudioAutomationArtifactListEntry {
	item: ArtifactListItem;
	agentResult: RovoDataParts["agent-result"];
}

export interface StudioAutomationArtifactListPayload {
	type: typeof STUDIO_AUTOMATION_ARTIFACT_LIST_TYPE;
	title: string;
	summary?: string;
	agents: StudioAutomationArtifactListEntry[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
	return value !== null && typeof value === "object" && !Array.isArray(value)
		? value as Record<string, unknown>
		: null;
}

function getString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function parseStudioAutomationAgentResult(value: unknown): RovoDataParts["agent-result"] | null {
	const record = asRecord(value);
	if (!record || record.action !== "create") {
		return null;
	}

	const agentId = getString(record.agentId);
	const name = getString(record.name);
	const summary = getString(record.summary);
	if (!agentId || !name || !summary) {
		return null;
	}

	return {
		...(record as RovoDataParts["agent-result"]),
		action: "create",
		agentId,
		name,
		summary,
	};
}

export function parseStudioAutomationArtifactListPayload(payload: unknown): StudioAutomationArtifactListPayload | null {
	const record = asRecord(payload);
	if (!record || record.type !== STUDIO_AUTOMATION_ARTIFACT_LIST_TYPE) {
		return null;
	}

	const title = getString(record.title) ?? "Generated agents";
	const rawAgents = Array.isArray(record.agents) ? record.agents : [];
	const agents = rawAgents.flatMap((entry): StudioAutomationArtifactListEntry[] => {
		const entryRecord = asRecord(entry);
		const itemRecord = asRecord(entryRecord?.item);
		const agentResult = parseStudioAutomationAgentResult(entryRecord?.agentResult);
		const id = getString(itemRecord?.id);
		const itemTitle = getString(itemRecord?.title);
		if (!id || !itemTitle || !agentResult) {
			return [];
		}

		return [{
			item: {
				id,
				title: itemTitle,
				source: getString(itemRecord?.source) ?? "Studio draft",
				owner: getString(itemRecord?.owner) ?? agentResult.byline ?? "Generated agent",
				logoSrc: getString(itemRecord?.logoSrc) ?? agentResult.avatarSrc,
			},
			agentResult,
		}];
	});

	if (agents.length === 0) {
		return null;
	}

	return {
		type: STUDIO_AUTOMATION_ARTIFACT_LIST_TYPE,
		title,
		summary: getString(record.summary) ?? undefined,
		agents,
	};
}

export function getStudioAutomationArtifactListAgents(
	message: Pick<RovoRenderableUIMessage, "parts">,
): RovoDataParts["agent-result"][] {
	const widgetParts = getAllDataParts(message, "data-widget-data");
	for (let index = widgetParts.length - 1; index >= 0; index -= 1) {
		const widget = widgetParts[index].data;
		if (widget.type !== STUDIO_AUTOMATION_ARTIFACT_LIST_TYPE) {
			continue;
		}

		const payload = parseStudioAutomationArtifactListPayload(widget.payload);
		if (payload) {
			return payload.agents.map((agent) => agent.agentResult);
		}
	}

	return [];
}
