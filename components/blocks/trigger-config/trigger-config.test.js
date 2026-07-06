const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const TRIGGER_CONFIG_SOURCE = readProjectFile("components/blocks/trigger-config/components/trigger-config.tsx");
const TRIGGER_CONFIG_COMPACT_HEADER_NAV_SOURCE = readProjectFile("components/blocks/trigger-config/components/agent-compact-header-nav.tsx");

test("Trigger Config delegates compact header navigation to a local component owner", () => {
	assert.match(
		TRIGGER_CONFIG_SOURCE,
		/from "@\/components\/blocks\/trigger-config\/components\/agent-compact-header-nav";/u,
	);
	assert.doesNotMatch(TRIGGER_CONFIG_SOURCE, /const AGENT_COMPACT_HEADER_NAV_ITEMS/u);
	assert.doesNotMatch(TRIGGER_CONFIG_SOURCE, /function AgentCompactHeaderNavButton/u);
	assert.doesNotMatch(TRIGGER_CONFIG_SOURCE, /export function AgentCompactHeaderNav/u);
	assert.match(
		TRIGGER_CONFIG_COMPACT_HEADER_NAV_SOURCE,
		/const AGENT_COMPACT_HEADER_NAV_ITEMS = \[[\s\S]*<LayoutDashboardIcon size="small" \/>[\s\S]*label: "Details"[\s\S]*label: "Insights"/u,
	);
	assert.match(TRIGGER_CONFIG_COMPACT_HEADER_NAV_SOURCE, /export type AgentCompactHeaderSection/u);
	assert.match(TRIGGER_CONFIG_COMPACT_HEADER_NAV_SOURCE, /export const AGENT_COMPACT_HEADER_DEFAULT_NAV_ITEMS/u);
	assert.match(TRIGGER_CONFIG_COMPACT_HEADER_NAV_SOURCE, /export const AGENT_COMPACT_HEADER_DETAILS_NAV_ITEM/u);
	assert.match(TRIGGER_CONFIG_COMPACT_HEADER_NAV_SOURCE, /function AgentCompactHeaderNavButton/u);
	assert.match(TRIGGER_CONFIG_COMPACT_HEADER_NAV_SOURCE, /export function AgentCompactHeaderNav/u);
	assert.match(TRIGGER_CONFIG_COMPACT_HEADER_NAV_SOURCE, /computeContextBarOverflow/u);
	assert.match(TRIGGER_CONFIG_COMPACT_HEADER_NAV_SOURCE, /aria-label="More agent sections"/u);
});
