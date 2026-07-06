"use client";

import { useEffect, type MutableRefObject } from "react";
import { useLatestRef } from "@/lib/use-latest-ref";
import { startRovoAppPassiveThreadRefresh } from "@/components/projects/rovo-core/lib/rovo-app-passive-thread-refresh";
import { shouldLoadInitialRovoAppThread } from "@/components/projects/rovo-core/lib/rovo-app-thread-route-sync";
import type { RovoAppRefreshThreadsOptions } from "@/components/projects/rovo-core/lib/rovo-app-thread-lifecycle";

interface UseRovoAppThreadRefreshEffectsOptions {
	initialThreadId: string | null;
	lastLoadedInitialThreadIdRef: MutableRefObject<string | null>;
	loadThread: (threadId: string) => Promise<void>;
	refreshThreads: (options?: RovoAppRefreshThreadsOptions) => Promise<void>;
}

export function useRovoAppThreadRefreshEffects({
	initialThreadId,
	lastLoadedInitialThreadIdRef,
	loadThread,
	refreshThreads,
}: UseRovoAppThreadRefreshEffectsOptions): void {
	const loadThreadRef = useLatestRef(loadThread);

	useEffect(() => {
		void refreshThreads({ reportBackendUnavailable: false });
	}, [refreshThreads]);

	useEffect(() => {
		return startRovoAppPassiveThreadRefresh({
			documentRef: document,
			refreshThreads,
			windowRef: window,
		});
	}, [refreshThreads]);

	useEffect(() => {
		if (!initialThreadId) {
			lastLoadedInitialThreadIdRef.current = null;
			return;
		}

		if (
			!shouldLoadInitialRovoAppThread({
				initialThreadId,
				lastLoadedInitialThreadId: lastLoadedInitialThreadIdRef.current,
			})
		) {
			return;
		}

		// The route param seeds the first hydration only. After that, the live
		// in-memory thread state owns navigation so "New chat" can stay blank.
		lastLoadedInitialThreadIdRef.current = initialThreadId;
		void loadThreadRef.current(initialThreadId);
	}, [initialThreadId, lastLoadedInitialThreadIdRef, loadThreadRef]);
}
