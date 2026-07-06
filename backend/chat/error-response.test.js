"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildGatewayErrorResponse,
	classifyAIGatewayFailureStage,
	createGatewayErrorResponseSender,
	createRovoUnavailableError,
	normalizeAIGatewayError,
} = require("./error-response");

test("classifyAIGatewayFailureStage preserves config, auth, stream, and request stages", () => {
	assert.equal(
		classifyAIGatewayFailureStage(new Error("AI Gateway URL is not configured")),
		"config",
	);
	assert.equal(
		classifyAIGatewayFailureStage(new Error("status 401 Authorization failed")),
		"auth",
	);
	assert.equal(
		classifyAIGatewayFailureStage(new Error("SSE response body is empty")),
		"stream",
	);
	assert.equal(
		classifyAIGatewayFailureStage(new Error("Unexpected gateway failure")),
		"request",
	);
});

test("createRovoUnavailableError preserves the existing unavailable contract", () => {
	const error = createRovoUnavailableError();

	assert.equal(error.code, "ROVO_UNAVAILABLE");
	assert.equal(error.backendSelected, "rovo");
	assert.equal(error.failureStage, "unavailable");
	assert.match(error.message, /Rovo Serve is required/u);
});

test("normalizeAIGatewayError annotates thrown values for response mapping", () => {
	const error = normalizeAIGatewayError("timed out waiting for stream");

	assert.equal(error.backendSelected, "ai-gateway");
	assert.equal(error.failureStage, "stream");
	assert.match(error.message, /timed out waiting for stream/u);
});

test("buildGatewayErrorResponse maps Rovo unavailable errors", () => {
	const error = createRovoUnavailableError();

	assert.deepEqual(
		buildGatewayErrorResponse({
			error,
			fallbackErrorMessage: "Failed to stream chat response",
		}),
		{
			statusCode: 503,
			body: {
				error: "Rovo Serve is required but not available",
				details: error.message,
				backendSelected: "rovo",
				failureStage: "unavailable",
			},
		},
	);
});

test("buildGatewayErrorResponse maps Rovo in-progress errors", () => {
	assert.deepEqual(
		buildGatewayErrorResponse({
			error: Object.assign(new Error("busy"), {
				code: "ROVO_CHAT_IN_PROGRESS_TIMEOUT",
			}),
		}),
		{
			statusCode: 409,
			body: {
				error: "Rovo chat turn is still in progress",
				details:
					"Another request is still finishing for this chat session. Please wait a moment and try again.",
				code: "ROVO_CHAT_IN_PROGRESS",
				backendSelected: "rovo",
				failureStage: "stream",
			},
		},
	);
	assert.equal(
		buildGatewayErrorResponse({
			error: new Error("chat already running"),
			isChatInProgressError: () => true,
		}).statusCode,
		409,
	);
});

test("buildGatewayErrorResponse maps AI Gateway errors by stage", () => {
	const configError = Object.assign(new Error("AI_GATEWAY_URL missing"), {
		backendSelected: "ai-gateway",
	});
	const authError = Object.assign(new Error("status 403"), {
		backendSelected: "ai-gateway",
	});
	const explicitStreamError = Object.assign(new Error("anything"), {
		backendSelected: "ai-gateway",
		failureStage: "stream",
	});

	assert.deepEqual(
		buildGatewayErrorResponse({
			error: configError,
			fallbackErrorMessage: "Failed to process chat request",
		}),
		{
			statusCode: 500,
			body: {
				error: "Failed to process chat request",
				details: "AI_GATEWAY_URL missing",
				backendSelected: "ai-gateway",
				failureStage: "config",
			},
		},
	);
	assert.equal(buildGatewayErrorResponse({ error: authError }).statusCode, 502);
	assert.deepEqual(buildGatewayErrorResponse({ error: explicitStreamError }).body, {
		error: "AI Gateway request failed",
		details: "anything",
		backendSelected: "ai-gateway",
		failureStage: "stream",
	});
});

test("buildGatewayErrorResponse maps generic failures to the unknown backend contract", () => {
	assert.deepEqual(
		buildGatewayErrorResponse({
			error: new Error("boom"),
			fallbackErrorMessage: "Failed to process chat request",
		}),
		{
			statusCode: 500,
			body: {
				error: "Failed to process chat request",
				details: "boom",
				backendSelected: "unknown",
				failureStage: "request",
			},
		},
	);
	assert.deepEqual(buildGatewayErrorResponse({ error: "raw failure" }).body, {
		error: "Internal server error",
		details: "raw failure",
		backendSelected: "unknown",
		failureStage: "request",
	});
});

test("createGatewayErrorResponseSender writes mapped status and body", () => {
	const calls = [];
	const res = {
		status: (statusCode) => {
			calls.push({ statusCode });
			return {
				json: (body) => {
					calls.push({ body });
					return { statusCode, body };
				},
			};
		},
	};
	const sendGatewayErrorResponse = createGatewayErrorResponseSender({
		isChatInProgressError: () => true,
	});

	assert.deepEqual(
		sendGatewayErrorResponse(res, new Error("busy"), "fallback"),
		{
			statusCode: 409,
			body: {
				error: "Rovo chat turn is still in progress",
				details:
					"Another request is still finishing for this chat session. Please wait a moment and try again.",
				code: "ROVO_CHAT_IN_PROGRESS",
				backendSelected: "rovo",
				failureStage: "stream",
			},
		},
	);
	assert.deepEqual(calls.map((call) => Object.keys(call)[0]), ["statusCode", "body"]);
});
