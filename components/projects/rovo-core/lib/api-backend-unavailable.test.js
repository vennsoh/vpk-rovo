const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const API_SOURCE = fs.readFileSync(path.join(__dirname, "api.ts"), "utf8");

// Regression: a backend-down stream surfaced a bare "fetch failed" in the
// composer because isRovoAppBackendUnavailableError only matched the proxy's
// normalized "Cannot connect to backend server" string. Raw transport network
// errors must also resolve to the actionable "start the backend" hint.
test("api treats raw network failures as backend-unavailable", () => {
	assert.match(API_SOURCE, /ROVO_APP_NETWORK_FAILURE_MESSAGES/u);
	assert.match(API_SOURCE, /"fetch failed"/u);
	assert.match(API_SOURCE, /"failed to fetch"/u);
	assert.match(API_SOURCE, /message === candidate \|\| message\.includes\(candidate\)/u);
});

test("api exports the shared Rovo app user error formatter", () => {
	assert.match(API_SOURCE, /export function toRovoAppUserErrorMessage\(error: unknown\): string \{/u);
	assert.match(API_SOURCE, /if \(isRovoAppBackendUnavailableError\(error\)\) \{[\s\S]*return getRovoAppBackendUnavailableUserMessage\(\);/u);
	assert.match(API_SOURCE, /return error instanceof Error \? error\.message : String\(error\);/u);
});
