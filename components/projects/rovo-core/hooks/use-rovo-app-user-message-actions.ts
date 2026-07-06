"use client";

import type { FileUIPart } from "ai";
import {
	useCallback,
	type Dispatch,
	type SetStateAction,
} from "react";
import { createRovoAppUserMessage } from "@/components/projects/rovo-core/lib/rovo-app-user-message";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import { createId } from "@/lib/utils";

interface AppendLocalRovoAppUserMessageInput {
	files: ReadonlyArray<FileUIPart>;
	metadata?: RovoUIMessage["metadata"];
	text: string;
}

interface AppendLocalRovoAppUserMessageResult {
	message: RovoUIMessage;
	messageId: string;
}

interface UseRovoAppUserMessageActionsOptions {
	setMessages: Dispatch<SetStateAction<RovoUIMessage[]>>;
}

interface UseRovoAppUserMessageActionsResult {
	appendLocalUserMessage: (
		input: AppendLocalRovoAppUserMessageInput,
	) => AppendLocalRovoAppUserMessageResult;
}

export function useRovoAppUserMessageActions({
	setMessages,
}: UseRovoAppUserMessageActionsOptions): UseRovoAppUserMessageActionsResult {
	const appendLocalUserMessage = useCallback(
		({
			files,
			metadata,
			text,
		}: AppendLocalRovoAppUserMessageInput) => {
			const createdAt = new Date().toISOString();
			const messageId = createId("rovo-app-user");
			const message = createRovoAppUserMessage({
				id: messageId,
				createdAt,
				files,
				metadata,
				text,
			});

			setMessages((previousMessages) => [...previousMessages, message]);
			return { message, messageId };
		},
		[setMessages],
	);

	return {
		appendLocalUserMessage,
	};
}
