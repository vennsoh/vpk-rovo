const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

function loadStudioAutomationArtifactListModule() {
	const result = esbuild.buildSync({
		entryPoints: [path.join(process.cwd(), "components/projects/studio/lib/studio-automation-artifact-list.ts")],
		bundle: true,
		format: "cjs",
		logLevel: "silent",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "studio-automation-artifact-list.cjs");
}

const {
	STUDIO_AUTOMATION_ARTIFACT_LIST_TYPE,
	getStudioAutomationArtifactListAgents,
	parseStudioAutomationArtifactListPayload,
} = loadStudioAutomationArtifactListModule();

function buildWidgetPayload(agentResultOverrides = {}) {
	return {
		type: STUDIO_AUTOMATION_ARTIFACT_LIST_TYPE,
		title: "Generated automation agents",
		agents: [{
			item: {
				id: "automation-agent-1",
				title: "Sprint Digest Agent",
			},
			agentResult: {
				action: "create",
				agentId: "automation-agent-1",
				name: "Sprint Digest Agent",
				summary: "Summarizes active sprint work.",
				...agentResultOverrides,
			},
		}],
	};
}

test("parseStudioAutomationArtifactListPayload keeps valid generated-agent entries", () => {
	const payload = parseStudioAutomationArtifactListPayload(buildWidgetPayload({
		avatarSrc: "/avatar-agent/test.svg",
		byline: "Automation team",
	}));

	assert.equal(payload?.agents.length, 1);
	assert.equal(payload?.agents[0].agentResult.agentId, "automation-agent-1");
	assert.equal(payload?.agents[0].item.owner, "Automation team");
	assert.equal(payload?.agents[0].item.logoSrc, "/avatar-agent/test.svg");
});

test("parseStudioAutomationArtifactListPayload drops malformed generated-agent entries", () => {
	assert.equal(parseStudioAutomationArtifactListPayload(buildWidgetPayload({ summary: "" })), null);
	assert.equal(parseStudioAutomationArtifactListPayload(buildWidgetPayload({ name: "   " })), null);
	assert.equal(parseStudioAutomationArtifactListPayload(buildWidgetPayload({ agentId: null })), null);
});

test("getStudioAutomationArtifactListAgents reads parsed widget-data agents", () => {
	const message = {
		parts: [{
			type: "data-widget-data",
			data: {
				type: STUDIO_AUTOMATION_ARTIFACT_LIST_TYPE,
				payload: buildWidgetPayload(),
			},
		}],
	};

	assert.deepEqual(
		getStudioAutomationArtifactListAgents(message).map((agent) => agent.agentId),
		["automation-agent-1"],
	);
});
