"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

const {
	createRovoChatProxyRouter,
	registerRovoChatProxyRoutes,
} = require("./rovo-chat-proxy");

async function withServer(dependencies, run) {
	const app = express();
	app.use(express.json());
	const calls = {
		errors: [],
		proxy: [],
		sendGatewayErrorResponse: [],
	};

	registerRovoChatProxyRoutes(app, {
		logger: {
			error: (...args) => calls.errors.push(args),
		},
		proxyRovoAppChatRequest: async (req, res) => {
			calls.proxy.push({
				body: req.body,
				path: req.path,
			});
			res.status(202).json({
				ok: true,
				threadId: req.body?.id,
			});
		},
		sendGatewayErrorResponse: (res, error, fallbackMessage) => {
			calls.sendGatewayErrorResponse.push({ error, fallbackMessage });
			return res.status(503).json({
				error: fallbackMessage,
				details: error instanceof Error ? error.message : String(error),
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

test("rovo chat proxy router validates required dependencies", () => {
	assert.throws(() => createRovoChatProxyRouter(), /proxyRovoAppChatRequest/u);
	assert.throws(
		() =>
			createRovoChatProxyRouter({
				proxyRovoAppChatRequest: async () => {},
			}),
		/sendGatewayErrorResponse/u,
	);
});

test("POST /api/rovo/chat delegates to the Rovo app chat proxy", async () => {
	await withServer({}, async (baseUrl, calls) => {
		const result = await postJson(baseUrl, "/api/rovo/chat", {
			id: "thread-123",
			messages: [{ role: "user", content: "Hello" }],
		});

		assert.equal(result.status, 202);
		assert.deepEqual(result.body, {
			ok: true,
			threadId: "thread-123",
		});
		assert.equal(calls.proxy.length, 1);
		assert.deepEqual(calls.proxy[0], {
			body: {
				id: "thread-123",
				messages: [{ role: "user", content: "Hello" }],
			},
			path: "/rovo/chat",
		});
		assert.deepEqual(calls.errors, []);
	});
});

test("POST /api/rovo/chat maps proxy failures through the gateway error response", async () => {
	const proxyError = new Error("Rovo stream failed");
	await withServer({
		proxyRovoAppChatRequest: async () => {
			throw proxyError;
		},
	}, async (baseUrl, calls) => {
		const result = await postJson(baseUrl, "/api/rovo/chat", {
			id: "thread-failed",
		});

		assert.equal(result.status, 503);
		assert.deepEqual(result.body, {
			error: "Failed to stream Rovo response",
			details: "Rovo stream failed",
		});
		assert.equal(calls.errors.length, 1);
		assert.equal(calls.errors[0][0], "[FUTURE-CHAT] Chat proxy failed:");
		assert.equal(calls.errors[0][1], proxyError);
		assert.deepEqual(calls.sendGatewayErrorResponse, [
			{
				error: proxyError,
				fallbackMessage: "Failed to stream Rovo response",
			},
		]);
	});
});
