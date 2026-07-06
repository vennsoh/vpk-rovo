const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const COMPONENT_SOURCE = fs.readFileSync(path.join(__dirname, "components/agent-selector.tsx"), "utf8");
const DATA_SOURCE = fs.readFileSync(path.join(__dirname, "data/demo-agents.ts"), "utf8");
const PAGE_SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");
const AGENT_SELECTOR_DROPDOWN_CALLSITE_SOURCES = [
	"components/blocks/agent-selector/page.tsx",
	"components/blocks/kanban-board/index.tsx",
	"components/projects/jira/components/column-agent-assignment.tsx",
	"components/projects/jira/components/work-item-modal/agent-panel.tsx",
	"components/projects/jira/components/work-item-modal/sidebar-stack.tsx",
	"components/projects/rovo-core/components/rovo-app-brand.tsx",
].map((sourcePath) => ({
	source: fs.readFileSync(path.join(process.cwd(), sourcePath), "utf8"),
	sourcePath,
}));

test("AgentSelector demo list omits Rovo Dev", () => {
	assert.doesNotMatch(DATA_SOURCE, /name:\s*"Rovo Dev"/u);
	assert.doesNotMatch(DATA_SOURCE, /id:\s*"rovo-dev"/u);
});

test("AgentSelector demo uses single selection without multi-select toggling", () => {
	assert.match(PAGE_SOURCE, /variant === "selected-agent-actions" \? \["ai-insights-agent"\] : \["github-copilot"\]/u);
	assert.match(PAGE_SOURCE, /function selectAgent\(agentId: string\) \{[\s\S]*setSelectedAgentIds\(\[agentId\]\);[\s\S]*\}/u);
	assert.match(PAGE_SOURCE, /selectionMode="single"/u);
	assert.doesNotMatch(PAGE_SOURCE, /currentIds\.includes\(agentId\)[\s\S]*currentIds\.filter/u);
});

test("AgentSelector hides command checkmarks for single-select usage", () => {
	assert.match(COMPONENT_SOURCE, /selectionMode = "multiple"/u);
	assert.match(COMPONENT_SOURCE, /const supportsMultipleSelection = selectionMode === "multiple";/u);
	assert.match(COMPONENT_SOURCE, /showCheckIcon=\{supportsMultipleSelection\}/u);
	assert.match(COMPONENT_SOURCE, /data-checked=\{supportsMultipleSelection && isChecked \? true : undefined\}/u);
});

test("AgentSelector uses stable command values for duplicate agent names", () => {
	assert.match(COMPONENT_SOURCE, /key=\{agent\.id\}/u);
	assert.match(COMPONENT_SOURCE, /value=\{agent\.id\}/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /value=\{agent\.name\}/u);
});

test("AgentSelector applies active search queries to selected and unselected agents", () => {
	assert.match(COMPONENT_SOURCE, /function filterAgentsByQuery\([\s\S]*agents\.filter\(\(agent\) => matchesAgent\(agent, normalizedQuery\)\)[\s\S]*: \[\.\.\.agents\];/u);
	assert.match(COMPONENT_SOURCE, /return \[\s*\.\.\.filterAgentsByQuery\(selectedAgents, normalizedQuery\),\s*\.\.\.filterAgentsByQuery\(unselectedAgents, normalizedQuery\),\s*\];/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /return \[\.\.\.selectedAgents, \.\.\.filteredUnselectedAgents\];/u);
});

test("AgentSelector action labels use subtle text color", () => {
	assert.match(COMPONENT_SOURCE, /const ACTION_LABEL_CLASS = "text-text-subtle";/u);
	assert.match(COMPONENT_SOURCE, /<span className=\{ACTION_LABEL_CLASS\}>\{action\.label\}<\/span>/u);
	assert.match(COMPONENT_SOURCE, /<span className=\{ACTION_LABEL_CLASS\}>\{browseAgentsLabel\}<\/span>/u);
	assert.match(COMPONENT_SOURCE, /<span className=\{ACTION_LABEL_CLASS\}>\{createAgentLabel\}<\/span>/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /<span className="text-text">\{(?:action\.label|browseAgentsLabel|createAgentLabel)\}<\/span>/u);
});

test("AgentSelector rows use greeting prompt text rhythm without enlarging agent logos", () => {
	assert.match(COMPONENT_SOURCE, /const AGENT_ROW_CLASS =\s*"grid h-11 w-full grid-cols-\[24px_minmax\(0,1fr\)_auto\] items-center gap-3 rounded-\[12px\] px-1\.5 py-0 text-left";/u);
	assert.match(COMPONENT_SOURCE, /const AGENT_COPY_CLASS =\s*"flex min-h-\[34px\] min-w-0 flex-col justify-start overflow-hidden";/u);
	// Title + byline use the shared editor-palette type treatment (menu-row-*
	// utilities) rather than re-deriving line-height with text-sm/leading-*.
	assert.match(COMPONENT_SOURCE, /const AGENT_LABEL_CLASS = "menu-row-title text-left";/u);
	assert.match(COMPONENT_SOURCE, /const AGENT_DESCRIPTION_CLASS = "menu-row-byline text-left";/u);
	assert.match(COMPONENT_SOURCE, /className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-sm"/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /grid-cols-\[32px_minmax\(0,1fr\)_auto\]/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-sm"/u);
	assert.match(COMPONENT_SOURCE, /className=\{AGENT_ROW_CLASS\}/u);
	assert.match(COMPONENT_SOURCE, /className=\{AGENT_COPY_CLASS\}/u);
	assert.match(COMPONENT_SOURCE, /className=\{AGENT_LABEL_CLASS\}/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /block truncate text-sm font-normal leading-[45] text-text-subtle/u);
});

test("AgentSelector dropdowns do not inherit the generic menu height cap", () => {
	assert.match(COMPONENT_SOURCE, /h-\[26rem\] max-h-\[min\(26rem,var\(--available-height,26rem\)\)\]/u);
	for (const { source, sourcePath } of AGENT_SELECTOR_DROPDOWN_CALLSITE_SOURCES) {
		assert.match(
			source,
			/className="max-h-none w-\[360px\] overflow-hidden p-0"/u,
			`${sourcePath} must let AgentSelector own its 26rem available-height cap`,
		);
	}
});
