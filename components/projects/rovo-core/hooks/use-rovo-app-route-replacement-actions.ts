"use client";

import { useCallback, type MutableRefObject } from "react";
import { useRouter } from "next/navigation";
import type { RovoAppRouteAdapter } from "@/components/projects/rovo-core/lib/rovo-app-route-adapter";
import { flushPendingRovoAppRouteReplacement } from "@/components/projects/rovo-core/lib/rovo-app-thread-route-sync";
import { replaceRovoAppHistoryPath } from "@/components/projects/rovo-core/lib/rovo-app-hook-helpers";

interface UseRovoAppRouteReplacementActionsOptions {
	activeThreadIdRef: MutableRefObject<string | null>;
	buildThreadPath: RovoAppRouteAdapter["buildThreadPath"];
	embedded: boolean;
	isStreaming: boolean;
	isVoiceMode: boolean;
	pendingRouteReadyRef: MutableRefObject<boolean>;
	pendingRouteThreadIdRef: MutableRefObject<string | null>;
}

interface UseRovoAppRouteReplacementActionsResult {
	flushPendingRouteReplacement: (nextActiveThreadId?: string | null) => boolean;
	replaceRovoAppRoute: (path: string) => void;
}

export function useRovoAppRouteReplacementActions({
	activeThreadIdRef,
	buildThreadPath,
	embedded,
	isStreaming,
	isVoiceMode,
	pendingRouteReadyRef,
	pendingRouteThreadIdRef,
}: UseRovoAppRouteReplacementActionsOptions): UseRovoAppRouteReplacementActionsResult {
	const router = useRouter();
	const replaceRovoAppRoute = useCallback((path: string) => {
		router.replace(path);
	}, [router]);

	const flushPendingRouteReplacement = useCallback(
		(nextActiveThreadId: string | null = activeThreadIdRef.current) => {
			return flushPendingRovoAppRouteReplacement({
				activeThreadId: nextActiveThreadId,
				buildThreadPath,
				embedded,
				isStreaming,
				isVoiceMode,
				pendingRouteReadyRef,
				pendingThreadIdRef: pendingRouteThreadIdRef,
				replaceHistoryPath: replaceRovoAppHistoryPath,
			});
		},
		[
			activeThreadIdRef,
			buildThreadPath,
			embedded,
			isStreaming,
			isVoiceMode,
			pendingRouteReadyRef,
			pendingRouteThreadIdRef,
		],
	);

	return {
		flushPendingRouteReplacement,
		replaceRovoAppRoute,
	};
}
