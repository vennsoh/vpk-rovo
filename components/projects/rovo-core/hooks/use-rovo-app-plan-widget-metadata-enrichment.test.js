const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	resolveRovoAppPlanWidgetMetadataEnrichmentRequest,
} = loadRovoCoreModule("hooks/use-rovo-app-plan-widget-metadata-enrichment.ts");

function createPlanWidget(overrides = {}) {
	return {
		title: "Plan",
		shortDescription: "",
		markdown: "# Plan",
		tasks: [{ id: "task-1", label: "Build it", blockedBy: [] }],
		agents: [],
		...overrides,
	};
}

function createInput(overrides = {}) {
	return {
		activeThreadId: "thread-1",
		attemptedPlanMetadataMessageIds: new Set(),
		isHydratingThread: false,
		isLoadingThread: false,
		isStreaming: false,
		latestSourcedPlanWidget: {
			sourceMessageId: "message-1",
			planWidget: createPlanWidget(),
		},
		...overrides,
	};
}

test("plan widget metadata enrichment waits until the thread is ready", () => {
	for (const overrides of [
		{ activeThreadId: null },
		{ isLoadingThread: true },
		{ isStreaming: true },
		{ isHydratingThread: true },
	]) {
		assert.equal(resolveRovoAppPlanWidgetMetadataEnrichmentRequest(createInput(overrides)), null);
	}
});

test("plan widget metadata enrichment requires a sourced plan widget", () => {
	assert.equal(resolveRovoAppPlanWidgetMetadataEnrichmentRequest(createInput({
		latestSourcedPlanWidget: null,
	})), null);
	assert.equal(resolveRovoAppPlanWidgetMetadataEnrichmentRequest(createInput({
		latestSourcedPlanWidget: {
			sourceMessageId: "",
			planWidget: createPlanWidget(),
		},
	})), null);
	assert.equal(resolveRovoAppPlanWidgetMetadataEnrichmentRequest(createInput({
		latestSourcedPlanWidget: {
			sourceMessageId: "message-1",
			planWidget: null,
		},
	})), null);
});

test("plan widget metadata enrichment skips specific metadata and attempted messages", () => {
	assert.equal(resolveRovoAppPlanWidgetMetadataEnrichmentRequest(createInput({
		latestSourcedPlanWidget: {
			sourceMessageId: "message-1",
			planWidget: createPlanWidget({
				title: "Specific migration plan",
				shortDescription: "Converge route hooks",
			}),
		},
	})), null);
	assert.equal(resolveRovoAppPlanWidgetMetadataEnrichmentRequest(createInput({
		attemptedPlanMetadataMessageIds: new Set(["message-1"]),
	})), null);
});

test("plan widget metadata enrichment allows generic or missing metadata", () => {
	assert.deepEqual(resolveRovoAppPlanWidgetMetadataEnrichmentRequest(createInput()), {
		threadId: "thread-1",
		sourceMessageId: "message-1",
		planWidget: createPlanWidget(),
	});
	assert.deepEqual(resolveRovoAppPlanWidgetMetadataEnrichmentRequest(createInput({
		latestSourcedPlanWidget: {
			sourceMessageId: "message-2",
			planWidget: createPlanWidget({
				title: "Plan",
				shortDescription: "Generic title still needs enrichment",
			}),
		},
	})), {
		threadId: "thread-1",
		sourceMessageId: "message-2",
		planWidget: createPlanWidget({
			title: "Plan",
			shortDescription: "Generic title still needs enrichment",
		}),
	});
});
