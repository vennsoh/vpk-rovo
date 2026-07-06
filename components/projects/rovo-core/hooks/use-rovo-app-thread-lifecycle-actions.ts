"use client";

import type { ChatStatus, UIMessageChunk } from "ai";
import {
	startTransition,
	useCallback,
	type Dispatch,
	type MutableRefObject,
	type SetStateAction,
} from "react";
import { API_ENDPOINTS } from "@/lib/api-config";
import {
	createRovoAppThread,
	detachRovoAppRun,
	detachRovoAppStream,
	getRovoAppBackendUnavailableUserMessage,
	getRovoAppDocument,
	getRovoAppThread,
	isRovoAppBackendUnavailableError,
	listRovoAppDocuments,
	listRovoAppThreads,
	listRovoAppVotes,
	toRovoAppUserErrorMessage,
	updateRovoAppThread,
} from "@/components/projects/rovo-core/lib/api";
import {
	activateBlankRovoAppThreadState,
	ensureRovoAppThreadWithLifecycle,
	hydrateRovoAppThreadByIdWithLifecycle,
	hydrateRovoAppThreadStateWithLifecycle,
	leaveRovoAppActiveThreadForBackground,
	loadRovoAppThreadWithLifecycle,
	refreshRovoAppThreadsWithLifecycle,
	resetRovoAppToBlankThreadState,
	subscribeToRovoAppRunWithLifecycle,
	type RovoAppRefreshThreadsOptions,
} from "@/components/projects/rovo-core/lib/rovo-app-thread-lifecycle";
import { pushRovoAppHistoryPath } from "@/components/projects/rovo-core/lib/rovo-app-hook-helpers";
import {
	type RovoAppActiveRun,
	type RovoAppDocument,
	type RovoAppPanelState,
	type RovoAppRunStatus,
	type RovoAppThread,
	type RovoAppVisibility,
	type RovoAppVote,
	type VoteValue,
	createRovoAppId,
} from "@/lib/rovo-app-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

type SetState<T> = Dispatch<SetStateAction<T>>;

interface ActivateBlankChatStateOptions {
	syncHistory?: boolean;
}

interface UseRovoAppThreadLifecycleActionsOptions {
	activeDocumentId: string | null;
	activeThreadIdRef: MutableRefObject<string | null>;
	attachedRunStatus: RovoAppRunStatus | null;
	beginThreadHydration: () => void;
	clearArtifactState: () => void;
	clearDirectDelegationState: () => void;
	clearPendingPlanMetadataGeneration: (sourceMessageId?: string | null) => void;
	clearStreamingArtifactState: () => void;
	completeThreadHydration: () => void;
	currentActiveRun: RovoAppActiveRun | null | undefined;
	delegationAbortControllerRef: MutableRefObject<AbortController | null>;
	deletedThreadIdsRef: MutableRefObject<Set<string>>;
	draftThreadId: string;
	embedded: boolean;
	handleAttachedRunChunk: (chunk: UIMessageChunk) => void;
	hasHydratedActiveThreadRef: MutableRefObject<boolean>;
	lastPersistedKeyRef: MutableRefObject<string | null>;
	pendingRouteReadyRef: MutableRefObject<boolean>;
	pendingRouteThreadIdRef: MutableRefObject<string | null>;
	pendingThreadCreationRef: MutableRefObject<Promise<string> | null>;
	pendingTitleMessageRef: MutableRefObject<string | null>;
	pendingTitleThreadIdRef: MutableRefObject<string | null>;
	queueProcessorRunningRef: MutableRefObject<boolean>;
	realtimeMessagesRef: MutableRefObject<RovoUIMessage[]>;
	reconcileThreadWithLocalTitle: (thread: RovoAppThread) => RovoAppThread;
	replaceRealtimeMessagesState: (
		messages: RovoUIMessage[],
		options?: { incrementVersion?: boolean },
	) => RovoUIMessage[];
	replaceRoute: (path: string) => void;
	resetObservedTurnComplete: () => void;
	resetPendingArtifactAssociation: () => void;
	rootPath: string;
	rovoMessagesRef: MutableRefObject<RovoUIMessage[]>;
	runSubscriptionAbortControllerRef: MutableRefObject<AbortController | null>;
	runSubscriptionThreadIdRef: MutableRefObject<string | null>;
	setActiveDocumentId: (documentId: string | null) => void;
	setActiveThreadId: (threadId: string | null) => void;
	setAttachedRunStatus: (status: RovoAppRunStatus | null) => void;
	setDocuments: SetState<RovoAppDocument[]>;
	setDraftThreadId: (threadId: string) => void;
	setEditingMessageId: (messageId: string | null) => void;
	setHasActiveDispatch: (hasActiveDispatch: boolean) => void;
	setInputError: SetState<string | null>;
	setIsGeneratingTitle: (isGenerating: boolean) => void;
	setIsLoadingThread: (isLoading: boolean) => void;
	setLocalThreadActiveRun: (threadId: string, activeRun: RovoAppActiveRun | null) => void;
	setPanelState: SetState<RovoAppPanelState>;
	setPendingTitleThreadId: (threadId: string | null) => void;
	setRovoMessages: SetState<RovoUIMessage[]>;
	setSelectedVersionId: (versionId: string | null) => void;
	setThreadVisibility: (visibility: RovoAppVisibility) => void;
	setThreads: SetState<RovoAppThread[]>;
	setThreadsLoaded: (loaded: boolean) => void;
	setVisibleArtifactDocumentId: (documentId: string | null) => void;
	setVotes: SetState<Record<string, VoteValue>>;
	statusRef: MutableRefObject<ChatStatus>;
	stopUseChat: () => void | Promise<void>;
	threadVisibility: RovoAppVisibility;
}

interface UseRovoAppThreadLifecycleActionsResult {
	activateBlankChatState: (options?: ActivateBlankChatStateOptions) => Promise<void>;
	ensureThread: (seedText: string) => Promise<string>;
	hydrateThreadById: (threadId: string) => Promise<void>;
	loadThread: (threadId: string) => Promise<void>;
	openNewChat: () => Promise<void>;
	refreshThreads: (options?: RovoAppRefreshThreadsOptions) => Promise<void>;
}

export function useRovoAppThreadLifecycleActions({
	activeDocumentId,
	activeThreadIdRef,
	attachedRunStatus,
	beginThreadHydration,
	clearArtifactState,
	clearDirectDelegationState,
	clearPendingPlanMetadataGeneration,
	clearStreamingArtifactState,
	completeThreadHydration,
	currentActiveRun,
	delegationAbortControllerRef,
	deletedThreadIdsRef,
	draftThreadId,
	embedded,
	handleAttachedRunChunk,
	hasHydratedActiveThreadRef,
	lastPersistedKeyRef,
	pendingRouteReadyRef,
	pendingRouteThreadIdRef,
	pendingThreadCreationRef,
	pendingTitleMessageRef,
	pendingTitleThreadIdRef,
	queueProcessorRunningRef,
	realtimeMessagesRef,
	reconcileThreadWithLocalTitle,
	replaceRealtimeMessagesState,
	replaceRoute,
	resetObservedTurnComplete,
	resetPendingArtifactAssociation,
	rootPath,
	rovoMessagesRef,
	runSubscriptionAbortControllerRef,
	runSubscriptionThreadIdRef,
	setActiveDocumentId,
	setActiveThreadId,
	setAttachedRunStatus,
	setDocuments,
	setDraftThreadId,
	setEditingMessageId,
	setHasActiveDispatch,
	setInputError,
	setIsGeneratingTitle,
	setIsLoadingThread,
	setLocalThreadActiveRun,
	setPanelState,
	setPendingTitleThreadId,
	setRovoMessages,
	setSelectedVersionId,
	setThreadVisibility,
	setThreads,
	setThreadsLoaded,
	setVisibleArtifactDocumentId,
	setVotes,
	statusRef,
	stopUseChat,
	threadVisibility,
}: UseRovoAppThreadLifecycleActionsOptions): UseRovoAppThreadLifecycleActionsResult {
	const refreshThreads = useCallback(async (options: RovoAppRefreshThreadsOptions = {}) => {
		await refreshRovoAppThreadsWithLifecycle({
			deletedThreadIdsRef,
			getBackendUnavailableUserMessage: getRovoAppBackendUnavailableUserMessage,
			isBackendUnavailableError: isRovoAppBackendUnavailableError,
			listThreads: listRovoAppThreads,
			options,
			reconcileThreadWithLocalTitle,
			setInputError,
			setThreads,
			setThreadsLoaded,
		});
	}, [
		deletedThreadIdsRef,
		reconcileThreadWithLocalTitle,
		setInputError,
		setThreads,
		setThreadsLoaded,
	]);

	const hydrateThreadState = useCallback(
		(thread: RovoAppThread, nextDocuments: RovoAppDocument[], nextVotes: RovoAppVote[]) => {
			hydrateRovoAppThreadStateWithLifecycle({
				activeThreadIdRef,
				beginThreadHydration,
				clearDirectDelegationState,
				clearPendingPlanMetadataGeneration,
				clearStreamingArtifactState,
				completeThreadHydration,
				hasHydratedActiveThreadRef,
				lastPersistedKeyRef,
				nextDocuments,
				nextVotes,
				pendingRouteReadyRef,
				pendingRouteThreadIdRef,
				pendingThreadCreationRef,
				queueProcessorRunningRef,
				replaceRealtimeMessagesState,
				resetObservedTurnComplete,
				resetPendingArtifactAssociation,
				scheduleComplete: (callback) => {
					window.setTimeout(callback, 0);
				},
				setActiveDocumentId,
				setActiveThreadId,
				setAttachedRunStatus,
				setDocuments,
				setHasActiveDispatch,
				setPanelState,
				setRovoMessages,
				setSelectedVersionId,
				setThreadVisibility,
				setVisibleArtifactDocumentId,
				setVotes,
				thread,
			});
		},
		[
			activeThreadIdRef,
			beginThreadHydration,
			clearDirectDelegationState,
			clearPendingPlanMetadataGeneration,
			clearStreamingArtifactState,
			completeThreadHydration,
			hasHydratedActiveThreadRef,
			lastPersistedKeyRef,
			pendingRouteReadyRef,
			pendingRouteThreadIdRef,
			pendingThreadCreationRef,
			queueProcessorRunningRef,
			replaceRealtimeMessagesState,
			resetObservedTurnComplete,
			resetPendingArtifactAssociation,
			setActiveDocumentId,
			setActiveThreadId,
			setAttachedRunStatus,
			setDocuments,
			setHasActiveDispatch,
			setPanelState,
			setRovoMessages,
			setSelectedVersionId,
			setThreadVisibility,
			setVisibleArtifactDocumentId,
			setVotes,
		],
	);

	const hydrateThreadById = useCallback(
		async (threadId: string) => {
			await hydrateRovoAppThreadByIdWithLifecycle({
				deletedThreadIdsRef,
				getThread: getRovoAppThread,
				hydrateThreadState,
				listDocuments: listRovoAppDocuments,
				listVotes: listRovoAppVotes,
				reconcileThreadWithLocalTitle,
				setThreads,
				threadId,
			});
		},
		[deletedThreadIdsRef, hydrateThreadState, reconcileThreadWithLocalTitle, setThreads],
	);

	const subscribeToRovoAppRun = useCallback(
		async (
			threadId: string,
			activeRun: RovoAppActiveRun | null,
		) => {
			await subscribeToRovoAppRunWithLifecycle({
				activeRun,
				activeThreadIdRef,
				fetchRunStream: (nextThreadId, signal) =>
					fetch(API_ENDPOINTS.rovoAppRunStream(nextThreadId), {
						method: "GET",
						signal,
					}),
				handleAttachedRunChunk,
				hydrateThreadById,
				runSubscriptionAbortControllerRef,
				runSubscriptionThreadIdRef,
				setAttachedRunStatus,
				setInputError,
				setLocalThreadActiveRun,
				setRovoMessages,
				threadId,
				toUserErrorMessage: toRovoAppUserErrorMessage,
			});
		},
		[
			activeThreadIdRef,
			handleAttachedRunChunk,
			hydrateThreadById,
			runSubscriptionAbortControllerRef,
			runSubscriptionThreadIdRef,
			setAttachedRunStatus,
			setInputError,
			setLocalThreadActiveRun,
			setRovoMessages,
		],
	);

	const resetToBlankChatState = useCallback((nextDraftId: string) => {
		resetRovoAppToBlankThreadState({
			activeThreadIdRef,
			beginThreadHydration,
			clearArtifactState,
			clearDirectDelegationState,
			clearPendingPlanMetadataGeneration,
			clearStreamingArtifactState,
			completeThreadHydration,
			hasHydratedActiveThreadRef,
			lastPersistedKeyRef,
			nextDraftId,
			pendingRouteReadyRef,
			pendingRouteThreadIdRef,
			pendingThreadCreationRef,
			queueProcessorRunningRef,
			replaceRealtimeMessagesState,
			resetObservedTurnComplete,
			resetPendingArtifactAssociation,
			runSubscriptionAbortControllerRef,
			runSubscriptionThreadIdRef,
			scheduleComplete: (callback) => {
				window.setTimeout(callback, 0);
			},
			setActiveThreadId,
			setAttachedRunStatus,
			setDocuments,
			setDraftThreadId,
			setEditingMessageId,
			setHasActiveDispatch,
			setRovoMessages,
			setThreadVisibility,
			setVotes,
		});
	}, [
		activeThreadIdRef,
		beginThreadHydration,
		clearArtifactState,
		clearDirectDelegationState,
		clearPendingPlanMetadataGeneration,
		clearStreamingArtifactState,
		completeThreadHydration,
		hasHydratedActiveThreadRef,
		lastPersistedKeyRef,
		pendingRouteReadyRef,
		pendingRouteThreadIdRef,
		pendingThreadCreationRef,
		queueProcessorRunningRef,
		replaceRealtimeMessagesState,
		resetObservedTurnComplete,
		resetPendingArtifactAssociation,
		runSubscriptionAbortControllerRef,
		runSubscriptionThreadIdRef,
		setActiveThreadId,
		setAttachedRunStatus,
		setDocuments,
		setDraftThreadId,
		setEditingMessageId,
		setHasActiveDispatch,
		setRovoMessages,
		setThreadVisibility,
		setVotes,
	]);

	const leaveActiveThreadForBackground = useCallback(async () => {
		await leaveRovoAppActiveThreadForBackground({
			activeDocumentId,
			activeThreadIdRef,
			attachedRunStatus,
			clearDirectDelegationState,
			currentActiveRun,
			delegationAbortControllerRef,
			detachRun: detachRovoAppRun,
			detachStream: detachRovoAppStream,
			realtimeMessagesRef,
			rovoMessagesRef,
			runSubscriptionAbortControllerRef,
			runSubscriptionThreadIdRef,
			setAttachedRunStatus,
			setLocalThreadActiveRun,
			statusRef,
			stopUseChat,
			threadVisibility,
			updateThread: updateRovoAppThread,
		});
	}, [
		activeDocumentId,
		activeThreadIdRef,
		attachedRunStatus,
		clearDirectDelegationState,
		currentActiveRun,
		delegationAbortControllerRef,
		realtimeMessagesRef,
		rovoMessagesRef,
		runSubscriptionAbortControllerRef,
		runSubscriptionThreadIdRef,
		setAttachedRunStatus,
		setLocalThreadActiveRun,
		statusRef,
		stopUseChat,
		threadVisibility,
	]);

	const loadThread = useCallback(
		async (threadId: string) => {
			await loadRovoAppThreadWithLifecycle({
				activeThreadIdRef,
				clearRunSubscription: () => {
					runSubscriptionAbortControllerRef.current?.abort();
					runSubscriptionAbortControllerRef.current = null;
					runSubscriptionThreadIdRef.current = null;
					setAttachedRunStatus(null);
				},
				createThreadId: createRovoAppId,
				deletedThreadIdsRef,
				embedded,
				getDocument: getRovoAppDocument,
				getThread: getRovoAppThread,
				hasHydratedActiveThreadRef,
				hydrateThreadState,
				leaveActiveThreadForBackground,
				listDocuments: listRovoAppDocuments,
				listVotes: listRovoAppVotes,
				reconcileThreadWithLocalTitle,
				replaceRootRoute: () => {
					startTransition(() => {
						replaceRoute(rootPath);
					});
				},
				resetToBlankChatState,
				setInputError,
				setIsLoadingThread,
				setThreads,
				subscribeToRun: subscribeToRovoAppRun,
				threadId,
				toUserErrorMessage: toRovoAppUserErrorMessage,
			});
		},
		[
			activeThreadIdRef,
			deletedThreadIdsRef,
			embedded,
			hasHydratedActiveThreadRef,
			hydrateThreadState,
			leaveActiveThreadForBackground,
			reconcileThreadWithLocalTitle,
			replaceRoute,
			resetToBlankChatState,
			rootPath,
			runSubscriptionAbortControllerRef,
			runSubscriptionThreadIdRef,
			setAttachedRunStatus,
			setInputError,
			setIsLoadingThread,
			setThreads,
			subscribeToRovoAppRun,
		],
	);

	const activateBlankChatState = useCallback(
		async ({
			syncHistory = true,
		}: ActivateBlankChatStateOptions = {}) => {
			await activateBlankRovoAppThreadState({
				createThreadId: createRovoAppId,
				embedded,
				leaveActiveThreadForBackground,
				pushRootPath: () => {
					pushRovoAppHistoryPath(rootPath);
				},
				resetToBlankChatState,
				syncHistory,
			});
		},
		[embedded, leaveActiveThreadForBackground, resetToBlankChatState, rootPath],
	);

	const openNewChat = useCallback(async () => {
		await activateBlankChatState();
	}, [activateBlankChatState]);

	const ensureThread = useCallback(
		async (seedText: string) => {
			return ensureRovoAppThreadWithLifecycle({
				activeDocumentId,
				activeThreadIdRef,
				createThread: createRovoAppThread,
				deletedThreadIdsRef,
				draftThreadId,
				embedded,
				hasHydratedActiveThreadRef,
				lastPersistedKeyRef,
				pendingRouteReadyRef,
				pendingRouteThreadIdRef,
				pendingThreadCreationRef,
				pendingTitleMessageRef,
				pendingTitleThreadIdRef,
				seedText,
				setActiveThreadId,
				setIsGeneratingTitle,
				setPendingTitleThreadId,
				setThreads,
				threadVisibility,
			});
		},
		[
			activeDocumentId,
			activeThreadIdRef,
			deletedThreadIdsRef,
			draftThreadId,
			embedded,
			hasHydratedActiveThreadRef,
			lastPersistedKeyRef,
			pendingRouteReadyRef,
			pendingRouteThreadIdRef,
			pendingThreadCreationRef,
			pendingTitleMessageRef,
			pendingTitleThreadIdRef,
			setActiveThreadId,
			setIsGeneratingTitle,
			setPendingTitleThreadId,
			setThreads,
			threadVisibility,
		],
	);

	return {
		activateBlankChatState,
		ensureThread,
		hydrateThreadById,
		loadThread,
		openNewChat,
		refreshThreads,
	};
}
