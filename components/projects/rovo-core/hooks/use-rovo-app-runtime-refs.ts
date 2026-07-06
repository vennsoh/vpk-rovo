"use client";

import type { ChatStatus } from "ai";
import { useEffect, type MutableRefObject } from "react";
import type { RovoAppRunStatus } from "@/lib/rovo-app-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

interface UseRovoAppRuntimeRefsOptions {
	activeThreadId: string | null;
	activeThreadIdRef: MutableRefObject<string | null>;
	attachedRunStatus: RovoAppRunStatus | null;
	attachedRunStatusRef: MutableRefObject<RovoAppRunStatus | null>;
	lastUseChatBusyAtRef: MutableRefObject<number>;
	realtimeMessages: RovoUIMessage[];
	realtimeMessagesRef: MutableRefObject<RovoUIMessage[]>;
	runSubscriptionAbortControllerRef: MutableRefObject<AbortController | null>;
	status: ChatStatus;
	statusRef: MutableRefObject<ChatStatus>;
	streamingArtifactMessageId: string | null;
	streamingArtifactMessageIdRef: MutableRefObject<string | null>;
	useChatStatus: ChatStatus;
	useChatStatusRef: MutableRefObject<ChatStatus>;
}

function abortRovoAppRunSubscription(
	runSubscriptionAbortControllerRef: MutableRefObject<AbortController | null>,
): void {
	runSubscriptionAbortControllerRef.current?.abort();
}

export function useRovoAppRuntimeRefs({
	activeThreadId,
	activeThreadIdRef,
	attachedRunStatus,
	attachedRunStatusRef,
	lastUseChatBusyAtRef,
	realtimeMessages,
	realtimeMessagesRef,
	runSubscriptionAbortControllerRef,
	status,
	statusRef,
	streamingArtifactMessageId,
	streamingArtifactMessageIdRef,
	useChatStatus,
	useChatStatusRef,
}: UseRovoAppRuntimeRefsOptions): void {
	useEffect(() => {
		activeThreadIdRef.current = activeThreadId;
	}, [activeThreadId, activeThreadIdRef]);

	useEffect(() => {
		streamingArtifactMessageIdRef.current = streamingArtifactMessageId;
	}, [streamingArtifactMessageId, streamingArtifactMessageIdRef]);

	useEffect(() => {
		return () => {
			abortRovoAppRunSubscription(runSubscriptionAbortControllerRef);
		};
	}, [runSubscriptionAbortControllerRef]);

	useEffect(() => {
		realtimeMessagesRef.current = realtimeMessages;
	}, [realtimeMessages, realtimeMessagesRef]);

	useEffect(() => {
		statusRef.current = status;
	}, [status, statusRef]);

	useEffect(() => {
		useChatStatusRef.current = useChatStatus;
		if (useChatStatus === "submitted" || useChatStatus === "streaming") {
			lastUseChatBusyAtRef.current = Date.now();
		}
	}, [lastUseChatBusyAtRef, useChatStatus, useChatStatusRef]);

	useEffect(() => {
		attachedRunStatusRef.current = attachedRunStatus;
	}, [attachedRunStatus, attachedRunStatusRef]);
}
