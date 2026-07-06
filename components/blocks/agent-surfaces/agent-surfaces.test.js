const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const SCREEN = "components/blocks/agent-surfaces/components/agent-surfaces.tsx";
const INDEX = "components/blocks/agent-surfaces/index.ts";
const AGENT_2_BLOCK = "components/blocks/agent-2/components/agent-2.tsx";

test("Agent Surfaces is exposed as a website block", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\("agent-surfaces", "Agent Surfaces"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\("agent-surfaces", "Agent Surfaces"\)/u,
	);
	assert.match(
		readDetailCategorySource("blocks"),
		/import \{ AgentSurfaces \} from "@\/components\/blocks\/agent-surfaces";/u,
	);
	assert.match(
		readWebsiteRegistrySource(),
		/"agent-surfaces": dynamic\(\s*\(\) => import\("\.\/demos\/blocks\/agent-surfaces-demo"\)/u,
	);
});

test("Agent Surfaces keeps default and extended surface rows", () => {
	const source = readProjectFile(SCREEN);
	assert.match(source, /export function AgentSurfaces/u);
	assert.match(source, /Choose where this agent appears across Atlassian apps and connected channels\./u);
	assert.match(source, /Default surfaces/u);
	assert.match(source, /Extended surfaces/u);
	assert.match(source, /Rovo Chat/u);
	assert.match(source, /Editor/u);
	assert.match(source, /Automation/u);
	assert.match(source, /Work items/u);
	assert.match(source, /Rovo browser extension/u);
	assert.match(source, /Slack/u);
	assert.match(source, /Customer portal/u);
	assert.match(source, /Help center/u);
	assert.match(source, /Managed elsewhere/u);
});

test("Agent block exposes Agent Surfaces through its compact section wrapper", () => {
	const source = readProjectFile(AGENT_2_BLOCK);
	assert.match(source, /import \{ AgentSurfaces \} from "@\/components\/blocks\/agent-surfaces";/u);
	assert.match(source, /export type AgentCompactSurfacesPanelProps = ComponentProps<typeof AgentSurfaces>;/u);
	assert.match(source, /return <AgentSurfaces \{\.\.\.props\} \/>;/u);
});

test("Agent Surfaces index re-exports the public API", () => {
	const index = readProjectFile(INDEX);
	assert.match(index, /export \{ AgentSurfaces \}/u);
	assert.match(index, /AgentSurfacesProps/u);
	assert.match(index, /AgentDefaultSurface/u);
	assert.match(index, /AgentExtendedSurface/u);
	assert.match(index, /AgentSurfaceStatus/u);
	assert.match(index, /AGENT_DEFAULT_SURFACES/u);
	assert.match(index, /AGENT_EXTENDED_SURFACES/u);
});
