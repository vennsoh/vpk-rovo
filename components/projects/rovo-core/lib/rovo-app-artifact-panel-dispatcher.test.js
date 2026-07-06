const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	buildRovoAppPlanDocument,
	deleteRovoAppDocumentWithLifecycle,
	hideRovoAppArtifactPane,
	hydrateRovoAppPersistedArtifact,
	openRovoAppArtifactFromMessage,
	openRovoAppDocument,
	openRovoAppPlanAsDocument,
	persistRovoAppActiveDocumentSelection,
	resolveRovoAppCompletedArtifactAutoOpen,
	resolveRovoAppStreamingArtifactAutoOpenPlan,
	ROVO_APP_STREAMING_ARTIFACT_AUTO_OPEN_DELAY_MS,
	saveRovoAppArtifactDraft,
	saveRovoAppStreamingArtifactCheckpoint,
	shouldOpenDelayedRovoAppStreamingArtifact,
} = loadRovoCoreModule("lib/rovo-app-artifact-panel-dispatcher.ts");

function createTextMessage(id, text) {
	return {
		id,
		role: "assistant",
		parts: [{ type: "text", text }],
	};
}

function createDocument(id, overrides = {}) {
	return {
		id,
		threadId: "thread-1",
		title: id,
		kind: "text",
		sourceMessageId: null,
		createdAt: "2026-07-04T00:00:00.000Z",
		updatedAt: "2026-07-04T00:00:00.000Z",
		versions: [],
		...overrides,
	};
}

function createThread(id, overrides = {}) {
	return {
		id,
		title: id,
		visibility: "private",
		messages: [],
		createdAt: "2026-07-04T00:00:00.000Z",
		updatedAt: "2026-07-04T00:00:00.000Z",
		activeDocumentId: null,
		...overrides,
	};
}

function createStreamingArtifact(overrides = {}) {
	return {
		content: "x".repeat(400),
		documentId: "doc-streaming",
		createdAt: "2026-07-04T00:00:00.000Z",
		kind: "text",
		status: "streaming",
		title: "Draft",
		updatedAt: "2026-07-04T00:00:00.000Z",
		...overrides,
	};
}

function createPanelRecorder() {
	const calls = [];
	return {
		calls,
		selectDocumentForDisplay(document) {
			calls.push(["selectDocumentForDisplay", document.id]);
		},
		setActiveDocumentId(documentId) {
			calls.push(["setActiveDocumentId", documentId]);
		},
		setArtifactMode(mode) {
			calls.push(["setArtifactMode", mode]);
		},
		setInputError(errorMessage) {
			calls.push(["setInputError", errorMessage]);
		},
		setPanelState(state) {
			calls.push(["setPanelState", state]);
		},
		setVisibleArtifactDocumentId(documentId) {
			calls.push(["setVisibleArtifactDocumentId", documentId]);
		},
	};
}

test("hideRovoAppArtifactPane suppresses auto-open only for the visible streaming document", () => {
	const recorder = createPanelRecorder();
	const suppressedDocumentIds = [];

	hideRovoAppArtifactPane({
		setPanelState: recorder.setPanelState,
		setSuppressedStreamingAutoOpenDocumentId(documentId) {
			suppressedDocumentIds.push(documentId);
		},
		setVisibleArtifactDocumentId: recorder.setVisibleArtifactDocumentId,
		streamingArtifact: {
			content: "Draft",
			documentId: "doc-streaming",
			createdAt: "2026-07-04T00:00:00.000Z",
			kind: "text",
			status: "streaming",
			title: "Draft",
			updatedAt: "2026-07-04T00:00:00.000Z",
		},
		visibleArtifactDocumentId: "doc-streaming",
	});

	assert.deepEqual(suppressedDocumentIds, ["doc-streaming"]);
	assert.deepEqual(recorder.calls, [
		["setVisibleArtifactDocumentId", null],
		["setPanelState", "closed"],
	]);

	const inactiveRecorder = createPanelRecorder();
	hideRovoAppArtifactPane({
		setPanelState: inactiveRecorder.setPanelState,
		setSuppressedStreamingAutoOpenDocumentId(documentId) {
			suppressedDocumentIds.push(documentId);
		},
		setVisibleArtifactDocumentId: inactiveRecorder.setVisibleArtifactDocumentId,
		streamingArtifact: {
			content: "Draft",
			documentId: "doc-other",
			createdAt: "2026-07-04T00:00:00.000Z",
			kind: "text",
			status: "streaming",
			title: "Draft",
			updatedAt: "2026-07-04T00:00:00.000Z",
		},
		visibleArtifactDocumentId: "doc-visible",
	});

	assert.deepEqual(suppressedDocumentIds, ["doc-streaming"]);
	assert.deepEqual(inactiveRecorder.calls, [
		["setVisibleArtifactDocumentId", null],
		["setPanelState", "closed"],
	]);
});

test("resolveRovoAppStreamingArtifactAutoOpenPlan opens only eligible streaming artifacts", () => {
	assert.equal(
		resolveRovoAppStreamingArtifactAutoOpenPlan({
			isHydratingThread: true,
			panelState: "closed",
			streamingArtifact: createStreamingArtifact(),
			suppressedDocumentId: null,
			visibleArtifactDocumentId: null,
		}),
		null,
	);
	assert.equal(
		resolveRovoAppStreamingArtifactAutoOpenPlan({
			isHydratingThread: false,
			panelState: "closed",
			streamingArtifact: createStreamingArtifact({ content: "short" }),
			suppressedDocumentId: null,
			visibleArtifactDocumentId: null,
		}),
		null,
	);
	assert.equal(
		resolveRovoAppStreamingArtifactAutoOpenPlan({
			isHydratingThread: false,
			panelState: "closed",
			streamingArtifact: createStreamingArtifact(),
			suppressedDocumentId: "doc-streaming",
			visibleArtifactDocumentId: null,
		}),
		null,
	);
	assert.equal(
		resolveRovoAppStreamingArtifactAutoOpenPlan({
			isHydratingThread: false,
			panelState: "closed",
			streamingArtifact: createStreamingArtifact(),
			suppressedDocumentId: null,
			visibleArtifactDocumentId: "doc-streaming",
		}),
		null,
	);

	const delayedPlan = resolveRovoAppStreamingArtifactAutoOpenPlan({
		isHydratingThread: false,
		now: Date.parse("2026-07-04T00:00:00.250Z"),
		panelState: "closed",
		streamingArtifact: createStreamingArtifact(),
		suppressedDocumentId: null,
		visibleArtifactDocumentId: null,
	});
	assert.deepEqual(delayedPlan, {
		delayMs: ROVO_APP_STREAMING_ARTIFACT_AUTO_OPEN_DELAY_MS - 250,
		documentId: "doc-streaming",
		shouldPreviewClosedPanel: true,
	});

	const immediatePlan = resolveRovoAppStreamingArtifactAutoOpenPlan({
		isHydratingThread: false,
		now: Date.parse("2026-07-04T00:00:00.800Z"),
		panelState: "preview",
		streamingArtifact: createStreamingArtifact(),
		suppressedDocumentId: null,
		visibleArtifactDocumentId: null,
	});
	assert.deepEqual(immediatePlan, {
		delayMs: 0,
		documentId: "doc-streaming",
		shouldPreviewClosedPanel: false,
	});
});

test("shouldOpenDelayedRovoAppStreamingArtifact rechecks current stream state", () => {
	assert.equal(
		shouldOpenDelayedRovoAppStreamingArtifact({
			documentId: "doc-streaming",
			streamingArtifact: createStreamingArtifact(),
			suppressedDocumentId: null,
		}),
		true,
	);
	assert.equal(
		shouldOpenDelayedRovoAppStreamingArtifact({
			documentId: "doc-streaming",
			streamingArtifact: createStreamingArtifact({ documentId: "doc-other" }),
			suppressedDocumentId: null,
		}),
		false,
	);
	assert.equal(
		shouldOpenDelayedRovoAppStreamingArtifact({
			documentId: "doc-streaming",
			streamingArtifact: createStreamingArtifact({ content: "short" }),
			suppressedDocumentId: null,
		}),
		false,
	);
	assert.equal(
		shouldOpenDelayedRovoAppStreamingArtifact({
			documentId: "doc-streaming",
			streamingArtifact: createStreamingArtifact(),
			suppressedDocumentId: "doc-streaming",
		}),
		false,
	);
});

test("resolveRovoAppCompletedArtifactAutoOpen opens completed artifacts only when visible", () => {
	const documents = [createDocument("doc-complete")];
	assert.equal(
		resolveRovoAppCompletedArtifactAutoOpen({
			completedDocumentId: "doc-complete",
			documents,
			isHydratingThread: false,
			isStreaming: false,
			suppressedDocumentId: null,
			visibleArtifactDocumentId: null,
		}),
		"doc-complete",
	);
	assert.equal(
		resolveRovoAppCompletedArtifactAutoOpen({
			completedDocumentId: "doc-complete",
			documents,
			isHydratingThread: false,
			isStreaming: true,
			suppressedDocumentId: null,
			visibleArtifactDocumentId: null,
		}),
		null,
	);
	assert.equal(
		resolveRovoAppCompletedArtifactAutoOpen({
			completedDocumentId: "doc-complete",
			documents,
			isHydratingThread: false,
			isStreaming: false,
			suppressedDocumentId: "doc-complete",
			visibleArtifactDocumentId: null,
		}),
		null,
	);
	assert.equal(
		resolveRovoAppCompletedArtifactAutoOpen({
			completedDocumentId: "doc-missing",
			documents,
			isHydratingThread: false,
			isStreaming: false,
			suppressedDocumentId: null,
			visibleArtifactDocumentId: null,
		}),
		null,
	);
});

test("openRovoAppArtifactFromMessage reopens existing source-message documents", async () => {
	const recorder = createPanelRecorder();
	const existingDocument = createDocument("doc-existing", {
		sourceMessageId: "message-1",
	});
	let ensuredWith = null;
	let saveCalls = 0;

	await openRovoAppArtifactFromMessage({
		documents: [existingDocument],
		ensureThread: async (seedText) => {
			ensuredWith = seedText;
			return "thread-1";
		},
		message: createTextMessage("message-1", "Build a report"),
		saveDocument: async () => {
			saveCalls += 1;
			return createDocument("unexpected");
		},
		selectDocumentForDisplay: recorder.selectDocumentForDisplay,
		setActiveDocumentId: recorder.setActiveDocumentId,
		setArtifactMode: recorder.setArtifactMode,
		setInputError: recorder.setInputError,
		setPanelState: recorder.setPanelState,
		setVisibleArtifactDocumentId: recorder.setVisibleArtifactDocumentId,
		toUserErrorMessage: (error) => `error:${String(error)}`,
	});

	assert.equal(ensuredWith, "Artifact context");
	assert.equal(saveCalls, 0);
	assert.deepEqual(recorder.calls, [
		["setActiveDocumentId", "doc-existing"],
		["setVisibleArtifactDocumentId", "doc-existing"],
		["setPanelState", "preview"],
		["setArtifactMode", "preview"],
	]);
});

test("openRovoAppArtifactFromMessage saves and selects new message artifacts", async () => {
	const recorder = createPanelRecorder();
	let savePayload = null;

	await openRovoAppArtifactFromMessage({
		documents: [],
		ensureThread: async () => "thread-2",
		message: createTextMessage("message-2", "Build a dashboard"),
		saveDocument: async (payload) => {
			savePayload = payload;
			return createDocument("doc-created", {
				sourceMessageId: payload.sourceMessageId,
				title: payload.title,
			});
		},
		selectDocumentForDisplay: recorder.selectDocumentForDisplay,
		setActiveDocumentId: recorder.setActiveDocumentId,
		setArtifactMode: recorder.setArtifactMode,
		setInputError: recorder.setInputError,
		setPanelState: recorder.setPanelState,
		setVisibleArtifactDocumentId: recorder.setVisibleArtifactDocumentId,
		toUserErrorMessage: (error) => `error:${String(error)}`,
	});

	assert.deepEqual(savePayload, {
		threadId: "thread-2",
		title: "Build a dashboard",
		kind: "text",
		content: "Build a dashboard",
		sourceMessageId: "message-2",
	});
	assert.deepEqual(recorder.calls, [
		["selectDocumentForDisplay", "doc-created"],
		["setVisibleArtifactDocumentId", "doc-created"],
		["setPanelState", "preview"],
	]);
});

test("openRovoAppArtifactFromMessage ignores empty messages and reports save errors", async () => {
	const emptyRecorder = createPanelRecorder();
	await openRovoAppArtifactFromMessage({
		documents: [],
		ensureThread: async () => "thread-1",
		message: { id: "empty", role: "assistant", parts: [] },
		saveDocument: async () => createDocument("unexpected"),
		selectDocumentForDisplay: emptyRecorder.selectDocumentForDisplay,
		setActiveDocumentId: emptyRecorder.setActiveDocumentId,
		setArtifactMode: emptyRecorder.setArtifactMode,
		setInputError: emptyRecorder.setInputError,
		setPanelState: emptyRecorder.setPanelState,
		setVisibleArtifactDocumentId: emptyRecorder.setVisibleArtifactDocumentId,
		toUserErrorMessage: (error) => `error:${String(error)}`,
	});
	assert.deepEqual(emptyRecorder.calls, []);

	const errorRecorder = createPanelRecorder();
	await openRovoAppArtifactFromMessage({
		documents: [],
		ensureThread: async () => "thread-1",
		message: createTextMessage("message-3", "Broken artifact"),
		saveDocument: async () => {
			throw new Error("save failed");
		},
		selectDocumentForDisplay: errorRecorder.selectDocumentForDisplay,
		setActiveDocumentId: errorRecorder.setActiveDocumentId,
		setArtifactMode: errorRecorder.setArtifactMode,
		setInputError: errorRecorder.setInputError,
		setPanelState: errorRecorder.setPanelState,
		setVisibleArtifactDocumentId: errorRecorder.setVisibleArtifactDocumentId,
		toUserErrorMessage: (error) => error.message,
	});
	assert.deepEqual(errorRecorder.calls, [["setInputError", "save failed"]]);
});

test("openRovoAppDocument selects cached documents or hydrates missing documents", async () => {
	const cachedRecorder = createPanelRecorder();
	await openRovoAppDocument({
		documentId: "doc-cached",
		documents: [createDocument("doc-cached")],
		hydratePersistedArtifact: async () => {
			throw new Error("should not hydrate cached documents");
		},
		selectDocumentForDisplay: cachedRecorder.selectDocumentForDisplay,
		setPanelState: cachedRecorder.setPanelState,
		setVisibleArtifactDocumentId: cachedRecorder.setVisibleArtifactDocumentId,
	});
	assert.deepEqual(cachedRecorder.calls, [
		["selectDocumentForDisplay", "doc-cached"],
		["setVisibleArtifactDocumentId", "doc-cached"],
		["setPanelState", "preview"],
	]);

	const missingRecorder = createPanelRecorder();
	let hydratedDocumentId = null;
	await openRovoAppDocument({
		documentId: "doc-missing",
		documents: [],
		hydratePersistedArtifact: async (documentId) => {
			hydratedDocumentId = documentId;
		},
		selectDocumentForDisplay: missingRecorder.selectDocumentForDisplay,
		setPanelState: missingRecorder.setPanelState,
		setVisibleArtifactDocumentId: missingRecorder.setVisibleArtifactDocumentId,
	});
	assert.equal(hydratedDocumentId, "doc-missing");
	assert.deepEqual(missingRecorder.calls, [
		["setVisibleArtifactDocumentId", "doc-missing"],
		["setPanelState", "preview"],
	]);
});

test("persistRovoAppActiveDocumentSelection updates the active thread record", async () => {
	let threads = [createThread("thread-1", { activeDocumentId: "old-doc" })];
	let updatePayload = null;

	await persistRovoAppActiveDocumentSelection({
		activeThreadId: "thread-1",
		deletedThreadIds: new Set(),
		documentId: "doc-active",
		reconcileThreadWithLocalTitle(thread) {
			return { ...thread, title: "Resolved title" };
		},
		setThreads(nextThreads) {
			threads =
				typeof nextThreads === "function"
					? nextThreads(threads)
					: nextThreads;
		},
		toUserErrorMessage: (error) => error.message,
		updateThread: async (threadId, payload) => {
			updatePayload = { threadId, payload };
			return createThread(threadId, {
				activeDocumentId: payload.activeDocumentId,
				updatedAt: "2026-07-04T01:00:00.000Z",
			});
		},
	});

	assert.deepEqual(updatePayload, {
		threadId: "thread-1",
		payload: { activeDocumentId: "doc-active" },
	});
	assert.equal(threads[0].activeDocumentId, "doc-active");
	assert.equal(threads[0].title, "Resolved title");
});

test("persistRovoAppActiveDocumentSelection skips missing threads and reports update errors", async () => {
	let updateCalls = 0;
	const warnings = [];
	await persistRovoAppActiveDocumentSelection({
		activeThreadId: null,
		deletedThreadIds: new Set(),
		documentId: "doc-active",
		reconcileThreadWithLocalTitle: (thread) => thread,
		setThreads() {},
		toUserErrorMessage: (error) => error.message,
		updateThread: async () => {
			updateCalls += 1;
			return createThread("unexpected");
		},
		warn(message, errorMessage) {
			warnings.push([message, errorMessage]);
		},
	});
	assert.equal(updateCalls, 0);

	await persistRovoAppActiveDocumentSelection({
		activeThreadId: "thread-1",
		deletedThreadIds: new Set(),
		documentId: "doc-active",
		reconcileThreadWithLocalTitle: (thread) => thread,
		setThreads() {},
		toUserErrorMessage: (error) => error.message,
		updateThread: async () => {
			throw new Error("update failed");
		},
		warn(message, errorMessage) {
			warnings.push([message, errorMessage]);
		},
	});
	assert.deepEqual(warnings, [[
		"[RovoApp] Failed to persist active artifact selection:",
		"update failed",
	]]);
});

test("saveRovoAppStreamingArtifactCheckpoint saves and selects current streaming content", async () => {
	const recorder = createPanelRecorder();
	let savePayload = null;

	const document = await saveRovoAppStreamingArtifactCheckpoint({
		saveDocument: async (payload) => {
			savePayload = payload;
			return createDocument("doc-streaming", {
				title: payload.title,
				versions: [{ id: "version-checkpoint" }],
			});
		},
		selectDocumentForDisplay: recorder.selectDocumentForDisplay,
		streamingArtifact: {
			content: "Checkpoint content",
			documentId: "doc-streaming",
			createdAt: "2026-07-04T00:00:00.000Z",
			kind: "text",
			status: "streaming",
			title: "Checkpoint title",
			updatedAt: "2026-07-04T00:00:00.000Z",
		},
	});

	assert.equal(document.id, "doc-streaming");
	assert.deepEqual(savePayload, {
		changeLabel: "Steered checkpoint",
		documentId: "doc-streaming",
		title: "Checkpoint title",
		kind: "text",
		content: "Checkpoint content",
	});
	assert.deepEqual(recorder.calls, [["selectDocumentForDisplay", "doc-streaming"]]);

	const skippedDocument = await saveRovoAppStreamingArtifactCheckpoint({
		saveDocument: async () => createDocument("unexpected"),
		selectDocumentForDisplay: recorder.selectDocumentForDisplay,
		streamingArtifact: null,
	});
	assert.equal(skippedDocument, null);
});

test("hydrateRovoAppPersistedArtifact retries missing documents and selects hydrated results", async () => {
	const recorder = createPanelRecorder();
	const waits = [];
	let attempts = 0;
	let clearArtifactCalls = 0;

	const document = await hydrateRovoAppPersistedArtifact({
		clearArtifactState() {
			clearArtifactCalls += 1;
		},
		documentId: "doc-hydrated",
		getBackendUnavailableMessage: () => "Backend unavailable",
		getDocument: async () => {
			attempts += 1;
			return attempts === 3 ? createDocument("doc-hydrated") : null;
		},
		isBackendUnavailableError: () => false,
		isHydratingThread: () => false,
		maxAttempts: 3,
		selectDocumentForDisplay: recorder.selectDocumentForDisplay,
		setInputError: recorder.setInputError,
		waitForRetry: async (ms) => {
			waits.push(ms);
		},
	});

	assert.equal(document.id, "doc-hydrated");
	assert.deepEqual(waits, [150, 300]);
	assert.equal(clearArtifactCalls, 0);
	assert.deepEqual(recorder.calls, [["selectDocumentForDisplay", "doc-hydrated"]]);
});

test("hydrateRovoAppPersistedArtifact clears, skips display during hydration, and reports errors", async () => {
	const clearedRecorder = createPanelRecorder();
	let clearArtifactCalls = 0;
	const missingDocument = await hydrateRovoAppPersistedArtifact({
		clearArtifactState() {
			clearArtifactCalls += 1;
		},
		documentId: "doc-missing",
		getBackendUnavailableMessage: () => "Backend unavailable",
		getDocument: async () => null,
		isBackendUnavailableError: () => false,
		isHydratingThread: () => false,
		maxAttempts: 1,
		selectDocumentForDisplay: clearedRecorder.selectDocumentForDisplay,
		setInputError: clearedRecorder.setInputError,
		waitForRetry: async () => {},
	});
	assert.equal(missingDocument, null);
	assert.equal(clearArtifactCalls, 1);
	assert.deepEqual(clearedRecorder.calls, []);

	const hydratingRecorder = createPanelRecorder();
	const hydratingDocument = await hydrateRovoAppPersistedArtifact({
		clearArtifactState() {},
		documentId: "doc-hydrating",
		getBackendUnavailableMessage: () => "Backend unavailable",
		getDocument: async () => createDocument("doc-hydrating"),
		isBackendUnavailableError: () => false,
		isHydratingThread: () => true,
		selectDocumentForDisplay: hydratingRecorder.selectDocumentForDisplay,
		setInputError: hydratingRecorder.setInputError,
		waitForRetry: async () => {},
	});
	assert.equal(hydratingDocument.id, "doc-hydrating");
	assert.deepEqual(hydratingRecorder.calls, []);

	const errorRecorder = createPanelRecorder();
	await hydrateRovoAppPersistedArtifact({
		clearArtifactState() {},
		documentId: "doc-error",
		getBackendUnavailableMessage: () => "Backend unavailable",
		getDocument: async () => {
			throw new Error("offline");
		},
		isBackendUnavailableError: () => true,
		isHydratingThread: () => false,
		selectDocumentForDisplay: errorRecorder.selectDocumentForDisplay,
		setInputError: errorRecorder.setInputError,
		waitForRetry: async () => {},
	});
	assert.deepEqual(errorRecorder.calls, [["setInputError", "Backend unavailable"]]);

	const genericErrorLogs = [];
	await hydrateRovoAppPersistedArtifact({
		clearArtifactState() {},
		documentId: "doc-error",
		getBackendUnavailableMessage: () => "Backend unavailable",
		getDocument: async () => {
			throw new Error("generic");
		},
		isBackendUnavailableError: () => false,
		isHydratingThread: () => false,
		logError(message, error) {
			genericErrorLogs.push([message, error.message]);
		},
		selectDocumentForDisplay: errorRecorder.selectDocumentForDisplay,
		setInputError: errorRecorder.setInputError,
		waitForRetry: async () => {},
	});
	assert.deepEqual(genericErrorLogs, [[
		"[RovoApp] Failed to hydrate streamed artifact:",
		"generic",
	]]);
});

test("plan artifact helpers preserve route-hook document shape", () => {
	const document = buildRovoAppPlanDocument({
		activeThreadId: "thread-1",
		documentId: "doc-plan",
		now: "2026-07-04T10:00:00.000Z",
		plan: {
			title: "Implementation plan",
			markdown: "  ",
			sourceMessageId: "assistant-1",
		},
		versionId: "version-plan",
	});

	assert.deepEqual(document, {
		id: "doc-plan",
		threadId: "thread-1",
		title: "Implementation plan",
		kind: "text",
		sourceMessageId: "assistant-1",
		createdAt: "2026-07-04T10:00:00.000Z",
		updatedAt: "2026-07-04T10:00:00.000Z",
		versions: [{
			id: "version-plan",
			changeLabel: "Plan",
			content: "Implementation plan",
			createdAt: "2026-07-04T10:00:00.000Z",
			title: "Implementation plan",
		}],
	});

	const recorder = createPanelRecorder();
	openRovoAppPlanAsDocument({
		activeThreadId: null,
		plan: {
			title: "Plan title",
			markdown: "Plan body",
		},
		selectDocumentForDisplay: recorder.selectDocumentForDisplay,
		setPanelState: recorder.setPanelState,
		setVisibleArtifactDocumentId: recorder.setVisibleArtifactDocumentId,
	});
	assert.equal(recorder.calls[0][0], "selectDocumentForDisplay");
	assert.equal(recorder.calls[1][0], "setVisibleArtifactDocumentId");
	assert.equal(recorder.calls[2][1], "preview");
});

test("saveRovoAppArtifactDraft preserves manual edit payload and local document update", async () => {
	const recorder = createPanelRecorder();
	let documents = [
		createDocument("doc-active", {
			title: "Old title",
			versions: [{ id: "old-version" }],
		}),
		createDocument("doc-other"),
	];
	let savePayload = null;
	let selectedVersionId = "old-version";

	await saveRovoAppArtifactDraft({
		activeDocument: documents[0],
		activeDocumentId: "doc-active",
		artifactDraftContent: "Updated draft",
		saveDocument: async (payload) => {
			savePayload = payload;
			return createDocument("doc-active", {
				title: payload.title,
				versions: [{ id: "new-version" }],
			});
		},
		setArtifactMode: recorder.setArtifactMode,
		setDocuments(nextDocuments) {
			documents =
				typeof nextDocuments === "function"
					? nextDocuments(documents)
					: nextDocuments;
		},
		setInputError: recorder.setInputError,
		setSelectedVersionId(versionId) {
			selectedVersionId = versionId;
		},
		toUserErrorMessage: (error) => error.message,
	});

	assert.deepEqual(savePayload, {
		changeLabel: "Manual edit",
		documentId: "doc-active",
		title: "Old title",
		kind: "text",
		content: "Updated draft",
	});
	assert.deepEqual(documents.map((document) => document.id), ["doc-active", "doc-other"]);
	assert.equal(selectedVersionId, "new-version");
	assert.deepEqual(recorder.calls, [["setArtifactMode", "preview"]]);
});

test("saveRovoAppArtifactDraft skips empty state and reports save errors", async () => {
	const skippedRecorder = createPanelRecorder();
	let saveCalls = 0;
	await saveRovoAppArtifactDraft({
		activeDocument: null,
		activeDocumentId: null,
		artifactDraftContent: "Updated draft",
		saveDocument: async () => {
			saveCalls += 1;
			return createDocument("unexpected");
		},
		setArtifactMode: skippedRecorder.setArtifactMode,
		setDocuments() {},
		setInputError: skippedRecorder.setInputError,
		setSelectedVersionId() {},
		toUserErrorMessage: (error) => error.message,
	});
	assert.equal(saveCalls, 0);
	assert.deepEqual(skippedRecorder.calls, []);

	const errorRecorder = createPanelRecorder();
	await saveRovoAppArtifactDraft({
		activeDocument: createDocument("doc-active"),
		activeDocumentId: "doc-active",
		artifactDraftContent: "Updated draft",
		saveDocument: async () => {
			throw new Error("manual save failed");
		},
		setArtifactMode: errorRecorder.setArtifactMode,
		setDocuments() {},
		setInputError: errorRecorder.setInputError,
		setSelectedVersionId() {},
		toUserErrorMessage: (error) => error.message,
	});
	assert.deepEqual(errorRecorder.calls, [["setInputError", "manual save failed"]]);
});

test("deleteRovoAppDocumentWithLifecycle removes local documents and clears active artifact", async () => {
	const recorder = createPanelRecorder();
	let documents = [createDocument("doc-active"), createDocument("doc-other")];
	let deletedDocumentId = null;
	let clearArtifactCalls = 0;

	await deleteRovoAppDocumentWithLifecycle({
		activeDocumentId: "doc-active",
		clearArtifactState() {
			clearArtifactCalls += 1;
		},
		deleteDocument: async (documentId) => {
			deletedDocumentId = documentId;
		},
		documentId: "doc-active",
		setDocuments(nextDocuments) {
			documents =
				typeof nextDocuments === "function"
					? nextDocuments(documents)
					: nextDocuments;
		},
		setInputError: recorder.setInputError,
		toUserErrorMessage: (error) => error.message,
	});

	assert.equal(deletedDocumentId, "doc-active");
	assert.deepEqual(documents.map((document) => document.id), ["doc-other"]);
	assert.equal(clearArtifactCalls, 1);
	assert.deepEqual(recorder.calls, []);
});

test("deleteRovoAppDocumentWithLifecycle preserves inactive artifact state and reports errors", async () => {
	const inactiveRecorder = createPanelRecorder();
	let documents = [createDocument("doc-active"), createDocument("doc-other")];
	let clearArtifactCalls = 0;
	await deleteRovoAppDocumentWithLifecycle({
		activeDocumentId: "doc-active",
		clearArtifactState() {
			clearArtifactCalls += 1;
		},
		deleteDocument: async () => {},
		documentId: "doc-other",
		setDocuments(nextDocuments) {
			documents =
				typeof nextDocuments === "function"
					? nextDocuments(documents)
					: nextDocuments;
		},
		setInputError: inactiveRecorder.setInputError,
		toUserErrorMessage: (error) => error.message,
	});
	assert.deepEqual(documents.map((document) => document.id), ["doc-active"]);
	assert.equal(clearArtifactCalls, 0);
	assert.deepEqual(inactiveRecorder.calls, []);

	const errorRecorder = createPanelRecorder();
	await deleteRovoAppDocumentWithLifecycle({
		activeDocumentId: "doc-active",
		clearArtifactState() {},
		deleteDocument: async () => {
			throw new Error("delete failed");
		},
		documentId: "doc-active",
		setDocuments() {},
		setInputError: errorRecorder.setInputError,
		toUserErrorMessage: (error) => error.message,
	});
	assert.deepEqual(errorRecorder.calls, [["setInputError", "delete failed"]]);
});
