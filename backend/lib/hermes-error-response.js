"use strict";

function buildHermesUnavailableResponse({
	error,
	fallbackErrorMessage = "Hermes request failed",
} = {}) {
	const statusCode =
		error && typeof error === "object" && error !== null && typeof error.statusCode === "number"
			? error.statusCode
			: error?.code === "ENOENT"
				? 404
				: error?.code === "INVALID_INPUT"
					? 400
					: error?.code === "HERMES_UNREACHABLE"
						? 503
						: 500;

	return {
		statusCode,
		body: {
			error:
				statusCode === 503
					? fallbackErrorMessage
					: error instanceof Error
						? error.message
						: fallbackErrorMessage,
			details: error instanceof Error ? error.details ?? error.message : String(error),
		},
	};
}

function createHermesUnavailableResponseSender() {
	return function sendHermesUnavailableResponse(
		res,
		error,
		fallbackErrorMessage = "Hermes request failed",
	) {
		const { statusCode, body } = buildHermesUnavailableResponse({
			error,
			fallbackErrorMessage,
		});
		return res.status(statusCode).json(body);
	};
}

module.exports = {
	buildHermesUnavailableResponse,
	createHermesUnavailableResponseSender,
};
