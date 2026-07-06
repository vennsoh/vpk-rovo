"use client";

import {
	getMessageText,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";

export function areRovoAppMessagesEqual(
	left: ReadonlyArray<RovoUIMessage>,
	right: ReadonlyArray<RovoUIMessage>,
): boolean {
	if (left === right) {
		return true;
	}

	if (left.length !== right.length) {
		return false;
	}

	for (let i = 0; i < left.length; i++) {
		if (left[i] !== right[i]) {
			return false;
		}
	}

	return true;
}

export function normalizeRovoMessagesForMerge(
	messages: ReadonlyArray<RovoUIMessage>,
	previousMessages: ReadonlyArray<RovoUIMessage>,
): {
	changed: boolean;
	messages: RovoUIMessage[];
} {
	const previousMessagesById = new Map(
		previousMessages.map((message) => [message.id, message]),
	);
	let didChange = false;

	const normalizedMessages = messages.map((message, index) => {
		const previousMessage = previousMessagesById.get(message.id);
		const previousText = previousMessage ? getMessageText(previousMessage) : "";
		const nextText = getMessageText(message);
		const existingCreatedAt = previousMessage?.metadata?.createdAt ?? message.metadata?.createdAt;
		const createdAt =
			existingCreatedAt ??
			new Date(Date.now() + index).toISOString();
		const updatedAt =
			previousMessage && previousText !== nextText
				? new Date().toISOString()
				: previousMessage?.metadata?.updatedAt ??
					message.metadata?.updatedAt ??
					createdAt;
		const metadata = {
			...(message.metadata ?? {}),
			origin: "rovo" as const,
			createdAt,
			updatedAt,
		};

		if (
			message.metadata?.origin !== "rovo"
			|| message.metadata?.createdAt !== createdAt
			|| message.metadata?.updatedAt !== updatedAt
		) {
			didChange = true;
		}

		return {
			...message,
			metadata,
		};
	});

	return {
		changed: didChange,
		messages: normalizedMessages,
	};
}
