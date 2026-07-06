"use client";

import {
	useCallback,
	useMemo,
	type MutableRefObject,
} from "react";
import { getLatestDocumentContent } from "@/components/projects/rovo-core/lib/rovo-app-message-artifacts";
import {
	buildRovoAppSmartGenerationRequest,
	type RovoAppSmartGenerationLayoutContext,
	type RovoAppSmartGenerationRequest,
} from "@/components/projects/rovo-core/lib/rovo-app-smart-generation-layout";
import type { RovoAppQueuedActionsByThreadId } from "@/components/projects/rovo-core/lib/rovo-app-queue-state";
import {
	mergeRovoAppThreadWithLocalTitle,
} from "@/components/projects/rovo-core/lib/rovo-app-thread-state";
import type {
	RovoAppDocument,
	RovoAppQueuedAction,
	RovoAppThread,
} from "@/lib/rovo-app-types";

interface UseRovoAppDerivedStateOptions {
	activeDocumentId: string | null;
	activeThreadId: string | null;
	documents: ReadonlyArray<RovoAppDocument>;
	draftThreadId: string;
	embedded: boolean;
	queuedActionsByThreadId: RovoAppQueuedActionsByThreadId;
	smartGenerationLayout?: RovoAppSmartGenerationLayoutContext;
	threads: ReadonlyArray<RovoAppThread>;
	threadsRef: MutableRefObject<RovoAppThread[]>;
}

interface UseRovoAppDerivedStateResult {
	activeDocument: RovoAppDocument | null;
	activeDocumentContent: string;
	backgroundStreamThreadIds: ReadonlySet<string>;
	currentThread: RovoAppThread | null;
	queuedPrompts: ReadonlyArray<RovoAppQueuedAction>;
	reconcileThreadWithLocalTitle: (thread: RovoAppThread) => RovoAppThread;
	runtimeThreadId: string;
	smartGenerationRequest: RovoAppSmartGenerationRequest;
}

export function useRovoAppDerivedState({
	activeDocumentId,
	activeThreadId,
	documents,
	draftThreadId,
	embedded,
	queuedActionsByThreadId,
	smartGenerationLayout,
	threads,
	threadsRef,
}: UseRovoAppDerivedStateOptions): UseRovoAppDerivedStateResult {
	const activeDocument = useMemo(() => {
		return documents.find((document) => document.id === activeDocumentId) ?? null;
	}, [activeDocumentId, documents]);
	const currentThread = useMemo(() => {
		return threads.find((thread) => thread.id === activeThreadId) ?? null;
	}, [activeThreadId, threads]);
	const backgroundStreamThreadIds = useMemo(() => {
		return new Set(
			threads
				.filter((thread) => thread.activeRun != null)
				.map((thread) => thread.id),
		);
	}, [threads]);
	const reconcileThreadWithLocalTitle = useCallback((thread: RovoAppThread) => {
		return mergeRovoAppThreadWithLocalTitle(threadsRef.current, thread);
	}, [threadsRef]);
	const activeDocumentContent = useMemo(() => {
		return getLatestDocumentContent(activeDocument);
	}, [activeDocument]);
	const smartGenerationContainerWidthPx = smartGenerationLayout?.containerWidthPx;
	const smartGenerationViewportWidthPx = smartGenerationLayout?.viewportWidthPx;
	const smartGenerationWidthClass = smartGenerationLayout?.widthClass;
	const smartGenerationRequest = useMemo(() => {
		return buildRovoAppSmartGenerationRequest({
			embedded,
			layout: {
				containerWidthPx: smartGenerationContainerWidthPx,
				viewportWidthPx: smartGenerationViewportWidthPx,
				widthClass: smartGenerationWidthClass,
			},
		});
	}, [
		embedded,
		smartGenerationContainerWidthPx,
		smartGenerationViewportWidthPx,
		smartGenerationWidthClass,
	]);
	const runtimeThreadId = activeThreadId ?? draftThreadId;
	const queuedPrompts = useMemo(
		() => queuedActionsByThreadId[runtimeThreadId] ?? [],
		[queuedActionsByThreadId, runtimeThreadId],
	);

	return {
		activeDocument,
		activeDocumentContent,
		backgroundStreamThreadIds,
		currentThread,
		queuedPrompts,
		reconcileThreadWithLocalTitle,
		runtimeThreadId,
		smartGenerationRequest,
	};
}
