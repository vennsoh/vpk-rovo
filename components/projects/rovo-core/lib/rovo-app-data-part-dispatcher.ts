import type {
	ArtifactMode,
	RovoAppDocument,
	RovoAppDocumentKind,
	RovoAppRunStatus,
} from "@/lib/rovo-app-types";
import type { RovoAppPendingArtifactResult } from "@/components/projects/rovo-core/lib/rovo-app-message-artifacts";
import type { RovoAppStreamingArtifact } from "@/components/projects/rovo-core/lib/rovo-app-streaming-artifact";

interface MutableRef<T> {
	current: T;
}

type SetState<T> = (value: T | ((previousValue: T) => T)) => void;

export interface RovoAppDataPart {
	data: unknown;
	type: string;
}

export interface DispatchRovoAppDataPartInput {
	activeThreadIdRef: MutableRef<string | null>;
	clearQueuedStreamingArtifactDelta: () => void;
	currentTurnIntentRef: MutableRef<string | null>;
	flushQueuedStreamingArtifactDeltaNow: () => void;
	hydratePersistedArtifact: (documentId: string) => Promise<RovoAppDocument | null>;
	kickQueue: () => void;
	lastCompletedArtifactDocumentIdRef: MutableRef<string | null>;
	markObservedTurnComplete: () => void;
	notifyStreamingCancelled: () => void;
	pendingArtifactAssociationRef: MutableRef<boolean>;
	pendingArtifactCreationRetryRef: MutableRef<boolean>;
	persistActiveDocumentSelection: (documentId: string | null) => void;
	queueStreamingArtifactDelta: (delta: string, kind?: RovoAppDocumentKind) => void;
	setActiveDocumentId: (documentId: string | null) => void;
	setArtifactMode: (mode: ArtifactMode) => void;
	setAttachedRunStatus: (status: RovoAppRunStatus | null) => void;
	setLocalThreadActiveRun: (threadId: string, status: null) => void;
	setPendingArtifactResult: SetState<RovoAppPendingArtifactResult | null>;
	setSelectedVersionId: (versionId: string | null) => void;
	setStreamingArtifact: SetState<RovoAppStreamingArtifact | null>;
	streamingArtifactRef: MutableRef<RovoAppStreamingArtifact | null>;
	suppressedStreamingAutoOpenDocumentIdRef: MutableRef<string | null>;
	visibleArtifactDocumentIdRef: MutableRef<string | null>;
}

function resolveRovoAppDocumentId(data: unknown): string | null {
	return typeof data === "string" && data.trim()
		? data
		: null;
}

function resolveRovoAppArtifactTitle(data: unknown): string | null {
	return typeof data === "string" && data.trim()
		? data
		: null;
}

function resolveRovoAppDocumentKind(data: unknown): RovoAppDocumentKind | null {
	return data === "text" || data === "code" || data === "image" || data === "sheet"
		? data
		: null;
}

function resolveRovoAppArtifactResult(data: unknown): {
	action: "create" | "update";
	documentId: string;
	kind: RovoAppDocumentKind;
	title: string;
} | null {
	if (
		!data ||
		typeof data !== "object" ||
		!("documentId" in data) ||
		!("action" in data) ||
		!("kind" in data) ||
		!("title" in data)
	) {
		return null;
	}

	const artifactResult = data as {
		action: "create" | "update";
		documentId: string;
		kind: RovoAppDocumentKind;
		title: string;
	};
	return artifactResult;
}

export function dispatchRovoAppDataPart(
	dataPart: RovoAppDataPart,
	{
		activeThreadIdRef,
		clearQueuedStreamingArtifactDelta,
		currentTurnIntentRef,
		flushQueuedStreamingArtifactDeltaNow,
		hydratePersistedArtifact,
		kickQueue,
		lastCompletedArtifactDocumentIdRef,
		markObservedTurnComplete,
		notifyStreamingCancelled,
		pendingArtifactAssociationRef,
		pendingArtifactCreationRetryRef,
		persistActiveDocumentSelection,
		queueStreamingArtifactDelta,
		setActiveDocumentId,
		setArtifactMode,
		setAttachedRunStatus,
		setLocalThreadActiveRun,
		setPendingArtifactResult,
		setSelectedVersionId,
		setStreamingArtifact,
		streamingArtifactRef,
		suppressedStreamingAutoOpenDocumentIdRef,
		visibleArtifactDocumentIdRef,
	}: Readonly<DispatchRovoAppDataPartInput>,
): void {
	const updateArtifact = (
		patch: Partial<RovoAppStreamingArtifact>,
	) => {
		const now = new Date().toISOString();
		setStreamingArtifact((prev) => ({
			content: prev?.content ?? "",
			documentId: prev?.documentId ?? null,
			createdAt: prev?.createdAt ?? now,
			kind: prev?.kind ?? "text",
			status: "streaming" as const,
			title: prev?.title ?? "Artifact draft",
			updatedAt: now,
			...patch,
		}));
	};
	const updatePendingArtifact = (
		patch: Partial<RovoAppPendingArtifactResult>,
	) => {
		setPendingArtifactResult((prev) => ({
			action: prev?.action ?? null,
			documentId: prev?.documentId ?? null,
			kind: prev?.kind ?? "text",
			title: prev?.title ?? "Artifact draft",
			...patch,
		}));
	};

	switch (dataPart.type) {
		case "data-id": {
			const documentId = resolveRovoAppDocumentId(dataPart.data);
			if (!documentId) {
				break;
			}

			updateArtifact({ documentId });
			updatePendingArtifact({ documentId });
			suppressedStreamingAutoOpenDocumentIdRef.current = null;
			setActiveDocumentId(documentId);
			persistActiveDocumentSelection(documentId);
			setSelectedVersionId("streaming");
			setArtifactMode("preview");
			pendingArtifactAssociationRef.current = true;
			break;
		}

		case "data-title": {
			const title = resolveRovoAppArtifactTitle(dataPart.data);
			if (!title) {
				break;
			}

			updateArtifact({ title });
			updatePendingArtifact({ title });
			break;
		}

		case "data-kind": {
			const kind = resolveRovoAppDocumentKind(dataPart.data);
			if (!kind) {
				break;
			}

			updateArtifact({ kind });
			updatePendingArtifact({ kind });
			break;
		}

		case "data-clear":
			clearQueuedStreamingArtifactDelta();
			setStreamingArtifact((prev) =>
				prev
					? { ...prev, content: "", status: "streaming", updatedAt: new Date().toISOString() }
					: null,
			);
			break;

		case "data-textDelta":
		case "data-codeDelta": {
			if (typeof dataPart.data !== "string" || !dataPart.data) {
				break;
			}

			queueStreamingArtifactDelta(
				dataPart.data,
				dataPart.type === "data-codeDelta" ? "code" : undefined,
			);
			break;
		}

		case "data-finish": {
			flushQueuedStreamingArtifactDeltaNow();
			const documentId = streamingArtifactRef.current?.documentId;
			setStreamingArtifact((prev) =>
				prev
					? { ...prev, status: "idle", updatedAt: new Date().toISOString() }
					: prev,
			);
			if (documentId) {
				void hydratePersistedArtifact(documentId)
					.then((document) => {
						setStreamingArtifact((prev) => {
							if (!prev || prev.documentId !== documentId) {
								return prev;
							}

							if (document) {
								return null;
							}

							return visibleArtifactDocumentIdRef.current === documentId
								? prev
								: null;
						});
					});
			}
			break;
		}

		case "data-artifact-result": {
			const artifactResult = resolveRovoAppArtifactResult(dataPart.data);
			if (!artifactResult) {
				break;
			}

			lastCompletedArtifactDocumentIdRef.current = artifactResult.documentId;
			if (artifactResult.action === "create") {
				pendingArtifactCreationRetryRef.current = false;
			}
			updatePendingArtifact({
				action: artifactResult.action,
				documentId: artifactResult.documentId,
				kind: artifactResult.kind,
				title: artifactResult.title,
			});
			break;
		}

		case "data-cancel-streaming":
			notifyStreamingCancelled();
			break;

		case "data-turn-complete": {
			markObservedTurnComplete();
			setAttachedRunStatus(null);
			const threadId = activeThreadIdRef.current;
			if (threadId) {
				setLocalThreadActiveRun(threadId, null);
			}
			currentTurnIntentRef.current = null;
			kickQueue();
			break;
		}

		case "data-route-decision": {
			const routeData = dataPart.data as { intent?: string } | null;
			if (routeData?.intent) {
				currentTurnIntentRef.current = routeData.intent;
			}
			break;
		}

		default:
			break;
	}
}
