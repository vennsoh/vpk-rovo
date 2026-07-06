"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	isChatInProgressError,
	retryChatInProgress,
	shouldCancelConflictingTurn,
} = require("./rovo-gateway-conflict-retry");

test("isChatInProgressError detects Rovo 409 conflicts from structured metadata", () => {
	assert.equal(
		isChatInProgressError({
			status: 409,
			endpoint: "/v3/stream_chat",
			message: "Conflict",
		}),
		true
	);
});

test("isChatInProgressError does not match unrelated 409 responses", () => {
	assert.equal(
		isChatInProgressError({
			status: 409,
			endpoint: "/v3/other",
			message: "Conflict",
		}),
		false
	);
});

test("shouldCancelConflictingTurn honors cancel grace threshold", () => {
	assert.equal(
		shouldCancelConflictingTurn({
			cancelOnConflict: true,
			cancelAfterMs: 5000,
			elapsedMs: 4999,
		}),
		false
	);
	assert.equal(
		shouldCancelConflictingTurn({
			cancelOnConflict: true,
			cancelAfterMs: 5000,
			elapsedMs: 5000,
		}),
		true
	);
	assert.equal(
		shouldCancelConflictingTurn({
			cancelOnConflict: false,
			cancelAfterMs: 0,
			elapsedMs: 50_000,
		}),
		false
	);
});

test("retryChatInProgress waits before cancellation and then cancels after threshold", async () => {
	let attempts = 0;
	let cancelCalls = 0;
	const retryProgress = [];

	const { value, aborted } = await retryChatInProgress(
		async () => {
			attempts += 1;
			if (attempts <= 4) {
				const conflictError = new Error("chat already in progress");
				conflictError.status = 409;
				conflictError.endpoint = "/v3/stream_chat";
				throw conflictError;
			}
			return "ok";
		},
		{
			logPrefix: "retryChatInProgress.test",
			timeoutMs: 4000,
			cancelOnConflict: true,
			cancelAfterMs: 700,
			cancelConflictTurn: async () => {
				cancelCalls += 1;
			},
			onRetryProgress: (status) => {
				retryProgress.push(status);
			},
		}
	);

	assert.equal(aborted, false);
	assert.equal(value, "ok");
	assert.ok(retryProgress.some((status) => status?.willCancel === false));
	assert.ok(retryProgress.some((status) => status?.willCancel === true));
	assert.ok(cancelCalls >= 1);
});

test("retryChatInProgress does not cancel when cancelOnConflict is disabled", async () => {
	let attempts = 0;
	let cancelCalls = 0;
	const retryProgress = [];

	const { value, aborted } = await retryChatInProgress(
		async () => {
			attempts += 1;
			if (attempts <= 2) {
				const conflictError = new Error("chat already in progress");
				conflictError.status = 409;
				conflictError.endpoint = "/v3/stream_chat";
				throw conflictError;
			}
			return "ok";
		},
		{
			logPrefix: "retryChatInProgress.test.no-cancel",
			timeoutMs: 2000,
			cancelOnConflict: false,
			cancelAfterMs: 0,
			cancelConflictTurn: async () => {
				cancelCalls += 1;
			},
			onRetryProgress: (status) => {
				retryProgress.push(status);
			},
		}
	);

	assert.equal(aborted, false);
	assert.equal(value, "ok");
	assert.equal(cancelCalls, 0);
	assert.ok(retryProgress.every((status) => status?.willCancel === false));
});

test("retryChatInProgress throttles consecutive cancel calls by cancelMinIntervalMs", async () => {
	let attempts = 0;
	const cancelTimestamps = [];

	await retryChatInProgress(
		async () => {
			attempts += 1;
			if (attempts <= 6) {
				const conflictError = new Error("chat already in progress");
				conflictError.status = 409;
				conflictError.endpoint = "/v3/stream_chat";
				throw conflictError;
			}
			return "ok";
		},
		{
			logPrefix: "retryChatInProgress.test.throttle",
			timeoutMs: 8000,
			cancelOnConflict: true,
			cancelAfterMs: 0,
			cancelMinIntervalMs: 500,
			cancelConflictTurn: async () => {
				cancelTimestamps.push(Date.now());
			},
		}
	);

	assert.ok(cancelTimestamps.length >= 2, "expected at least 2 cancel calls");
	for (let i = 1; i < cancelTimestamps.length; i++) {
		const gap = cancelTimestamps[i] - cancelTimestamps[i - 1];
		assert.ok(gap >= 400, `cancel gap ${gap}ms was shorter than throttle interval`);
	}
});
