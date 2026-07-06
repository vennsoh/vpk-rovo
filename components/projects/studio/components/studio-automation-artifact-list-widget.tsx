"use client";

import { useMemo } from "react";

import { ArtifactList } from "@/components/ui-custom/artifact-list";
import type { StudioAutomationArtifactListPayload } from "@/components/projects/studio/lib/studio-automation-artifact-list";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";

export function StudioAutomationArtifactListWidget({
	messageId,
	onAgentResultSelect,
	payload,
}: Readonly<{
	messageId: string;
	onAgentResultSelect?: (agent: RovoDataParts["agent-result"], options?: { sourceMessageId?: string }) => void;
	payload: StudioAutomationArtifactListPayload;
}>) {
	const agentByItemId = useMemo(
		() => new Map(payload.agents.map((agent) => [agent.item.id, agent.agentResult] as const)),
		[payload.agents],
	);

	return (
		<>
			<div className="mb-2 w-full max-w-3xl">
				<h3 className="text-sm font-semibold leading-5 text-text">{payload.title}</h3>
				{payload.summary ? <p className="mt-0.5 text-xs leading-4 text-text-subtle">{payload.summary}</p> : null}
			</div>
			<ArtifactList
				className="w-full max-w-3xl"
				items={payload.agents.map((agent) => agent.item)}
				openLabel="View agent"
				openOnRowClick
				onOpen={(item) => {
					const agent = agentByItemId.get(item.id);
					if (agent) {
						onAgentResultSelect?.(agent, { sourceMessageId: messageId });
					}
				}}
			/>
		</>
	);
}
