"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RovoAppQueueContextValue } from "@/components/projects/rovo-core/hooks/use-rovo-app-queue";
import {
	type RovoAppAgentMode,
	syncRovoAppAgentModeForDispatch,
} from "@/components/projects/rovo-core/lib/rovo-app-agent-mode";

type RovoAppDispatchAgentMode = Extract<RovoAppAgentMode, "default" | "plan">;

interface UseRovoAppDispatchPrepActionsOptions {
	activeThreadId: string | null;
	removeQueuedAction: RovoAppQueueContextValue["removeQueuedAction"];
	runtimeThreadId: string;
}

interface UseRovoAppDispatchPrepActionsResult {
	removeQueuedPrompt: (id: string) => void;
	syncAgentModeForDispatch: (mode: RovoAppDispatchAgentMode) => Promise<void>;
}

export function useRovoAppDispatchPrepActions({
	activeThreadId,
	removeQueuedAction,
	runtimeThreadId,
}: UseRovoAppDispatchPrepActionsOptions): UseRovoAppDispatchPrepActionsResult {
	const lastSyncedAgentModeRef = useRef<RovoAppDispatchAgentMode | null>(null);

	useEffect(() => {
		lastSyncedAgentModeRef.current = null;
	}, [activeThreadId]);

	const syncAgentModeForDispatch = useCallback(
		async (mode: RovoAppDispatchAgentMode) => {
			if (lastSyncedAgentModeRef.current === mode) {
				return;
			}

			const result = await syncRovoAppAgentModeForDispatch(fetch, mode);
			if (result.applied) {
				lastSyncedAgentModeRef.current = mode;
			}
		},
		[],
	);

	const removeQueuedPrompt = useCallback(
		(id: string) => {
			if (!id) {
				return;
			}

			removeQueuedAction(runtimeThreadId, id);
		},
		[removeQueuedAction, runtimeThreadId],
	);

	return {
		removeQueuedPrompt,
		syncAgentModeForDispatch,
	};
}
