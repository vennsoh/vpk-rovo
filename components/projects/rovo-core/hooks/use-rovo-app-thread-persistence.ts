"use client";

import { useEffect } from "react";
import {
	buildRovoAppThreadPersistencePlan,
	runRovoAppThreadPersistenceLifecycle,
	type RunRovoAppThreadPersistenceLifecycleInput,
} from "@/components/projects/rovo-core/lib/rovo-app-thread-persistence";
import type {
	RovoAppThread,
	RovoAppVisibility,
} from "@/lib/rovo-app-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

interface MutableRef<T> {
	current: T;
}

type SetState<T> = (value: T | ((previousValue: T) => T)) => void;

export interface UseRovoAppThreadPersistenceOptions {
	activeDocumentId: string | null;
	activeThreadId: string | null;
	activeThreadIdRef: RunRovoAppThreadPersistenceLifecycleInput["activeThreadIdRef"];
	beginThreadHydration: RunRovoAppThreadPersistenceLifecycleInput["beginThreadHydration"];
	completeThreadHydration: RunRovoAppThreadPersistenceLifecycleInput["completeThreadHydration"];
	createThread: RunRovoAppThreadPersistenceLifecycleInput["createThread"];
	deletedThreadIdsRef: RunRovoAppThreadPersistenceLifecycleInput["deletedThreadIdsRef"];
	embedded: boolean;
	flushPendingRouteReplacement: RunRovoAppThreadPersistenceLifecycleInput["flushPendingRouteReplacement"];
	isGeneratingTitle: boolean;
	isHydratingThreadRef: MutableRef<boolean>;
	isLoadingThread: boolean;
	isStreaming: boolean;
	lastPersistedKeyRef: RunRovoAppThreadPersistenceLifecycleInput["lastPersistedKeyRef"];
	messages: ReadonlyArray<RovoUIMessage>;
	normalizedMessages: ReadonlyArray<RovoUIMessage>;
	pendingRouteReadyRef: RunRovoAppThreadPersistenceLifecycleInput["pendingRouteReadyRef"];
	pendingRouteThreadIdRef: RunRovoAppThreadPersistenceLifecycleInput["pendingRouteThreadIdRef"];
	pendingTitleThreadId: string | null;
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	realtimeMessagesRef: RunRovoAppThreadPersistenceLifecycleInput["realtimeMessagesRef"];
	realtimeMessagesVersionRef: RunRovoAppThreadPersistenceLifecycleInput["realtimeMessagesVersionRef"];
	reconcileThreadWithLocalTitle: RunRovoAppThreadPersistenceLifecycleInput["reconcileThreadWithLocalTitle"];
	replaceRealtimeMessagesState: RunRovoAppThreadPersistenceLifecycleInput["replaceRealtimeMessagesState"];
	setInputError: RunRovoAppThreadPersistenceLifecycleInput["setInputError"];
	setMessages: SetState<RovoUIMessage[]>;
	setThreads: SetState<RovoAppThread[]>;
	threadVisibility: RovoAppVisibility;
	threads: ReadonlyArray<RovoAppThread>;
	toUserErrorMessage: RunRovoAppThreadPersistenceLifecycleInput["toUserErrorMessage"];
	updateThread: RunRovoAppThreadPersistenceLifecycleInput["updateThread"];
}

export function useRovoAppThreadPersistence({
	activeDocumentId,
	activeThreadId,
	activeThreadIdRef,
	beginThreadHydration,
	completeThreadHydration,
	createThread,
	deletedThreadIdsRef,
	embedded,
	flushPendingRouteReplacement,
	isGeneratingTitle,
	isHydratingThreadRef,
	isLoadingThread,
	isStreaming,
	lastPersistedKeyRef,
	messages,
	normalizedMessages,
	pendingRouteReadyRef,
	pendingRouteThreadIdRef,
	pendingTitleThreadId,
	realtimeMessages,
	realtimeMessagesRef,
	realtimeMessagesVersionRef,
	reconcileThreadWithLocalTitle,
	replaceRealtimeMessagesState,
	setInputError,
	setMessages,
	setThreads,
	threadVisibility,
	threads,
	toUserErrorMessage,
	updateThread,
}: UseRovoAppThreadPersistenceOptions): void {
	useEffect(() => {
		if (!activeThreadId || isLoadingThread || isStreaming || isHydratingThreadRef.current) {
			return;
		}

		const persistencePlan = buildRovoAppThreadPersistencePlan({
			activeDocumentId,
			activeThreadId,
			isGeneratingTitle,
			messages,
			normalizedMessages,
			pendingTitleThreadId,
			realtimeMessages,
			threadVisibility,
			threads,
		});
		if (persistencePlan.nextPersistKey === lastPersistedKeyRef.current) {
			return;
		}

		return runRovoAppThreadPersistenceLifecycle({
			activeDocumentId,
			activeThreadId,
			activeThreadIdRef,
			beginThreadHydration,
			completeThreadHydration,
			createThread,
			deletedThreadIdsRef,
			embedded,
			flushPendingRouteReplacement,
			lastPersistedKeyRef,
			normalizedMessages,
			pendingRouteReadyRef,
			pendingRouteThreadIdRef,
			persistencePlan,
			realtimeMessages,
			realtimeMessagesRef,
			realtimeMessagesVersionRef,
			reconcileThreadWithLocalTitle,
			replaceRealtimeMessagesState,
			requestVersion: realtimeMessagesVersionRef.current,
			setInputError,
			setMessages,
			setThreads,
			threadVisibility,
			toUserErrorMessage,
			updateThread,
		});
	}, [
		activeDocumentId,
		activeThreadId,
		activeThreadIdRef,
		beginThreadHydration,
		completeThreadHydration,
		createThread,
		deletedThreadIdsRef,
		embedded,
		flushPendingRouteReplacement,
		isGeneratingTitle,
		isHydratingThreadRef,
		isLoadingThread,
		isStreaming,
		lastPersistedKeyRef,
		messages,
		normalizedMessages,
		pendingRouteReadyRef,
		pendingRouteThreadIdRef,
		pendingTitleThreadId,
		realtimeMessages,
		realtimeMessagesRef,
		realtimeMessagesVersionRef,
		reconcileThreadWithLocalTitle,
		replaceRealtimeMessagesState,
		setInputError,
		setMessages,
		setThreads,
		threadVisibility,
		threads,
		toUserErrorMessage,
		updateThread,
	]);
}
