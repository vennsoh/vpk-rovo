const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

function loadStudioAutomationDiscoveryPromptModule() {
	const result = esbuild.buildSync({
		entryPoints: [path.join(process.cwd(), "components/projects/studio/lib/studio-automation-discovery-prompt.ts")],
		bundle: true,
		format: "cjs",
		logLevel: "silent",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "studio-automation-discovery-prompt.cjs");
}

const { isStudioAutomationDiscoveryDemoPrompt } = loadStudioAutomationDiscoveryPromptModule();

test("detects the scripted automation-discovery demo prompt", () => {
	assert.equal(
		isStudioAutomationDiscoveryDemoPrompt(
			"Review my last 30 days across Slack, Jira, Confluence, and GitHub. Find manual workflows and create agentic automations.",
		),
		true,
	);
	assert.equal(
		isStudioAutomationDiscoveryDemoPrompt(
			"Look at the past month of work history in Figma, Loom, Calendar, and Teamwork Graph for repeated workflow automation ideas.",
		),
		true,
	);
});

test("rejects prompts without the demo source, time, and automation signals", () => {
	assert.equal(isStudioAutomationDiscoveryDemoPrompt(""), false);
	assert.equal(
		isStudioAutomationDiscoveryDemoPrompt("Review Slack and Jira from the last 30 days for manual workflows."),
		false,
	);
	assert.equal(
		isStudioAutomationDiscoveryDemoPrompt("Review Slack, Jira, and Confluence for manual workflows."),
		false,
	);
	assert.equal(
		isStudioAutomationDiscoveryDemoPrompt("Review Slack, Jira, and Confluence from the last 30 days."),
		false,
	);
});
