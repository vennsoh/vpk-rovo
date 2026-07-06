const assert = require("node:assert/strict");
const test = require("node:test");

const {
	extractClassifierJsonCandidate,
	isClassifierIntentLeakCandidate,
	parseClassifierIntentPayload,
	safeJsonParse,
} = require("./classifier-intent");

test("safeJsonParse returns parsed JSON or null", () => {
	assert.deepEqual(safeJsonParse('{"ok":true}'), { ok: true });
	assert.equal(safeJsonParse("{not-json"), null);
	assert.equal(safeJsonParse({ ok: true }), null);
});

test("extractClassifierJsonCandidate accepts fenced and plain object JSON only", () => {
	assert.equal(
		extractClassifierJsonCandidate('```json\n{"intent":"genui"}\n```'),
		'{"intent":"genui"}',
	);
	assert.equal(
		extractClassifierJsonCandidate('{"intent":"audio"}'),
		'{"intent":"audio"}',
	);
	assert.equal(extractClassifierJsonCandidate('prefix {"intent":"audio"}'), null);
	assert.equal(extractClassifierJsonCandidate(""), null);
});

test("parseClassifierIntentPayload normalizes supported classifier payloads", () => {
	assert.deepEqual(
		parseClassifierIntentPayload('{"intent":"GENUI","confidence":0.75,"reason":" Looks visual "}'),
		{
			intent: "genui",
			confidence: 0.75,
			reason: "Looks visual",
		},
	);
	assert.deepEqual(
		parseClassifierIntentPayload('```json\n{"intent":"normal"}\n```'),
		{
			intent: "normal",
			confidence: null,
			reason: null,
		},
	);
});

test("parseClassifierIntentPayload rejects unsupported or leaky payloads", () => {
	assert.equal(parseClassifierIntentPayload('{"confidence":0.5}'), null);
	assert.equal(parseClassifierIntentPayload('{"intent":"search"}'), null);
	assert.equal(parseClassifierIntentPayload('{"intent":"image","confidence":2}'), null);
	assert.equal(parseClassifierIntentPayload('{"intent":"audio","reason":"   "}'), null);
	assert.equal(parseClassifierIntentPayload('{"intent":"genui","extra":true}'), null);
	assert.equal(parseClassifierIntentPayload("[]"), null);
});

test("isClassifierIntentLeakCandidate detects JSON-looking text", () => {
	assert.equal(isClassifierIntentLeakCandidate('  {"intent":"genui"}'), true);
	assert.equal(isClassifierIntentLeakCandidate("```json\n{}\n```"), true);
	assert.equal(isClassifierIntentLeakCandidate("plain assistant text"), false);
	assert.equal(isClassifierIntentLeakCandidate(null), false);
});
