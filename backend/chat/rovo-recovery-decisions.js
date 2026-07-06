"use strict";

function createRovoRecoveryThinkingStatusPart({ label, content } = {}) {
	return {
		type: "data-thinking-status",
		data: {
			label,
			...(content ? { content } : {}),
			activity: "results",
			source: "backend",
		},
	};
}

function normalizeRovoRecoveryError(recoveryResult) {
	return typeof recoveryResult?.error === "string" &&
		recoveryResult.error.trim().length > 0
		? recoveryResult.error.trim()
		: null;
}

async function resolveRovoPortStuckRecovery({
	abortSignal,
	attemptCount = 0,
	buildInteractiveStuckPortFailureMessage = () =>
		"Rovo port recovery failed. Please retry or reset the chat.",
	logger = console,
	maxAttempts = 0,
	recoveryPort,
	restartOptions = {},
	restartRovoPort,
	shouldRetryInteractiveStuckPortRecovery = () => false,
} = {}) {
	let recoveryResult = null;

	if (
		typeof recoveryPort === "number" &&
		recoveryPort > 0 &&
		typeof restartRovoPort === "function"
	) {
		try {
			recoveryResult = await restartRovoPort({
				...restartOptions,
				port: recoveryPort,
			});
			logger.info("[CHAT-SDK] Port stuck recovery result", {
				port: recoveryPort,
				recovered: recoveryResult.recovered === true,
				killedPids: recoveryResult.killedPids,
				activePids: recoveryResult.activePids,
				error: recoveryResult.error,
			});
		} catch (recoveryErr) {
			logger.error(
				"[CHAT-SDK] Port restart failed:",
				recoveryErr?.message || recoveryErr
			);
			recoveryResult = {
				recovered: false,
				error:
					recoveryErr instanceof Error
						? recoveryErr.message
						: String(recoveryErr ?? "Port restart failed"),
			};
		}
	}

	const recovered = recoveryResult?.recovered === true;
	const shouldRetry = shouldRetryInteractiveStuckPortRecovery({
		aborted: abortSignal?.aborted === true,
		attemptCount,
		maxAttempts,
		recovered,
	});
	if (shouldRetry) {
		return {
			action: "retry",
			nextAttemptCount: attemptCount + 1,
			recovered,
			recoveryPort,
			recoveryResult,
			statusParts: [
				createRovoRecoveryThinkingStatusPart({
					label: "Recovered stuck port, retrying",
					content: `Rovo port ${recoveryPort} restarted successfully.`,
				}),
			],
		};
	}

	const recoveryError = normalizeRovoRecoveryError(recoveryResult);
	const statusParts = recoveryError
		? [
			createRovoRecoveryThinkingStatusPart({
				label: "Port recovery failed",
				content: recoveryError,
			}),
		]
		: [];

	return {
		action: "fail",
		failureText: buildInteractiveStuckPortFailureMessage({
			recoveryError,
			retriedRecovery: recovered,
		}),
		nextAttemptCount: attemptCount,
		recovered,
		recoveryError,
		recoveryPort,
		recoveryResult,
		statusParts,
	};
}

async function resolveRovoChatInProgressTimeoutRecovery({
	attemptCount = 0,
	logger = console,
	maxAttempts = 0,
	resolvedRecoveryPort,
	restartOptions = {},
	restartRovoPort,
} = {}) {
	const canForceRecoverPort =
		typeof resolvedRecoveryPort === "number" &&
		resolvedRecoveryPort > 0 &&
		attemptCount < maxAttempts &&
		typeof restartRovoPort === "function";
	let nextAttemptCount = attemptCount;
	const statusParts = [];

	if (canForceRecoverPort) {
		nextAttemptCount += 1;
		const recoveryResult = await restartRovoPort({
			...restartOptions,
			port: resolvedRecoveryPort,
		});
		logger.info("[CHAT-SDK] Forced per-port recovery result", {
			port: resolvedRecoveryPort,
			recovered: recoveryResult.recovered === true,
			killedPids: recoveryResult.killedPids,
			activePids: recoveryResult.activePids,
			error: recoveryResult.error,
		});

		if (recoveryResult.recovered) {
			return {
				action: "retry",
				nextAttemptCount,
				recoveryResult,
				statusParts: [
					createRovoRecoveryThinkingStatusPart({
						label: "Recovered stuck port, retrying",
						content: `Rovo port ${resolvedRecoveryPort} restarted successfully.`,
					}),
				],
			};
		}

		statusParts.push(
			createRovoRecoveryThinkingStatusPart({
				label: "Port recovery failed",
				content:
					normalizeRovoRecoveryError(recoveryResult) ||
					`Failed to recover Rovo port ${resolvedRecoveryPort}.`,
			})
		);
	}

	statusParts.push(
		createRovoRecoveryThinkingStatusPart({
			label: "Rovo turn wait timed out",
			content:
				"Automatic recovery timed out while waiting for the previous turn to clear.",
		})
	);

	return {
		action: "timeout",
		nextAttemptCount,
		statusParts,
		textDelta:
			"Automatic recovery timed out while waiting for the previous turn. Please retry or reset the chat.",
	};
}

module.exports = {
	createRovoRecoveryThinkingStatusPart,
	normalizeRovoRecoveryError,
	resolveRovoChatInProgressTimeoutRecovery,
	resolveRovoPortStuckRecovery,
};
