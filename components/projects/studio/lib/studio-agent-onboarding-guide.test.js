const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

function loadStudioAgentOnboardingGuideModule() {
	const result = esbuild.buildSync({
		entryPoints: [path.join(process.cwd(), "components/projects/studio/lib/studio-agent-onboarding-guide.ts")],
		bundle: true,
		format: "cjs",
		logLevel: "silent",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "studio-agent-onboarding-guide.cjs");
}

const {
	buildStudioAgentOnboardingVoiceInput,
	createStudioAgentOnboardingGuideMessage,
	createStudioAgentOnboardingLocalConversation,
	getStudioAgentOnboardingGuideGreeting,
	getStudioAgentOnboardingGuideStepByIndex,
	getStudioAgentOnboardingGuideStepNarration,
	resolveStudioAgentOnboardingGuideCommand,
} = loadStudioAgentOnboardingGuideModule();

test("resolveStudioAgentOnboardingGuideCommand maps spoken controls", () => {
	assert.equal(resolveStudioAgentOnboardingGuideCommand("go next"), "next");
	assert.equal(resolveStudioAgentOnboardingGuideCommand("go back"), "back");
	assert.equal(resolveStudioAgentOnboardingGuideCommand("done"), "done");
	assert.equal(resolveStudioAgentOnboardingGuideCommand("what can this do?"), "unknown");
});

test("guide messages use Rovo metadata and text parts", () => {
	const message = createStudioAgentOnboardingGuideMessage({
		createdAt: "2026-01-02T03:04:05.000Z",
		role: "assistant",
		text: "Welcome",
	});

	assert.equal(message.role, "assistant");
	assert.equal(message.metadata.origin, "rovo");
	assert.equal(message.metadata.createdAt, "2026-01-02T03:04:05.000Z");
	assert.equal(message.metadata.updatedAt, "2026-01-02T03:04:05.000Z");
	assert.deepEqual(message.parts, [{
		type: "text",
		text: "Welcome",
		state: "done",
	}]);
});

test("guide copy derives greeting and step narration from the tour data", () => {
	assert.match(
		getStudioAgentOnboardingGuideGreeting("Release Notes Agent"),
		/Congrats - Release Notes Agent is ready/u,
	);
	assert.match(
		getStudioAgentOnboardingGuideStepNarration(getStudioAgentOnboardingGuideStepByIndex(0)),
		/The agent card is the launchpad/u,
	);
	assert.match(
		getStudioAgentOnboardingGuideStepNarration(getStudioAgentOnboardingGuideStepByIndex(1)),
		/fast refinements/u,
	);
	assert.equal(getStudioAgentOnboardingGuideStepByIndex(99), null);
});

test("local conversation returns voice input and initial narration only when active", async () => {
	const messages = [createStudioAgentOnboardingGuideMessage({
		createdAt: "2026-01-02T03:04:05.000Z",
		role: "assistant",
		text: "Welcome",
	})];
	const onSubmit = async () => ({ handled: true, voiceText: "Next step" });
	const conversation = createStudioAgentOnboardingLocalConversation({
		initialAgentName: "Release Notes Agent",
		initialVoiceKey: null,
		isActive: true,
		messages,
		onSubmit,
		resolveInitialVoiceText: getStudioAgentOnboardingGuideGreeting,
	});

	assert.equal(conversation.initialVoiceKey, "generated-agent");
	assert.match(conversation.initialVoiceText, /Release Notes Agent is ready/u);
	assert.equal(conversation.messages, messages);
	assert.equal(conversation.onSubmit, onSubmit);
	assert.match(buildStudioAgentOnboardingVoiceInput("Read me"), /Speak much quicker than normal/u);
	assert.equal(createStudioAgentOnboardingLocalConversation({
		initialAgentName: null,
		initialVoiceKey: null,
		isActive: false,
		messages,
		onSubmit,
		resolveInitialVoiceText: getStudioAgentOnboardingGuideGreeting,
	}), null);
});
