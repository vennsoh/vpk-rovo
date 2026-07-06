const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	buildActiveArtifactMetadata,
	buildRecentHistory,
	buildRovoAppChatRequestBody,
	resolveActiveArtifactContext,
} = loadRovoCoreModule("lib/rovo-app-chat-request-body.ts");

function createTextMessage(id, role, text) {
	return {
		id,
		role,
		parts: [{ type: "text", text }],
	};
}

function createDocument(id, updatedAt, overrides = {}) {
	return {
		id,
		threadId: "thread-1",
		title: id,
		kind: "text",
		sourceMessageId: null,
		createdAt: updatedAt,
		updatedAt,
		versions: [],
		...overrides,
	};
}

test("context and history helpers preserve route-hook payload shape", () => {
	const activeDocument = createDocument("doc-1", "2026-07-03T00:00:00.000Z", {
		kind: "code",
		title: "App",
	});
	const streamingArtifact = {
		content: "streamed content",
		documentId: "doc-stream",
		kind: "text",
		messageId: "message-1",
		state: "streaming",
		threadId: "thread-1",
		title: "Stream",
		versionId: "version-1",
	};

	assert.deepEqual(resolveActiveArtifactContext(activeDocument, "draft", "persisted", null), {
		content: "draft",
		id: "doc-1",
		kind: "code",
		title: "App",
	});
	assert.deepEqual(resolveActiveArtifactContext(null, "", "", streamingArtifact), {
		content: "streamed content",
		id: "doc-stream",
		kind: "text",
		title: "Stream",
	});
	assert.deepEqual(buildRecentHistory([
		createTextMessage("system-1", "system", "ignore"),
		createTextMessage("user-1", "user", "Hello"),
		createTextMessage("assistant-1", "assistant", "Hi"),
	]), [
		{ role: "user", content: "Hello" },
		{ role: "assistant", content: "Hi" },
	]);
	assert.deepEqual(buildActiveArtifactMetadata(activeDocument), {
		id: "doc-1",
		kind: "code",
		title: "App",
	});
});

test("chat request body builder keeps plain chat light and rich chat contextual", () => {
	const activeDocument = createDocument("doc-1", "2026-07-03T00:00:00.000Z", {
		title: "Artifact",
	});
	const smartGenerationRequest = {
		enabled: true,
		surface: "rovo",
	};

	const plainBody = buildRovoAppChatRequestBody({
		activeDocument: null,
		activeDocumentContent: "",
		activeDocumentId: null,
		artifactDraftContent: "",
		body: {},
		isPlanModeActive: false,
		isVoiceModeActive: false,
		messages: [createTextMessage("user-1", "user", "hello")],
		pendingArtifactCreationRetry: false,
		runtimeThreadId: "thread-1",
		smartGenerationRequest,
		streamingArtifact: null,
		threadVisibility: "private",
	});

	assert.equal(plainBody.smartGeneration, undefined);
	assert.equal(plainBody.activeDocumentId, null);
	assert.equal(plainBody.origin, "text");
	assert.equal(plainBody.isPlanMode, false);
	assert.equal(
		buildRovoAppChatRequestBody({
			activeDocument: null,
			activeDocumentContent: "",
			activeDocumentId: null,
			artifactDraftContent: "",
			body: { creationMode: "agent" },
			isPlanModeActive: false,
			isVoiceModeActive: false,
			messages: [createTextMessage("user-1", "user", "hello")],
			pendingArtifactCreationRetry: false,
			runtimeThreadId: "thread-1",
			streamingArtifact: null,
			threadVisibility: "private",
		}).creationMode,
		undefined,
	);
	assert.equal(
		buildRovoAppChatRequestBody({
			activeDocument: null,
			activeDocumentContent: "",
			activeDocumentId: null,
			artifactDraftContent: "",
			body: { creationMode: "project" },
			includeCreationMode: true,
			isPlanModeActive: false,
			isVoiceModeActive: false,
			messages: [createTextMessage("user-1", "user", "hello")],
			pendingArtifactCreationRetry: false,
			runtimeThreadId: "thread-1",
			streamingArtifact: null,
			threadVisibility: "private",
		}).creationMode,
		undefined,
	);

	const richBody = buildRovoAppChatRequestBody({
		activeDocument,
		activeDocumentContent: "persisted artifact",
		activeDocumentId: "doc-1",
		artifactDraftContent: "draft artifact",
		body: {
			creationMode: "agent",
			id: "explicit-thread",
			isPlanMode: true,
			origin: "voice",
		},
		chatSdkSource: "studio",
		includeCreationMode: true,
		isPlanModeActive: false,
		isVoiceModeActive: false,
		messages: [createTextMessage("user-1", "user", "Build a dashboard")],
		pendingArtifactCreationRetry: true,
		runtimeThreadId: "thread-1",
		smartGenerationRequest,
		streamingArtifact: null,
		threadVisibility: "public",
	});

	assert.equal(richBody.activeDocumentId, "doc-1");
	assert.deepEqual(richBody.artifactContext, {
		content: "draft artifact",
		id: "doc-1",
		kind: "text",
		title: "Artifact",
	});
	assert.equal(richBody.artifactCreationRetry, true);
	assert.equal(richBody.chatSdkSource, "studio");
	assert.equal(richBody.contextDescription.includes("Plan mode is enabled."), true);
	assert.equal(richBody.creationMode, "agent");
	assert.equal(richBody.id, "explicit-thread");
	assert.equal(richBody.isPlanMode, true);
	assert.equal(richBody.origin, "voice");
	assert.equal(richBody.smartGeneration, smartGenerationRequest);
	assert.equal(richBody.visibility, "public");
});
