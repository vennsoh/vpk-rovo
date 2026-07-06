const assert = require("node:assert/strict");
const test = require("node:test");

const {
	executeAIGatewayBufferedStream,
	resolveIsFirstAgentCreationTurn,
} = require("./ai-gateway-buffered-stream");

function createWriter() {
	const parts = [];
	return {
		parts,
		writer: {
			write(part) {
				parts.push(part);
			},
		},
	};
}

function createBaseOptions(overrides = {}) {
	return {
		abortSignal: { aborted: false },
		agentCreationOriginalBrief: "",
		agentCreationTracePrompt: "Build something useful.",
		buildStudioAgentCreationTrace: () => [],
		creationMode: undefined,
		effectiveContextWithPortBinding: "Workspace context",
		finalOutputOptions: {
			latestUserMessage: "Hello",
		},
		gatewayMessages: [{ role: "user", content: "Hello" }],
		gatewaySystem: "System prompt",
		isPostClarificationTurn: false,
		latestUserMessage: "Hello",
		logger: {
			warnings: [],
			warn(...args) {
				this.warnings.push(args);
			},
		},
		provider: "openai",
		shouldBoundStudioAgentGatewayCall: () => false,
		streamTextViaGateway: async ({ onTextDelta }) => {
			onTextDelta("Hello");
		},
		studioAgentGatewayFallbackTimeoutMs: 12_000,
		threadId: "thread-1",
		withStudioAgentGatewayFallbackTimeout: async (promise) => promise,
		writeAIGatewayFinalOutput: (options) => options,
		writeThinkingTraceSteps: async () => {},
		...overrides,
	};
}

test("resolves first agent-creation turn from clarification and assistant history", () => {
	assert.equal(resolveIsFirstAgentCreationTurn({
		creationMode: "agent",
		gatewayMessages: [{ role: "user", content: "Build an agent" }],
		isPostClarificationTurn: false,
	}), true);
	assert.equal(resolveIsFirstAgentCreationTurn({
		creationMode: "agent",
		gatewayMessages: [
			{ role: "user", content: "Build an agent" },
			{ role: "assistant", content: "Answer these first" },
		],
		isPostClarificationTurn: false,
	}), false);
	assert.equal(resolveIsFirstAgentCreationTurn({
		creationMode: "agent",
		gatewayMessages: [{ role: "user", content: "The team" }],
		isPostClarificationTurn: true,
	}), false);
	assert.equal(resolveIsFirstAgentCreationTurn({
		creationMode: "skill",
		gatewayMessages: [{ role: "user", content: "Build a skill" }],
		isPostClarificationTurn: false,
	}), false);
});

test("buffers gateway deltas and passes them to final output writer", async () => {
	const { parts, writer } = createWriter();
	let gatewayRequest = null;
	let finalOptions = null;

	await executeAIGatewayBufferedStream(createBaseOptions({
		finalOutputOptions: {
			latestUserMessage: "Summarize this",
		},
		latestUserMessage: "Summarize this",
		streamTextViaGateway: async (request) => {
			gatewayRequest = request;
			request.onTextDelta("Hello ");
			request.onTextDelta("");
			request.onTextDelta("there");
		},
		writeAIGatewayFinalOutput: (options) => {
			finalOptions = options;
			return { ok: true };
		},
		writer,
	}));

	assert.deepEqual(parts, [{
		type: "data-thinking-status",
		data: {
			label: "Working",
			content: undefined,
			activity: "data",
			source: "backend",
		},
	}]);
	assert.equal(gatewayRequest.backendPreference, "ai-gateway");
	assert.equal(gatewayRequest.prompt, "Summarize this");
	assert.equal(gatewayRequest.system, "System prompt");
	assert.equal(gatewayRequest.maxOutputTokens, 2000);
	assert.equal(gatewayRequest.temperature, 0.4);
	assert.equal(finalOptions.bufferedText, "Hello there");
	assert.equal(finalOptions.isFirstAgentCreationTurn, false);
	assert.match(finalOptions.textId, /^ai-gateway-text-/u);
	assert.equal(finalOptions.writer, writer);
});

test("agent creation gateway failures fall back to final output", async () => {
	const { parts, writer } = createWriter();
	const logger = createBaseOptions().logger;
	let traceInput = null;
	let finalOptions = null;

	await executeAIGatewayBufferedStream(createBaseOptions({
		buildStudioAgentCreationTrace: (input) => {
			traceInput = input;
			return [{ label: "Review brief" }];
		},
		creationMode: "agent",
		logger,
		streamTextViaGateway: async () => {
			throw new Error("gateway offline");
		},
		writeAIGatewayFinalOutput: (options) => {
			finalOptions = options;
			return { ok: true };
		},
		writeThinkingTraceSteps: async (_writer, trace, options) => {
			assert.deepEqual(trace, [{ label: "Review brief" }]);
			assert.equal(options.signal.aborted, false);
		},
		writer,
	}));

	assert.equal(parts[0].data.label, "Designing agent");
	assert.equal(traceInput.isFollowUpTurn, false);
	assert.equal(traceInput.contextDescription, "Workspace context");
	assert.equal(finalOptions.bufferedText, "");
	assert.equal(finalOptions.isFirstAgentCreationTurn, true);
	assert.match(logger.warnings[0][0], /Studio agent gateway generation failed/u);
});

test("agent creation timeout uses bounded gateway call and marks follow-up turns", async () => {
	const { writer } = createWriter();
	const logger = createBaseOptions().logger;
	let timeoutMs = null;
	let traceInput = null;
	let finalOptions = null;

	await executeAIGatewayBufferedStream(createBaseOptions({
		buildStudioAgentCreationTrace: (input) => {
			traceInput = input;
			return [];
		},
		creationMode: "agent",
		gatewayMessages: [
			{ role: "user", content: "Build an agent" },
			{ role: "assistant", content: "Answer these first" },
		],
		logger,
		shouldBoundStudioAgentGatewayCall: () => true,
		streamTextViaGateway: async ({ onTextDelta }) => {
			onTextDelta("Partial");
		},
		withStudioAgentGatewayFallbackTimeout: async (_promise, receivedTimeoutMs) => {
			timeoutMs = receivedTimeoutMs;
			return { timedOut: true, value: "" };
		},
		writeAIGatewayFinalOutput: (options) => {
			finalOptions = options;
			return { ok: true };
		},
		writer,
	}));

	assert.equal(timeoutMs, 12_000);
	assert.equal(traceInput.isFollowUpTurn, true);
	assert.equal(finalOptions.bufferedText, "Partial");
	assert.equal(finalOptions.isFirstAgentCreationTurn, false);
	assert.match(logger.warnings[0][0], /timed out/u);
	assert.deepEqual(logger.warnings[0][1], {
		timeoutMs: 12_000,
		threadId: "thread-1",
	});
});
