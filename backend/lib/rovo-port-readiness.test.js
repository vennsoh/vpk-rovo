"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	DEFAULT_POST_STREAM_COOLDOWN_MS,
	DEFAULT_READY_PROBE_INTERVAL_MS,
	DEFAULT_READY_PROBE_MAX_ATTEMPTS,
	createRovoPortReadinessWaiter,
} = require("./rovo-port-readiness");

test("createRovoPortReadinessWaiter validates required dependencies", () => {
	assert.throws(() => createRovoPortReadinessWaiter(), /classifyHealthCheck/u);
	assert.throws(() => createRovoPortReadinessWaiter({
		classifyHealthCheck: () => ({}),
	}), /healthCheck/u);
	assert.throws(() => createRovoPortReadinessWaiter({
		classifyHealthCheck: () => ({}),
		healthCheck: async () => ({}),
		sleepFn: null,
	}), /sleepFn/u);
});

test("waitForPortReady waits the post-stream cooldown before probing", async () => {
	const sleeps = [];
	const healthChecks = [];
	const waitForPortReady = createRovoPortReadinessWaiter({
		classifyHealthCheck: () => ({ ready: true }),
		healthCheck: async (port) => {
			healthChecks.push(port);
			return { status: "healthy" };
		},
		sleepFn: async (ms) => {
			sleeps.push(ms);
		},
	});

	await waitForPortReady(9001);

	assert.deepEqual(sleeps, [DEFAULT_POST_STREAM_COOLDOWN_MS]);
	assert.deepEqual(healthChecks, [9001]);
});

test("waitForPortReady preserves terminal health metadata", async () => {
	const waitForPortReady = createRovoPortReadinessWaiter({
		classifyHealthCheck: () => ({
			detail: { review: true },
			message: "pending review",
			reason: "review-required",
			status: "blocked",
			terminal: true,
		}),
		healthCheck: async () => ({ status: "blocked" }),
		sleepFn: async () => {},
	});

	await assert.rejects(
		() => waitForPortReady(9002),
		(error) => {
			assert.equal(error.message, "Port 9002 is not ready: pending review");
			assert.equal(error.healthStatus, "blocked");
			assert.equal(error.healthReason, "review-required");
			assert.deepEqual(error.healthDetail, { review: true });
			return true;
		},
	);
});

test("waitForPortReady sleeps between thrown health-check failures", async () => {
	const sleeps = [];
	let attempts = 0;
	const waitForPortReady = createRovoPortReadinessWaiter({
		classifyHealthCheck: () => ({ ready: true }),
		healthCheck: async () => {
			attempts += 1;
			if (attempts === 1) {
				throw new Error("connection refused");
			}
			return { status: "healthy" };
		},
		sleepFn: async (ms) => {
			sleeps.push(ms);
		},
	});

	await waitForPortReady(9003);

	assert.deepEqual(sleeps, [
		DEFAULT_POST_STREAM_COOLDOWN_MS,
		DEFAULT_READY_PROBE_INTERVAL_MS,
	]);
	assert.equal(attempts, 2);
});

test("waitForPortReady preserves retryable health behavior", async () => {
	const sleeps = [];
	let attempts = 0;
	const waitForPortReady = createRovoPortReadinessWaiter({
		classifyHealthCheck: () => {
			attempts += 1;
			return attempts === 1 ? { ready: false, terminal: false } : { ready: true };
		},
		healthCheck: async () => ({ status: "starting" }),
		sleepFn: async (ms) => {
			sleeps.push(ms);
		},
	});

	await waitForPortReady(9004);

	assert.deepEqual(sleeps, [DEFAULT_POST_STREAM_COOLDOWN_MS]);
	assert.equal(attempts, 2);
});

test("waitForPortReady reports exhausted probe attempts", async () => {
	const waitForPortReady = createRovoPortReadinessWaiter({
		classifyHealthCheck: () => ({ ready: false, terminal: false }),
		healthCheck: async () => ({ status: "starting" }),
		maxAttempts: 2,
		sleepFn: async () => {},
	});

	await assert.rejects(
		() => waitForPortReady(9005),
		/Port 9005 did not become ready after 2 probes/u,
	);
});

test("default readiness constants preserve server probe policy", () => {
	assert.equal(DEFAULT_POST_STREAM_COOLDOWN_MS, 500);
	assert.equal(DEFAULT_READY_PROBE_INTERVAL_MS, 100);
	assert.equal(DEFAULT_READY_PROBE_MAX_ATTEMPTS, 20);
});
