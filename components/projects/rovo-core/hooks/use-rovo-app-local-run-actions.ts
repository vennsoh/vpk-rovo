"use client";

import {
	useCallback,
	type Dispatch,
	type SetStateAction,
} from "react";
import {
	createRovoAppLocalActiveRun,
	updateRovoAppThreadActiveRun,
} from "@/components/projects/rovo-core/lib/rovo-app-run-lifecycle";
import type {
	RovoAppActiveRun,
	RovoAppRunStatus,
	RovoAppThread,
} from "@/lib/rovo-app-types";

interface UseRovoAppLocalRunActionsOptions {
	resetObservedTurnComplete: () => void;
	setAttachedRunStatus: (status: RovoAppRunStatus | null) => void;
	setThreads: Dispatch<SetStateAction<RovoAppThread[]>>;
}

interface UseRovoAppLocalRunActionsResult {
	markLocalThreadRunPending: (threadId: string, status?: RovoAppRunStatus) => void;
	setLocalThreadActiveRun: (threadId: string, activeRun: RovoAppActiveRun | null) => void;
}

export function useRovoAppLocalRunActions({
	resetObservedTurnComplete,
	setAttachedRunStatus,
	setThreads,
}: UseRovoAppLocalRunActionsOptions): UseRovoAppLocalRunActionsResult {
	const setLocalThreadActiveRun = useCallback(
		(threadId: string, activeRun: RovoAppActiveRun | null) => {
			setThreads((previousThreads) =>
				updateRovoAppThreadActiveRun(previousThreads, {
					activeRun,
					threadId,
				}),
			);
		},
		[setThreads],
	);

	const markLocalThreadRunPending = useCallback(
		(threadId: string, status: RovoAppRunStatus = "streaming") => {
			resetObservedTurnComplete();
			setLocalThreadActiveRun(threadId, createRovoAppLocalActiveRun({
				status,
				threadId,
			}));
			setAttachedRunStatus(status);
		},
		[resetObservedTurnComplete, setAttachedRunStatus, setLocalThreadActiveRun],
	);

	return {
		markLocalThreadRunPending,
		setLocalThreadActiveRun,
	};
}
