"use client";

import {
	useCallback,
	type Dispatch,
	type SetStateAction,
} from "react";
import { buildEditedRovoAppMessageHistory } from "@/components/projects/rovo-core/lib/rovo-app-message-editing";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

interface UseRovoAppMessageEditActionsOptions {
	beginThreadHydration: () => void;
	completeThreadHydration: () => void;
	normalizedMessages: RovoUIMessage[];
	regenerate: () => void | Promise<void>;
	resetObservedTurnComplete: () => void;
	resetPendingArtifactAssociation: () => void;
	setEditingMessageId: Dispatch<SetStateAction<string | null>>;
	setMessages: Dispatch<SetStateAction<RovoUIMessage[]>>;
}

interface UseRovoAppMessageEditActionsResult {
	editMessage: (messageId: string, nextText: string) => Promise<void>;
	regenerateLatest: () => void;
}

export function useRovoAppMessageEditActions({
	beginThreadHydration,
	completeThreadHydration,
	normalizedMessages,
	regenerate,
	resetObservedTurnComplete,
	resetPendingArtifactAssociation,
	setEditingMessageId,
	setMessages,
}: UseRovoAppMessageEditActionsOptions): UseRovoAppMessageEditActionsResult {
	const editMessage = useCallback(
		async (messageId: string, nextText: string) => {
			const updatedMessages = buildEditedRovoAppMessageHistory({
				messageId,
				messages: normalizedMessages,
				nextText,
			});
			if (!updatedMessages) return;
			beginThreadHydration();
			setMessages(updatedMessages);
			window.setTimeout(() => {
				completeThreadHydration();
				resetPendingArtifactAssociation();
				resetObservedTurnComplete();
				void regenerate();
			}, 0);
			setEditingMessageId(null);
		},
		[
			beginThreadHydration,
			completeThreadHydration,
			normalizedMessages,
			regenerate,
			resetObservedTurnComplete,
			resetPendingArtifactAssociation,
			setEditingMessageId,
			setMessages,
		],
	);

	const regenerateLatest = useCallback(() => {
		resetPendingArtifactAssociation();
		resetObservedTurnComplete();
		void regenerate();
	}, [regenerate, resetObservedTurnComplete, resetPendingArtifactAssociation]);

	return {
		editMessage,
		regenerateLatest,
	};
}
