"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildSseEventError,
	buildWarningEvent,
	getSseEventMessage,
	parseSseEventPayload,
} = require("./rovo-gateway-sse-events");

test("parseSseEventPayload returns object payloads only", () => {
	assert.deepEqual(parseSseEventPayload('{"message":"hello"}'), {
		message: "hello",
	});
	assert.equal(parseSseEventPayload("not-json"), null);
	assert.equal(parseSseEventPayload(""), null);
});

test("getSseEventMessage prefers structured message fields", () => {
	assert.equal(
		getSseEventMessage("warning", "raw fallback", { message: " structured " }),
		"structured"
	);
	assert.equal(
		getSseEventMessage("warning", "raw fallback", { error: " error text " }),
		"error text"
	);
	assert.equal(
		getSseEventMessage("warning", "raw fallback", { title: " title text " }),
		"title text"
	);
	assert.equal(getSseEventMessage("warning", " raw fallback ", null), "raw fallback");
	assert.equal(
		getSseEventMessage("warning", "", null),
		"Rovo warning event received"
	);
});

test("buildSseEventError preserves metadata and raw data", () => {
	const error = buildSseEventError(
		"exception",
		'{"title":"Failure","type":"server"}',
		{
			title: "Failure",
			type: "server",
		}
	);

	assert.equal(error.message, "Failure");
	assert.equal(error.eventName, "exception");
	assert.equal(error.title, "Failure");
	assert.equal(error.type, "server");
	assert.equal(error.rawData, '{"title":"Failure","type":"server"}');
});

test("buildWarningEvent preserves parsed payload metadata", () => {
	const warningEvent = buildWarningEvent(
		"warning",
		'{"title":"Careful","message":"Heads up"}',
		{
			title: "Careful",
			message: "Heads up",
		}
	);

	assert.deepEqual(warningEvent, {
		eventName: "warning",
		message: "Heads up",
		rawData: '{"title":"Careful","message":"Heads up"}',
		title: "Careful",
		payload: {
			title: "Careful",
			message: "Heads up",
		},
	});
});
