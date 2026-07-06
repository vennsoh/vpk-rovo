"use strict";

const DEFAULT_POST_STREAM_COOLDOWN_MS = 500;
const DEFAULT_READY_PROBE_INTERVAL_MS = 100;
const DEFAULT_READY_PROBE_MAX_ATTEMPTS = 20;

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createRovoPortReadinessWaiter requires ${name}`);
	}
	return value;
}

function createRovoPortReadinessWaiter({
	classifyHealthCheck,
	healthCheck,
	maxAttempts = DEFAULT_READY_PROBE_MAX_ATTEMPTS,
	postStreamCooldownMs = DEFAULT_POST_STREAM_COOLDOWN_MS,
	probeIntervalMs = DEFAULT_READY_PROBE_INTERVAL_MS,
	sleepFn = sleep,
} = {}) {
	requireFunction("classifyHealthCheck", classifyHealthCheck);
	requireFunction("healthCheck", healthCheck);
	requireFunction("sleepFn", sleepFn);

	return async function waitForPortReady(port) {
		await sleepFn(postStreamCooldownMs);

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			try {
				const health = await healthCheck(port);
				const classifiedHealth = classifyHealthCheck(health);
				if (classifiedHealth.ready) {
					return;
				}

				if (classifiedHealth.terminal) {
					const terminalError = new Error(
						`Port ${port} is not ready: ${classifiedHealth.message || classifiedHealth.status}`
					);
					terminalError.healthStatus = classifiedHealth.status;
					terminalError.healthReason = classifiedHealth.reason;
					terminalError.healthDetail = classifiedHealth.detail;
					throw terminalError;
				}
			} catch (error) {
				if (error?.healthReason) {
					throw error;
				}
				await sleepFn(probeIntervalMs);
			}
		}

		throw new Error(`Port ${port} did not become ready after ${maxAttempts} probes`);
	};
}

module.exports = {
	DEFAULT_POST_STREAM_COOLDOWN_MS,
	DEFAULT_READY_PROBE_INTERVAL_MS,
	DEFAULT_READY_PROBE_MAX_ATTEMPTS,
	createRovoPortReadinessWaiter,
};
