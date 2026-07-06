const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildGoogleCalendarDateContext,
	normalizeClientTimeZone,
} = require("./date-context");

test("normalizeClientTimeZone returns trimmed valid IANA timezone names", () => {
	assert.equal(normalizeClientTimeZone(" Australia/Sydney "), "Australia/Sydney");
	assert.equal(normalizeClientTimeZone("UTC"), "UTC");
});

test("normalizeClientTimeZone rejects empty, overlong, and invalid values", () => {
	assert.equal(normalizeClientTimeZone(""), null);
	assert.equal(normalizeClientTimeZone(" ".repeat(4)), null);
	assert.equal(normalizeClientTimeZone("A".repeat(101)), null);
	assert.equal(normalizeClientTimeZone("Mars/Base"), null);
	assert.equal(normalizeClientTimeZone(null), null);
});

test("buildGoogleCalendarDateContext includes deterministic UTC timestamp and timezone", () => {
	assert.equal(
		buildGoogleCalendarDateContext("Australia/Sydney", {
			now: new Date("2026-07-05T01:02:03.456Z"),
		}),
		[
			"[Google Calendar Date Context]",
			"Current UTC timestamp: 2026-07-05T01:02:03Z",
			"User timezone: Australia/Sydney",
			"Interpret relative date phrases in the user's timezone when available, then convert `timeMin` and `timeMax` to strict UTC ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`).",
			"[End Google Calendar Date Context]",
		].join("\n"),
	);
});

test("buildGoogleCalendarDateContext marks timezone unavailable when missing", () => {
	assert.match(
		buildGoogleCalendarDateContext(null, {
			now: new Date("2026-07-05T01:02:03.456Z"),
		}),
		/User timezone: unavailable/u,
	);
});
