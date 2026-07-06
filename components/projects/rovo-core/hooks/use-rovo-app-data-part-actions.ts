"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
	dispatchRovoAppDataPart,
	type DispatchRovoAppDataPartInput,
	type RovoAppDataPart,
} from "@/components/projects/rovo-core/lib/rovo-app-data-part-dispatcher";

type UseRovoAppDataPartActionsOptions = Omit<
	DispatchRovoAppDataPartInput,
	"notifyStreamingCancelled"
>;

interface UseRovoAppDataPartActionsResult {
	handleRovoAppDataPart: (dataPart: RovoAppDataPart) => void;
}

export function useRovoAppDataPartActions({
	activeThreadIdRef,
	clearQueuedStreamingArtifactDelta,
	currentTurnIntentRef,
	flushQueuedStreamingArtifactDeltaNow,
	hydratePersistedArtifact,
	kickQueue,
	lastCompletedArtifactDocumentIdRef,
	markObservedTurnComplete,
	pendingArtifactAssociationRef,
	pendingArtifactCreationRetryRef,
	persistActiveDocumentSelection,
	queueStreamingArtifactDelta,
	setActiveDocumentId,
	setArtifactMode,
	setAttachedRunStatus,
	setLocalThreadActiveRun,
	setPendingArtifactResult,
	setSelectedVersionId,
	setStreamingArtifact,
	streamingArtifactRef,
	suppressedStreamingAutoOpenDocumentIdRef,
	visibleArtifactDocumentIdRef,
}: UseRovoAppDataPartActionsOptions): UseRovoAppDataPartActionsResult {
	const handleRovoAppDataPart = useCallback(
		(dataPart: RovoAppDataPart) => {
			dispatchRovoAppDataPart(dataPart, {
				activeThreadIdRef,
				clearQueuedStreamingArtifactDelta,
				currentTurnIntentRef,
				flushQueuedStreamingArtifactDeltaNow,
				hydratePersistedArtifact,
				kickQueue,
				lastCompletedArtifactDocumentIdRef,
				markObservedTurnComplete,
				notifyStreamingCancelled: () => {
					toast("Previous version saved", {
						description: "A partial version was saved before starting the new one.",
					});
				},
				pendingArtifactAssociationRef,
				pendingArtifactCreationRetryRef,
				persistActiveDocumentSelection,
				queueStreamingArtifactDelta,
				setActiveDocumentId,
				setArtifactMode,
				setAttachedRunStatus,
				setLocalThreadActiveRun,
				setPendingArtifactResult,
				setSelectedVersionId,
				setStreamingArtifact,
				streamingArtifactRef,
				suppressedStreamingAutoOpenDocumentIdRef,
				visibleArtifactDocumentIdRef,
			});
		},
		[
			activeThreadIdRef,
			clearQueuedStreamingArtifactDelta,
			currentTurnIntentRef,
			flushQueuedStreamingArtifactDeltaNow,
			hydratePersistedArtifact,
			kickQueue,
			lastCompletedArtifactDocumentIdRef,
			markObservedTurnComplete,
			pendingArtifactAssociationRef,
			pendingArtifactCreationRetryRef,
			persistActiveDocumentSelection,
			queueStreamingArtifactDelta,
			setActiveDocumentId,
			setArtifactMode,
			setAttachedRunStatus,
			setLocalThreadActiveRun,
			setPendingArtifactResult,
			setSelectedVersionId,
			setStreamingArtifact,
			streamingArtifactRef,
			suppressedStreamingAutoOpenDocumentIdRef,
			visibleArtifactDocumentIdRef,
		],
	);

	return {
		handleRovoAppDataPart,
	};
}
