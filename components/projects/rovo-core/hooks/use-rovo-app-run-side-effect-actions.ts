"use client";

import type { ChatStatus } from "ai";
import {
	useCallback,
	type Dispatch,
	type MutableRefObject,
	type SetStateAction,
} from "react";
import type { RovoAppDataPart } from "@/components/projects/rovo-core/lib/rovo-app-data-part-dispatcher";
import {
	handleRovoAppAttachedRunChunk,
	releaseCompletedRovoAppUseChatTurn,
} from "@/components/projects/rovo-core/lib/rovo-app-run-lifecycle";
import { waitForRovoApp } from "@/components/projects/rovo-core/lib/rovo-app-hook-helpers";
import type {
	RovoAppActiveRun,
	RovoAppRunStatus,
	RovoAppThread,
} from "@/lib/rovo-app-types";

const ACTIVE_TURN_STOP_TIMEOUT_MS = 1_200;

interface UseRovoAppRunSideEffectActionsOptions {
	activeThreadIdRef: MutableRefObject<string | null>;
	attachedRunStatus: RovoAppRunStatus | null;
	handleRovoAppDataPart: (dataPart: RovoAppDataPart) => void;
	hasObservedTurnCompleteRef: MutableRefObject<boolean>;
	runSubscriptionThreadIdRef: MutableRefObject<string | null>;
	setAttachedRunStatus: (status: RovoAppRunStatus | null) => void;
	setLocalThreadActiveRun: (threadId: string, activeRun: RovoAppActiveRun | null) => void;
	setThreads: Dispatch<SetStateAction<RovoAppThread[]>>;
	statusRef: MutableRefObject<ChatStatus>;
	stopUseChat: () => void | Promise<void>;
	useChatStatus: ChatStatus;
}

interface UseRovoAppRunSideEffectActionsResult {
	handleAttachedRunChunk: (chunk: { data?: unknown; type?: string }) => void;
	releaseCompletedUseChatTurnIfNeeded: () => Promise<void>;
}

export function useRovoAppRunSideEffectActions({
	activeThreadIdRef,
	attachedRunStatus,
	handleRovoAppDataPart,
	hasObservedTurnCompleteRef,
	runSubscriptionThreadIdRef,
	setAttachedRunStatus,
	setLocalThreadActiveRun,
	setThreads,
	statusRef,
	stopUseChat,
	useChatStatus,
}: UseRovoAppRunSideEffectActionsOptions): UseRovoAppRunSideEffectActionsResult {
	const handleAttachedRunChunk = useCallback(
		(chunk: { data?: unknown; type?: string }) => {
			handleRovoAppAttachedRunChunk({
				attachedRunStatus,
				chunk,
				dispatchDataPart: handleRovoAppDataPart,
				runSubscriptionThreadIdRef,
				setAttachedRunStatus,
				setThreads,
			});
		},
		[
			attachedRunStatus,
			handleRovoAppDataPart,
			runSubscriptionThreadIdRef,
			setAttachedRunStatus,
			setThreads,
		],
	);

	const releaseCompletedUseChatTurnIfNeeded = useCallback(async () => {
		await releaseCompletedRovoAppUseChatTurn({
			activeThreadIdRef,
			hasObservedTurnCompleteRef,
			setAttachedRunStatus,
			setLocalThreadActiveRun,
			sleep: waitForRovoApp,
			statusRef,
			stopUseChat,
			timeoutMs: ACTIVE_TURN_STOP_TIMEOUT_MS,
			useChatStatus,
		});
	}, [
		activeThreadIdRef,
		hasObservedTurnCompleteRef,
		setAttachedRunStatus,
		setLocalThreadActiveRun,
		statusRef,
		stopUseChat,
		useChatStatus,
	]);

	return {
		handleAttachedRunChunk,
		releaseCompletedUseChatTurnIfNeeded,
	};
}
