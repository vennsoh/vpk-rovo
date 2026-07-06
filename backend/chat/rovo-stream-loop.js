"use strict";

function buildRovoInitialActiveAttemptMessage({
	rawDeferredToolResponse,
	userMessageText,
} = {}) {
	return rawDeferredToolResponse && typeof rawDeferredToolResponse === "object"
		? {
				message: rawDeferredToolResponse,
				enableDeepPlan: false,
			}
		: {
				message: userMessageText,
				enableDeepPlan: false,
			};
}

function resolveRovoToolFirstRetryLimit({
	isStrictToolFirstTurn = false,
	softRetryMode,
	toolFirstPolicy,
} = {}) {
	if (
		!isStrictToolFirstTurn ||
		toolFirstPolicy?.enforcement?.mode !== softRetryMode
	) {
		return 0;
	}
	return Math.max(toolFirstPolicy?.enforcement?.maxRelevantRetries ?? 0, 0);
}

function waitForRovoRetryDelay(delayMs, {
	abortSignal,
} = {}) {
	return new Promise((resolve) => {
		if (
			typeof delayMs !== "number" ||
			delayMs <= 0 ||
			abortSignal?.aborted
		) {
			resolve();
			return;
		}
		let settled = false;
		const finish = () => {
			if (settled) {
				return;
			}
			settled = true;
			abortSignal?.removeEventListener?.("abort", onAbort);
			resolve();
		};
		const onAbort = () => {
			clearTimeout(timer);
			finish();
		};
		const timer = setTimeout(finish, delayMs);
		abortSignal?.addEventListener?.("abort", onAbort, { once: true });
	});
}

async function runRovoStreamRetryLoop({
	abortSignal,
	forcePortRecoveryAttemptCount = 0,
	handleAttemptError,
	hasRelevantToolSuccess,
	hasRetriedAsDeferredToolResponse = false,
	initialActiveAttemptMessage,
	initialToolFirstAttempt = 1,
	logger = console,
	recordToolFirstAttempt,
	resetAssistantTextForRetryAttempt,
	resolveRetryPlan,
	runStreamAttempt,
	stuckPortRecoveryRetryCount = 0,
	waitForRetryDelay = waitForRovoRetryDelay,
	writeStatusPart,
} = {}) {
	let activeAttemptMessage = initialActiveAttemptMessage;
	let currentToolFirstAttempt = initialToolFirstAttempt;
	let shouldContinueToolFirstRetry = true;

	while (shouldContinueToolFirstRetry) {
		recordToolFirstAttempt({
			activeAttemptMessage,
			currentToolFirstAttempt,
			isRetry: currentToolFirstAttempt > 1,
		});

		let streamTimedOut = false;
		try {
			await runStreamAttempt({
				activeAttemptMessage,
				currentToolFirstAttempt,
			});
		} catch (rovoStreamError) {
			const recoveryResult = await handleAttemptError({
				activeAttemptMessage,
				currentToolFirstAttempt,
				forcePortRecoveryAttemptCount,
				hasRetriedAsDeferredToolResponse,
				rovoStreamError,
				stuckPortRecoveryRetryCount,
			});
			if (recoveryResult.stuckPortRecoveryRetryCount !== undefined) {
				stuckPortRecoveryRetryCount =
					recoveryResult.stuckPortRecoveryRetryCount;
			}
			if (recoveryResult.forcePortRecoveryAttemptCount !== undefined) {
				forcePortRecoveryAttemptCount =
					recoveryResult.forcePortRecoveryAttemptCount;
			}
			if (recoveryResult.activeAttemptMessage) {
				activeAttemptMessage = recoveryResult.activeAttemptMessage;
			}
			if (recoveryResult.hasRetriedAsDeferredToolResponse) {
				hasRetriedAsDeferredToolResponse = true;
			}
			if (recoveryResult.shouldContinueToolFirstRetry === false) {
				shouldContinueToolFirstRetry = false;
			}
			if (recoveryResult.action === "stream-timeout") {
				streamTimedOut = true;
			}
			if (recoveryResult.action === "retry-stream") {
				if (recoveryResult.resetAssistantText) {
					resetAssistantTextForRetryAttempt();
				}
				continue;
			}
		}

		if (streamTimedOut) {
			shouldContinueToolFirstRetry = false;
			continue;
		}

		const hasToolFirstSuccess = hasRelevantToolSuccess();
		const retryPlan = resolveRetryPlan({
			activeAttemptMessage,
			currentToolFirstAttempt,
			hasToolFirstSuccess,
		});
		if (retryPlan.action !== "retry") {
			shouldContinueToolFirstRetry = false;
			continue;
		}

		logger.info("[TOOL-FIRST] Retrying tool-grounded response", {
			...retryPlan.logData,
		});
		writeStatusPart(retryPlan.statusPart);
		resetAssistantTextForRetryAttempt();

		if (retryPlan.retryDelayMs > 0) {
			await waitForRetryDelay(retryPlan.retryDelayMs, { abortSignal });
		}
		if (abortSignal?.aborted) {
			shouldContinueToolFirstRetry = false;
			continue;
		}

		activeAttemptMessage = retryPlan.activeAttemptMessage;
		currentToolFirstAttempt = retryPlan.nextAttempt;
	}

	return {
		activeAttemptMessage,
		currentToolFirstAttempt,
		forcePortRecoveryAttemptCount,
		hasRetriedAsDeferredToolResponse,
		stuckPortRecoveryRetryCount,
	};
}

async function runRovoStreamRetryLoopWithToolFirstPlanning({
	abortSignal,
	getHasEmittedQuestionCard = () => false,
	getHasObservedDeferredToolRequest = () => false,
	handleAttemptError,
	hasRelevantToolSuccess: hasRelevantToolSuccessFn,
	initialActiveAttemptMessage,
	logger = console,
	recordToolFirstAttempt,
	resetAssistantTextForRetryAttempt,
	resolveRovoToolFirstRetryPlan,
	runRovoStreamRetryLoopFn = runRovoStreamRetryLoop,
	runStreamAttempt,
	toolFirstExecutionState,
	toolFirstPolicy,
	toolFirstRelevanceDomains,
	toolFirstSoftRetryEnabled = false,
	totalToolFirstAttempts = 1,
	userMessageText,
	writer,
} = {}) {
	return runRovoStreamRetryLoopFn({
		abortSignal,
		initialActiveAttemptMessage,
		logger,
		recordToolFirstAttempt: ({ isRetry }) => {
			recordToolFirstAttempt(toolFirstExecutionState, { isRetry });
		},
		runStreamAttempt,
		handleAttemptError,
		hasRelevantToolSuccess: () =>
			hasRelevantToolSuccessFn(toolFirstExecutionState),
		resolveRetryPlan: ({
			currentToolFirstAttempt,
			hasToolFirstSuccess,
		}) => resolveRovoToolFirstRetryPlan({
			abortSignal,
			currentToolFirstAttempt,
			hasEmittedQuestionCard: getHasEmittedQuestionCard(),
			hasObservedDeferredToolRequest:
				getHasObservedDeferredToolRequest(),
			hasToolFirstSuccess,
			toolFirstExecutionState,
			toolFirstPolicy,
			toolFirstRelevanceDomains,
			toolFirstSoftRetryEnabled,
			totalToolFirstAttempts,
			userMessageText,
		}),
		resetAssistantTextForRetryAttempt,
		writeStatusPart: (statusPart) => {
			writer.write(statusPart);
		},
	});
}

module.exports = {
	buildRovoInitialActiveAttemptMessage,
	resolveRovoToolFirstRetryLimit,
	runRovoStreamRetryLoop,
	runRovoStreamRetryLoopWithToolFirstPlanning,
	waitForRovoRetryDelay,
};
