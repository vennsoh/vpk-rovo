const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRovoAppArtifactToolResponseStreamer,
} = require("./rovo-app-artifact-tool-response");
const {
	ACTIVE_WORK_ITEM_CONTEXT_END,
	ACTIVE_WORK_ITEM_CONTEXT_START,
} = require("../../lib/work-item-report-intent");

function createHarness(overrides = {}) {
	const calls = [];
	const writes = [];
	const dependencies = {
		createUIMessageStream: (options) => ({ options }),
		createUIMessageStreamResponse: ({ stream }) => ({
			stream,
			run: async () => {
				await stream.options.execute({
					writer: {
						write: (part) => writes.push(part),
					},
				});
				return writes;
			},
		}),
		generateAndPersistRovoAppArtifact: async (input) => {
			calls.push(["generateAndPersistRovoAppArtifact", input]);
			const content = await input.generateArtifactText({
				onTextDelta: (delta) => calls.push(["persistDelta", delta]),
			});
			return {
				contentToPersist: content,
				persistedArtifactDocument: {
					id: input.artifactDocument.id,
					threadId: "thread-1",
					title: "Final artifact",
					kind: input.artifactDocument.kind,
				},
				titleChanged: true,
				kindChanged: false,
			};
		},
		generateRovoAppArtifactText: async (options) => {
			calls.push(["generateRovoAppArtifactText", options]);
			options.onTextDelta?.("generated delta");
			return "generated body";
		},
		generateRovoAppArtifactTitleFromContent: async (options) => {
			calls.push(["generateRovoAppArtifactTitleFromContent", options]);
			return null;
		},
		generateSuggestedQuestions: async (options) => {
			calls.push(["generateSuggestedQuestions", options]);
			return ["What should change next?"];
		},
		generateTextViaGateway: async (options) => {
			calls.push(["generateTextViaGateway", options]);
			return "gateway text";
		},
		generateWorkItemVpkHtmlReport: async (options) => {
			calls.push(["generateWorkItemVpkHtmlReport", options]);
			await options.generateText({ prompt: "extract fields" });
			return {
				html: "<!doctype html><html><body><h1>Report</h1></body></html>",
			};
		},
		logger: {
			warn: (...args) => calls.push(["warn", args]),
		},
		rovoAppDocumentManager: {
			appendDocumentVersion: async () => null,
			deleteDocument: async (documentId) => {
				calls.push(["deleteDocument", documentId]);
			},
			finalizeDocumentShell: async () => null,
		},
		rovoAppThreadManager: {
			updateThread: async (threadId, patch) => {
				calls.push(["updateThread", threadId, patch]);
			},
		},
		...overrides,
	};
	const {
		streamRovoAppArtifactToolResponse,
	} = createRovoAppArtifactToolResponseStreamer(dependencies);

	return {
		calls,
		streamRovoAppArtifactToolResponse,
		writes,
	};
}

function createBaseRequest(overrides = {}) {
	return {
		artifactAction: "createDocument",
		artifactBackendPreference: "ai-gateway",
		artifactDocument: {
			id: "doc-1",
			title: "Draft artifact",
			kind: "text",
		},
		artifactThreadId: "thread-1",
		cancelStreaming: false,
		changeLabel: "Created",
		contextDescription: null,
		conversationHistory: [{ type: "user", content: "Earlier request" }],
		latestUserMessage: "Create a short artifact",
		previousActiveDocumentId: "previous-doc",
		provider: "openai",
		requestOrigin: "text",
		signal: null,
		...overrides,
	};
}

test("artifact tool response streams deterministic content and artifact result", async () => {
	const { calls, streamRovoAppArtifactToolResponse, writes } = createHarness();

	const response = streamRovoAppArtifactToolResponse(createBaseRequest({
		deterministicArtifactContent: "Deterministic body",
	}));
	await response.run();

	assert.deepEqual(
		writes.map((part) => part.type),
		[
			"data-thinking-status",
			"data-kind",
			"data-id",
			"data-title",
			"data-clear",
			"data-textDelta",
			"data-title",
			"data-finish",
			"data-artifact-result",
			"text-start",
			"text-delta",
			"text-end",
			"data-route-decision",
			"data-turn-complete",
			"data-suggested-questions",
		],
	);
	assert.equal(writes.find((part) => part.type === "data-textDelta").data, "Deterministic body");
	assert.deepEqual(writes.find((part) => part.type === "data-artifact-result").data, {
		action: "create",
		documentId: "doc-1",
		kind: "text",
		threadId: "thread-1",
		title: "Final artifact",
	});
	assert.equal(
		writes.find((part) => part.type === "text-delta").delta,
		"Created artifact \"Final artifact\".",
	);
	assert.deepEqual(
		writes.find((part) => part.type === "data-suggested-questions").data.questions,
		["What should change next?"],
	);
	assert.equal(
		calls.some((call) => call[0] === "generateRovoAppArtifactText"),
		false,
	);
	assert.deepEqual(calls.find((call) => call[0] === "persistDelta"), [
		"persistDelta",
		"Deterministic body",
	]);
});

test("artifact tool response routes active Work Item HTML reports through AI Gateway", async () => {
	const activeWorkItemContext = [
		ACTIVE_WORK_ITEM_CONTEXT_START,
		"Key: RFP-101",
		"Title: Qualify inbound Acme Mobility RFP",
		ACTIVE_WORK_ITEM_CONTEXT_END,
	].join("\n");
	const { calls, streamRovoAppArtifactToolResponse, writes } = createHarness();

	const response = streamRovoAppArtifactToolResponse(createBaseRequest({
		artifactDocument: {
			id: "doc-html",
			title: "Work Item Report",
			kind: "html",
		},
		contextDescription: activeWorkItemContext,
		latestUserMessage: "create an HTML report for this work item",
	}));
	await response.run();

	assert.equal(
		calls.some((call) => call[0] === "generateWorkItemVpkHtmlReport"),
		true,
	);
	assert.equal(
		calls.some((call) => call[0] === "generateRovoAppArtifactText"),
		false,
	);
	assert.deepEqual(
		calls.find((call) => call[0] === "generateTextViaGateway")[1],
		{
			prompt: "extract fields",
			backendPreference: "ai-gateway",
			provider: "openai",
			signal: null,
		},
	);
	assert.equal(
		writes.find((part) => part.type === "data-textDelta").data,
		"<!doctype html><html><body><h1>Report</h1></body></html>",
	);
	assert.equal(
		writes.find((part) => part.type === "text-delta").delta,
		"Created report: Final artifact.",
	);
});

test("artifact tool response cleans up create shells when persistence fails", async () => {
	const failure = new Error("artifact generation failed");
	const { calls, streamRovoAppArtifactToolResponse } = createHarness({
		generateAndPersistRovoAppArtifact: async (input) => {
			await input.onCreateFailure({ error: failure });
			throw failure;
		},
	});

	const response = streamRovoAppArtifactToolResponse(createBaseRequest());
	await assert.rejects(response.run(), /artifact generation failed/u);

	assert.deepEqual(calls.find((call) => call[0] === "deleteDocument"), [
		"deleteDocument",
		"doc-1",
	]);
	assert.deepEqual(calls.find((call) => call[0] === "updateThread"), [
		"updateThread",
		"thread-1",
		{ activeDocumentId: "previous-doc" },
	]);
});
