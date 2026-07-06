"use strict";

const {
	getRovoAppRunFailurePayload,
} = require("./rovo-app-run-failure");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createRovoAppManagedRunLifecycle requires ${name}`);
	}
	return value;
}

function createSseDataChunk(payload) {
	return `data: ${JSON.stringify(payload)}\n\n`;
}

function createRovoAppFailureSseChunks(
	errorOrMessage,
	{
		now = () => Date.now(),
		nowDate = () => new Date(),
	} = {},
) {
	const failurePayload = getRovoAppRunFailurePayload(
		errorOrMessage,
		typeof errorOrMessage === "string" ? errorOrMessage : undefined,
	);
	const text = failurePayload.message;
	const textId = `rovo-app-error-${now()}`;
	return [
		createSseDataChunk({ type: "text-start", id: textId }),
		createSseDataChunk({ type: "text-delta", id: textId, delta: text }),
		createSseDataChunk({ type: "text-end", id: textId }),
		createSseDataChunk({
			type: "data-widget-error",
			id: `rovo-app-error-widget-${now()}`,
			data: {
				type: "question-card",
				code: failurePayload.code,
				message: text,
				details: failurePayload.details,
				canRetry: failurePayload.canRetry,
			},
		}),
		createSseDataChunk({
			type: "data-turn-complete",
			data: { timestamp: nowDate().toISOString() },
		}),
	];
}

function createRovoAppManagedRunLifecycle({
	activeRequests,
	clearRovoAppRunState,
	createFailureSseChunks = createRovoAppFailureSseChunks,
	executeRovoAppManagedRun,
	logger = console,
	persistRovoAppRunState,
	resolveRovoAppPortAvailability,
	rovoAppRunManager,
} = {}) {
	requireFunction("activeRequests.delete", activeRequests?.delete);
	requireFunction("clearRovoAppRunState", clearRovoAppRunState);
	requireFunction("createFailureSseChunks", createFailureSseChunks);
	requireFunction("executeRovoAppManagedRun", executeRovoAppManagedRun);
	requireFunction("logger.error", logger?.error);
	requireFunction("persistRovoAppRunState", persistRovoAppRunState);
	requireFunction("resolveRovoAppPortAvailability", resolveRovoAppPortAvailability);
	requireFunction("rovoAppRunManager.appendChunk", rovoAppRunManager?.appendChunk);
	requireFunction("rovoAppRunManager.clearRun", rovoAppRunManager?.clearRun);
	requireFunction("rovoAppRunManager.getRun", rovoAppRunManager?.getRun);
	requireFunction("rovoAppRunManager.hasSubscribers", rovoAppRunManager?.hasSubscribers);
	requireFunction("rovoAppRunManager.listQueuedThreadIds", rovoAppRunManager?.listQueuedThreadIds);
	requireFunction("rovoAppRunManager.markRunStarted", rovoAppRunManager?.markRunStarted);
	requireFunction("rovoAppRunManager.removeQueuedRun", rovoAppRunManager?.removeQueuedRun);
	requireFunction("rovoAppRunManager.setRunError", rovoAppRunManager?.setRunError);

	let isProcessingRovoAppRunQueue = false;

	async function failRovoAppRun(threadId, error) {
		const failurePayload = getRovoAppRunFailurePayload(error);
		const message = failurePayload.message;
		const isAbortLike =
			typeof error === "object"
			&& error !== null
			&& (
				("name" in error && error.name === "AbortError")
				|| /abort/i.test(message)
			);
		const run = rovoAppRunManager.getRun(threadId);
		if (run) {
			rovoAppRunManager.setRunError(threadId, message);
			if (!isAbortLike) {
				for (const chunk of createFailureSseChunks(error)) {
					rovoAppRunManager.appendChunk(threadId, chunk);
				}
			}
		}
		await clearRovoAppRunState(threadId);
		if (threadId) {
			activeRequests.delete(threadId);
		}
		rovoAppRunManager.clearRun(threadId);
		void startNextQueuedRovoAppRun();
	}

	async function startManagedRovoAppRun(run) {
		const markedRun = rovoAppRunManager.markRunStarted(run.threadId, {
			backend: run.backend === "rovo" ? "rovo" : "ai-gateway",
			portIndex: null,
			rovoPort: null,
			status: rovoAppRunManager.hasSubscribers(run.threadId) ? "streaming" : "background",
		});
		if (!markedRun) {
			return;
		}

		await persistRovoAppRunState(run.threadId, markedRun);
		void executeRovoAppManagedRun(markedRun).catch(async (error) => {
			const wasAborted = markedRun.abortController.signal.aborted;
			if (!wasAborted) {
				logger.error("[FUTURE-CHAT] Managed run failed:", error);
			}
			await failRovoAppRun(markedRun.threadId, error);
		});
	}

	async function startNextQueuedRovoAppRun() {
		if (isProcessingRovoAppRunQueue) {
			return;
		}

		isProcessingRovoAppRunQueue = true;
		try {
			const queuedThreadIds = rovoAppRunManager.listQueuedThreadIds();
			for (const threadId of queuedThreadIds) {
				const run = rovoAppRunManager.getRun(threadId);
				if (!run) {
					rovoAppRunManager.removeQueuedRun(threadId);
					continue;
				}

				const assignment = resolveRovoAppPortAvailability();
				if (!assignment) {
					continue;
				}

				await startManagedRovoAppRun(run);
				break;
			}
		} finally {
			isProcessingRovoAppRunQueue = false;
		}
	}

	return {
		failRovoAppRun,
		startManagedRovoAppRun,
		startNextQueuedRovoAppRun,
	};
}

module.exports = {
	createRovoAppFailureSseChunks,
	createRovoAppManagedRunLifecycle,
	createSseDataChunk,
};
