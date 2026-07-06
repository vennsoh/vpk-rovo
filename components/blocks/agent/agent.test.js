const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");

function readProjectFile(relativePath) {
	return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const AGENT_INDEX_SOURCE = readProjectFile("components/blocks/agent/index.ts");
const AGENT_PAGE_SOURCE = readProjectFile("components/blocks/agent/page.tsx");
const AGENT_PREVIEW_PAGE_SOURCE = readProjectFile("app/preview/blocks/agent/page.tsx");
const AGENT_DEMO_SOURCE = readProjectFile("components/website/demos/blocks/agent-demo.tsx");
const AGENT_2_DEMO_SOURCE = readProjectFile("components/website/demos/blocks/agent-2-demo.tsx");
const AGENT_DETAIL_SOURCE = readProjectFile("app/data/details/blocks/agent.ts");
const AGENT_2_DETAIL_SOURCE = readProjectFile("app/data/details/blocks/agent-2.ts");
const AGENT_DETAIL_HELPER_SOURCE = readProjectFile("app/data/details/blocks/agent-detail.ts");
const BLOCK_DETAILS_SOURCE = readDetailCategorySource("blocks");
const COMPONENTS_SOURCE = readProjectFile("app/data/components.ts");
const COMPONENT_MANIFEST_SOURCE = readProjectFile("app/data/component-manifest.ts");
const WEBSITE_REGISTRY_SOURCE = readWebsiteRegistrySource();

test("Agent compatibility facade re-exports Agent 2", () => {
	assert.equal(AGENT_INDEX_SOURCE.trim(), 'export * from "@/components/blocks/agent-2";');
	assert.match(AGENT_DETAIL_SOURCE, /createAgentDetail\(\{\s*demoSlugPrefix: "agent",\s*importPath: "@\/components\/blocks\/agent",\s*\}\)/u);
	assert.match(AGENT_2_DETAIL_SOURCE, /createAgentDetail\(\{\s*demoSlugPrefix: "agent-2",\s*importPath: "@\/components\/blocks\/agent-2",\s*\}\)/u);
});

test("Agent page and preview route keep the legacy route compatibility layer", () => {
	assert.match(AGENT_PAGE_SOURCE, /import AgentDemo from "@\/components\/website\/demos\/blocks\/agent-demo";/u);
	assert.match(AGENT_PAGE_SOURCE, /export default function AgentPage\(\): React\.ReactElement \{\s*return <AgentDemo \/>;\s*\}/u);
	assert.match(AGENT_PREVIEW_PAGE_SOURCE, /import AgentPage from "@\/components\/blocks\/agent\/page";/u);
	assert.match(AGENT_PREVIEW_PAGE_SOURCE, /return <AgentPage \/>;/u);
});

test("Agent remains registered as a block demo through the facade", () => {
	assert.match(COMPONENTS_SOURCE, /blockComponent\("agent"\)/u);
	assert.match(COMPONENT_MANIFEST_SOURCE, /blockComponent\("agent"\)/u);
	assert.match(
		WEBSITE_REGISTRY_SOURCE,
		/const BLOCK_DEMOS: Record<string, ComponentType> = \{[\s\S]*agent: dynamic\(\(\) => import\("\.\/demos\/blocks\/agent-demo"\), \{ ssr: false \}\)/u,
	);
	assert.match(BLOCK_DETAILS_SOURCE, /agent: AGENT_DETAIL/u);
	assert.match(AGENT_DETAIL_HELPER_SOURCE, /demoSlug: `\$\{demoSlugPrefix\}-demo-full`/u);
	assert.match(AGENT_DETAIL_HELPER_SOURCE, /demoSlug: `\$\{demoSlugPrefix\}-demo-empty`/u);
});

test("Agent demo consumes the legacy facade and exposes configured variants", () => {
	assert.match(AGENT_DEMO_SOURCE, /from "@\/components\/blocks\/agent";/u);
	assert.match(AGENT_DEMO_SOURCE, /export default function AgentDemo\(\) \{[\s\S]*return <AgentDemoFull \/>;/u);
	assert.match(AGENT_DEMO_SOURCE, /export function AgentDemoFull\(\)/u);
	assert.match(AGENT_DEMO_SOURCE, /export function AgentDemoEmpty\(\)/u);
	assert.match(AGENT_DEMO_SOURCE, /activeSection === "surfaces"[\s\S]*<AgentCompactSurfacesPanel \/>/u);
});

test("Agent 2 demo delegates to the canonical Agent demo owner", () => {
	assert.match(AGENT_2_DEMO_SOURCE, /AgentDemoFull as AgentDemo2Full/u);
	assert.match(AGENT_2_DEMO_SOURCE, /AgentDemoEmpty as AgentDemo2Empty/u);
	assert.match(AGENT_2_DEMO_SOURCE, /from "\.\/agent-demo";/u);
	assert.doesNotMatch(AGENT_2_DEMO_SOURCE, /useAgentDemoConfig/u);
	assert.doesNotMatch(AGENT_2_DEMO_SOURCE, /function AgentDemo2Full/u);
});
