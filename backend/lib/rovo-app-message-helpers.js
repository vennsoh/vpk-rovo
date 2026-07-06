"use strict";

const {
	extractTextFromUiParts,
	getNonEmptyString,
} = require("./shared-utils");

function getLatestVisibleUserMessage(messages) {
	if (!Array.isArray(messages)) {
		return null;
	}

	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (!message || message.role !== "user") {
			continue;
		}

		const visibility = getNonEmptyString(message?.metadata?.visibility);
		if (visibility === "hidden") {
			continue;
		}

		const text = extractTextFromUiParts(message.parts);
		if (!text) {
			continue;
		}

		return {
			text,
			source: getNonEmptyString(message?.metadata?.source) || null,
		};
	}

	return null;
}

function getLatestUserMessageSource(messages) {
	if (!Array.isArray(messages)) {
		return null;
	}

	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (!message || message.role !== "user") {
			continue;
		}

		const source = getNonEmptyString(message?.metadata?.source);
		if (source) {
			return source;
		}
	}

	return null;
}

function createHiddenRovoAppUserMessage(messageId, text) {
	const resolvedText = getNonEmptyString(text);
	if (!resolvedText) {
		return null;
	}

	return {
		id:
			typeof messageId === "string" && messageId.trim().length > 0
				? messageId.trim()
				: `rovo-app-hidden-user-${Date.now()}`,
		role: "user",
		metadata: {
			source: "agent-directive",
			visibility: "hidden",
		},
		parts: [
			{
				type: "text",
				text: resolvedText,
				state: "done",
			},
		],
	};
}

function findRovoAppMessageById(messages, messageId) {
	if (!Array.isArray(messages) || typeof messageId !== "string" || !messageId.trim()) {
		return null;
	}

	return (
		messages.find((message) => {
			return (
				message &&
				typeof message === "object" &&
				typeof message.id === "string" &&
				message.id === messageId
			);
		}) ?? null
	);
}

function resolveRovoAppDelegatedPrompt({
	delegatedMessageId,
	requestMessages,
	thread,
}) {
	const resolvedDelegatedMessageId = getNonEmptyString(delegatedMessageId);
	if (!resolvedDelegatedMessageId) {
		return null;
	}

	const candidateMessage =
		findRovoAppMessageById(requestMessages, resolvedDelegatedMessageId) ||
		findRovoAppMessageById(thread?.realtimeMessages, resolvedDelegatedMessageId) ||
		findRovoAppMessageById(thread?.messages, resolvedDelegatedMessageId);
	if (!candidateMessage) {
		return null;
	}

	const text = extractTextFromUiParts(candidateMessage.parts);
	if (!text) {
		return null;
	}

	return {
		messageId: resolvedDelegatedMessageId,
		text,
	};
}

module.exports = {
	createHiddenRovoAppUserMessage,
	findRovoAppMessageById,
	getLatestUserMessageSource,
	getLatestVisibleUserMessage,
	resolveRovoAppDelegatedPrompt,
};
