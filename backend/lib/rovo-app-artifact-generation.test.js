const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildRovoAppArtifactContext,
	buildRovoAppArtifactSystemPrompt,
	createRovoAppArtifactGenerationService,
	deriveRovoAppArtifactDeltaType,
	shouldUseWorkItemVpkHtmlReportGenerator,
} = require("./rovo-app-artifact-generation");
const {
	ACTIVE_WORK_ITEM_CONTEXT_END,
	ACTIVE_WORK_ITEM_CONTEXT_START,
} = require("../../lib/work-item-report-intent");

function createHarness({
	generatedTitle = "\"Generated Title.\"",
	gatewayDecision = "{\"action\":\"createDocument\",\"title\":\"Plan\",\"kind\":\"text\"}",
	streamFailures = [],
	streamText = "artifact text",
} = {}) {
	const calls = [];
	const warnings = [];
	const service = createRovoAppArtifactGenerationService({
		aiGatewayProvider: {
			generateText: async (options) => {
				calls.push(["aiGateway.generateText", options]);
				if (generatedTitle instanceof Error) {
					throw generatedTitle;
				}
				return generatedTitle;
			},
		},
		generateTextViaGateway: async (options) => {
			calls.push(["generateTextViaGateway", options]);
			return gatewayDecision;
		},
		logger: {
			warn: (...args) => warnings.push(args),
		},
		rovoCancelChat: async () => {
			calls.push(["rovoCancelChat"]);
		},
		streamTextViaGateway: async (options) => {
			calls.push(["streamTextViaGateway", options]);
			const nextFailure = streamFailures.shift();
			if (nextFailure) {
				throw nextFailure;
			}
			if (typeof options.onTextDelta === "function") {
				options.onTextDelta("delta");
			}
			return streamText;
		},
	});

	return {
		calls,
		service,
		warnings,
	};
}

test("buildRovoAppArtifactContext returns bounded editable artifact context", () => {
	assert.equal(buildRovoAppArtifactContext(null), null);
	assert.equal(buildRovoAppArtifactContext({ title: "Draft" }), null);
	assert.equal(
		buildRovoAppArtifactContext({
			title: "Draft",
			kind: "html",
			content: "Body",
		}),
		[
			"[FUTURE CHAT ARTIFACT CONTEXT]",
			"Active artifact title: Draft",
			"Active artifact kind: html",
			"Treat the following artifact content as editable working context for the user's next request.",
			"Body",
			"[END FUTURE CHAT ARTIFACT CONTEXT]",
		].join("\n"),
	);
});

test("buildRovoAppArtifactSystemPrompt preserves kind-specific instructions", () => {
	assert.match(
		buildRovoAppArtifactSystemPrompt({
			mode: "create",
			title: "Report",
			kind: "html",
		}),
		/offline single-file HTML/u,
	);
	assert.match(
		buildRovoAppArtifactSystemPrompt({
			mode: "update",
			title: "Tool",
			kind: "code",
		}),
		/Return only the completed code artifact/u,
	);
	assert.match(
		buildRovoAppArtifactSystemPrompt({
			mode: "create",
			title: "Diagram",
			kind: "excalidraw",
		}),
		/Excalidraw/u,
	);
});

test("artifact generation streams non-excalidraw artifact text with normalized history", async () => {
	const { calls, service } = createHarness();
	const deltas = [];

	const text = await service.generateRovoAppArtifactText({
		mode: "create",
		title: "Plan",
		kind: "text",
		latestUserMessage: "Write a plan",
		conversationHistory: [
			{ type: "assistant", content: "Earlier answer" },
			{ type: "user", content: "Earlier request" },
		],
		contextDescription: "Context",
		provider: "openai",
		backendPreference: "ai-gateway",
		onTextDelta: (delta) => deltas.push(delta),
	});

	assert.equal(text, "artifact text");
	assert.deepEqual(deltas, ["delta"]);
	const call = calls.find((entry) => entry[0] === "streamTextViaGateway")[1];
	assert.match(call.system, /generating a new text artifact/u);
	assert.equal(call.prompt, "Context\n\nUser request:\nWrite a plan");
	assert.deepEqual(call.messages, [
		{ role: "assistant", content: "Earlier answer" },
		{ role: "user", content: "Earlier request" },
	]);
	assert.equal(call.maxOutputTokens, 1800);
	assert.equal(call.temperature, 0.35);
	assert.equal(call.backendPreference, "ai-gateway");
});

test("artifact generation retries pending deferred tool errors and cancels stale Rovo turns", async () => {
	const { calls, service, warnings } = createHarness({
		streamFailures: [new Error("pending deferred tool request")],
	});

	const text = await service.generateRovoAppArtifactText({
		mode: "create",
		title: "Plan",
		kind: "text",
		latestUserMessage: "Write a plan",
		backendPreference: "rovo",
	});

	assert.equal(text, "artifact text");
	assert.equal(calls.filter((call) => call[0] === "streamTextViaGateway").length, 2);
	assert.equal(calls.some((call) => call[0] === "rovoCancelChat"), true);
	assert.equal(warnings.some((warning) => /clearing Rovo chat state/u.test(warning[0])), true);
});

test("artifact generation retries AI Gateway pending deferred errors without cancelling Rovo", async () => {
	const { calls, service } = createHarness({
		streamFailures: [new Error("pending deferred tool request")],
	});

	const text = await service.generateRovoAppArtifactText({
		mode: "create",
		title: "Plan",
		kind: "html",
		latestUserMessage: "Write a report",
		backendPreference: "ai-gateway",
	});

	assert.equal(text, "artifact text");
	assert.equal(calls.filter((call) => call[0] === "streamTextViaGateway").length, 2);
	assert.equal(calls.some((call) => call[0] === "rovoCancelChat"), false);
});

test("excalidraw artifact generation forces AI Gateway and validates scene JSON", async () => {
	const scene = JSON.stringify({
		type: "excalidraw",
		version: 2,
		elements: [{ id: "shape-1", type: "rectangle", x: 0, y: 0 }],
	});
	const { calls, service } = createHarness({ gatewayDecision: scene });
	const deltas = [];

	const text = await service.generateRovoAppArtifactText({
		mode: "create",
		title: "Diagram",
		kind: "excalidraw",
		latestUserMessage: "Draw a diagram",
		backendPreference: "rovo",
		onTextDelta: (delta) => deltas.push(delta),
	});

	const parsedScene = JSON.parse(text);
	assert.deepEqual(parsedScene, {
		type: "excalidraw",
		version: 2,
		source: "rovo",
		appState: { viewBackgroundColor: "#ffffff" },
		elements: [{ id: "shape-1", type: "rectangle", x: 0, y: 0 }],
	});
	assert.deepEqual(deltas, [text]);
	const call = calls.find((entry) => entry[0] === "generateTextViaGateway")[1];
	assert.equal(call.backendPreference, "ai-gateway");
	assert.equal(call.temperature, 0.2);
	assert.equal(call.maxOutputTokens, 3200);

	const failingHarness = createHarness({ gatewayDecision: "{}" });
	await assert.rejects(
		failingHarness.service.generateRovoAppArtifactText({
			mode: "create",
			title: "Diagram",
			kind: "excalidraw",
			latestUserMessage: "Draw",
		}),
		/invalid scene JSON/u,
	);
});

test("artifact title generation uses AI Gateway and sanitizes fallback failures", async () => {
	const { calls, service } = createHarness();

	assert.equal(
		await service.generateRovoAppArtifactTitleFromContent({
			content: "# Long document",
			provider: "openai",
		}),
		"Generated Title",
	);
	assert.equal(calls.find((call) => call[0] === "aiGateway.generateText")[1].maxOutputTokens, 30);

	const failingHarness = createHarness({
		generatedTitle: new Error("gateway down"),
	});
	assert.equal(
		await failingHarness.service.generateRovoAppArtifactTitleFromContent({
			content: "Body",
		}),
		null,
	);
	assert.equal(
		await failingHarness.service.generateRovoAppArtifactTitleFromContent({
			content: "",
		}),
		null,
	);
});

test("artifact kind, delta type, and Work Item report routing preserve existing rules", () => {
	const { service } = createHarness();
	const activeWorkItemContext = [
		ACTIVE_WORK_ITEM_CONTEXT_START,
		"Key: VPK-1",
		"Title: Architecture cleanup",
		ACTIVE_WORK_ITEM_CONTEXT_END,
	].join("\n");

	assert.equal(service.resolveRovoAppArtifactKind({
		action: "updateDocument",
		activeArtifact: { kind: "html" },
		decisionKind: null,
	}), "html");
	assert.equal(service.resolveRovoAppArtifactKind({
		action: "createDocument",
		decisionKind: "sheet",
	}), "sheet");
	assert.equal(deriveRovoAppArtifactDeltaType("code"), "data-codeDelta");
	assert.equal(deriveRovoAppArtifactDeltaType("html"), "data-textDelta");
	assert.equal(shouldUseWorkItemVpkHtmlReportGenerator({
		artifactKind: "html",
		contextDescription: activeWorkItemContext,
		latestUserMessage: "create an HTML report for this work item",
	}), true);
	assert.equal(shouldUseWorkItemVpkHtmlReportGenerator({
		artifactKind: "text",
		contextDescription: activeWorkItemContext,
		latestUserMessage: "create an HTML report for this work item",
	}), false);
});

test("artifact decision delegates classification to AI Gateway and preserves same-version updates", async () => {
	const { calls, service } = createHarness({
		gatewayDecision: "{\"action\":\"createDocument\",\"title\":\"New title\",\"kind\":\"text\"}",
	});

	const decision = await service.resolveRovoAppArtifactDecision({
		activeArtifact: {
			id: "doc-1",
			title: "Existing title",
			kind: "html",
		},
		conversationHistory: [],
		latestUserMessage: "update this same artifact",
		provider: "openai",
		streamingArtifact: { id: "stream-1" },
	});

	assert.deepEqual(decision, {
		action: "updateDocument",
		title: "New title",
		kind: "text",
		cancelStreaming: true,
	});
	const call = calls.find((entry) => entry[0] === "generateTextViaGateway")[1];
	assert.equal(call.backendPreference, "ai-gateway");
	assert.match(call.system, /strict JSON/u);

	const failingHarness = createHarness({ gatewayDecision: "not json" });
	await assert.rejects(
		failingHarness.service.resolveRovoAppArtifactDecision({
			conversationHistory: [],
			latestUserMessage: "make a document",
		}),
		/unparseable result/u,
	);
});
