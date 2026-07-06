"use client";

import { useCallback, useMemo, useState } from "react";
import type { RovoAppActiveRun } from "@/lib/rovo-app-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import {
	buildRovoAppPlanExecutionDismissKey,
	clearRovoAppPlanExecutionDismissalsForThread,
	resolveRovoAppPlanExecutionTracker,
	type RovoAppPlanExecutionTrackerViewModel,
} from "@/components/projects/shared/lib/rovo-app-plan-execution-tracker";

interface ResolveVisibleRovoAppPlanExecutionTrackerOptions {
	activeThreadId: string | null;
	dismissedKeys: ReadonlySet<string>;
	tracker: RovoAppPlanExecutionTrackerViewModel | null;
}

export function resolveVisibleRovoAppPlanExecutionTracker({
	activeThreadId,
	dismissedKeys,
	tracker,
}: ResolveVisibleRovoAppPlanExecutionTrackerOptions): RovoAppPlanExecutionTrackerViewModel | null {
	if (!activeThreadId || !tracker) {
		return null;
	}

	const dismissKey = buildRovoAppPlanExecutionDismissKey(
		activeThreadId,
		tracker.planKey,
	);
	return dismissedKeys.has(dismissKey) ? null : tracker;
}

interface UseRovoAppPlanExecutionTrackerOptions {
	activeRun: RovoAppActiveRun | null;
	activeThreadId: string | null;
	messages: ReadonlyArray<RovoUIMessage>;
	threadUpdatedAt: string | null;
}

interface UseRovoAppPlanExecutionTrackerResult {
	clearPlanExecutionTrackerDismissalsForThread: (threadId: string) => void;
	dismissPlanExecutionTracker: () => void;
	planExecutionTracker: RovoAppPlanExecutionTrackerViewModel | null;
}

export function useRovoAppPlanExecutionTracker({
	activeRun,
	activeThreadId,
	messages,
	threadUpdatedAt,
}: UseRovoAppPlanExecutionTrackerOptions): UseRovoAppPlanExecutionTrackerResult {
	const [dismissedPlanExecutionTrackerKeys, setDismissedPlanExecutionTrackerKeys] =
		useState<Set<string>>(() => new Set());
	const resolvedPlanExecutionTracker = useMemo(() => {
		return resolveRovoAppPlanExecutionTracker({
			activeRun,
			messages,
			threadId: activeThreadId,
			threadUpdatedAt,
		});
	}, [activeRun, activeThreadId, messages, threadUpdatedAt]);
	const planExecutionTracker = useMemo(() => {
		return resolveVisibleRovoAppPlanExecutionTracker({
			activeThreadId,
			dismissedKeys: dismissedPlanExecutionTrackerKeys,
			tracker: resolvedPlanExecutionTracker,
		});
	}, [
		activeThreadId,
		dismissedPlanExecutionTrackerKeys,
		resolvedPlanExecutionTracker,
	]);
	const dismissPlanExecutionTracker = useCallback(() => {
		if (!activeThreadId || !resolvedPlanExecutionTracker) {
			return;
		}

		const dismissKey = buildRovoAppPlanExecutionDismissKey(
			activeThreadId,
			resolvedPlanExecutionTracker.planKey,
		);
		setDismissedPlanExecutionTrackerKeys((previousKeys) => {
			if (previousKeys.has(dismissKey)) {
				return previousKeys;
			}

			const nextKeys = new Set(previousKeys);
			nextKeys.add(dismissKey);
			return nextKeys;
		});
	}, [activeThreadId, resolvedPlanExecutionTracker]);
	const clearPlanExecutionTrackerDismissalsForThread = useCallback((threadId: string) => {
		setDismissedPlanExecutionTrackerKeys((previousKeys) =>
			clearRovoAppPlanExecutionDismissalsForThread(previousKeys, threadId),
		);
	}, []);

	return {
		clearPlanExecutionTrackerDismissalsForThread,
		dismissPlanExecutionTracker,
		planExecutionTracker,
	};
}
