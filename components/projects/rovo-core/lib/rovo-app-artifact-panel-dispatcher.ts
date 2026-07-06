import {
	buildArtifactContentFromMessage,
	deriveThreadTitle,
	inferArtifactKind,
	meetsStreamingAutoOpenContentThreshold,
} from "@/components/projects/rovo-core/lib/rovo-app-hook-helpers";
import {
	getRovoAppStreamingArtifactCheckpoint,
	type RovoAppStreamingArtifact,
} from "@/components/projects/rovo-core/lib/rovo-app-streaming-artifact";
import { upsertRovoAppThreadRecord } from "@/components/projects/rovo-core/lib/rovo-app-thread-state";
import {
	type ArtifactMode,
	type RovoAppDocument,
	type RovoAppDocumentKind,
	type RovoAppPanelState,
	type RovoAppThread,
} from "@/lib/rovo-app-types";
import { getMessageText, type RovoUIMessage } from "@/lib/rovo-ui-messages";
import { createId } from "@/lib/utils";

export const ROVO_APP_STREAMING_ARTIFACT_AUTO_OPEN_DELAY_MS = 600;

interface RovoAppArtifactPanelPreviewSetters {
	setPanelState: (state: RovoAppPanelState) => void;
	setVisibleArtifactDocumentId: (documentId: string | null) => void;
}

type SetRovoAppDocuments = (
	documents: RovoAppDocument[] | ((previousDocuments: RovoAppDocument[]) => RovoAppDocument[]),
) => void;

type SetRovoAppThreads = (
	threads: RovoAppThread[] | ((previousThreads: RovoAppThread[]) => RovoAppThread[]),
) => void;

interface RovoAppExistingArtifactPreviewSetters
	extends RovoAppArtifactPanelPreviewSetters {
	setActiveDocumentId: (documentId: string | null) => void;
	setArtifactMode: (mode: ArtifactMode) => void;
}

interface SaveRovoAppDocumentInput {
	changeLabel?: string;
	content?: string;
	documentId?: string;
	kind?: RovoAppDocumentKind | string;
	sourceMessageId?: string;
	threadId?: string;
	title?: string;
}

export interface OpenRovoAppArtifactFromMessageInput
	extends RovoAppExistingArtifactPreviewSetters {
	documents: ReadonlyArray<RovoAppDocument>;
	ensureThread: (seedText: string) => Promise<string>;
	message: RovoUIMessage;
	saveDocument: (payload: SaveRovoAppDocumentInput) => Promise<RovoAppDocument>;
	selectDocumentForDisplay: (document: RovoAppDocument) => void;
	setInputError: (errorMessage: string | null) => void;
	toUserErrorMessage: (error: unknown) => string;
}

export interface OpenRovoAppDocumentInput
	extends RovoAppArtifactPanelPreviewSetters {
	documentId: string;
	documents: ReadonlyArray<RovoAppDocument>;
	hydratePersistedArtifact: (documentId: string) => Promise<unknown>;
	selectDocumentForDisplay: (document: RovoAppDocument) => void;
}

export interface RovoAppPlanDocument {
	markdown: string;
	sourceMessageId?: string | null;
	title: string;
}

export interface BuildRovoAppPlanDocumentInput {
	activeThreadId?: string | null;
	documentId?: string;
	now?: string;
	plan: RovoAppPlanDocument;
	versionId?: string;
}

export interface OpenRovoAppPlanAsDocumentInput
	extends RovoAppArtifactPanelPreviewSetters {
	activeThreadId?: string | null;
	plan: RovoAppPlanDocument;
	selectDocumentForDisplay: (document: RovoAppDocument) => void;
}

export interface SaveRovoAppArtifactDraftInput {
	activeDocument: RovoAppDocument | null;
	activeDocumentId: string | null;
	artifactDraftContent: string;
	saveDocument: (payload: SaveRovoAppDocumentInput) => Promise<RovoAppDocument>;
	setArtifactMode: (mode: ArtifactMode) => void;
	setDocuments: SetRovoAppDocuments;
	setInputError: (errorMessage: string | null) => void;
	setSelectedVersionId: (versionId: string | null) => void;
	toUserErrorMessage: (error: unknown) => string;
}

export interface DeleteRovoAppDocumentWithLifecycleInput {
	activeDocumentId: string | null;
	clearArtifactState: () => void;
	deleteDocument: (documentId: string) => Promise<unknown>;
	documentId: string;
	setDocuments: SetRovoAppDocuments;
	setInputError: (errorMessage: string | null) => void;
	toUserErrorMessage: (error: unknown) => string;
}

export interface HideRovoAppArtifactPaneInput
	extends RovoAppArtifactPanelPreviewSetters {
	setSuppressedStreamingAutoOpenDocumentId: (documentId: string) => void;
	streamingArtifact: RovoAppStreamingArtifact | null;
	visibleArtifactDocumentId: string | null;
}

export interface PersistRovoAppActiveDocumentSelectionInput {
	activeThreadId?: string | null;
	deletedThreadIds: ReadonlySet<string>;
	documentId: string | null;
	reconcileThreadWithLocalTitle: (thread: RovoAppThread) => RovoAppThread;
	setThreads: SetRovoAppThreads;
	toUserErrorMessage: (error: unknown) => string;
	updateThread: (
		threadId: string,
		payload: { activeDocumentId: string | null },
	) => Promise<RovoAppThread>;
	warn?: (message: string, errorMessage: string) => void;
}

export interface SaveRovoAppStreamingArtifactCheckpointInput {
	saveDocument: (payload: SaveRovoAppDocumentInput) => Promise<RovoAppDocument>;
	selectDocumentForDisplay: (document: RovoAppDocument) => void;
	streamingArtifact: RovoAppStreamingArtifact | null;
}

export interface HydrateRovoAppPersistedArtifactInput {
	clearArtifactState: () => void;
	documentId: string;
	getBackendUnavailableMessage: () => string;
	getDocument: (documentId: string) => Promise<RovoAppDocument | null>;
	isBackendUnavailableError: (error: unknown) => boolean;
	isHydratingThread: () => boolean;
	logError?: (message: string, error: unknown) => void;
	maxAttempts?: number;
	retryDelayMs?: (attemptIndex: number) => number;
	selectDocumentForDisplay: (document: RovoAppDocument) => void;
	setInputError: (errorMessage: string | null) => void;
	waitForRetry: (ms: number) => Promise<unknown>;
}

export interface ResolveRovoAppStreamingArtifactAutoOpenPlanInput {
	isHydratingThread: boolean;
	now?: number;
	panelState: RovoAppPanelState;
	streamingArtifact: RovoAppStreamingArtifact | null;
	suppressedDocumentId: string | null;
	visibleArtifactDocumentId: string | null;
}

export interface RovoAppStreamingArtifactAutoOpenPlan {
	delayMs: number;
	documentId: string;
	shouldPreviewClosedPanel: boolean;
}

export interface ShouldOpenDelayedRovoAppStreamingArtifactInput {
	documentId: string;
	streamingArtifact: RovoAppStreamingArtifact | null;
	suppressedDocumentId: string | null;
}

export interface ResolveRovoAppCompletedArtifactAutoOpenInput {
	completedDocumentId: string | null;
	documents: ReadonlyArray<RovoAppDocument>;
	isHydratingThread: boolean;
	isStreaming: boolean;
	suppressedDocumentId: string | null;
	visibleArtifactDocumentId: string | null;
}

function openExistingArtifactDocument(
	document: RovoAppDocument,
	{
		setActiveDocumentId,
		setArtifactMode,
		setPanelState,
		setVisibleArtifactDocumentId,
	}: RovoAppExistingArtifactPreviewSetters,
): void {
	setActiveDocumentId(document.id);
	setVisibleArtifactDocumentId(document.id);
	setPanelState("preview");
	setArtifactMode("preview");
}

function openSelectedArtifactDocument(
	document: RovoAppDocument,
	{
		selectDocumentForDisplay,
		setPanelState,
		setVisibleArtifactDocumentId,
	}: {
		selectDocumentForDisplay: (document: RovoAppDocument) => void;
	} & RovoAppArtifactPanelPreviewSetters,
): void {
	selectDocumentForDisplay(document);
	setVisibleArtifactDocumentId(document.id);
	setPanelState("preview");
}

export function hideRovoAppArtifactPane({
	setPanelState,
	setSuppressedStreamingAutoOpenDocumentId,
	setVisibleArtifactDocumentId,
	streamingArtifact,
	visibleArtifactDocumentId,
}: HideRovoAppArtifactPaneInput): void {
	const streamingDocumentId = streamingArtifact?.documentId ?? null;
	if (
		streamingDocumentId &&
		visibleArtifactDocumentId === streamingDocumentId
	) {
		setSuppressedStreamingAutoOpenDocumentId(streamingDocumentId);
	}

	setVisibleArtifactDocumentId(null);
	setPanelState("closed");
}

export function resolveRovoAppStreamingArtifactAutoOpenPlan({
	isHydratingThread,
	now = Date.now(),
	panelState,
	streamingArtifact,
	suppressedDocumentId,
	visibleArtifactDocumentId,
}: ResolveRovoAppStreamingArtifactAutoOpenPlanInput): RovoAppStreamingArtifactAutoOpenPlan | null {
	if (isHydratingThread) {
		return null;
	}

	if (!streamingArtifact?.documentId) {
		return null;
	}
	const streamingDocumentId = streamingArtifact.documentId;

	if (visibleArtifactDocumentId === streamingDocumentId) {
		return null;
	}

	if (suppressedDocumentId === streamingDocumentId) {
		return null;
	}

	if (!meetsStreamingAutoOpenContentThreshold(streamingArtifact)) {
		return null;
	}

	const createdAt = Date.parse(streamingArtifact.createdAt);
	const delayMs = Number.isFinite(createdAt)
		? Math.max(0, ROVO_APP_STREAMING_ARTIFACT_AUTO_OPEN_DELAY_MS - (now - createdAt))
		: 0;

	return {
		delayMs,
		documentId: streamingDocumentId,
		shouldPreviewClosedPanel: panelState === "closed",
	};
}

export function shouldOpenDelayedRovoAppStreamingArtifact({
	documentId,
	streamingArtifact,
	suppressedDocumentId,
}: ShouldOpenDelayedRovoAppStreamingArtifactInput): boolean {
	return Boolean(
		streamingArtifact?.documentId === documentId
		&& suppressedDocumentId !== documentId
		&& meetsStreamingAutoOpenContentThreshold(streamingArtifact),
	);
}

export function resolveRovoAppCompletedArtifactAutoOpen({
	completedDocumentId,
	documents,
	isHydratingThread,
	isStreaming,
	suppressedDocumentId,
	visibleArtifactDocumentId,
}: ResolveRovoAppCompletedArtifactAutoOpenInput): string | null {
	if (
		isHydratingThread
		|| !completedDocumentId
		|| isStreaming
		|| visibleArtifactDocumentId !== null
		|| suppressedDocumentId === completedDocumentId
	) {
		return null;
	}

	const completedDocument = documents.find(
		(document) => document.id === completedDocumentId,
	);
	return completedDocument ? completedDocumentId : null;
}

export async function openRovoAppArtifactFromMessage({
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
}: OpenRovoAppArtifactFromMessageInput): Promise<void> {
	const content = buildArtifactContentFromMessage(message);
	if (!content.trim()) {
		return;
	}

	try {
		const threadId = await ensureThread("Artifact context");
		const existingDocument = documents.find((document) => document.sourceMessageId === message.id);
		if (existingDocument) {
			openExistingArtifactDocument(existingDocument, {
				setActiveDocumentId,
				setArtifactMode,
				setPanelState,
				setVisibleArtifactDocumentId,
			});
			return;
		}

		const document = await saveDocument({
			threadId,
			title: deriveThreadTitle(getMessageText(message) || "Artifact"),
			kind: inferArtifactKind(message, content),
			content,
			sourceMessageId: message.id,
		});
		openSelectedArtifactDocument(document, {
			selectDocumentForDisplay,
			setPanelState,
			setVisibleArtifactDocumentId,
		});
	} catch (error) {
		setInputError(toUserErrorMessage(error));
	}
}

export async function openRovoAppDocument({
	documentId,
	documents,
	hydratePersistedArtifact,
	selectDocumentForDisplay,
	setPanelState,
	setVisibleArtifactDocumentId,
}: OpenRovoAppDocumentInput): Promise<void> {
	const existingDocument = documents.find((document) => document.id === documentId) ?? null;
	if (existingDocument) {
		openSelectedArtifactDocument(existingDocument, {
			selectDocumentForDisplay,
			setPanelState,
			setVisibleArtifactDocumentId,
		});
		return;
	}

	await hydratePersistedArtifact(documentId);
	setVisibleArtifactDocumentId(documentId);
	setPanelState("preview");
}

export async function persistRovoAppActiveDocumentSelection({
	activeThreadId,
	deletedThreadIds,
	documentId,
	reconcileThreadWithLocalTitle,
	setThreads,
	toUserErrorMessage,
	updateThread,
	warn = console.warn,
}: PersistRovoAppActiveDocumentSelectionInput): Promise<void> {
	if (!activeThreadId) {
		return;
	}

	try {
		const thread = await updateThread(activeThreadId, {
			activeDocumentId: documentId,
		});
		const resolvedThread = reconcileThreadWithLocalTitle(thread);
		setThreads((previousThreads) =>
			upsertRovoAppThreadRecord(previousThreads, resolvedThread, {
				deletedThreadIds,
			}),
		);
	} catch (error) {
		warn(
			"[RovoApp] Failed to persist active artifact selection:",
			toUserErrorMessage(error),
		);
	}
}

export async function saveRovoAppStreamingArtifactCheckpoint({
	saveDocument,
	selectDocumentForDisplay,
	streamingArtifact,
}: SaveRovoAppStreamingArtifactCheckpointInput): Promise<RovoAppDocument | null> {
	const checkpoint = getRovoAppStreamingArtifactCheckpoint(streamingArtifact);
	if (!checkpoint) {
		return null;
	}

	const document = await saveDocument({
		changeLabel: "Steered checkpoint",
		documentId: checkpoint.documentId,
		title: checkpoint.title,
		kind: checkpoint.kind,
		content: checkpoint.content,
	});
	selectDocumentForDisplay(document);
	return document;
}

export async function hydrateRovoAppPersistedArtifact({
	clearArtifactState,
	documentId,
	getBackendUnavailableMessage,
	getDocument,
	isBackendUnavailableError,
	isHydratingThread,
	logError = console.error,
	maxAttempts = 5,
	retryDelayMs = (attemptIndex) => 150 * (attemptIndex + 1),
	selectDocumentForDisplay,
	setInputError,
	waitForRetry,
}: HydrateRovoAppPersistedArtifactInput): Promise<RovoAppDocument | null> {
	try {
		let document = null;
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			document = await getDocument(documentId);
			if (document) {
				break;
			}

			await waitForRetry(retryDelayMs(attempt));
		}

		if (!document) {
			clearArtifactState();
			return null;
		}

		if (isHydratingThread()) {
			return document;
		}

		selectDocumentForDisplay(document);
		return document;
	} catch (error) {
		if (isBackendUnavailableError(error)) {
			setInputError(getBackendUnavailableMessage());
			return null;
		}

		logError("[RovoApp] Failed to hydrate streamed artifact:", error);
		return null;
	}
}

export function buildRovoAppPlanDocument({
	activeThreadId,
	documentId = createId(),
	now = new Date().toISOString(),
	plan,
	versionId = createId(),
}: BuildRovoAppPlanDocumentInput): RovoAppDocument {
	const content = plan.markdown.trim() || plan.title;
	return {
		id: documentId,
		threadId: activeThreadId ?? "",
		title: plan.title,
		kind: "text",
		sourceMessageId: plan.sourceMessageId ?? null,
		createdAt: now,
		updatedAt: now,
		versions: [{
			id: versionId,
			changeLabel: "Plan",
			content,
			createdAt: now,
			title: plan.title,
		}],
	};
}

export function openRovoAppPlanAsDocument({
	activeThreadId,
	plan,
	selectDocumentForDisplay,
	setPanelState,
	setVisibleArtifactDocumentId,
}: OpenRovoAppPlanAsDocumentInput): void {
	const document = buildRovoAppPlanDocument({ activeThreadId, plan });
	openSelectedArtifactDocument(document, {
		selectDocumentForDisplay,
		setPanelState,
		setVisibleArtifactDocumentId,
	});
}

export async function saveRovoAppArtifactDraft({
	activeDocument,
	activeDocumentId,
	artifactDraftContent,
	saveDocument,
	setArtifactMode,
	setDocuments,
	setInputError,
	setSelectedVersionId,
	toUserErrorMessage,
}: SaveRovoAppArtifactDraftInput): Promise<void> {
	if (!activeDocumentId || !artifactDraftContent.trim()) {
		return;
	}

	try {
		const document = await saveDocument({
			changeLabel: "Manual edit",
			documentId: activeDocumentId,
			title: activeDocument?.title ?? "Artifact",
			kind: activeDocument?.kind ?? "text",
			content: artifactDraftContent,
		});
		setDocuments((previousDocuments) => {
			const withoutPrevious = previousDocuments.filter((item) => item.id !== document.id);
			return [document, ...withoutPrevious];
		});
		setSelectedVersionId(document.versions.at(-1)?.id ?? null);
		setArtifactMode("preview");
	} catch (error) {
		setInputError(toUserErrorMessage(error));
	}
}

export async function deleteRovoAppDocumentWithLifecycle({
	activeDocumentId,
	clearArtifactState,
	deleteDocument,
	documentId,
	setDocuments,
	setInputError,
	toUserErrorMessage,
}: DeleteRovoAppDocumentWithLifecycleInput): Promise<void> {
	try {
		await deleteDocument(documentId);
		setDocuments((previousDocuments) =>
			previousDocuments.filter((document) => document.id !== documentId),
		);
		if (activeDocumentId === documentId) {
			clearArtifactState();
		}
	} catch (error) {
		setInputError(toUserErrorMessage(error));
	}
}
