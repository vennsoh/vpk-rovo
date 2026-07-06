const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const APP_SOURCE = readFileSync(join(__dirname, "..", "app.js"), "utf8");
const AI_UTILITIES_ROUTE_SOURCE = readFileSync(
	join(__dirname, "..", "routes", "ai-utilities.js"),
	"utf8",
);
const NEXT_ROUTE_SOURCE = readFileSync(
	join(__dirname, "..", "..", "app", "api", "studio", "agent-data-flow", "route.ts"),
	"utf8",
);

test("Studio agent data-flow route proxies to the backend refinement endpoint", () => {
	assert.match(NEXT_ROUTE_SOURCE, /path: "\/api\/studio\/agent-data-flow"/u);
	assert.match(NEXT_ROUTE_SOURCE, /readJsonBody<Record<string, unknown>>\(request\)/u);
});

test("Express route refines Mermaid and falls back to baseline", () => {
	assert.match(AI_UTILITIES_ROUTE_SOURCE, /refineAgentDataFlowMermaid/u);
	assert.match(AI_UTILITIES_ROUTE_SOURCE, /router\.post\("\/studio\/agent-data-flow"/u);
	assert.match(AI_UTILITIES_ROUTE_SOURCE, /normalizeAgentDataFlowConfigFn\(requestBody\.config\)/u);
	assert.match(AI_UTILITIES_ROUTE_SOURCE, /buildAgentDataFlowMermaidFn\(config\)/u);
	assert.match(AI_UTILITIES_ROUTE_SOURCE, /return res\.status\(200\)\.json\(\{ mermaid: baseline \}\);/u);
	assert.match(APP_SOURCE, /registerAiUtilitiesRoutes\(app, \{/u);
});
