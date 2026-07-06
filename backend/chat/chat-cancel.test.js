const assert = require("node:assert/strict");
const test = require("node:test");

const {
	getThreadIdFromRequest,
	handleChatCancelRequest,
} = require("./chat-cancel");

function createResponse() {
	return {
		body: null,
		statusCode: null,
		status(statusCode) {
			this.statusCode = statusCode;
			return this;
		},
		json(body) {
			this.body = body;
			return this;
		},
	};
}

function createLogger() {
	return {
		errors: [],
		logs: [],
		error(...args) {
			this.errors.push(args);
		},
		log(...args) {
			this.logs.push(args);
		},
	};
}

test("getThreadIdFromRequest trims only non-empty string query values", () => {
	assert.equal(getThreadIdFromRequest({ query: { threadId: " thread-1 " } }), "thread-1");
	assert.equal(getThreadIdFromRequest({ query: { threadId: "" } }), null);
	assert.equal(getThreadIdFromRequest({ query: { threadId: ["thread-1"] } }), null);
	assert.equal(getThreadIdFromRequest({ query: {} }), null);
});

test("handleChatCancelRequest aborts and cancels by active request port", async () => {
	const aborts = [];
	const cancelCalls = [];
	const activeRequests = new Map([[
		"thread-1",
		{
			port: 8123,
			abortController: {
				abort() {
					aborts.push("thread-1");
				},
			},
		},
	]]);
	const logger = createLogger();
	const res = createResponse();

	await handleChatCancelRequest({
		activeRequests,
		cancelChat: async (port) => {
			cancelCalls.push(port);
		},
		logger,
		req: { query: { threadId: "thread-1" } },
		res,
	});

	assert.deepEqual(aborts, ["thread-1"]);
	assert.deepEqual(cancelCalls, [8123]);
	assert.equal(activeRequests.has("thread-1"), false);
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.body, {
		cancelled: true,
		threadId: "thread-1",
		port: 8123,
	});
	assert.match(logger.logs[0][0], /thread thread-1 \(port 8123\)/u);
});

test("handleChatCancelRequest cancels the default chat when no thread is tracked", async () => {
	const cancelCalls = [];
	const activeRequests = new Map();
	const logger = createLogger();
	const res = createResponse();

	await handleChatCancelRequest({
		activeRequests,
		cancelChat: async (port) => {
			cancelCalls.push(port);
		},
		logger,
		req: { query: {} },
		res,
	});

	assert.deepEqual(cancelCalls, [undefined]);
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.body, { cancelled: true });
	assert.match(logger.logs[0][0], /no threadId/u);
});

test("handleChatCancelRequest preserves 200 error response shape on cancel failure", async () => {
	const activeRequests = new Map();
	const logger = createLogger();
	const res = createResponse();

	await handleChatCancelRequest({
		activeRequests,
		cancelChat: async () => {
			throw new Error("cancel failed");
		},
		logger,
		req: { query: { threadId: "thread-2" } },
		res,
	});

	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.body, {
		cancelled: false,
		error: "cancel failed",
	});
	assert.match(logger.errors[0][0], /Cancel error/u);
});
