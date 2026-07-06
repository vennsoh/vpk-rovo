"use client";

import {
	useCallback,
	useRef,
	useState,
	type Dispatch,
	type MutableRefObject,
	type SetStateAction,
} from "react";
import type { RovoAppPendingArtifactResult } from "@/components/projects/rovo-core/lib/rovo-app-message-artifacts";
import type { RovoAppStreamingArtifact } from "@/components/projects/rovo-core/lib/rovo-app-streaming-artifact";

interface UseRovoAppArtifactResetActionsOptions {
	clearQueuedStreamingArtifactDelta: () => void;
	setPendingArtifactResult: Dispatch<SetStateAction<RovoAppPendingArtifactResult | null>>;
	setStreamingArtifact: Dispatch<SetStateAction<RovoAppStreamingArtifact | null>>;
}

interface UseRovoAppArtifactResetActionsResult {
	clearStreamingArtifactState: () => void;
	lastCompletedArtifactDocumentIdRef: MutableRefObject<string | null>;
	pendingArtifactAssociationRef: MutableRefObject<boolean>;
	resetPendingArtifactAssociation: () => void;
	setStreamingArtifactMessageId: Dispatch<SetStateAction<string | null>>;
	streamingArtifactMessageId: string | null;
	streamingArtifactMessageIdRef: MutableRefObject<string | null>;
	suppressedStreamingAutoOpenDocumentIdRef: MutableRefObject<string | null>;
}

export function useRovoAppArtifactResetActions({
	clearQueuedStreamingArtifactDelta,
	setPendingArtifactResult,
	setStreamingArtifact,
}: UseRovoAppArtifactResetActionsOptions): UseRovoAppArtifactResetActionsResult {
	const [streamingArtifactMessageId, setStreamingArtifactMessageId] = useState<string | null>(null);
	const streamingArtifactMessageIdRef = useRef<string | null>(null);
	const pendingArtifactAssociationRef = useRef(false);
	const lastCompletedArtifactDocumentIdRef = useRef<string | null>(null);
	const suppressedStreamingAutoOpenDocumentIdRef = useRef<string | null>(null);

	const clearStreamingArtifactState = useCallback(() => {
		clearQueuedStreamingArtifactDelta();
		setStreamingArtifact(null);
	}, [clearQueuedStreamingArtifactDelta, setStreamingArtifact]);

	const resetPendingArtifactAssociation = useCallback(() => {
		setPendingArtifactResult(null);
		setStreamingArtifactMessageId(null);
		streamingArtifactMessageIdRef.current = null;
		pendingArtifactAssociationRef.current = false;
		lastCompletedArtifactDocumentIdRef.current = null;
		suppressedStreamingAutoOpenDocumentIdRef.current = null;
	}, [
		lastCompletedArtifactDocumentIdRef,
		pendingArtifactAssociationRef,
		setPendingArtifactResult,
		setStreamingArtifactMessageId,
		streamingArtifactMessageIdRef,
		suppressedStreamingAutoOpenDocumentIdRef,
	]);

	return {
		clearStreamingArtifactState,
		lastCompletedArtifactDocumentIdRef,
		pendingArtifactAssociationRef,
		resetPendingArtifactAssociation,
		setStreamingArtifactMessageId,
		streamingArtifactMessageId,
		streamingArtifactMessageIdRef,
		suppressedStreamingAutoOpenDocumentIdRef,
	};
}
