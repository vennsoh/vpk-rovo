"use client";

import type { MutableRefObject } from "react";
import { useEffect } from "react";

import {
	resolveRovoAppCompletedArtifactAutoOpen,
	resolveRovoAppStreamingArtifactAutoOpenPlan,
	shouldOpenDelayedRovoAppStreamingArtifact,
} from "@/components/projects/rovo-core/lib/rovo-app-artifact-panel-dispatcher";
import { upsertDocumentRecord } from "@/components/projects/rovo-core/lib/rovo-app-hook-helpers";
import type { RovoAppStreamingArtifact } from "@/components/projects/rovo-core/lib/rovo-app-streaming-artifact";
import type {
	RovoAppDocument,
	RovoAppPanelState,
} from "@/lib/rovo-app-types";
import {
	getMessageArtifactResult,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";

interface SaveRovoAppDocumentSourceMessageInput {
	documentId?: string;
	sourceMessageId?: string;
}

interface UseRovoAppArtifactPanelEffectsInput {
	documents: RovoAppDocument[];
	isHydratingThreadRef: MutableRefObject<boolean>;
	isStreaming: boolean;
	lastCompletedArtifactDocumentIdRef: MutableRefObject<string | null>;
	normalizedRovoMessages: RovoUIMessage[];
	panelState: RovoAppPanelState;
	pendingArtifactAssociationRef: MutableRefObject<boolean>;
	saveDocument: (payload: SaveRovoAppDocumentSourceMessageInput) => Promise<RovoAppDocument>;
	setDocuments: (
		documents: RovoAppDocument[] | ((previousDocuments: RovoAppDocument[]) => RovoAppDocument[]),
	) => void;
	setPanelState: (
		state: RovoAppPanelState | ((previousState: RovoAppPanelState) => RovoAppPanelState),
	) => void;
	setPendingArtifactResult: (result: null) => void;
	setStreamingArtifactMessageId: (messageId: string | null) => void;
	setVisibleArtifactDocumentId: (documentId: string | null) => void;
	streamingArtifact: RovoAppStreamingArtifact | null;
	streamingArtifactMessageId: string | null;
	streamingArtifactMessageIdRef: MutableRefObject<string | null>;
	streamingArtifactRef: MutableRefObject<RovoAppStreamingArtifact | null>;
	suppressedStreamingAutoOpenDocumentIdRef: MutableRefObject<string | null>;
	visibleArtifactDocumentId: string | null;
}

export function useRovoAppArtifactPanelEffects({
	documents,
	isHydratingThreadRef,
	isStreaming,
	lastCompletedArtifactDocumentIdRef,
	normalizedRovoMessages,
	panelState,
	pendingArtifactAssociationRef,
	saveDocument,
	setDocuments,
	setPanelState,
	setPendingArtifactResult,
	setStreamingArtifactMessageId,
	setVisibleArtifactDocumentId,
	streamingArtifact,
	streamingArtifactMessageId,
	streamingArtifactMessageIdRef,
	streamingArtifactRef,
	suppressedStreamingAutoOpenDocumentIdRef,
	visibleArtifactDocumentId,
}: UseRovoAppArtifactPanelEffectsInput): void {
	useEffect(() => {
		if (!pendingArtifactAssociationRef.current) return;
		if (streamingArtifactMessageId) return;
		const lastMessage =
			normalizedRovoMessages[normalizedRovoMessages.length - 1];
		if (lastMessage?.role === "assistant") {
			pendingArtifactAssociationRef.current = false;
			setStreamingArtifactMessageId(lastMessage.id);
			streamingArtifactMessageIdRef.current = lastMessage.id;
			const documentId = streamingArtifactRef.current?.documentId;
			if (documentId) {
				void saveDocument({
					documentId,
					sourceMessageId: lastMessage.id,
				}).then((updatedDocument) => {
					setDocuments((prev) => upsertDocumentRecord(prev, updatedDocument));
				}).catch((error) => {
					console.warn("[RovoApp] Failed to persist sourceMessageId:", error);
				});
			}
		}
	}, [
		normalizedRovoMessages,
		pendingArtifactAssociationRef,
		saveDocument,
		setDocuments,
		setStreamingArtifactMessageId,
		streamingArtifactMessageId,
		streamingArtifactMessageIdRef,
		streamingArtifactRef,
	]);

	useEffect(() => {
		if (!streamingArtifactMessageId) {
			return;
		}

		const associatedMessage = normalizedRovoMessages.find(
			(message) => message.id === streamingArtifactMessageId && message.role === "assistant",
		);
		if (!associatedMessage || !getMessageArtifactResult(associatedMessage)) {
			return;
		}

		setPendingArtifactResult(null);
	}, [normalizedRovoMessages, setPendingArtifactResult, streamingArtifactMessageId]);

	useEffect(() => {
		const autoOpenPlan = resolveRovoAppStreamingArtifactAutoOpenPlan({
			isHydratingThread: isHydratingThreadRef.current,
			panelState,
			streamingArtifact,
			suppressedDocumentId: suppressedStreamingAutoOpenDocumentIdRef.current,
			visibleArtifactDocumentId,
		});
		if (!autoOpenPlan) {
			return;
		}

		if (autoOpenPlan.delayMs === 0) {
			setVisibleArtifactDocumentId(autoOpenPlan.documentId);
			if (autoOpenPlan.shouldPreviewClosedPanel) {
				setPanelState("preview");
			}
			return;
		}

		const timeoutId = window.setTimeout(() => {
			if (shouldOpenDelayedRovoAppStreamingArtifact({
				documentId: autoOpenPlan.documentId,
				streamingArtifact: streamingArtifactRef.current,
				suppressedDocumentId: suppressedStreamingAutoOpenDocumentIdRef.current,
			})) {
				setVisibleArtifactDocumentId(autoOpenPlan.documentId);
				setPanelState((prev) => prev === "closed" ? "preview" : prev);
			}
		}, autoOpenPlan.delayMs);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [
		isHydratingThreadRef,
		panelState,
		setPanelState,
		setVisibleArtifactDocumentId,
		streamingArtifact,
		streamingArtifactRef,
		suppressedStreamingAutoOpenDocumentIdRef,
		visibleArtifactDocumentId,
	]);

	useEffect(() => {
		const completedDocumentId = resolveRovoAppCompletedArtifactAutoOpen({
			completedDocumentId: lastCompletedArtifactDocumentIdRef.current,
			documents,
			isHydratingThread: isHydratingThreadRef.current,
			isStreaming,
			suppressedDocumentId: suppressedStreamingAutoOpenDocumentIdRef.current,
			visibleArtifactDocumentId,
		});
		if (!completedDocumentId) {
			return;
		}

		lastCompletedArtifactDocumentIdRef.current = null;
		setVisibleArtifactDocumentId(completedDocumentId);
		setPanelState((prev) => prev === "closed" ? "preview" : prev);
	}, [
		documents,
		isHydratingThreadRef,
		isStreaming,
		lastCompletedArtifactDocumentIdRef,
		setPanelState,
		setVisibleArtifactDocumentId,
		suppressedStreamingAutoOpenDocumentIdRef,
		visibleArtifactDocumentId,
	]);
}
