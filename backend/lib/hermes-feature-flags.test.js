"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	areHermesCompanionsEnabled,
	areHermesJobsEnabled,
	parseOptionalBoolean,
} = require("./hermes-feature-flags");

test("parseOptionalBoolean preserves existing true values", () => {
	assert.equal(parseOptionalBoolean(true), true);
	assert.equal(parseOptionalBoolean("true"), true);
	assert.equal(parseOptionalBoolean(1), true);
	assert.equal(parseOptionalBoolean("1"), true);
});

test("parseOptionalBoolean preserves existing false values", () => {
	assert.equal(parseOptionalBoolean(false), false);
	assert.equal(parseOptionalBoolean("false"), false);
	assert.equal(parseOptionalBoolean(0), false);
	assert.equal(parseOptionalBoolean("0"), false);
});

test("parseOptionalBoolean returns null for unspecified or unsupported values", () => {
	assert.equal(parseOptionalBoolean(undefined), null);
	assert.equal(parseOptionalBoolean(null), null);
	assert.equal(parseOptionalBoolean("TRUE"), null);
	assert.equal(parseOptionalBoolean("yes"), null);
	assert.equal(parseOptionalBoolean(""), null);
});

test("Hermes companion flag remains opt-in", () => {
	assert.equal(areHermesCompanionsEnabled({ env: {} }), false);
	assert.equal(areHermesCompanionsEnabled({ env: { HERMES_COMPANIONS_ENABLED: "false" } }), false);
	assert.equal(areHermesCompanionsEnabled({ env: { HERMES_COMPANIONS_ENABLED: "1" } }), true);
});

test("Hermes jobs flag remains opt-in", () => {
	assert.equal(areHermesJobsEnabled({ env: {} }), false);
	assert.equal(areHermesJobsEnabled({ env: { HERMES_JOBS_ENABLED: "0" } }), false);
	assert.equal(areHermesJobsEnabled({ env: { HERMES_JOBS_ENABLED: true } }), true);
});
