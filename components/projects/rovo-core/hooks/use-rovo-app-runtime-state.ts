"use client";

import type { ChatStatus } from "ai";
import {
	resolveRovoAppComposerSubmitState,
	type RovoAppDirectDelegationPhase,
} from "@/components/projects/shared/lib/rovo-app-composer-submit-state";
import {
	hasQueuedRovoAppFollowUp,
	isRovoAppThreadBusy,
} from "@/components/projects/rovo-core/lib/rovo-app-queue-gate";
import type { RovoAppRunStatus } from "@/lib/rovo-app-types";

type RovoAppComposerState = ReturnType<typeof resolveRovoAppComposerSubmitState>;

export interface RovoAppRuntimeStateInput {
	activeRunStatus: RovoAppRunStatus | null;
	attachedRunStatus: RovoAppRunStatus | null;
	delegationTurnStatus: ChatStatus;
	directDelegationPhase: RovoAppDirectDelegationPhase;
	hasActiveDispatch: boolean;
	hasObservedTurnComplete: boolean;
	isAttachedActiveRun: boolean;
	latestThinkingStatusLabel: string | null;
	queuedPromptCount: number;
	streamingArtifactStatus: "streaming" | "idle" | null;
	useChatStatus: ChatStatus;
}

export interface RovoAppRuntimeState {
	composerState: RovoAppComposerState;
	isStreaming: boolean;
	isThreadBusy: boolean;
	shouldQueueNextSubmission: boolean;
	shouldSuppressLatestAssistantSuggestions: boolean;
	status: ChatStatus;
}

export function resolveRovoAppRuntimeState({
	activeRunStatus,
	attachedRunStatus,
	delegationTurnStatus,
	directDelegationPhase,
	hasActiveDispatch,
	hasObservedTurnComplete,
	isAttachedActiveRun,
	latestThinkingStatusLabel,
	queuedPromptCount,
	streamingArtifactStatus,
	useChatStatus,
}: RovoAppRuntimeStateInput): RovoAppRuntimeState {
	const composerState = resolveRovoAppComposerSubmitState({
		activeRunStatus,
		backgroundDelegationLabelOverride:
			activeRunStatus === "queued"
				? "Queued. This thread will start when a Rovo port is free."
				: null,
		hasObservedTurnComplete,
		isAttachedActiveRun,
		useChatStatus,
		delegationPhase: directDelegationPhase,
		latestThinkingStatusLabel,
		streamingArtifactStatus,
	});
	const status =
		(
			useChatStatus === "submitted" || useChatStatus === "streaming"
		) && !hasObservedTurnComplete
			? useChatStatus
			: attachedRunStatus === "streaming"
				? "streaming"
				: attachedRunStatus === "queued"
					? "submitted"
					: delegationTurnStatus;
	const isStreaming = status === "submitted" || status === "streaming";
	const isThreadBusy = isRovoAppThreadBusy({
		activeRunStatus,
		attachedRunStatus,
		status,
	});
	const shouldQueueNextSubmission =
		hasActiveDispatch || isThreadBusy || queuedPromptCount > 0;
	const shouldSuppressLatestAssistantSuggestions = hasQueuedRovoAppFollowUp({
		hasActiveQueuedAction: hasActiveDispatch,
		queuedCount: queuedPromptCount,
	});

	return {
		composerState,
		isStreaming,
		isThreadBusy,
		shouldQueueNextSubmission,
		shouldSuppressLatestAssistantSuggestions,
		status,
	};
}

export function useRovoAppRuntimeState(input: RovoAppRuntimeStateInput): RovoAppRuntimeState {
	return resolveRovoAppRuntimeState(input);
}
