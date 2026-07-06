"use client";

import {
	useCallback,
	useState,
	type Dispatch,
	type MutableRefObject,
	type SetStateAction,
} from "react";
import { persistRovoAppPlanWidgetMetadata as persistRovoAppPlanWidgetMetadataCore } from "@/components/projects/rovo-core/lib/rovo-app-plan-widget-metadata-persistence";
import type { RovoAppPersistPlanWidgetMetadataInput } from "@/components/projects/rovo-core/hooks/use-rovo-app-plan-widget-metadata-enrichment";
import type { RovoAppThread } from "@/lib/rovo-app-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

interface UseRovoAppPlanWidgetMetadataActionsOptions {
	activeThreadIdRef: MutableRefObject<string | null>;
	beginThreadHydration: () => void;
	completeThreadHydration: () => void;
	deletedThreadIdsRef: MutableRefObject<Set<string>>;
	lastPersistedKeyRef: MutableRefObject<string>;
	reconcileThreadWithLocalTitle: (thread: RovoAppThread) => RovoAppThread;
	setMessages: Dispatch<SetStateAction<RovoUIMessage[]>>;
	setThreads: Dispatch<SetStateAction<RovoAppThread[]>>;
	threadsRef: MutableRefObject<RovoAppThread[]>;
	updateThread: (
		threadId: string,
		patch: { messages: ReadonlyArray<RovoUIMessage> },
	) => Promise<RovoAppThread>;
}

interface UseRovoAppPlanWidgetMetadataActionsResult {
	clearPendingPlanMetadataGeneration: (sourceMessageId?: string | null) => void;
	pendingPlanMetadataMessageIds: ReadonlySet<string>;
	persistPlanWidgetMetadata: (options: RovoAppPersistPlanWidgetMetadataInput) => void;
	setPlanMetadataPendingState: (sourceMessageId: string, isPending: boolean) => void;
}

export function useRovoAppPlanWidgetMetadataActions({
	activeThreadIdRef,
	beginThreadHydration,
	completeThreadHydration,
	deletedThreadIdsRef,
	lastPersistedKeyRef,
	reconcileThreadWithLocalTitle,
	setMessages,
	setThreads,
	threadsRef,
	updateThread,
}: UseRovoAppPlanWidgetMetadataActionsOptions): UseRovoAppPlanWidgetMetadataActionsResult {
	const [pendingPlanMetadataMessageIds, setPendingPlanMetadataMessageIds] =
		useState<Set<string>>(() => new Set<string>());

	const setPlanMetadataPendingState = useCallback(
		(sourceMessageId: string, isPending: boolean) => {
			setPendingPlanMetadataMessageIds((previousMessageIds) => {
				if (isPending && previousMessageIds.has(sourceMessageId)) {
					return previousMessageIds;
				}
				if (!isPending && !previousMessageIds.has(sourceMessageId)) {
					return previousMessageIds;
				}

				const nextMessageIds = new Set<string>(previousMessageIds);
				if (isPending) {
					nextMessageIds.add(sourceMessageId);
				} else {
					nextMessageIds.delete(sourceMessageId);
				}
				return nextMessageIds;
			});
		},
		[],
	);

	const clearPendingPlanMetadataGeneration = useCallback(
		(sourceMessageId?: string | null) => {
			if (!sourceMessageId) {
				setPendingPlanMetadataMessageIds((previousMessageIds) => (
					previousMessageIds.size === 0 ? previousMessageIds : new Set<string>()
				));
				return;
			}

			setPlanMetadataPendingState(sourceMessageId, false);
		},
		[setPlanMetadataPendingState],
	);

	const persistPlanWidgetMetadata = useCallback(
		(options: RovoAppPersistPlanWidgetMetadataInput) => {
			void persistRovoAppPlanWidgetMetadataCore({
				activeThreadIdRef,
				beginThreadHydration,
				clearPendingPlanMetadataGeneration,
				completeThreadHydration,
				deletedThreadIdsRef,
				lastPersistedKeyRef,
				messages: options.messages,
				reconcileThreadWithLocalTitle,
				setRovoMessages: setMessages,
				setThreads,
				shortDescription: options.shortDescription,
				sourceMessageId: options.sourceMessageId,
				threadId: options.threadId,
				threadsRef,
				title: options.title,
				updateThread,
			});
		},
		[
			activeThreadIdRef,
			beginThreadHydration,
			clearPendingPlanMetadataGeneration,
			completeThreadHydration,
			deletedThreadIdsRef,
			lastPersistedKeyRef,
			reconcileThreadWithLocalTitle,
			setMessages,
			setThreads,
			threadsRef,
			updateThread,
		],
	);

	return {
		clearPendingPlanMetadataGeneration,
		pendingPlanMetadataMessageIds,
		persistPlanWidgetMetadata,
		setPlanMetadataPendingState,
	};
}
