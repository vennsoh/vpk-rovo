"use strict";

const { cancelChat } = require("./rovo-client");

const RETRY_INITIAL_DELAY_MS = 250;
const RETRY_DELAY_STEP_MS = 250;
const RETRY_MAX_DELAY_MS = 1_000;
const RETRY_TIMEOUT_MS = 10_000;
const RETRY_CANCEL_MIN_INTERVAL_MS = 2_000;
const WAIT_FOR_TURN_TIMEOUT_MS = 600_000;

function isChatInProgressError(err) {
	if (!err || typeof err !== "object") {
		return false;
	}

	const errorRecord = /** @type {{ message?: unknown; code?: unknown; status?: unknown; statusCode?: unknown; endpoint?: unknown }} */ (
		err
	);
	const message =
		typeof errorRecord.message === "string" ? errorRecord.message : "";
	const code = typeof errorRecord.code === "string" ? errorRecord.code : "";
	if (code === "ROVO_CHAT_IN_PROGRESS_TIMEOUT") {
		return true;
	}

	if (
		/chat(?: already)? in progress|chat-turn wait timed out|still finishing the previous response/i.test(
			message
		)
	) {
		return true;
	}

	const status =
		typeof errorRecord.status === "number"
			? errorRecord.status
			: typeof errorRecord.statusCode === "number"
				? errorRecord.statusCode
				: null;
	if (status !== 409) {
		return false;
	}

	const endpoint =
		typeof errorRecord.endpoint === "string" ? errorRecord.endpoint : "";
	return (
		/\/v3\/(?:set_chat_message|stream_chat|cancel)\b/i.test(endpoint) ||
		/\/v3\/(?:set_chat_message|stream_chat|cancel)\b/i.test(message)
	);
}

function isPromptTooLongError(err) {
	if (!err || typeof err.message !== "string") {
		return false;
	}
	const msg = err.message;
	return (
		/prompt is too long/i.test(msg) ||
		/tokens?\s*>\s*\d+\s*maximum/i.test(msg) ||
		/context limit(?: exceeded)?/i.test(msg) ||
		/maximum context(?: length| window)?/i.test(msg) ||
		/context window(?: exceeded| overflow)?/i.test(msg) ||
		/too many tokens/i.test(msg)
	);
}

function sleep(ms, signal) {
	return new Promise((resolve) => {
		if (signal?.aborted) {
			resolve();
			return;
		}

		const timer = setTimeout(resolve, ms);

		if (signal) {
			const onAbort = () => {
				clearTimeout(timer);
				resolve();
			};
			signal.addEventListener("abort", onAbort, { once: true });
		}
	});
}

function createAbortError(message = "Rovo operation aborted") {
	const abortError = new Error(message);
	abortError.name = "AbortError";
	abortError.code = "ABORT_ERR";
	return abortError;
}

function throwIfAborted(signal, message) {
	if (!signal?.aborted) {
		return;
	}
	throw createAbortError(message);
}

function shouldCancelConflictingTurn({
	cancelOnConflict = true,
	cancelAfterMs = 0,
	elapsedMs = 0,
}) {
	if (!cancelOnConflict) {
		return false;
	}

	const safeCancelAfterMs =
		typeof cancelAfterMs === "number" && Number.isFinite(cancelAfterMs)
			? Math.max(0, cancelAfterMs)
			: 0;
	if (safeCancelAfterMs === 0) {
		return true;
	}

	const safeElapsedMs =
		typeof elapsedMs === "number" && Number.isFinite(elapsedMs)
			? Math.max(0, elapsedMs)
			: 0;
	return safeElapsedMs >= safeCancelAfterMs;
}

async function retryChatInProgress(
	operation,
	{
		signal,
		onRetry,
		onRetryProgress,
		logPrefix,
		timeoutMs = RETRY_TIMEOUT_MS,
		cancelOnConflict = true,
		cancelAfterMs = 0,
		cancelMinIntervalMs = RETRY_CANCEL_MIN_INTERVAL_MS,
		cancelConflictTurn = cancelChat,
		port,
	}
) {
	const startedAtMs = Date.now();
	const deadlineMs = Date.now() + timeoutMs;
	let retryDelayMs = RETRY_INITIAL_DELAY_MS;
	let retryNotified = false;
	let conflictCount = 0;
	let cancelAttemptCount = 0;
	let lastCancelAttemptAtMs = 0;

	while (true) {
		if (signal?.aborted) {
			return { aborted: true, value: undefined };
		}

		try {
			const value = await operation();
			if (conflictCount > 0) {
				const elapsedMs = Date.now() - startedAtMs;
				console.info(
					`[${logPrefix}] Chat turn acquired after ${conflictCount} conflict retries (${elapsedMs}ms elapsed, ${cancelAttemptCount} cancel attempts).`
				);
			}
			return { aborted: false, value };
		} catch (err) {
			if (!isChatInProgressError(err)) {
				throw err;
			}
			conflictCount += 1;

			const remainingMs = deadlineMs - Date.now();
			if (remainingMs <= 0) {
				if (err && typeof err === "object") {
					err.chatInProgressTimedOut = true;
					err.chatInProgressRetryCount = conflictCount;
					err.chatInProgressElapsedMs = Date.now() - startedAtMs;
					err.chatInProgressCancelAttempts = cancelAttemptCount;
				}
				throw err;
			}

			if (!retryNotified && typeof onRetry === "function") {
				retryNotified = true;
				onRetry();
			}

			const elapsedMs = Date.now() - startedAtMs;
			const waitMs = Math.min(retryDelayMs, RETRY_MAX_DELAY_MS, remainingMs);
			const shouldCancel = shouldCancelConflictingTurn({
				cancelOnConflict,
				cancelAfterMs,
				elapsedMs,
			});
			const elapsedSinceLastCancelMs = Date.now() - lastCancelAttemptAtMs;
			const cancelThrottled =
				shouldCancel && elapsedSinceLastCancelMs < cancelMinIntervalMs;
			const cancelBackoffRemainingMs = cancelThrottled
				? cancelMinIntervalMs - elapsedSinceLastCancelMs
				: 0;
			const willCancelNow = shouldCancel && !cancelThrottled;
			if (typeof onRetryProgress === "function") {
				onRetryProgress({
					conflictCount,
					elapsedMs,
					waitMs,
					remainingMs,
					willCancel: willCancelNow,
					cancelThrottled,
					cancelBackoffRemainingMs,
					cancelAttemptCount,
				});
			}
			console.warn(
				willCancelNow
					? `[${logPrefix}] Chat already in progress (conflict ${conflictCount}) — cancelling and retrying in ${waitMs}ms...`
					: cancelThrottled
						? `[${logPrefix}] Chat already in progress (conflict ${conflictCount}) — cancel throttled for ${Math.ceil(cancelBackoffRemainingMs)}ms, retrying in ${waitMs}ms...`
						: cancelOnConflict
							? `[${logPrefix}] Chat already in progress (conflict ${conflictCount}) — waiting ${waitMs}ms before attempting cancellation...`
							: `[${logPrefix}] Chat already in progress (conflict ${conflictCount}) — waiting ${waitMs}ms before retrying...`
			);

			if (willCancelNow) {
				cancelAttemptCount += 1;
				lastCancelAttemptAtMs = Date.now();
				try {
					await cancelConflictTurn(port);
				} catch {
					// Ignore cancel errors — the chat may have finished on its own
				}
			}

			await sleep(waitMs, signal);
			retryDelayMs = Math.min(
				retryDelayMs + RETRY_DELAY_STEP_MS,
				RETRY_MAX_DELAY_MS
			);
		}
	}
}

function createChatInProgressTimeoutError(timeoutMs, metadata = {}) {
	const timeoutSeconds = Math.ceil(timeoutMs / 1000);
	const retryCount =
		typeof metadata.retryCount === "number" && metadata.retryCount > 0
			? metadata.retryCount
			: null;
	const timeoutError = new Error(
		retryCount
			? `Rovo chat in progress timeout after ${timeoutSeconds}s (${retryCount} retries)`
			: `Rovo chat in progress timeout after ${timeoutSeconds}s`
	);
	timeoutError.code = "ROVO_CHAT_IN_PROGRESS_TIMEOUT";
	if (retryCount) {
		timeoutError.retryCount = retryCount;
	}
	if (typeof metadata.elapsedMs === "number" && metadata.elapsedMs > 0) {
		timeoutError.elapsedMs = metadata.elapsedMs;
	}
	if (typeof metadata.logPrefix === "string" && metadata.logPrefix.trim()) {
		timeoutError.source = metadata.logPrefix.trim();
	}
	return timeoutError;
}

function createPortStuckError(port) {
	const err = new Error(
		`Rovo port ${port} is stuck — a previous turn never completed. Port has been marked unhealthy and will be restarted.`
	);
	err.code = "ROVO_PORT_STUCK";
	err.port = port;
	return err;
}

function createAbortCancelFailedError(port, cause) {
	const detail =
		cause instanceof Error && typeof cause.message === "string" && cause.message.trim().length > 0
			? cause.message.trim()
			: "Rovo cancel cleanup failed";
	const error = new Error(
		`Rovo port ${port} could not be cleared after abort: ${detail}`
	);
	error.code = "ROVO_ABORT_CANCEL_FAILED";
	error.port = port;
	error.cause = cause;
	return error;
}

module.exports = {
	createAbortCancelFailedError,
	createAbortError,
	createChatInProgressTimeoutError,
	createPortStuckError,
	isChatInProgressError,
	isPromptTooLongError,
	retryChatInProgress,
	shouldCancelConflictingTurn,
	throwIfAborted,
	WAIT_FOR_TURN_TIMEOUT_MS,
	RETRY_TIMEOUT_MS,
};
