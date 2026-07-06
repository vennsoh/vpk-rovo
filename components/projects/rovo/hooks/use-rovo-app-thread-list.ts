"use client";

import {
	useRovoAppThreadListCore,
	type UseRovoAppThreadListResult,
} from "@/components/projects/rovo-core/hooks/use-rovo-app-thread-list";

const ROVO_APP_PASSIVE_THREAD_REFRESH_INTERVAL_MS = 15_000;

export type { UseRovoAppThreadListResult };

export function useRovoAppThreadList(): UseRovoAppThreadListResult {
	return useRovoAppThreadListCore({
		passiveRefreshIntervalMs: ROVO_APP_PASSIVE_THREAD_REFRESH_INTERVAL_MS,
	});
}
