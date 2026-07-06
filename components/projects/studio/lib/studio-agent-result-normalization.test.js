const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

function loadStudioAgentResultNormalizationModule() {
	const result = esbuild.buildSync({
		entryPoints: [path.join(process.cwd(), "components/projects/studio/lib/studio-agent-result-normalization.ts")],
		bundle: true,
		format: "cjs",
		loader: {
			".css": "empty",
		},
		logLevel: "silent",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "studio-agent-result-normalization.cjs");
}

const {
	normalizeStudioAgentResult,
	resolveRegisteredStudioAgentId,
} = loadStudioAgentResultNormalizationModule();

function createAgentResult(overrides = {}) {
	return {
		action: "create",
		agentId: "support-agent",
		conversationStarters: ["Triaging a billing issue", " Summarize customer context ", "", "Draft a reply"],
		conversationStarterIcons: ["ai-chat", "page", "automation"],
		description: "Handles support cases",
		name: "Support Agent",
		summary: "Support specialist",
		...overrides,
	};
}

test("normalizeStudioAgentResult builds a selected-agent profile from generated agent results", () => {
	const profile = normalizeStudioAgentResult(createAgentResult({ avatarSrc: " /avatar.svg " }));

	assert.ok(profile);
	assert.equal(profile.id, "support-agent");
	assert.equal(profile.name, "Support Agent");
	assert.equal(profile.description, "Handles support cases");
	assert.equal(profile.avatarSrc, "/avatar.svg");
	assert.equal(profile.byline, "Custom agent by You");
	assert.deepEqual(
		profile.starters.map((starter) => starter.label),
		["Triaging a billing issue", "Summarize customer context", "Draft a reply"],
	);
	assert.equal(profile.starters[0].id, "support-agent-starter-1");
	assert.equal(profile.starters[0].prompt, "Triaging a billing issue");
	assert.match(profile.contextDescription, /Source: \/studio agent creation result/u);
	assert.match(profile.contextDescription, /Conversation starters: Triaging a billing issue \| Summarize customer context \| Draft a reply/u);
});

test("normalizeStudioAgentResult falls back to summary and injected avatar source", () => {
	const profile = normalizeStudioAgentResult(
		createAgentResult({
			avatarSrc: "",
			description: "",
			summary: "Summarizes incidents",
		}),
		() => "/avatar-agent/fallback.svg",
	);

	assert.ok(profile);
	assert.equal(profile.description, "Summarizes incidents");
	assert.equal(profile.avatarSrc, "/avatar-agent/fallback.svg");
});

test("normalizeStudioAgentResult rejects incomplete generated agent results", () => {
	assert.equal(normalizeStudioAgentResult(createAgentResult({ agentId: "" })), null);
	assert.equal(normalizeStudioAgentResult(createAgentResult({ name: "" })), null);
	assert.equal(normalizeStudioAgentResult(createAgentResult({ description: "", summary: "" })), null);
	assert.equal(normalizeStudioAgentResult(createAgentResult({ conversationStarters: [] })), null);
});

test("resolveRegisteredStudioAgentId accepts registered ids and falls back otherwise", () => {
	assert.equal(resolveRegisteredStudioAgentId(" registered-agent ", "fallback-agent"), "registered-agent");
	assert.equal(resolveRegisteredStudioAgentId({ id: " object-agent " }, "fallback-agent"), "object-agent");
	assert.equal(resolveRegisteredStudioAgentId({ id: "" }, "fallback-agent"), "fallback-agent");
	assert.equal(resolveRegisteredStudioAgentId(null, "fallback-agent"), "fallback-agent");
});
