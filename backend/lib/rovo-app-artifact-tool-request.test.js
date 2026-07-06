const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRovoAppArtifactToolRequestHandler,
} = require("./rovo-app-artifact-tool-request");

function createHarness(overrides = {}) {
	const calls = [];
	const dependencies = {
		logger: {
			info: (...args) => calls.push(["info", args]),
			warn: (...args) => calls.push(["warn", args]),
		},
		mapUiMessagesToConversation: () => ({
			message: "Create an artifact",
			conversationHistory: [{ type: "user", content: "Create an artifact" }],
		}),
		resolveRovoAppArtifactDecision: async () => {
			calls.push(["resolveRovoAppArtifactDecision"]);
			return {
				action: "createDocument",
				title: "Generated title",
				kind: "text",
				cancelStreaming: null,
			};
		},
		resolveRovoAppArtifactKind: (input) => {
			calls.push(["resolveRovoAppArtifactKind", input]);
			return input.decisionKind || input.activeArtifact?.kind || "text";
		},
		rovoAppDocumentManager: {
			appendDocumentVersion: async (documentId, version) => {
				calls.push(["appendDocumentVersion", documentId, version]);
			},
			createDocumentShell: async (input) => {
				calls.push(["createDocumentShell", input]);
				return {
					id: "doc-shell",
					title: input.title,
					kind: input.kind,
				};
			},
			getDocument: async (documentId) => {
				calls.push(["getDocument", documentId]);
				return null;
			},
		},
		rovoAppThreadManager: {
			updateThread: async (threadId, patch) => {
				calls.push(["updateThread", threadId, patch]);
			},
		},
		streamRovoAppArtifactToolResponse: (input) => {
			calls.push(["streamRovoAppArtifactToolResponse", input]);
			return { response: true };
		},
		...overrides,
	};
	const {
		handleRovoAppArtifactToolRequest,
	} = createRovoAppArtifactToolRequestHandler(dependencies);

	return {
		calls,
		handleRovoAppArtifactToolRequest,
	};
}

function createBaseRequest(overrides = {}) {
	return {
		artifactBackendPreference: "ai-gateway",
		contextDescription: "Existing context",
		requestBody: {
			messages: [],
			provider: "openai",
		},
		requestOrigin: "text",
		signal: null,
		threadId: "thread-1",
		...overrides,
	};
}

test("artifact request handler creates document shells from legacy artifact fields", async () => {
	const { calls, handleRovoAppArtifactToolRequest } = createHarness({
		resolveRovoAppArtifactDecision: async () => {
			throw new Error("legacy artifact fields should skip classifier");
		},
	});

	const result = await handleRovoAppArtifactToolRequest(createBaseRequest({
		requestBody: {
			futureArtifactKind: "markdown",
			futureArtifactMode: "create",
			futureArtifactTitle: "Legacy title",
			messages: [],
			provider: "openai",
		},
	}));

	assert.equal(result.handled, true);
	assert.deepEqual(calls.find((call) => call[0] === "createDocumentShell"), [
		"createDocumentShell",
		{
			threadId: "thread-1",
			title: "Legacy title",
			kind: "text",
		},
	]);
	assert.deepEqual(calls.find((call) => call[0] === "updateThread"), [
		"updateThread",
		"thread-1",
		{ activeDocumentId: "doc-shell" },
	]);
	assert.equal(
		calls.some((call) => call[0] === "resolveRovoAppArtifactDecision"),
		false,
	);
	assert.deepEqual(
		calls.find((call) => call[0] === "streamRovoAppArtifactToolResponse")[1],
		{
			artifactAction: "createDocument",
			artifactBackendPreference: "ai-gateway",
			artifactDocument: {
				id: "doc-shell",
				title: "Legacy title",
				kind: "text",
			},
			artifactThreadId: "thread-1",
			cancelStreaming: null,
			changeLabel: "Created",
			contextDescription: "Existing context",
			conversationHistory: [{ type: "user", content: "Create an artifact" }],
			deterministicArtifactContent: null,
			latestUserMessage: "Create an artifact",
			previousActiveDocumentId: null,
			provider: "openai",
			requestOrigin: "text",
			signal: null,
		},
	);
});

test("artifact request handler updates active documents and preserves replaced partial streams", async () => {
	const { calls, handleRovoAppArtifactToolRequest } = createHarness({
		mapUiMessagesToConversation: () => ({
			message: "Rewrite this report",
			conversationHistory: [{ type: "user", content: "Rewrite this report" }],
		}),
		resolveRovoAppArtifactDecision: async () => ({
			action: "updateDocument",
			title: "Updated report",
			kind: "html",
			cancelStreaming: true,
		}),
		rovoAppDocumentManager: {
			appendDocumentVersion: async (documentId, version) => {
				calls.push(["appendDocumentVersion", documentId, version]);
			},
			createDocumentShell: async () => {
				throw new Error("update should not create a shell");
			},
			getDocument: async (documentId) => {
				calls.push(["getDocument", documentId]);
				return {
					id: documentId,
					threadId: "thread-1",
					title: "Existing report",
					kind: "html",
					versions: [{ content: "<!doctype html><html><body>Old</body></html>" }],
				};
			},
		},
	});

	const result = await handleRovoAppArtifactToolRequest(createBaseRequest({
		activeArtifact: {
			id: "doc-1",
			title: "Existing report",
			kind: "html",
			content: "<!doctype html><html><body>Old</body></html>",
		},
		streamingArtifact: {
			id: "streaming-doc",
			title: "Streaming report",
			kind: "html",
			content: "<!doctype html><html><body>Partial</body></html>",
		},
	}));

	assert.equal(result.handled, true);
	assert.deepEqual(calls.find((call) => call[0] === "getDocument"), [
		"getDocument",
		"doc-1",
	]);
	assert.deepEqual(calls.find((call) => call[0] === "appendDocumentVersion"), [
		"appendDocumentVersion",
		"streaming-doc",
		{
			changeLabel: "Partial (replaced)",
			title: "Streaming report",
			kind: "html",
			content: "<!doctype html><html><body>Partial</body></html>",
		},
	]);
	const streamInput = calls.find((call) => call[0] === "streamRovoAppArtifactToolResponse")[1];
	assert.equal(streamInput.artifactAction, "updateDocument");
	assert.deepEqual(streamInput.artifactDocument, {
		id: "doc-1",
		title: "Updated report",
		kind: "html",
	});
	assert.equal(streamInput.cancelStreaming, true);
	assert.equal(streamInput.previousActiveDocumentId, "doc-1");
	assert.match(streamInput.contextDescription, /\[FUTURE CHAT ARTIFACT CONTEXT\]/u);
	assert.match(streamInput.contextDescription, /Existing context/u);
});

test("artifact request handler returns false for chat decisions", async () => {
	const { calls, handleRovoAppArtifactToolRequest } = createHarness({
		resolveRovoAppArtifactDecision: async () => ({
			action: "chat",
			title: null,
			kind: null,
			cancelStreaming: null,
		}),
	});

	const result = await handleRovoAppArtifactToolRequest(createBaseRequest());

	assert.equal(result, false);
	assert.equal(
		calls.some((call) => call[0] === "streamRovoAppArtifactToolResponse"),
		false,
	);
});
