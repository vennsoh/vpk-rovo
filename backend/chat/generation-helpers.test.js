const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildArtifactPreviewSummary,
	createChatGenerationHelpers,
	withStudioAgentGatewayFallbackTimeout,
} = require("./generation-helpers");

function createHarness(overrides = {}) {
	const calls = {
		gatewayText: [],
		planMetadata: [],
		suggestions: [],
	};
	const loggerMessages = [];
	const helpers = createChatGenerationHelpers({
		aiGatewayProvider: {
			generateText: async (options) => {
				calls.gatewayText.push(options);
				return "gateway result";
			},
		},
		generatePlanMetadata: async (options) => {
			calls.planMetadata.push(options);
			return options.generateText({ prompt: "metadata", system: "system" });
		},
		generateSuggestedQuestionsViaAIGateway: async (options) => {
			calls.suggestions.push(options);
			return options.generateText({ prompt: "questions", system: "system" });
		},
		generateTextViaGateway: async (options) => {
			calls.gatewayText.push(options);
			return {
				title: "Generated",
				shortDescription: "Generated description",
			};
		},
		hasGatewayUrlConfigured: () => true,
		logger: {
			info: (message) => loggerMessages.push(message),
		},
		...overrides,
	});

	return {
		calls,
		helpers,
		loggerMessages,
	};
}

test("buildArtifactPreviewSummary preserves app fallback and custom titles", () => {
	assert.equal(
		buildArtifactPreviewSummary(""),
		"Generated app preview ready to open",
	);
	assert.equal(
		buildArtifactPreviewSummary("Roadmap Dashboard"),
		"Roadmap Dashboard preview ready to open",
	);
});

test("createChatGenerationHelpers validates required dependencies", () => {
	assert.throws(
		() => createChatGenerationHelpers(),
		/aiGatewayProvider\.generateText/u,
	);
	assert.throws(
		() => createChatGenerationHelpers({ aiGatewayProvider: { generateText() {} } }),
		/generateTextViaGateway/u,
	);
	assert.throws(
		() => createChatGenerationHelpers({
			aiGatewayProvider: { generateText() {} },
			generateTextViaGateway() {},
			hasGatewayUrlConfigured() {},
			generatePlanMetadata: null,
		}),
		/generatePlanMetadata/u,
	);
});

test("generateSuggestedQuestions skips empty assistant text and missing gateway config", async () => {
	const emptyHarness = createHarness();
	assert.deepEqual(
		await emptyHarness.helpers.generateSuggestedQuestions({
			assistantResponse: "   ",
		}),
		[],
	);
	assert.equal(emptyHarness.calls.suggestions.length, 0);

	const unavailableHarness = createHarness({
		hasGatewayUrlConfigured: () => false,
	});
	assert.deepEqual(
		await unavailableHarness.helpers.generateSuggestedQuestions({
			message: "hello",
			conversationHistory: [],
			assistantResponse: "Hi there",
		}),
		[],
	);
	assert.equal(unavailableHarness.calls.suggestions.length, 0);
	assert.deepEqual(unavailableHarness.loggerMessages, [
		"[SUGGESTIONS] Skipping AI Gateway (not configured)",
	]);
});

test("generateSuggestedQuestions delegates to AI Gateway question generator", async () => {
	const signal = AbortSignal.abort();
	const harness = createHarness();

	assert.equal(
		await harness.helpers.generateSuggestedQuestions({
			message: "hello",
			conversationHistory: [{ type: "assistant", content: "Hi" }],
			assistantResponse: "What next?",
			signal,
		}),
		"gateway result",
	);

	assert.equal(harness.calls.suggestions.length, 1);
	assert.equal(harness.calls.suggestions[0].message, "hello");
	assert.equal(harness.calls.suggestions[0].assistantResponse, "What next?");
	assert.equal(harness.calls.suggestions[0].signal, signal);
	assert.equal(harness.calls.gatewayText.length, 1);
	assert.deepEqual(harness.calls.gatewayText[0], {
		prompt: "questions",
		system: "system",
	});
});

test("generatePlanMetadataViaGateway forces AI Gateway backend preference", async () => {
	const harness = createHarness();

	assert.deepEqual(
		await harness.helpers.generatePlanMetadataViaGateway({
			title: "Plan",
			description: "Build a dashboard",
			markdown: "# Plan",
			tasks: ["Create cards"],
		}),
		{
			title: "Generated",
			shortDescription: "Generated description",
		},
	);

	assert.equal(harness.calls.planMetadata.length, 1);
	assert.equal(harness.calls.planMetadata[0].title, "Plan");
	assert.deepEqual(harness.calls.gatewayText[0], {
		prompt: "metadata",
		system: "system",
		backendPreference: "ai-gateway",
	});
});

test("withStudioAgentGatewayFallbackTimeout resolves, times out, and propagates rejection", async () => {
	assert.deepEqual(
		await withStudioAgentGatewayFallbackTimeout(Promise.resolve("done"), 50),
		{ timedOut: false, value: "done" },
	);

	assert.deepEqual(
		await withStudioAgentGatewayFallbackTimeout(new Promise(() => {}), 1),
		{ timedOut: true, value: "" },
	);

	await assert.rejects(
		withStudioAgentGatewayFallbackTimeout(Promise.reject(new Error("boom")), 50),
		/boom/u,
	);
});
