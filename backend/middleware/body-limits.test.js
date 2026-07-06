"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	FALLBACK_BODY_LIMIT,
	ROUTE_JSON_BODY_LIMITS,
	createPayloadTooLargeHandler,
	registerBodyLimitMiddleware,
} = require("./body-limits");

function createFakeExpress() {
	const calls = [];
	return {
		calls,
		json: (options) => {
			calls.push({ parser: "json", options });
			return { parser: "json", options };
		},
		text: (options) => {
			calls.push({ parser: "text", options });
			return { parser: "text", options };
		},
		urlencoded: (options) => {
			calls.push({ parser: "urlencoded", options });
			return { parser: "urlencoded", options };
		},
	};
}

function createFakeApp() {
	const uses = [];
	return {
		uses,
		use: (...args) => {
			uses.push(args);
		},
	};
}

test("body limit route table preserves exact scoped parser limits", () => {
	assert.deepEqual(ROUTE_JSON_BODY_LIMITS, [
		{
			paths: ["/api/chat-sdk", "/api/rovo/suggestions"],
			limit: "8mb",
		},
		{
			paths: ["/api/sound-generation", "/api/speech-transcription"],
			limit: "12mb",
		},
		{
			paths: "/api/rovo/files/upload",
			limit: "12mb",
		},
		{
			paths: "/api/skills/hub/install",
			limit: "5mb",
		},
	]);
	assert.equal(FALLBACK_BODY_LIMIT, "50mb");
});

test("registerBodyLimitMiddleware mounts scoped parsers before fallback parsers", () => {
	const app = createFakeApp();
	const expressImpl = createFakeExpress();

	registerBodyLimitMiddleware(app, { expressImpl });

	assert.deepEqual(app.uses.slice(0, 4), [
		[["/api/chat-sdk", "/api/rovo/suggestions"], { parser: "json", options: { limit: "8mb" } }],
		[["/api/sound-generation", "/api/speech-transcription"], { parser: "json", options: { limit: "12mb" } }],
		["/api/rovo/files/upload", { parser: "json", options: { limit: "12mb" } }],
		["/api/skills/hub/install", { parser: "json", options: { limit: "5mb" } }],
	]);
	assert.deepEqual(app.uses.slice(4, 7), [
		[{ parser: "json", options: { limit: "50mb" } }],
		[{ parser: "text", options: { limit: "50mb", type: "text/markdown" } }],
		[{ parser: "urlencoded", options: { limit: "50mb", extended: true } }],
	]);
	assert.equal(typeof app.uses[7][0], "function");
});

test("registerBodyLimitMiddleware validates app and parser dependencies", () => {
	assert.throws(() => registerBodyLimitMiddleware(null), /Express app/u);
	assert.throws(
		() => registerBodyLimitMiddleware(createFakeApp(), { expressImpl: { json: () => {} } }),
		/body parser helpers/u,
	);
});

test("payload-too-large handler preserves response shape and passes other errors through", () => {
	const handler = createPayloadTooLargeHandler();
	const responses = [];
	const res = {
		status: (statusCode) => {
			responses.push({ statusCode });
			return {
				json: (body) => {
					responses[responses.length - 1].body = body;
				},
			};
		},
	};
	const nextCalls = [];

	handler({ type: "entity.too.large" }, {}, res, (error) => {
		nextCalls.push(error);
	});

	assert.deepEqual(responses, [{
		statusCode: 413,
		body: {
			error: "Request payload is too large.",
			reason: "payload_too_large",
			details:
				"The request included more data than this endpoint can process, often from inline image/file data in chat history. You can continue chatting after starting a new thread or trimming history.",
		},
	}]);
	assert.deepEqual(nextCalls, []);

	const passthroughError = new Error("other");
	handler(passthroughError, {}, res, (error) => {
		nextCalls.push(error);
	});
	assert.deepEqual(nextCalls, [passthroughError]);
});
