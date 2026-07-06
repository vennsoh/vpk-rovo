"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";

import {
	deleteRovoAppDocumentWithLifecycle,
	hideRovoAppArtifactPane,
	hydrateRovoAppPersistedArtifact,
	openRovoAppArtifactFromMessage,
	openRovoAppDocument,
	openRovoAppPlanAsDocument,
	persistRovoAppActiveDocumentSelection,
	saveRovoAppArtifactDraft,
	saveRovoAppStreamingArtifactCheckpoint,
} from "@/components/projects/rovo-core/lib/rovo-app-artifact-panel-dispatcher";
import { getLatestDocumentContent } from "@/components/projects/rovo-core/lib/rovo-app-message-artifacts";
import type { RovoAppStreamingArtifact } from "@/components/projects/rovo-core/lib/rovo-app-streaming-artifact";
import { upsertDocumentRecord } from "@/components/projects/rovo-core/lib/rovo-app-hook-helpers";
import type {
	ArtifactMode,
	RovoAppDocument,
	RovoAppPanelState,
	RovoAppThread,
} from "@/lib/rovo-app-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

type ValueRef<T> = { current: T };

type SetRovoAppDocuments = Dispatch<SetStateAction<RovoAppDocument[]>>;
type SetRovoAppThreads = Dispatch<SetStateAction<RovoAppThread[]>>;

interface SaveRovoAppDocumentInput {
	changeLabel?: string;
	content?: string;
	documentId?: string;
	kind?: string;
	sourceMessageId?: string;
	threadId?: string;
	title?: string;
}

interface UseRovoAppArtifactPanelControllerInput {
	activeThreadIdRef: ValueRef<string | null>;
	deletedThreadIdsRef: ValueRef<Set<string>>;
	getBackendUnavailableMessage: () => string;
	getDocument: (documentId: string) => Promise<RovoAppDocument | null>;
	isBackendUnavailableError: (error: unknown) => boolean;
	isHydratingThreadRef: ValueRef<boolean>;
	reconcileThreadWithLocalTitle: (thread: RovoAppThread) => RovoAppThread;
	saveDocument: (payload: SaveRovoAppDocumentInput) => Promise<RovoAppDocument>;
	setActiveDocumentId: (documentId: string | null) => void;
	setArtifactDraftContent: (value: string) => void;
	setArtifactMode: (mode: ArtifactMode) => void;
	setDocuments: SetRovoAppDocuments;
	setInputError: (errorMessage: string | null) => void;
	setPanelState: Dispatch<SetStateAction<RovoAppPanelState>>;
	setSelectedVersionId: (versionId: string | null) => void;
	setThreads: SetRovoAppThreads;
	setVisibleArtifactDocumentId: (documentId: string | null) => void;
	streamingArtifactRef: ValueRef<RovoAppStreamingArtifact | null>;
	suppressedStreamingAutoOpenDocumentIdRef: ValueRef<string | null>;
	toUserErrorMessage: (error: unknown) => string;
	updateThread: (
		threadId: string,
		payload: { activeDocumentId: string | null },
	) => Promise<RovoAppThread>;
	visibleArtifactDocumentId: string | null;
	waitForRetry: (ms: number) => Promise<unknown>;
}

export interface RovoAppArtifactPanelController {
	clearArtifactState: () => void;
	hideArtifactPane: () => void;
	hydratePersistedArtifact: (documentId: string) => Promise<RovoAppDocument | null>;
	persistActiveDocumentSelection: (documentId: string | null) => void;
	saveStreamingArtifactCheckpoint: () => Promise<RovoAppDocument | null>;
	selectDocumentForDisplay: (document: RovoAppDocument) => void;
}

interface UseRovoAppArtifactPanelActionsInput {
	activeDocument: RovoAppDocument | null;
	activeDocumentId: string | null;
	activeThreadId: string | null;
	artifactDraftContent: string;
	clearArtifactState: () => void;
	deleteDocumentApi: (documentId: string) => Promise<unknown>;
	documents: RovoAppDocument[];
	ensureThread: (seedText: string) => Promise<string>;
	hydratePersistedArtifact: (documentId: string) => Promise<unknown>;
	saveDocument: (payload: SaveRovoAppDocumentInput) => Promise<RovoAppDocument>;
	selectDocumentForDisplay: (document: RovoAppDocument) => void;
	setActiveDocumentId: (documentId: string | null) => void;
	setArtifactMode: (mode: ArtifactMode) => void;
	setDocuments: SetRovoAppDocuments;
	setInputError: (errorMessage: string | null) => void;
	setPanelState: Dispatch<SetStateAction<RovoAppPanelState>>;
	setSelectedVersionId: (versionId: string | null) => void;
	setVisibleArtifactDocumentId: (documentId: string | null) => void;
	toUserErrorMessage: (error: unknown) => string;
}

export interface RovoAppArtifactPanelActions {
	deleteDocument: (documentId: string) => Promise<void>;
	openArtifactFromMessage: (message: RovoUIMessage) => Promise<void>;
	openDocument: (documentId: string) => Promise<void>;
	openPlanAsDocument: (plan: { title: string; markdown: string; sourceMessageId?: string | null }) => void;
	saveArtifactDraft: () => Promise<void>;
}

export function useRovoAppArtifactPanelController({
	activeThreadIdRef,
	deletedThreadIdsRef,
	getBackendUnavailableMessage,
	getDocument,
	isBackendUnavailableError,
	isHydratingThreadRef,
	reconcileThreadWithLocalTitle,
	saveDocument,
	setActiveDocumentId,
	setArtifactDraftContent,
	setArtifactMode,
	setDocuments,
	setInputError,
	setPanelState,
	setSelectedVersionId,
	setThreads,
	setVisibleArtifactDocumentId,
	streamingArtifactRef,
	suppressedStreamingAutoOpenDocumentIdRef,
	toUserErrorMessage,
	updateThread,
	visibleArtifactDocumentId,
	waitForRetry,
}: UseRovoAppArtifactPanelControllerInput): RovoAppArtifactPanelController {
	const clearArtifactState = useCallback(() => {
		setActiveDocumentId(null);
		setVisibleArtifactDocumentId(null);
		setPanelState("closed");
		setSelectedVersionId(null);
		setArtifactDraftContent("");
		setArtifactMode("preview");
	}, [
		setActiveDocumentId,
		setArtifactDraftContent,
		setArtifactMode,
		setPanelState,
		setSelectedVersionId,
		setVisibleArtifactDocumentId,
	]);

	const selectDocumentForDisplay = useCallback((document: RovoAppDocument) => {
		setDocuments((previousDocuments) => upsertDocumentRecord(previousDocuments, document));
		setActiveDocumentId(document.id);
		setSelectedVersionId(document.versions.at(-1)?.id ?? null);
		setArtifactDraftContent(getLatestDocumentContent(document));
		setArtifactMode("preview");
	}, [
		setActiveDocumentId,
		setArtifactDraftContent,
		setArtifactMode,
		setDocuments,
		setSelectedVersionId,
	]);

	const hideArtifactPane = useCallback(() => {
		hideRovoAppArtifactPane({
			setPanelState,
			setSuppressedStreamingAutoOpenDocumentId(documentId) {
				suppressedStreamingAutoOpenDocumentIdRef.current = documentId;
			},
			setVisibleArtifactDocumentId,
			streamingArtifact: streamingArtifactRef.current,
			visibleArtifactDocumentId,
		});
	}, [
		setPanelState,
		setVisibleArtifactDocumentId,
		streamingArtifactRef,
		suppressedStreamingAutoOpenDocumentIdRef,
		visibleArtifactDocumentId,
	]);

	const persistActiveDocumentSelection = useCallback((documentId: string | null) => {
		void persistRovoAppActiveDocumentSelection({
			activeThreadId: activeThreadIdRef.current,
			deletedThreadIds: deletedThreadIdsRef.current,
			documentId,
			reconcileThreadWithLocalTitle,
			setThreads,
			toUserErrorMessage,
			updateThread,
		});
	}, [
		activeThreadIdRef,
		deletedThreadIdsRef,
		reconcileThreadWithLocalTitle,
		setThreads,
		toUserErrorMessage,
		updateThread,
	]);

	const saveStreamingArtifactCheckpoint = useCallback(async () => {
		return saveRovoAppStreamingArtifactCheckpoint({
			saveDocument,
			selectDocumentForDisplay,
			streamingArtifact: streamingArtifactRef.current,
		});
	}, [saveDocument, selectDocumentForDisplay, streamingArtifactRef]);

	const hydratePersistedArtifact = useCallback(async (documentId: string) => {
		return hydrateRovoAppPersistedArtifact({
			clearArtifactState,
			documentId,
			getBackendUnavailableMessage,
			getDocument,
			isBackendUnavailableError,
			isHydratingThread: () => isHydratingThreadRef.current,
			selectDocumentForDisplay,
			setInputError,
			waitForRetry,
		});
	}, [
		clearArtifactState,
		getBackendUnavailableMessage,
		getDocument,
		isBackendUnavailableError,
		isHydratingThreadRef,
		selectDocumentForDisplay,
		setInputError,
		waitForRetry,
	]);

	return {
		clearArtifactState,
		hideArtifactPane,
		hydratePersistedArtifact,
		persistActiveDocumentSelection,
		saveStreamingArtifactCheckpoint,
		selectDocumentForDisplay,
	};
}

export function useRovoAppArtifactPanelActions({
	activeDocument,
	activeDocumentId,
	activeThreadId,
	artifactDraftContent,
	clearArtifactState,
	deleteDocumentApi,
	documents,
	ensureThread,
	hydratePersistedArtifact,
	saveDocument,
	selectDocumentForDisplay,
	setActiveDocumentId,
	setArtifactMode,
	setDocuments,
	setInputError,
	setPanelState,
	setSelectedVersionId,
	setVisibleArtifactDocumentId,
	toUserErrorMessage,
}: UseRovoAppArtifactPanelActionsInput): RovoAppArtifactPanelActions {
	const openArtifactFromMessage = useCallback(
		async (message: RovoUIMessage) => {
			await openRovoAppArtifactFromMessage({
				documents,
				ensureThread,
				message,
				saveDocument,
				selectDocumentForDisplay,
				setActiveDocumentId,
				setArtifactMode,
				setInputError,
				setPanelState,
				setVisibleArtifactDocumentId,
				toUserErrorMessage,
			});
		},
		[
			documents,
			ensureThread,
			saveDocument,
			selectDocumentForDisplay,
			setActiveDocumentId,
			setArtifactMode,
			setInputError,
			setPanelState,
			setVisibleArtifactDocumentId,
			toUserErrorMessage,
		],
	);

	const openDocument = useCallback(
		async (documentId: string) => {
			await openRovoAppDocument({
				documentId,
				documents,
				hydratePersistedArtifact,
				selectDocumentForDisplay,
				setPanelState,
				setVisibleArtifactDocumentId,
			});
		},
		[
			documents,
			hydratePersistedArtifact,
			selectDocumentForDisplay,
			setPanelState,
			setVisibleArtifactDocumentId,
		],
	);

	const openPlanAsDocument = useCallback(
		(plan: { title: string; markdown: string; sourceMessageId?: string | null }) => {
			openRovoAppPlanAsDocument({
				activeThreadId,
				plan,
				selectDocumentForDisplay,
				setPanelState,
				setVisibleArtifactDocumentId,
			});
		},
		[
			activeThreadId,
			selectDocumentForDisplay,
			setPanelState,
			setVisibleArtifactDocumentId,
		],
	);

	const saveArtifactDraft = useCallback(async () => {
		await saveRovoAppArtifactDraft({
			activeDocument,
			activeDocumentId,
			artifactDraftContent,
			saveDocument,
			setArtifactMode,
			setDocuments,
			setInputError,
			setSelectedVersionId,
			toUserErrorMessage,
		});
	}, [
		activeDocument,
		activeDocumentId,
		artifactDraftContent,
		saveDocument,
		setArtifactMode,
		setDocuments,
		setInputError,
		setSelectedVersionId,
		toUserErrorMessage,
	]);

	const deleteDocument = useCallback(
		async (documentId: string) => {
			await deleteRovoAppDocumentWithLifecycle({
				activeDocumentId,
				clearArtifactState,
				deleteDocument: deleteDocumentApi,
				documentId,
				setDocuments,
				setInputError,
				toUserErrorMessage,
			});
		},
		[
			activeDocumentId,
			clearArtifactState,
			deleteDocumentApi,
			setDocuments,
			setInputError,
			toUserErrorMessage,
		],
	);

	return {
		deleteDocument,
		openArtifactFromMessage,
		openDocument,
		openPlanAsDocument,
		saveArtifactDraft,
	};
}
