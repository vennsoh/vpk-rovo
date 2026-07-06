"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

const {
	REALTIME_AUDIO_CONVERSATION_SCOPE,
	createRealtimeRouter,
	registerRealtimeRoutes,
} = require("./realtime");

async function withServer(dependencies, run) {
	const app = express();
	const calls = {
		createRuntimeSocketToken: [],
	};

	registerRealtimeRoutes(app, {
		createRuntimeSocketToken: (scope) => {
			calls.createRuntimeSocketToken.push(scope);
			return "runtime-token";
		},
		requireRuntimeSocketTokenRequester: (_req, _res, next) => next(),
		runtimeSocketTokenTtlMs: 60_000,
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

async function getJson(baseUrl, path) {
	const response = await fetch(`${baseUrl}${path}`);
	return {
		body: await response.json(),
		status: response.status,
	};
}

test("realtime router validates required dependencies", () => {
	assert.throws(() => createRealtimeRouter(), /createRuntimeSocketToken/u);
	assert.throws(
		() =>
			createRealtimeRouter({
				createRuntimeSocketToken: () => "token",
			}),
		/requireRuntimeSocketTokenRequester/u,
	);
	assert.throws(
		() =>
			createRealtimeRouter({
				createRuntimeSocketToken: () => "token",
				requireRuntimeSocketTokenRequester: (_req, _res, next) => next(),
			}),
		/runtimeSocketTokenTtlMs/u,
	);
});

test("GET /api/realtime/audio-conversation-token mints a scoped runtime socket token", async () => {
	await withServer({}, async (baseUrl, calls) => {
		const result = await getJson(baseUrl, "/api/realtime/audio-conversation-token");

		assert.equal(result.status, 200);
		assert.deepEqual(result.body, {
			token: "runtime-token",
			expiresInMs: 60_000,
		});
		assert.deepEqual(calls.createRuntimeSocketToken, [
			REALTIME_AUDIO_CONVERSATION_SCOPE,
		]);
	});
});

test("GET /api/realtime/audio-conversation-token preserves null token response shape", async () => {
	await withServer({
		createRuntimeSocketToken: (scope) => {
			assert.equal(scope, REALTIME_AUDIO_CONVERSATION_SCOPE);
			return "";
		},
	}, async (baseUrl) => {
		const result = await getJson(baseUrl, "/api/realtime/audio-conversation-token");

		assert.equal(result.status, 200);
		assert.deepEqual(result.body, {
			token: null,
			expiresInMs: 0,
		});
	});
});

test("GET /api/realtime/audio-conversation-token respects the runtime socket origin gate", async () => {
	await withServer({
		createRuntimeSocketToken: () => {
			throw new Error("should not mint token");
		},
		requireRuntimeSocketTokenRequester: (_req, res) => {
			res.status(403).json({
				error: "Runtime socket token origin is not allowed",
			});
		},
	}, async (baseUrl, calls) => {
		const result = await getJson(baseUrl, "/api/realtime/audio-conversation-token");

		assert.equal(result.status, 403);
		assert.deepEqual(result.body, {
			error: "Runtime socket token origin is not allowed",
		});
		assert.deepEqual(calls.createRuntimeSocketToken, []);
	});
});
