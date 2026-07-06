const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	dispatchRovoAppDataPart,
} = loadRovoCoreModule("lib/rovo-app-data-part-dispatcher.ts");

function applySetState(currentValue, nextValue) {
	return typeof nextValue === "function"
		? nextValue(currentValue)
		: nextValue;
}

function createStreamingArtifact(overrides = {}) {
	return {
		content: "Draft content",
		createdAt: "2026-07-04T00:00:00.000Z",
		documentId: "document-1",
		kind: "text",
		status: "streaming",
		title: "Draft",
		updatedAt: "2026-07-04T00:00:00.000Z",
		...overrides,
	};
}

function createHarness(overrides = {}) {
	const calls = [];
	const activeThreadIdRef = { current: overrides.activeThreadId ?? "thread-1" };
	const currentTurnIntentRef = { current: overrides.currentTurnIntent ?? "artifact_create" };
	const lastCompletedArtifactDocumentIdRef = { current: null };
	const pendingArtifactAssociationRef = { current: false };
	const pendingArtifactCreationRetryRef = { current: overrides.pendingArtifactCreationRetry ?? false };
	const streamingArtifactRef = {
		current: overrides.streamingArtifact ?? null,
	};
	const suppressedStreamingAutoOpenDocumentIdRef = {
		current: overrides.suppressedStreamingAutoOpenDocumentId ?? "suppressed-document",
	};
	const visibleArtifactDocumentIdRef = {
		current: overrides.visibleArtifactDocumentId ?? null,
	};
	let activeDocumentId = null;
	let artifactMode = null;
	let attachedRunStatus = "streaming";
	let pendingArtifactResult = null;
	let selectedVersionId = null;
	let streamingArtifact = streamingArtifactRef.current;

	return {
		activeThreadIdRef,
		calls,
		currentTurnIntentRef,
		get activeDocumentId() {
			return activeDocumentId;
		},
		get artifactMode() {
			return artifactMode;
		},
		get attachedRunStatus() {
			return attachedRunStatus;
		},
		lastCompletedArtifactDocumentIdRef,
		pendingArtifactAssociationRef,
		pendingArtifactCreationRetryRef,
		get pendingArtifactResult() {
			return pendingArtifactResult;
		},
		get selectedVersionId() {
			return selectedVersionId;
		},
		get streamingArtifact() {
			return streamingArtifact;
		},
		streamingArtifactRef,
		suppressedStreamingAutoOpenDocumentIdRef,
		visibleArtifactDocumentIdRef,
		deps: {
			activeThreadIdRef,
			clearQueuedStreamingArtifactDelta() {
				calls.push(["clearQueuedStreamingArtifactDelta"]);
			},
			currentTurnIntentRef,
			flushQueuedStreamingArtifactDeltaNow() {
				calls.push(["flushQueuedStreamingArtifactDeltaNow"]);
			},
			async hydratePersistedArtifact(documentId) {
				calls.push(["hydratePersistedArtifact", documentId]);
				return overrides.persistedDocument ?? null;
			},
			kickQueue() {
				calls.push(["kickQueue"]);
			},
			lastCompletedArtifactDocumentIdRef,
			markObservedTurnComplete() {
				calls.push(["markObservedTurnComplete"]);
			},
			notifyStreamingCancelled() {
				calls.push(["notifyStreamingCancelled"]);
			},
			pendingArtifactAssociationRef,
			pendingArtifactCreationRetryRef,
			persistActiveDocumentSelection(documentId) {
				calls.push(["persistActiveDocumentSelection", documentId]);
			},
			queueStreamingArtifactDelta(delta, kind) {
				calls.push(["queueStreamingArtifactDelta", delta, kind]);
			},
			setActiveDocumentId(documentId) {
				activeDocumentId = documentId;
				calls.push(["setActiveDocumentId", documentId]);
			},
			setArtifactMode(mode) {
				artifactMode = mode;
				calls.push(["setArtifactMode", mode]);
			},
			setAttachedRunStatus(status) {
				attachedRunStatus = status;
				calls.push(["setAttachedRunStatus", status]);
			},
			setLocalThreadActiveRun(threadId, status) {
				calls.push(["setLocalThreadActiveRun", threadId, status]);
			},
			setPendingArtifactResult(nextValue) {
				pendingArtifactResult = applySetState(pendingArtifactResult, nextValue);
				calls.push(["setPendingArtifactResult", pendingArtifactResult]);
			},
			setSelectedVersionId(versionId) {
				selectedVersionId = versionId;
				calls.push(["setSelectedVersionId", versionId]);
			},
			setStreamingArtifact(nextValue) {
				streamingArtifact = applySetState(streamingArtifact, nextValue);
				streamingArtifactRef.current = streamingArtifact;
				calls.push(["setStreamingArtifact", streamingArtifact]);
			},
			streamingArtifactRef,
			suppressedStreamingAutoOpenDocumentIdRef,
			visibleArtifactDocumentIdRef,
		},
	};
}

function dispatchDataPart(harness, type, data) {
	dispatchRovoAppDataPart({ data, type }, harness.deps);
}

async function settlePromises() {
	await Promise.resolve();
	await Promise.resolve();
}

test("dispatchRovoAppDataPart initializes artifact state from data-id", () => {
	const harness = createHarness();

	dispatchDataPart(harness, "data-id", "document-42");

	assert.equal(harness.streamingArtifact.documentId, "document-42");
	assert.equal(harness.streamingArtifact.kind, "text");
	assert.equal(harness.streamingArtifact.status, "streaming");
	assert.equal(harness.pendingArtifactResult.documentId, "document-42");
	assert.equal(harness.suppressedStreamingAutoOpenDocumentIdRef.current, null);
	assert.equal(harness.activeDocumentId, "document-42");
	assert.equal(harness.selectedVersionId, "streaming");
	assert.equal(harness.artifactMode, "preview");
	assert.equal(harness.pendingArtifactAssociationRef.current, true);
	assert.deepEqual(
		harness.calls.filter((call) => call[0] !== "setStreamingArtifact" && call[0] !== "setPendingArtifactResult"),
		[
			["setActiveDocumentId", "document-42"],
			["persistActiveDocumentSelection", "document-42"],
			["setSelectedVersionId", "streaming"],
			["setArtifactMode", "preview"],
		],
	);
});

test("dispatchRovoAppDataPart queues text and code deltas with the expected kind", () => {
	const harness = createHarness();

	dispatchDataPart(harness, "data-textDelta", "hello");
	dispatchDataPart(harness, "data-codeDelta", "const value = 1;");

	assert.deepEqual(harness.calls, [
		["queueStreamingArtifactDelta", "hello", undefined],
		["queueStreamingArtifactDelta", "const value = 1;", "code"],
	]);
});

test("dispatchRovoAppDataPart finishes and clears streamed artifact after persisted hydration", async () => {
	const harness = createHarness({
		persistedDocument: { id: "document-1" },
		streamingArtifact: createStreamingArtifact(),
	});

	dispatchDataPart(harness, "data-finish", null);

	assert.equal(harness.streamingArtifact.status, "idle");
	assert.deepEqual(harness.calls.slice(0, 2).map((call) => call[0]), [
		"flushQueuedStreamingArtifactDeltaNow",
		"setStreamingArtifact",
	]);

	await settlePromises();

	assert.equal(harness.streamingArtifact, null);
	assert.deepEqual(
		harness.calls.filter((call) => call[0] === "hydratePersistedArtifact"),
		[["hydratePersistedArtifact", "document-1"]],
	);
});

test("dispatchRovoAppDataPart keeps visible streamed artifact when no persisted document exists", async () => {
	const harness = createHarness({
		streamingArtifact: createStreamingArtifact(),
		visibleArtifactDocumentId: "document-1",
	});

	dispatchDataPart(harness, "data-finish", null);
	await settlePromises();

	assert.equal(harness.streamingArtifact.documentId, "document-1");
	assert.equal(harness.streamingArtifact.status, "idle");
});

test("dispatchRovoAppDataPart records artifact results and clears create retry state", () => {
	const harness = createHarness({ pendingArtifactCreationRetry: true });

	dispatchDataPart(harness, "data-artifact-result", {
		action: "create",
		documentId: "document-created",
		kind: "code",
		title: "Created artifact",
	});

	assert.equal(harness.lastCompletedArtifactDocumentIdRef.current, "document-created");
	assert.equal(harness.pendingArtifactCreationRetryRef.current, false);
	assert.deepEqual(harness.pendingArtifactResult, {
		action: "create",
		documentId: "document-created",
		kind: "code",
		title: "Created artifact",
	});
});

test("dispatchRovoAppDataPart completes turns and drains the queue", () => {
	const harness = createHarness();

	dispatchDataPart(harness, "data-turn-complete", null);

	assert.equal(harness.currentTurnIntentRef.current, null);
	assert.equal(harness.attachedRunStatus, null);
	assert.deepEqual(harness.calls, [
		["markObservedTurnComplete"],
		["setAttachedRunStatus", null],
		["setLocalThreadActiveRun", "thread-1", null],
		["kickQueue"],
	]);
});

test("dispatchRovoAppDataPart stores route decisions and reports cancelled streaming", () => {
	const harness = createHarness({ currentTurnIntent: null });

	dispatchDataPart(harness, "data-route-decision", { intent: "artifact_update" });
	dispatchDataPart(harness, "data-cancel-streaming", null);

	assert.equal(harness.currentTurnIntentRef.current, "artifact_update");
	assert.deepEqual(harness.calls, [
		["notifyStreamingCancelled"],
	]);
});
