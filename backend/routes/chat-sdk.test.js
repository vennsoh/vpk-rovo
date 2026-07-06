"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

const {
	createChatSdkRouter,
	registerChatSdkRoutes,
} = require("./chat-sdk");

async function withServer(dependencies, run) {
	const app = express();
	app.use(express.json());
	const calls = {
		handleChatSdkRequest: [],
	};

	registerChatSdkRoutes(app, {
		handleChatSdkRequest: async (req, res) => {
			calls.handleChatSdkRequest.push({
				body: req.body,
				path: req.path,
			});
			res.status(202).json({
				ok: true,
				messageCount: Array.isArray(req.body?.messages) ? req.body.messages.length : 0,
			});
		},
		...dependencies,
	});

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

async function postJson(baseUrl, path, body) {
	const response = await fetch(`${baseUrl}${path}`, {
		body: JSON.stringify(body),
		headers: { "content-type": "application/json" },
		method: "POST",
	});
	return {
		body: await response.json(),
		status: response.status,
	};
}

test("chat sdk router validates required dependencies", () => {
	assert.throws(() => createChatSdkRouter(), /handleChatSdkRequest/u);
});

test("POST /api/chat-sdk delegates to the chat SDK handler", async () => {
	await withServer({}, async (baseUrl, calls) => {
		const result = await postJson(baseUrl, "/api/chat-sdk", {
			messages: [
				{ role: "user", content: "Hello" },
				{ role: "assistant", content: "Hi" },
			],
		});

		assert.equal(result.status, 202);
		assert.deepEqual(result.body, {
			ok: true,
			messageCount: 2,
		});
		assert.deepEqual(calls.handleChatSdkRequest, [
			{
				body: {
					messages: [
						{ role: "user", content: "Hello" },
						{ role: "assistant", content: "Hi" },
					],
				},
				path: "/chat-sdk",
			},
		]);
	});
});
