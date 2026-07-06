"use strict";

function createTextGenerationQueue() {
	let queuedTextGenerationTail = Promise.resolve();
	let queuedTextGenerationCount = 0;
	let queuedTextGenerationId = 0;

	const enqueueTextGeneration = (
		operation,
		{ logPrefix = "generateTextViaRovo" } = {}
	) => {
		const queueId = ++queuedTextGenerationId;
		const queuedAtMs = Date.now();
		queuedTextGenerationCount += 1;
		console.info(
			`[${logPrefix}] Queued background text generation request #${queueId} (queued=${queuedTextGenerationCount}).`
		);

		const queuedTask = queuedTextGenerationTail.then(async () => {
			const queueWaitMs = Date.now() - queuedAtMs;
			const startedAtMs = Date.now();
			console.info(
				`[${logPrefix}] Starting background text generation request #${queueId} after ${queueWaitMs}ms queue wait.`
			);
			try {
				const result = await operation();
				console.info(
					`[${logPrefix}] Completed background text generation request #${queueId} in ${Date.now() - startedAtMs}ms.`
				);
				return result;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				console.warn(
					`[${logPrefix}] Background text generation request #${queueId} failed after ${Date.now() - startedAtMs}ms: ${errorMessage}`
				);
				throw error;
			} finally {
				queuedTextGenerationCount = Math.max(queuedTextGenerationCount - 1, 0);
			}
		});

		queuedTextGenerationTail = queuedTask.catch(() => undefined);
		return queuedTask;
	};

	return {
		enqueueTextGeneration,
	};
}

const defaultTextGenerationQueue = createTextGenerationQueue();

module.exports = {
	createTextGenerationQueue,
	enqueueTextGeneration: defaultTextGenerationQueue.enqueueTextGeneration,
};
