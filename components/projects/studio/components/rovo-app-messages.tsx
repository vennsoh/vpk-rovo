"use client";

import { AgentResultCard, isGeneratedAgentResult } from "@/components/projects/sidebar-chat/components/agent-result-card";
import {
	ROVO_APP_DEFAULT_EMPTY_STATE,
	RovoAppMessages as RovoCoreAppMessages,
	type RovoAppMessagesProps,
} from "@/components/projects/rovo-core/components/rovo-app-messages";
import {
	StudioAutomationArtifactListWidget,
} from "@/components/projects/studio/components/studio-automation-artifact-list-widget";
import {
	parseStudioAutomationArtifactListPayload,
	STUDIO_AUTOMATION_ARTIFACT_LIST_TYPE,
} from "@/components/projects/studio/lib/studio-automation-artifact-list";
import {
	getMessageAgentResult,
	hasTurnCompleteSignal,
	type RovoDataParts,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";

const STUDIO_TOOL_DRIVEN_WIDGET_TYPES = new Set([
	STUDIO_AUTOMATION_ARTIFACT_LIST_TYPE,
]);

const STUDIO_EMPTY_STATE = {
	default: {
		heading: "Move work forward with agents",
		id: "default",
	},
	max: ROVO_APP_DEFAULT_EMPTY_STATE.max,
} as const;

type StudioRovoAppMessagesProps = Omit<
	RovoAppMessagesProps,
	| "additionalToolDrivenWidgetTypes"
	| "contentSpacingClassName"
	| "emptyStateConfig"
	| "renderAfterAssistantMessage"
	| "renderCustomWidget"
	| "shouldSuppressArtifactCard"
	| "shouldSuppressResolvedQuestionTrace"
	| "treatSettledToolsAsPostResultPending"
	| "unavailableProductName"
> & {
	onAgentResultSelect?: (agent: RovoDataParts["agent-result"], options?: { sourceMessageId?: string }) => void;
};

function getCompletedGeneratedAgentResult(message: RovoUIMessage): RovoDataParts["agent-result"] | null {
	const agentResult = getMessageAgentResult(message);
	return isGeneratedAgentResult(agentResult) && hasTurnCompleteSignal(message)
		? agentResult
		: null;
}

export function RovoAppMessages({
	onAgentResultSelect,
	...props
}: Readonly<StudioRovoAppMessagesProps>) {
	return (
		<RovoCoreAppMessages
			{...props}
			additionalToolDrivenWidgetTypes={STUDIO_TOOL_DRIVEN_WIDGET_TYPES}
			contentSpacingClassName="pt-6 pb-32"
			emptyStateConfig={STUDIO_EMPTY_STATE}
			renderAfterAssistantMessage={({ message }) => {
				const completedAgentResult = getCompletedGeneratedAgentResult(message);
				return completedAgentResult ? (
					<AgentResultCard
						agent={completedAgentResult}
						onSelectAgent={
							onAgentResultSelect
								? (agent) => onAgentResultSelect(agent, { sourceMessageId: message.id })
								: undefined
						}
					/>
				) : null;
			}}
			renderCustomWidget={({ message, widget }) => {
				if (widget.type !== STUDIO_AUTOMATION_ARTIFACT_LIST_TYPE) {
					return null;
				}

				const payload = parseStudioAutomationArtifactListPayload(widget.payload);
				return payload ? (
					<StudioAutomationArtifactListWidget
						messageId={message.id}
						onAgentResultSelect={onAgentResultSelect}
						payload={payload}
					/>
				) : null;
			}}
			shouldSuppressArtifactCard={({ message }) => getCompletedGeneratedAgentResult(message) !== null}
			shouldSuppressResolvedQuestionTrace
			treatSettledToolsAsPostResultPending
			unavailableProductName="Studio"
		/>
	);
}
