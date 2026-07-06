"use client";

import {
	useRovoAppThreadListCore,
	type UseRovoAppThreadListResult,
} from "@/components/projects/rovo-core/hooks/use-rovo-app-thread-list";

export type { UseRovoAppThreadListResult };

export function useRovoAppThreadList(): UseRovoAppThreadListResult {
	return useRovoAppThreadListCore({ dedupeRefreshResults: true });
}
