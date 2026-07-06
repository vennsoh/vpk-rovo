"use strict";

function getThreadIdFromRequest(req) {
	return typeof req?.query?.threadId === "string" &&
		req.query.threadId.trim().length > 0
		? req.query.threadId.trim()
		: null;
}

async function handleChatCancelRequest({
	activeRequests,
	cancelChat,
	logger = console,
	req,
	res,
} = {}) {
	try {
		const threadId = getThreadIdFromRequest(req);
		const activeRequest = threadId ? activeRequests.get(threadId) : null;
		const resolvedPort = activeRequest?.port ?? null;

		logger.log(
			threadId
				? `[CHAT-CANCEL] Cancel requested for thread ${threadId}${typeof resolvedPort === "number" ? ` (port ${resolvedPort})` : ""}`
				: "[CHAT-CANCEL] Cancel requested (no threadId)"
		);

		if (activeRequest?.abortController) {
			try {
				activeRequest.abortController.abort();
			} catch {}
		}

		if (typeof resolvedPort === "number") {
			await cancelChat(resolvedPort);
		} else {
			await cancelChat();
		}

		if (threadId) {
			activeRequests.delete(threadId);
		}

		return res.status(200).json({
			cancelled: true,
			...(threadId ? { threadId } : {}),
			...(typeof resolvedPort === "number" ? { port: resolvedPort } : {}),
		});
	} catch (error) {
		logger.error("[CHAT-CANCEL] Cancel error:", error.message || error);
		return res.status(200).json({ cancelled: false, error: error.message });
	}
}

module.exports = {
	getThreadIdFromRequest,
	handleChatCancelRequest,
};
