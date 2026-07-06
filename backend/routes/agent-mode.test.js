"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

const {
	createAgentModeRouter,
	isRovoConnectionFailure,
	registerAgentModeRoutes,
} = require("./agent-mode");

async function withServer(overrides, run) {
	const app = express();
	app.use(express.json());
	const calls = {
		getAgentMode: 0,
		isRovoAvailable: 0,
		setAgentMode: [],
	};
	const dependencies = {
		createRovoUnavailableError: () => new Error("Rovo Serve is unavailable"),
		getAgentMode: async () => {
			calls.getAgentMode += 1;
			return { mode: "ask", message: "Agent mode is ask" };
		},
		isRovoAvailable: async () => {
			calls.isRovoAvailable += 1;
			return true;
		},
		logger: {
			error() {},
			info() {},
		},
		setAgentMode: async (port, mode) => {
			calls.setAgentMode.push({ port, mode });
			return { mode, message: `Agent mode changed to ${mode}` };
		},
		...overrides,
	};
	registerAgentModeRoutes(app, dependencies);

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

test("agent mode router validates required dependencies", () => {
	assert.throws(() => createAgentModeRouter(), /createRovoUnavailableError/u);
	assert.throws(
		() => createAgentModeRouter({
			createRovoUnavailableError: () => new Error("missing"),
		}),
		/getAgentMode/u,
	);
});

test("isRovoConnectionFailure preserves connection failure detection", () => {
	assert.equal(isRovoConnectionFailure(new Error("Rovo connection failed")), true);
	assert.equal(isRovoConnectionFailure(new Error("connect ECONNREFUSED 127.0.0.1")), true);
	assert.equal(isRovoConnectionFailure(new Error("Request timed out")), true);
	assert.equal(isRovoConnectionFailure(new Error("status 500")), false);
});

test("POST /api/agent-mode validates mode payloads", async () => {
	await withServer({}, async (baseUrl, calls) => {
		const missing = await postJson(baseUrl, "/api/agent-mode", {});
		assert.equal(missing.status, 400);
		assert.deepEqual(missing.body, {
			error: "mode is required (default, ask, or plan)",
		});

		const invalid = await postJson(baseUrl, "/api/agent-mode", { mode: "review" });
		assert.equal(invalid.status, 400);
		assert.deepEqual(invalid.body, {
			error: "Invalid mode: review. Must be one of: default, ask, plan",
		});
		assert.deepEqual(calls.setAgentMode, []);
	});
});

test("POST /api/agent-mode returns unavailable when Rovo is down", async () => {
	await withServer({
		isRovoAvailable: async () => false,
	}, async (baseUrl, calls) => {
		const result = await postJson(baseUrl, "/api/agent-mode", { mode: "plan" });

		assert.equal(result.status, 503);
		assert.deepEqual(result.body, {
			error: "Rovo Serve is required but not available",
			details: "Rovo Serve is unavailable",
		});
		assert.deepEqual(calls.setAgentMode, []);
	});
});

test("POST /api/agent-mode sets a valid mode through Rovo", async () => {
	await withServer({}, async (baseUrl, calls) => {
		const result = await postJson(baseUrl, "/api/agent-mode", { mode: "ask" });

		assert.equal(result.status, 200);
		assert.deepEqual(result.body, {
			mode: "ask",
			message: "Agent mode changed to ask",
		});
		assert.deepEqual(calls.setAgentMode, [{ port: undefined, mode: "ask" }]);
	});
});

test("GET /api/agent-mode returns default when Rovo is unavailable", async () => {
	await withServer({
		isRovoAvailable: async () => false,
	}, async (baseUrl, calls) => {
		const result = await getJson(baseUrl, "/api/agent-mode");

		assert.equal(result.status, 200);
		assert.deepEqual(result.body, {
			mode: "default",
			message: "Rovo Serve is not available; default agent mode assumed",
		});
		assert.equal(calls.getAgentMode, 0);
	});
});

test("GET /api/agent-mode returns the Rovo mode when available", async () => {
	await withServer({}, async (baseUrl, calls) => {
		const result = await getJson(baseUrl, "/api/agent-mode");

		assert.equal(result.status, 200);
		assert.deepEqual(result.body, {
			mode: "ask",
			message: "Agent mode is ask",
		});
		assert.equal(calls.getAgentMode, 1);
	});
});

test("GET /api/agent-mode falls back for unsupported Rovo versions", async () => {
	await withServer({
		getAgentMode: async () => {
			throw new Error("Get agent mode failed (status 404): Not Found");
		},
	}, async (baseUrl) => {
		const result = await getJson(baseUrl, "/api/agent-mode");

		assert.equal(result.status, 200);
		assert.deepEqual(result.body, {
			mode: "default",
			message: "Agent mode not supported by this Rovo version",
		});
	});
});

test("GET /api/agent-mode falls back for Rovo connection failures", async () => {
	await withServer({
		getAgentMode: async () => {
			throw new Error("connect ECONNREFUSED 127.0.0.1");
		},
	}, async (baseUrl) => {
		const result = await getJson(baseUrl, "/api/agent-mode");

		assert.equal(result.status, 200);
		assert.deepEqual(result.body, {
			mode: "default",
			message: "Rovo Serve is not available; default agent mode assumed",
		});
	});
});

test("agent mode routes preserve generic failure responses", async () => {
	await withServer({
		getAgentMode: async () => {
			throw new Error("mode service failed");
		},
		setAgentMode: async () => {
			throw new Error("set failed");
		},
	}, async (baseUrl) => {
		const getResult = await getJson(baseUrl, "/api/agent-mode");
		assert.equal(getResult.status, 500);
		assert.deepEqual(getResult.body, { error: "mode service failed" });

		const postResult = await postJson(baseUrl, "/api/agent-mode", { mode: "plan" });
		assert.equal(postResult.status, 500);
		assert.deepEqual(postResult.body, { error: "set failed" });
	});
});
