"use client";

import { useCallback, type MutableRefObject } from "react";
import type { RovoAppStreamingArtifact } from "@/components/projects/rovo-core/lib/rovo-app-streaming-artifact";
import {
	completeRovoAppUseChatTurn,
	handleRovoAppUseChatError,
} from "@/components/projects/rovo-core/lib/rovo-app-run-lifecycle";
import type {
	RovoAppActiveRun,
	RovoAppDocument,
	RovoAppRunStatus,
} from "@/lib/rovo-app-types";

interface UseRovoAppUseChatLifecycleActionsOptions {
	activeDocumentRef: MutableRefObject<RovoAppDocument | null>;
	activeThreadIdRef: MutableRefObject<string | null>;
	clearArtifactState: () => void;
	clearStreamingArtifactState: () => void;
	currentTurnIntentRef: MutableRefObject<string | null>;
	kickQueue: () => void;
	pendingArtifactCreationRetryRef: MutableRefObject<boolean>;
	resetPendingArtifactAssociation: () => void;
	setAttachedRunStatus: (status: RovoAppRunStatus | null) => void;
	setInputError: (message: string | null) => void;
	setLocalThreadActiveRun: (threadId: string, activeRun: RovoAppActiveRun | null) => void;
	streamingArtifactRef: MutableRefObject<RovoAppStreamingArtifact | null>;
	toUserErrorMessage: (error: unknown) => string;
}

interface UseRovoAppUseChatLifecycleActionsResult {
	completeUseChatTurn: () => void;
	handleUseChatError: (error: unknown) => void;
}

export function useRovoAppUseChatLifecycleActions({
	activeDocumentRef,
	activeThreadIdRef,
	clearArtifactState,
	clearStreamingArtifactState,
	currentTurnIntentRef,
	kickQueue,
	pendingArtifactCreationRetryRef,
	resetPendingArtifactAssociation,
	setAttachedRunStatus,
	setInputError,
	setLocalThreadActiveRun,
	streamingArtifactRef,
	toUserErrorMessage,
}: UseRovoAppUseChatLifecycleActionsOptions): UseRovoAppUseChatLifecycleActionsResult {
	const handleUseChatError = useCallback(
		(error: unknown) => {
			handleRovoAppUseChatError({
				activeDocumentRef,
				clearArtifactState,
				clearStreamingArtifactState,
				currentTurnIntentRef,
				error,
				pendingArtifactCreationRetryRef,
				resetPendingArtifactAssociation,
				setInputError,
				streamingArtifactRef,
				toUserErrorMessage,
			});
		},
		[
			activeDocumentRef,
			clearArtifactState,
			clearStreamingArtifactState,
			currentTurnIntentRef,
			pendingArtifactCreationRetryRef,
			resetPendingArtifactAssociation,
			setInputError,
			streamingArtifactRef,
			toUserErrorMessage,
		],
	);

	const completeUseChatTurn = useCallback(() => {
		completeRovoAppUseChatTurn({
			activeThreadId: activeThreadIdRef.current,
			kickQueue,
			setAttachedRunStatus,
			setLocalThreadActiveRun,
		});
	}, [
		activeThreadIdRef,
		kickQueue,
		setAttachedRunStatus,
		setLocalThreadActiveRun,
	]);

	return {
		completeUseChatTurn,
		handleUseChatError,
	};
}
