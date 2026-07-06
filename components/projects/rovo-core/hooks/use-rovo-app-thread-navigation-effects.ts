"use client";

import { useEffect, type MutableRefObject } from "react";
import { handleRovoAppThreadPopState } from "@/components/projects/rovo-core/lib/rovo-app-thread-lifecycle";

interface ActivateBlankChatStateOptions {
	syncHistory?: boolean;
}

interface UseRovoAppThreadNavigationEffectsOptions {
	activeThreadId: string | null;
	activeThreadIdRef: MutableRefObject<string | null>;
	activateBlankChatState: (options?: ActivateBlankChatStateOptions) => Promise<void>;
	embedded: boolean;
	flushPendingRouteReplacement: (nextActiveThreadId?: string | null) => boolean;
	getThreadIdFromPath: (pathname: string) => string | null;
	hasHydratedActiveThreadRef: MutableRefObject<boolean>;
	loadThread: (threadId: string) => Promise<void>;
	rootPath: string;
}

export function useRovoAppThreadNavigationEffects({
	activeThreadId,
	activeThreadIdRef,
	activateBlankChatState,
	embedded,
	flushPendingRouteReplacement,
	getThreadIdFromPath,
	hasHydratedActiveThreadRef,
	loadThread,
	rootPath,
}: UseRovoAppThreadNavigationEffectsOptions): void {
	useEffect(() => {
		if (embedded) {
			return;
		}

		const handlePopState = () => {
			handleRovoAppThreadPopState({
				activateBlankChatState,
				activeThreadIdRef,
				getThreadIdFromPath,
				hasHydratedActiveThreadRef,
				loadThread,
				pathname: window.location.pathname,
				rootPath,
			});
		};

		window.addEventListener("popstate", handlePopState);
		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, [
		activeThreadIdRef,
		activateBlankChatState,
		embedded,
		getThreadIdFromPath,
		hasHydratedActiveThreadRef,
		loadThread,
		rootPath,
	]);

	useEffect(() => {
		flushPendingRouteReplacement(activeThreadId);
	}, [activeThreadId, flushPendingRouteReplacement]);
}
