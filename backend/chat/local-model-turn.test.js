const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildLocalModelErrorText,
	handleLocalModelTurn,
} = require("./local-model-turn");

function createHarness(overrides = {}) {
	const parts = [];
	let pipePromise = null;
	const calls = {
		pipe: 0,
		streamLocalModel: [],
	};
	const logger = {
		errors: [],
		infos: [],
		error(...args) {
			this.errors.push(args);
		},
		info(...args) {
			this.infos.push(args);
		},
	};

	return {
		calls,
		logger,
		parts,
		get pipePromise() {
			return pipePromise;
		},
		options: {
			conversationHistory: [{ role: "user", content: "Earlier" }],
			createUIMessageStream: (streamOptions) => streamOptions,
			isLocalModelRequest: (provider, model) =>
				provider === "local" || model === "local/qwen",
			latestUserMessage: "Hello local",
			logger,
			now: () => 0,
			pipeUIMessageStreamToResponse: ({ stream }) => {
				calls.pipe += 1;
				pipePromise = stream.execute({
					writer: {
						write(part) {
							parts.push(part);
						},
					},
				});
				return pipePromise;
			},
			provider: "local",
			rawModel: "local/qwen",
			res: {},
			streamLocalModel: async (input) => {
				calls.streamLocalModel.push(input);
				input.writer.write({ type: "text-start", id: "local-text" });
				input.writer.write({
					type: "text-delta",
					id: "local-text",
					delta: "Local response",
				});
				input.writer.write({ type: "text-end", id: "local-text" });
				input.writer.write({
					type: "data-turn-complete",
					data: { timestamp: "done" },
				});
			},
			...overrides,
		},
	};
}

test("buildLocalModelErrorText preserves the existing remediation text", () => {
	const text = buildLocalModelErrorText(new Error("server unavailable"));

	assert.match(text, /Local model error: server unavailable/u);
	assert.match(text, /mlx_lm\.server --model mlx-community\/Qwen3-0\.6B-MLX-8bit --port 8800/u);
});

test("handleLocalModelTurn returns false without piping non-local requests", () => {
	const harness = createHarness({
		provider: "openai",
		rawModel: "gpt",
	});

	assert.equal(handleLocalModelTurn(harness.options), false);
	assert.equal(harness.calls.pipe, 0);
	assert.deepEqual(harness.parts, []);
});

test("handleLocalModelTurn streams local model output with the existing inputs", async () => {
	const harness = createHarness();

	assert.equal(handleLocalModelTurn(harness.options), true);
	await harness.pipePromise;

	assert.equal(harness.calls.pipe, 1);
	assert.equal(harness.calls.streamLocalModel.length, 1);
	assert.equal(harness.calls.streamLocalModel[0].userMessage, "Hello local");
	assert.deepEqual(harness.calls.streamLocalModel[0].conversationHistory, [{
		role: "user",
		content: "Earlier",
	}]);
	assert.deepEqual(harness.parts.map((part) => part.type), [
		"text-start",
		"text-delta",
		"text-end",
		"data-turn-complete",
	]);
	assert.equal(harness.parts[1].delta, "Local response");
	assert.deepEqual(harness.logger.infos, [[
		"[CHAT-SDK] Routing through local MLX model",
		{ provider: "local", model: "local/qwen" },
	]]);
});

test("handleLocalModelTurn emits the existing local model fallback on stream failure", async () => {
	const harness = createHarness({
		streamLocalModel: async () => {
			throw new Error("server unavailable");
		},
	});

	assert.equal(handleLocalModelTurn(harness.options), true);
	await harness.pipePromise;

	assert.deepEqual(harness.parts.map((part) => part.type), [
		"text-start",
		"text-delta",
		"text-end",
		"data-turn-complete",
	]);
	assert.equal(harness.parts[0].id, "local-error-0");
	assert.match(harness.parts[1].delta, /Local model error: server unavailable/u);
	assert.deepEqual(harness.parts[3].data, {
		timestamp: "1970-01-01T00:00:00.000Z",
	});
	assert.equal(harness.logger.errors.length, 1);
});
