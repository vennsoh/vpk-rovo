"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

const {
	SKIP_QUESTION_FALLBACK_TEXT,
	buildConversationHistoryFromMessages,
	createChatSkipQuestionRouter,
	normalizeRequestOrigin,
	registerChatSkipQuestionRoutes,
} = require("./chat-skip-question");

async function withServer(overrides, run) {
	const app = express();
	app.use(express.json());
	const calls = {
		buildQuestionCardSkipNotification: [],
		buildUserMessage: [],
		streamChatViaRovo: [],
	};
	const dependencies = {
		buildQuestionCardSkipNotification: (questionTitle) => {
			calls.buildQuestionCardSkipNotification.push(questionTitle);
			return `[Question Card Dismissed] ${questionTitle || ""}`.trim();
		},
		buildUserMessage: (message, conversationHistory, contextDescription) => {
			calls.buildUserMessage.push({
				message,
				conversationHistory,
				contextDescription,
			});
			return `USER:${message}`;
		},
		createRouteDecision: (data) => ({ type: "data-route-decision", data }),
		logger: {
			error() {},
			info() {},
		},
		streamChatViaRovo: async (options) => {
			calls.streamChatViaRovo.push(options);
			options.onTextDelta("Skipped response");
		},
		...overrides,
	};
	registerChatSkipQuestionRoutes(app, dependencies);

	const server = http.createServer(app);
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	const baseUrl = `http://127.0.0.1:${address.port}`;

	try {
		await run(baseUrl, calls);
	} finally {
		await new Promise((resolve, reject) => {
			server.close((error) => {
				if (error) {
					reject(error);
					return;
				}
				resolve();
			});
		});
	}
}

async function postSkipQuestion(baseUrl, body) {
	const response = await fetch(`${baseUrl}/api/chat-sdk/skip-question`, {
		body: JSON.stringify(body),
		headers: { "content-type": "application/json" },
		method: "POST",
	});
	return {
		body: await response.text(),
		contentType: response.headers.get("content-type") || "",
		status: response.status,
	};
}

test("chat skip-question router validates required dependencies", () => {
	assert.throws(() => createChatSkipQuestionRouter(), /buildQuestionCardSkipNotification/u);
	assert.throws(
		() =>
			createChatSkipQuestionRouter({
				buildQuestionCardSkipNotification: () => "",
			}),
		/buildUserMessage/u,
	);
});

test("normalizeRequestOrigin keeps only voice as a non-text origin", () => {
	assert.equal(normalizeRequestOrigin("voice"), "voice");
	assert.equal(normalizeRequestOrigin(" Voice "), "voice");
	assert.equal(normalizeRequestOrigin("text"), "text");
	assert.equal(normalizeRequestOrigin("other"), "text");
	assert.equal(normalizeRequestOrigin(null), "text");
});

test("buildConversationHistoryFromMessages keeps the last ten visible chat messages", () => {
	const messages = [
		{ role: "system", content: "ignored" },
		{ role: "user", content: "  one  " },
		{ role: "assistant", content: "two" },
		{ role: "tool", content: "ignored" },
		{ role: "user", content: "" },
		...Array.from({ length: 10 }, (_, index) => ({
			role: index % 2 === 0 ? "user" : "assistant",
			content: `message-${index}`,
		})),
	];

	assert.deepEqual(
		buildConversationHistoryFromMessages(messages),
		[
			{ type: "user", content: "message-0" },
			{ type: "assistant", content: "message-1" },
			{ type: "user", content: "message-2" },
			{ type: "assistant", content: "message-3" },
			{ type: "user", content: "message-4" },
			{ type: "assistant", content: "message-5" },
			{ type: "user", content: "message-6" },
			{ type: "assistant", content: "message-7" },
			{ type: "user", content: "message-8" },
			{ type: "assistant", content: "message-9" },
		],
	);
});

test("POST /api/chat-sdk/skip-question streams Rovo output and route decision", async () => {
	await withServer({}, async (baseUrl, calls) => {
		const result = await postSkipQuestion(baseUrl, {
			contextDescription: "Context block",
			messages: [
				{ role: "user", content: "  hello  " },
				{ role: "assistant", content: "Need details" },
				{ role: "tool", content: "ignore" },
			],
			origin: "voice",
			questionTitle: "  Pick scope  ",
			sessionId: "session-1",
		});

		assert.equal(result.status, 200);
		assert.match(result.contentType, /text\/event-stream/iu);
		assert.match(result.body, /"type":"text-start"/u);
		assert.match(result.body, /"type":"text-delta","id":"skip-question-response-\d+","delta":"Skipped response"/u);
		assert.match(result.body, /"type":"data-route-decision","data":\{"intent":"chat","origin":"voice","reason":"intent_clarification_skip"/u);
		assert.match(result.body, /"type":"data-turn-complete"/u);
		assert.deepEqual(calls.buildQuestionCardSkipNotification, ["Pick scope"]);
		assert.deepEqual(calls.buildUserMessage, [
			{
				message: "[Question Card Dismissed] Pick scope",
				conversationHistory: [
					{ type: "user", content: "hello" },
					{ type: "assistant", content: "Need details" },
				],
				contextDescription: "Context block",
			},
		]);
		assert.equal(calls.streamChatViaRovo[0].message, "USER:[Question Card Dismissed] Pick scope");
		assert.equal(calls.streamChatViaRovo[0].sessionId, "session-1");
		assert.equal(calls.streamChatViaRovo[0].conflictPolicy, "wait-for-turn");
	});
});

test("POST /api/chat-sdk/skip-question emits fallback text when Rovo streaming fails", async () => {
	await withServer({
		streamChatViaRovo: async () => {
			throw new Error("Rovo connection failed");
		},
	}, async (baseUrl) => {
		const result = await postSkipQuestion(baseUrl, {
			origin: "unknown",
			questionTitle: "Clarify",
		});

		assert.equal(result.status, 200);
		assert.match(result.body, new RegExp(SKIP_QUESTION_FALLBACK_TEXT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"));
		assert.match(result.body, /"type":"data-route-decision","data":\{"intent":"chat","origin":"text","reason":"intent_clarification_skip"/u);
		assert.match(result.body, /data: \[DONE\]/u);
	});
});

test("POST /api/chat-sdk/skip-question preserves top-level failure response", async () => {
	await withServer({
		buildUserMessage: () => {
			throw new Error("prompt build failed");
		},
	}, async (baseUrl) => {
		const response = await fetch(`${baseUrl}/api/chat-sdk/skip-question`, {
			body: JSON.stringify({}),
			headers: { "content-type": "application/json" },
			method: "POST",
		});

		assert.equal(response.status, 500);
		assert.deepEqual(await response.json(), {
			error: "Failed to process question skip notification",
			details: "prompt build failed",
		});
	});
});
