const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const SKILL_CONFIG_SOURCE = readProjectFile("components/blocks/skill-config/components/skill-config.tsx");
const SKILL_CONFIG_COMPACT_HEADER_NAV_SOURCE = readProjectFile("components/blocks/skill-config/components/agent-compact-header-nav.tsx");

test("Skill Config delegates compact header navigation to a local component owner", () => {
	assert.match(
		SKILL_CONFIG_SOURCE,
		/from "@\/components\/blocks\/skill-config\/components\/agent-compact-header-nav";/u,
	);
	assert.doesNotMatch(SKILL_CONFIG_SOURCE, /const AGENT_COMPACT_HEADER_NAV_ITEMS/u);
	assert.doesNotMatch(SKILL_CONFIG_SOURCE, /function AgentCompactHeaderNavButton/u);
	assert.doesNotMatch(SKILL_CONFIG_SOURCE, /export function AgentCompactHeaderNav/u);
	assert.match(
		SKILL_CONFIG_COMPACT_HEADER_NAV_SOURCE,
		/const AGENT_COMPACT_HEADER_NAV_ITEMS = \[[\s\S]*<LayoutDashboardIcon size="small" \/>[\s\S]*label: "Details"[\s\S]*label: "Insights"/u,
	);
	assert.match(SKILL_CONFIG_COMPACT_HEADER_NAV_SOURCE, /export type AgentCompactHeaderSection/u);
	assert.match(SKILL_CONFIG_COMPACT_HEADER_NAV_SOURCE, /export interface AgentCompactHeaderNavProps/u);
	assert.match(SKILL_CONFIG_COMPACT_HEADER_NAV_SOURCE, /export const AGENT_COMPACT_HEADER_DEFAULT_NAV_ITEMS/u);
	assert.match(SKILL_CONFIG_COMPACT_HEADER_NAV_SOURCE, /export const AGENT_COMPACT_HEADER_DETAILS_NAV_ITEM/u);
	assert.match(SKILL_CONFIG_COMPACT_HEADER_NAV_SOURCE, /function AgentCompactHeaderNavButton/u);
	assert.match(SKILL_CONFIG_COMPACT_HEADER_NAV_SOURCE, /export function AgentCompactHeaderNav/u);
	assert.match(SKILL_CONFIG_COMPACT_HEADER_NAV_SOURCE, /computeContextBarOverflow/u);
	assert.match(SKILL_CONFIG_COMPACT_HEADER_NAV_SOURCE, /aria-label="More agent sections"/u);
	assert.doesNotMatch(SKILL_CONFIG_COMPACT_HEADER_NAV_SOURCE, /DEFAULT_COLLAPSED_SECTIONS/u);
});

test("Skill Config toolbar visibility is an explicit apps-only model", () => {
	assert.match(
		SKILL_CONFIG_SOURCE,
		/const SKILL_CONFIG_TOOLBAR_FIELD_NAMES: ReadonlySet<AgentConfigToolbarFieldName> =\s+new Set<AgentConfigToolbarFieldName>\(\["apps"\]\);/u,
	);
	assert.match(
		SKILL_CONFIG_SOURCE,
		/function isSkillConfigToolbarFieldVisible\([\s\S]*SKILL_CONFIG_TOOLBAR_FIELD_NAMES\.has\(fieldName\)[\s\S]*isAgentHideableConfigField\(fieldName\)/u,
	);
	assert.match(
		SKILL_CONFIG_SOURCE,
		/function getVisibleSkillConfigToolbarNavItems\([\s\S]*getAgentCompactEmptyConfigNavItems\(config\)\.filter\(\(item\) =>[\s\S]*isSkillConfigToolbarFieldVisible\(item\.agentFieldName, hiddenConfigFields\)/u,
	);
	assert.match(
		SKILL_CONFIG_SOURCE,
		/function getVisibleSkillConfigToolbarRows\([\s\S]*rows\.filter\(\(row\) => isSkillConfigToolbarFieldVisible\(row\.key, hiddenConfigFields\)\)/u,
	);
	assert.match(
		SKILL_CONFIG_SOURCE,
		/const items = getVisibleSkillConfigToolbarNavItems\(config, hiddenConfigFields\);/u,
	);
	assert.match(
		SKILL_CONFIG_SOURCE,
		/const rows: ReadonlyArray<AgentConfigToolbarRow> = \[/u,
	);
	assert.match(
		SKILL_CONFIG_SOURCE,
		/const orderedRows = getVisibleSkillConfigToolbarRows\(rows, hiddenConfigFields\)\s+\.map/u,
	);
	assert.doesNotMatch(
		SKILL_CONFIG_SOURCE,
		/getAgentCompactEmptyConfigNavItems\(config\)\.filter\([\s\S]{0,220}item\.agentFieldName === "apps"/u,
	);
	assert.doesNotMatch(
		SKILL_CONFIG_SOURCE,
		/filter\(\(row\) => row\.key === "apps"/u,
	);
});
