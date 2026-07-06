"use client";

import type { ChatStatus } from "ai";
import { useEffect, useMemo } from "react";
import {
	getRovoAppBackgroundRefreshThreadIds,
	runRovoAppBackgroundRefreshPoll,
	type RovoAppBackgroundStreamSummary,
} from "@/components/projects/rovo-core/lib/rovo-app-background-refresh";
import type { RovoAppThread } from "@/lib/rovo-app-types";

interface MutableRef<T> {
	current: T;
}

export interface UseRovoAppBackgroundRefreshOptions {
	activeThreadId: string | null;
	activeThreadIdRef: MutableRef<string | null>;
	deletedThreadIdsRef: MutableRef<Set<string>>;
	hydrateThreadById: (threadId: string) => Promise<unknown>;
	listBackgroundStreams: () => Promise<ReadonlyArray<RovoAppBackgroundStreamSummary>>;
	listThreads: () => Promise<ReadonlyArray<RovoAppThread>>;
	reconcileThread: (thread: RovoAppThread) => RovoAppThread;
	setThreads: (updater: (previousThreads: RovoAppThread[]) => RovoAppThread[]) => void;
	statusRef: MutableRef<ChatStatus>;
	threads: ReadonlyArray<RovoAppThread>;
}

export function useRovoAppBackgroundRefresh({
	activeThreadId,
	activeThreadIdRef,
	deletedThreadIdsRef,
	hydrateThreadById,
	listBackgroundStreams,
	listThreads,
	reconcileThread,
	setThreads,
	statusRef,
	threads,
}: UseRovoAppBackgroundRefreshOptions): void {
	const backgroundRefreshThreadIds = useMemo(() => {
		return getRovoAppBackgroundRefreshThreadIds({
			activeThreadId,
			threads,
		});
	}, [activeThreadId, threads]);
	const backgroundRefreshThreadIdsKey = useMemo(() => {
		return JSON.stringify(backgroundRefreshThreadIds);
	}, [backgroundRefreshThreadIds]);

	useEffect(() => {
		if (backgroundRefreshThreadIdsKey === "[]") {
			return;
		}

		const trackedThreadIds = JSON.parse(backgroundRefreshThreadIdsKey) as string[];
		let cancelled = false;
		const poll = async () => {
			await runRovoAppBackgroundRefreshPoll({
				getActiveThreadId: () => activeThreadIdRef.current,
				getDeletedThreadIds: () => deletedThreadIdsRef.current,
				getStatus: () => statusRef.current,
				hydrateThreadById,
				isCancelled: () => cancelled,
				listBackgroundStreams,
				listThreads,
				reconcileThread,
				setThreads,
				trackedThreadIds,
			});
		};

		const intervalId = window.setInterval(poll, 3000);
		void poll(); // Run immediately on first render

		return () => {
			cancelled = true;
			window.clearInterval(intervalId);
		};
	}, [
		activeThreadIdRef,
		backgroundRefreshThreadIdsKey,
		deletedThreadIdsRef,
		hydrateThreadById,
		listBackgroundStreams,
		listThreads,
		reconcileThread,
		setThreads,
		statusRef,
	]);
}
