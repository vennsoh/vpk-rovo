"use strict";

function handleRovoStreamPortAcquired(acquiredPort, {
	abortController,
	activeRequests,
	logger = console,
	onResolvedRovoPort,
	sessionMode,
	stageTrace,
	syncRovoAppThreadSessionFromCurrentPort,
	threadId,
} = {}) {
	if (typeof acquiredPort !== "number" || acquiredPort <= 0) {
		return false;
	}

	onResolvedRovoPort?.(acquiredPort);
	if (threadId) {
		activeRequests.set(threadId, { port: acquiredPort, abortController });
		void syncRovoAppThreadSessionFromCurrentPort(
			threadId,
			acquiredPort,
			{ sessionMode },
		).catch((error) => {
			logger.warn("[FUTURE-CHAT] Failed to sync thread session on port acquisition:", {
				threadId,
				port: acquiredPort,
				error: error instanceof Error ? error.message : String(error),
			});
		});
	}

	stageTrace.mark("stream_port_acquired", {
		port: acquiredPort,
	});
	return true;
}

function handleRovoStreamTimingStage(stage, details, {
	stageTrace,
} = {}) {
	stageTrace.mark(stage, details);
	return true;
}

function createRovoStreamLifecycleHandlers(deps = {}) {
	return {
		onPortAcquired: (acquiredPort) =>
			handleRovoStreamPortAcquired(acquiredPort, deps),
		onTimingStage: (stage, details) =>
			handleRovoStreamTimingStage(stage, details, deps),
	};
}

module.exports = {
	createRovoStreamLifecycleHandlers,
	handleRovoStreamPortAcquired,
	handleRovoStreamTimingStage,
};
