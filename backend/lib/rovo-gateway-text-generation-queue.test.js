"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createTextGenerationQueue,
} = require("./rovo-gateway-text-generation-queue");

test("text generation queue serializes operations in submission order", async () => {
	const { enqueueTextGeneration } = createTextGenerationQueue();
	const events = [];
	let releaseFirst;
	const firstGate = new Promise((resolve) => {
		releaseFirst = resolve;
	});

	const first = enqueueTextGeneration(async () => {
		events.push("first:start");
		await firstGate;
		events.push("first:end");
		return "first";
	}, { logPrefix: "queue.test" });
	const second = enqueueTextGeneration(async () => {
		events.push("second:start");
		return "second";
	}, { logPrefix: "queue.test" });

	await Promise.resolve();
	assert.deepEqual(events, ["first:start"]);

	releaseFirst();
	assert.equal(await first, "first");
	assert.equal(await second, "second");
	assert.deepEqual(events, ["first:start", "first:end", "second:start"]);
});

test("text generation queue continues after a failed operation", async () => {
	const { enqueueTextGeneration } = createTextGenerationQueue();
	const events = [];
	const first = enqueueTextGeneration(async () => {
		events.push("first:start");
		throw new Error("boom");
	}, { logPrefix: "queue.test.failure" });
	const second = enqueueTextGeneration(async () => {
		events.push("second:start");
		return "second";
	}, { logPrefix: "queue.test.failure" });

	await assert.rejects(first, /boom/);
	assert.equal(await second, "second");
	assert.deepEqual(events, ["first:start", "second:start"]);
});
