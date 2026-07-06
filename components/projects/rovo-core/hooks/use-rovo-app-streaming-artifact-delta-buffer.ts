"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { RovoAppDocumentKind } from "@/lib/rovo-app-types";
import {
	appendRovoAppStreamingArtifactDelta,
	type RovoAppStreamingArtifact,
} from "@/components/projects/rovo-core/lib/rovo-app-streaming-artifact";

export interface UseRovoAppStreamingArtifactDeltaBufferOptions {
	setStreamingArtifact: Dispatch<SetStateAction<RovoAppStreamingArtifact | null>>;
}

export interface UseRovoAppStreamingArtifactDeltaBufferResult {
	clearQueuedStreamingArtifactDelta: () => void;
	flushQueuedStreamingArtifactDeltaNow: () => void;
	queueStreamingArtifactDelta: (delta: string, kind?: RovoAppDocumentKind) => void;
}

export function useRovoAppStreamingArtifactDeltaBuffer({
	setStreamingArtifact,
}: Readonly<UseRovoAppStreamingArtifactDeltaBufferOptions>): UseRovoAppStreamingArtifactDeltaBufferResult {
	const queuedStreamingArtifactDeltaRef = useRef("");
	const queuedStreamingArtifactKindRef = useRef<RovoAppDocumentKind | null>(null);
	const queuedStreamingArtifactFrameRef = useRef<number | null>(null);

	const clearQueuedStreamingArtifactDelta = useCallback(() => {
		if (queuedStreamingArtifactFrameRef.current !== null) {
			window.cancelAnimationFrame(queuedStreamingArtifactFrameRef.current);
			queuedStreamingArtifactFrameRef.current = null;
		}

		queuedStreamingArtifactDeltaRef.current = "";
		queuedStreamingArtifactKindRef.current = null;
	}, []);

	const flushQueuedStreamingArtifactDelta = useCallback(() => {
		const delta = queuedStreamingArtifactDeltaRef.current;
		if (!delta) {
			return;
		}

		const kind = queuedStreamingArtifactKindRef.current ?? undefined;
		queuedStreamingArtifactDeltaRef.current = "";
		queuedStreamingArtifactKindRef.current = null;

		setStreamingArtifact((prev) =>
			appendRovoAppStreamingArtifactDelta({
				current: prev,
				delta,
				kind,
				timestamp: new Date().toISOString(),
			}),
		);
	}, [setStreamingArtifact]);

	const flushQueuedStreamingArtifactDeltaNow = useCallback(() => {
		if (queuedStreamingArtifactFrameRef.current !== null) {
			window.cancelAnimationFrame(queuedStreamingArtifactFrameRef.current);
			queuedStreamingArtifactFrameRef.current = null;
		}

		flushQueuedStreamingArtifactDelta();
	}, [flushQueuedStreamingArtifactDelta]);

	const queueStreamingArtifactDelta = useCallback(
		(delta: string, kind?: RovoAppDocumentKind) => {
			if (!delta) {
				return;
			}

			queuedStreamingArtifactDeltaRef.current += delta;
			if (kind) {
				queuedStreamingArtifactKindRef.current = kind;
			}
			if (queuedStreamingArtifactFrameRef.current !== null) {
				return;
			}

			queuedStreamingArtifactFrameRef.current = window.requestAnimationFrame(() => {
				queuedStreamingArtifactFrameRef.current = null;
				flushQueuedStreamingArtifactDelta();
			});
		},
		[flushQueuedStreamingArtifactDelta],
	);

	useEffect(() => {
		return () => {
			if (queuedStreamingArtifactFrameRef.current !== null) {
				window.cancelAnimationFrame(queuedStreamingArtifactFrameRef.current);
			}
		};
	}, []);

	return {
		clearQueuedStreamingArtifactDelta,
		flushQueuedStreamingArtifactDeltaNow,
		queueStreamingArtifactDelta,
	};
}
