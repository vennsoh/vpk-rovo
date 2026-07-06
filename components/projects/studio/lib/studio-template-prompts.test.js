const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

function loadStudioTemplatePromptsModule() {
	const result = esbuild.buildSync({
		entryPoints: [path.join(process.cwd(), "components/projects/studio/lib/studio-template-prompts.ts")],
		bundle: true,
		format: "cjs",
		logLevel: "silent",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "studio-template-prompts.cjs");
}

const { buildFallbackTemplatePrompt } = loadStudioTemplatePromptsModule();

test("fallback template prompt includes available template context", () => {
	assert.equal(
		buildFallbackTemplatePrompt({
			name: "Bug Triage",
			description: "Triages incoming defects.",
			sources: [{ label: "Jira" }, { label: "Slack" }],
			skills: [{ label: "Summarize" }, { label: "Assign owner" }],
			capabilities: [{ label: "Cluster related issues" }, { label: "Draft next steps" }],
		}),
		[
			"Use the Bug Triage template to create a Rovo agent.",
			"Triages incoming defects.",
			"Connect it to Jira, Slack.",
			"Include skills for Summarize, Assign owner.",
			"It should support these features: Cluster related issues; Draft next steps.",
			"Keep the prompt concise and ready for me to review before sending.",
		].join(" "),
	);
});

test("fallback template prompt omits absent optional context", () => {
	assert.equal(
		buildFallbackTemplatePrompt({
			name: "Release Notes",
			description: "Drafts release notes.",
		}),
		"Use the Release Notes template to create a Rovo agent. Drafts release notes. Keep the prompt concise and ready for me to review before sending.",
	);
});
