"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	resolveRovoChatInProgressTimeoutRecovery,
	resolveRovoPortStuckRecovery,
} = require("./rovo-recovery-decisions");

test("resolveRovoPortStuckRecovery returns retry action after recovered restart", async () => {
	const logs = [];
	const result = await resolveRovoPortStuckRecovery({
		attemptCount: 0,
		maxAttempts: 1,
		recoveryPort: 4301,
		restartOptions: { timeoutMs: 100 },
		restartRovoPort: async (options) => ({
			activePids: [123],
			killedPids: [122],
			options,
			recovered: true,
		}),
		shouldRetryInteractiveStuckPortRecovery: ({ recovered }) => recovered,
		logger: {
			info: (message, data) => logs.push({ message, data }),
			error: () => {},
		},
	});

	assert.equal(result.action, "retry");
	assert.equal(result.nextAttemptCount, 1);
	assert.deepEqual(result.statusParts, [
		{
			type: "data-thinking-status",
			data: {
				label: "Recovered stuck port, retrying",
				content: "Rovo port 4301 restarted successfully.",
				activity: "results",
				source: "backend",
			},
		},
	]);
	assert.equal(result.recoveryResult.options.port, 4301);
	assert.equal(result.recoveryResult.options.timeoutMs, 100);
	assert.equal(logs[0].message, "[CHAT-SDK] Port stuck recovery result");
});

test("resolveRovoPortStuckRecovery returns failure text and status after failed restart", async () => {
	const result = await resolveRovoPortStuckRecovery({
		attemptCount: 1,
		buildInteractiveStuckPortFailureMessage: ({ recoveryError, retriedRecovery }) =>
			`failed:${recoveryError}:${retriedRecovery}`,
		maxAttempts: 1,
		recoveryPort: 4301,
		restartRovoPort: async () => ({
			error: "still stuck",
			recovered: false,
		}),
		shouldRetryInteractiveStuckPortRecovery: () => false,
		logger: {
			info: () => {},
			error: () => {},
		},
	});

	assert.equal(result.action, "fail");
	assert.equal(result.nextAttemptCount, 1);
	assert.equal(result.failureText, "failed:still stuck:false");
	assert.deepEqual(result.statusParts, [
		{
			type: "data-thinking-status",
			data: {
				label: "Port recovery failed",
				content: "still stuck",
				activity: "results",
				source: "backend",
			},
		},
	]);
});

test("resolveRovoChatInProgressTimeoutRecovery returns retry after forced recovery", async () => {
	const result = await resolveRovoChatInProgressTimeoutRecovery({
		attemptCount: 0,
		maxAttempts: 1,
		resolvedRecoveryPort: 4302,
		restartOptions: { timeoutMs: 200 },
		restartRovoPort: async (options) => ({
			options,
			recovered: true,
		}),
		logger: {
			info: () => {},
		},
	});

	assert.equal(result.action, "retry");
	assert.equal(result.nextAttemptCount, 1);
	assert.equal(result.recoveryResult.options.port, 4302);
	assert.deepEqual(result.statusParts, [
		{
			type: "data-thinking-status",
			data: {
				label: "Recovered stuck port, retrying",
				content: "Rovo port 4302 restarted successfully.",
				activity: "results",
				source: "backend",
			},
		},
	]);
});

test("resolveRovoChatInProgressTimeoutRecovery returns timeout status after failed recovery", async () => {
	const result = await resolveRovoChatInProgressTimeoutRecovery({
		attemptCount: 0,
		maxAttempts: 1,
		resolvedRecoveryPort: 4302,
		restartRovoPort: async () => ({
			error: "",
			recovered: false,
		}),
		logger: {
			info: () => {},
		},
	});

	assert.equal(result.action, "timeout");
	assert.equal(result.nextAttemptCount, 1);
	assert.deepEqual(result.statusParts, [
		{
			type: "data-thinking-status",
			data: {
				label: "Port recovery failed",
				content: "Failed to recover Rovo port 4302.",
				activity: "results",
				source: "backend",
			},
		},
		{
			type: "data-thinking-status",
			data: {
				label: "Rovo turn wait timed out",
				content:
					"Automatic recovery timed out while waiting for the previous turn to clear.",
				activity: "results",
				source: "backend",
			},
		},
	]);
	assert.equal(
		result.textDelta,
		"Automatic recovery timed out while waiting for the previous turn. Please retry or reset the chat.",
	);
});
