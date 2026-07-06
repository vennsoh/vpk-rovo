"use strict";

function classifyAIGatewayFailureStage(error) {
	const message = error instanceof Error ? error.message : String(error ?? "");

	if (
		/AI Gateway URL is not configured|Server configuration error|AI_GATEWAY_URL|AI_GATEWAY_USE_CASE_ID|AI_GATEWAY_CLOUD_ID|AI_GATEWAY_USER_ID/i.test(message)
	) {
		return "config";
	}

	if (/ASAP_|authentication|Authorization|status 401|status 403|auth/i.test(message)) {
		return "auth";
	}

	if (/stream|SSE|response body is empty|timeout|timed out/i.test(message)) {
		return "stream";
	}

	return "request";
}

function createRovoUnavailableError() {
	const error = new Error(
		"Rovo Serve is required but not available. " +
		"Please start Rovo Serve with 'pnpm run rovo' before using this feature."
	);
	error.code = "ROVO_UNAVAILABLE";
	error.backendSelected = "rovo";
	error.failureStage = "unavailable";
	return error;
}

function normalizeAIGatewayError(error) {
	const normalizedError = error instanceof Error ? error : new Error(String(error));
	normalizedError.backendSelected = "ai-gateway";
	normalizedError.failureStage = classifyAIGatewayFailureStage(normalizedError);
	return normalizedError;
}

function buildGatewayErrorResponse({
	error,
	fallbackErrorMessage,
	isChatInProgressError = () => false,
} = {}) {
	if (error && error.code === "ROVO_UNAVAILABLE") {
		return {
			statusCode: 503,
			body: {
				error: "Rovo Serve is required but not available",
				details: error.message,
				backendSelected: "rovo",
				failureStage: "unavailable",
			},
		};
	}

	if (
		error &&
		(error.code === "ROVO_CHAT_IN_PROGRESS_TIMEOUT" ||
			isChatInProgressError(error))
	) {
		return {
			statusCode: 409,
			body: {
				error: "Rovo chat turn is still in progress",
				details:
					"Another request is still finishing for this chat session. Please wait a moment and try again.",
				code: "ROVO_CHAT_IN_PROGRESS",
				backendSelected: "rovo",
				failureStage: "stream",
			},
		};
	}

	if (error && error.backendSelected === "ai-gateway") {
		const stage = error.failureStage || classifyAIGatewayFailureStage(error);
		return {
			statusCode: stage === "config" ? 500 : 502,
			body: {
				error: fallbackErrorMessage || "AI Gateway request failed",
				details: error.message,
				backendSelected: "ai-gateway",
				failureStage: stage,
			},
		};
	}

	return {
		statusCode: 500,
		body: {
			error: fallbackErrorMessage || "Internal server error",
			details: error instanceof Error ? error.message : String(error),
			backendSelected: "unknown",
			failureStage: "request",
		},
	};
}

function createGatewayErrorResponseSender({
	isChatInProgressError = () => false,
} = {}) {
	return function sendGatewayErrorResponse(res, error, fallbackErrorMessage) {
		const { statusCode, body } = buildGatewayErrorResponse({
			error,
			fallbackErrorMessage,
			isChatInProgressError,
		});
		return res.status(statusCode).json(body);
	};
}

module.exports = {
	buildGatewayErrorResponse,
	classifyAIGatewayFailureStage,
	createGatewayErrorResponseSender,
	createRovoUnavailableError,
	normalizeAIGatewayError,
};
