"use strict";

const { getNonEmptyString } = require("./shared-utils");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createRovoAppThreadSessionSync requires ${name}`);
	}
	return value;
}

function createRovoAppThreadSessionSync({
	ensureRovoSession,
	getCurrentRovoSession,
	logger = console,
	rovoAppThreadManager,
} = {}) {
	requireFunction("ensureRovoSession", ensureRovoSession);
	requireFunction("getCurrentRovoSession", getCurrentRovoSession);
	requireFunction("logger.warn", logger?.warn);
	requireFunction("rovoAppThreadManager.getThread", rovoAppThreadManager?.getThread);
	requireFunction("rovoAppThreadManager.updateThread", rovoAppThreadManager?.updateThread);

	async function syncRovoAppThreadSession(threadId, rovoPort, { thread: providedThread } = {}) {
		if (!threadId || !Number.isInteger(rovoPort) || rovoPort <= 0) {
			return providedThread ?? null;
		}

		const currentThread = providedThread ?? await rovoAppThreadManager.getThread(threadId);
		if (!currentThread) {
			return null;
		}

		const customTitle =
			getNonEmptyString(currentThread.title) ||
			"Rovo";

		const existingSessionId = getNonEmptyString(currentThread.sessionId);
		const sessionRecord = await ensureRovoSession(rovoPort, {
			sessionId: existingSessionId,
			customTitle,
			timeoutMs: 5_000,
		});

		const nextSessionId = getNonEmptyString(sessionRecord?.sessionId);
		if (!nextSessionId) {
			return currentThread;
		}

		const nextSessionMode = currentThread.sessionMode === "ephemeral"
			? "ephemeral"
			: "persistent";

		if (
			currentThread.sessionId === nextSessionId &&
			currentThread.sessionMode === nextSessionMode
		) {
			return currentThread;
		}

		return rovoAppThreadManager.updateThread(threadId, {
			sessionId: nextSessionId,
			sessionMode: nextSessionMode,
		});
	}

	async function syncRovoAppThreadSessionFromCurrentPort(
		threadId,
		rovoPort,
		{
			sessionMode = "persistent",
			thread: providedThread,
		} = {},
	) {
		if (!threadId || !Number.isInteger(rovoPort) || rovoPort <= 0) {
			return providedThread ?? null;
		}

		const currentThread = providedThread ?? await rovoAppThreadManager.getThread(threadId);
		if (!currentThread) {
			return null;
		}

		let sessionRecord = null;
		try {
			sessionRecord = await getCurrentRovoSession(rovoPort, { timeoutMs: 5_000 });
		} catch (error) {
			logger.warn("[FUTURE-CHAT] Failed to read current Rovo session; falling back to ensure session:", {
				threadId,
				port: rovoPort,
				error: error instanceof Error ? error.message : String(error),
			});
			return syncRovoAppThreadSession(threadId, rovoPort, {
				thread: currentThread,
			});
		}
		const nextSessionId = getNonEmptyString(sessionRecord?.sessionId);
		if (!nextSessionId) {
			logger.warn("[FUTURE-CHAT] Current Rovo session response did not include a session id; falling back to ensure session:", {
				threadId,
				port: rovoPort,
			});
			return syncRovoAppThreadSession(threadId, rovoPort, {
				thread: currentThread,
			});
		}

		const nextSessionMode = sessionMode === "ephemeral" ? "ephemeral" : "persistent";
		if (
			currentThread.sessionId === nextSessionId &&
			currentThread.sessionMode === nextSessionMode
		) {
			return currentThread;
		}

		return rovoAppThreadManager.updateThread(threadId, {
			sessionId: nextSessionId,
			sessionMode: nextSessionMode,
		});
	}

	return {
		syncRovoAppThreadSession,
		syncRovoAppThreadSessionFromCurrentPort,
	};
}

module.exports = {
	createRovoAppThreadSessionSync,
};
