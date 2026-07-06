"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { createPreferredBackendResolver } = require("./chat-backend-selection");

test("createPreferredBackendResolver validates required dependencies", () => {
	assert.throws(
		() => createPreferredBackendResolver(),
		/createPreferredBackendResolver requires isRovoAvailable/u,
	);
});

test("AI Gateway preference bypasses Rovo availability checks", async () => {
	let availabilityChecks = 0;
	const resolvePreferredBackend = createPreferredBackendResolver({
		isRovoAvailable: async () => {
			availabilityChecks += 1;
			return true;
		},
	});

	assert.deepEqual(
		await resolvePreferredBackend({ backendPreference: "ai-gateway" }),
		{
			backend: "ai-gateway",
			rovoAvailable: false,
		},
	);
	assert.equal(availabilityChecks, 0);
});

test("Rovo preference resolves to Rovo when available", async () => {
	const resolvePreferredBackend = createPreferredBackendResolver({
		isRovoAvailable: async () => true,
	});

	assert.deepEqual(
		await resolvePreferredBackend({ backendPreference: "rovo" }),
		{
			backend: "rovo",
			rovoAvailable: true,
		},
	);
});

test("Rovo preference resolves to no backend when unavailable", async () => {
	const resolvePreferredBackend = createPreferredBackendResolver({
		isRovoAvailable: async () => false,
	});

	assert.deepEqual(
		await resolvePreferredBackend(),
		{
			backend: null,
			rovoAvailable: false,
		},
	);
});
