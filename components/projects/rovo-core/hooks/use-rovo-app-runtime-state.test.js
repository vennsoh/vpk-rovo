const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	resolveRovoAppRuntimeState,
} = loadRovoCoreModule("hooks/use-rovo-app-runtime-state.ts");

function createInput(overrides = {}) {
	return {
		activeRunStatus: null,
		attachedRunStatus: null,
		delegationTurnStatus: "ready",
		directDelegationPhase: "idle",
		hasActiveDispatch: false,
		hasObservedTurnComplete: false,
		isAttachedActiveRun: false,
		latestThinkingStatusLabel: null,
		queuedPromptCount: 0,
		streamingArtifactStatus: null,
		useChatStatus: "ready",
		...overrides,
	};
}

test("resolveRovoAppRuntimeState treats active useChat turns as streaming and busy", () => {
	const state = resolveRovoAppRuntimeState(createInput({
		useChatStatus: "streaming",
	}));

	assert.equal(state.status, "streaming");
	assert.equal(state.isStreaming, true);
	assert.equal(state.isThreadBusy, true);
	assert.equal(state.shouldQueueNextSubmission, true);
	assert.equal(state.composerState.composerStatus, "streaming");
});

test("resolveRovoAppRuntimeState maps queued attached runs to submitted state", () => {
	const state = resolveRovoAppRuntimeState(createInput({
		attachedRunStatus: "queued",
	}));

	assert.equal(state.status, "submitted");
	assert.equal(state.isStreaming, true);
	assert.equal(state.isThreadBusy, true);
});

test("resolveRovoAppRuntimeState suppresses suggestions while queued work exists", () => {
	const state = resolveRovoAppRuntimeState(createInput({
		queuedPromptCount: 1,
	}));

	assert.equal(state.shouldQueueNextSubmission, true);
	assert.equal(state.shouldSuppressLatestAssistantSuggestions, true);
});

test("resolveRovoAppRuntimeState formats background delegation labels from thinking status", () => {
	const state = resolveRovoAppRuntimeState(createInput({
		activeRunStatus: "background",
		latestThinkingStatusLabel: "Writing files",
	}));

	assert.equal(state.composerState.hasBackgroundDelegation, true);
	assert.equal(state.composerState.backgroundDelegationLabel, "Rovo is still working: Writing files.");
});
