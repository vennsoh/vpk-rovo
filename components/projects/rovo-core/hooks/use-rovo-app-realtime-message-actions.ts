"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { createId } from "@/lib/utils";
import type { RovoAppThread } from "@/lib/rovo-app-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import {
	appendRovoAppRealtimeMessage as appendRovoAppRealtimeMessageCore,
	mutateRovoAppRealtimeMessageContent as mutateRovoAppRealtimeMessageContentCore,
} from "@/components/projects/rovo-core/lib/rovo-app-realtime-message-state";

type RovoAppRealtimeMessagesMutator = (
	updater: (currentMessages: RovoUIMessage[]) => RovoUIMessage[],
	options?: {
		incrementVersion?: boolean;
	},
) => RovoUIMessage[];

type RovoAppRealtimeMessagePersistor = (
	input: Readonly<{
		message: RovoUIMessage;
		threadId: string;
	}>,
) => Promise<unknown>;

interface UseRovoAppRealtimeMessageActionsOptions {
	activeThreadIdRef: {
		current: string | null;
	};
	ensureThread: (fallbackText: string) => Promise<string>;
	mutateRealtimeMessagesState: RovoAppRealtimeMessagesMutator;
	persistRealtimeMessage: RovoAppRealtimeMessagePersistor;
	setThreads: Dispatch<SetStateAction<RovoAppThread[]>>;
}

export function useRovoAppRealtimeMessageActions({
	activeThreadIdRef,
	ensureThread,
	mutateRealtimeMessagesState,
	persistRealtimeMessage,
	setThreads,
}: UseRovoAppRealtimeMessageActionsOptions) {
	const appendRealtimeMessage = useCallback(
		async (
			role: "user" | "assistant",
			content: string,
			options?: {
				createdAt?: string;
				messageId?: string;
				metadata?: RovoUIMessage["metadata"];
				parts?: RovoUIMessage["parts"];
				state?: "done" | "streaming";
			},
		) => {
			return appendRovoAppRealtimeMessageCore({
				content,
				createMessageId: () => createId("rovo-app-realtime"),
				ensureThread,
				mutateRealtimeMessagesState,
				options,
				persistRealtimeMessage,
				role,
				setThreads,
			});
		},
		[ensureThread, mutateRealtimeMessagesState, persistRealtimeMessage, setThreads],
	);

	const mutateRealtimeMessageContent = useCallback(
		(messageId: string, content: string, options: { append: boolean; state: "done" | "streaming" }) => {
			mutateRovoAppRealtimeMessageContentCore({
				activeThreadId: activeThreadIdRef.current,
				content,
				messageId,
				mutateRealtimeMessagesState,
				options,
				persistRealtimeMessage,
			});
		},
		[activeThreadIdRef, mutateRealtimeMessagesState, persistRealtimeMessage],
	);

	const setRealtimeMessageContent = useCallback(
		(messageId: string, content: string) => {
			mutateRealtimeMessageContent(messageId, content, { append: false, state: "done" });
		},
		[mutateRealtimeMessageContent],
	);

	const updateRealtimeMessage = useCallback(
		(messageId: string, contentDelta: string) => {
			mutateRealtimeMessageContent(messageId, contentDelta, { append: true, state: "streaming" });
		},
		[mutateRealtimeMessageContent],
	);

	return {
		appendRealtimeMessage,
		mutateRealtimeMessageContent,
		setRealtimeMessageContent,
		updateRealtimeMessage,
	};
}
