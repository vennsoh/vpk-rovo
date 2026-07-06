"use client";

import { useEffect } from "react";
import {
	hydrateCompletedRovoAppActiveRun,
	type HydrateCompletedRovoAppActiveRunInput,
} from "@/components/projects/rovo-core/lib/rovo-app-thread-lifecycle";

export type UseRovoAppCompletedRunHydrationOptions = HydrateCompletedRovoAppActiveRunInput;

export function useRovoAppCompletedRunHydration({
	activeThreadId,
	attachedRunStatus,
	currentActiveRun,
	hydrateThreadById,
	messages,
	setLocalThreadActiveRun,
	useChatStatus,
}: UseRovoAppCompletedRunHydrationOptions): void {
	useEffect(() => {
		hydrateCompletedRovoAppActiveRun({
			activeThreadId,
			attachedRunStatus,
			currentActiveRun,
			hydrateThreadById,
			messages,
			setLocalThreadActiveRun,
			useChatStatus,
		});
	}, [
		activeThreadId,
		attachedRunStatus,
		currentActiveRun,
		hydrateThreadById,
		messages,
		setLocalThreadActiveRun,
		useChatStatus,
	]);
}
