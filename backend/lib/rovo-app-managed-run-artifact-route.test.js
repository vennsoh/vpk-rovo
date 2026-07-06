const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRovoAppManagedRunArtifactRouter,
	isArtifactRoutingDecision,
} = require("./rovo-app-managed-run-artifact-route");

function createHarness(overrides = {}) {
	const calls = [];
	const marks = [];
	const dependencies = {
		consumeRovoAppManagedResponse: async (input) => {
			calls.push(["consumeRovoAppManagedResponse", input]);
		},
		handleRovoAppArtifactToolRequest: async (input) => {
			calls.push(["handleRovoAppArtifactToolRequest", input]);
			return {
				handled: true,
				response: new Response("event: artifact\n\n", {
					headers: { "content-type": "text/event-stream" },
				}),
			};
		},
		isRovoAvailable: async () => true,
		persistRovoAppRunBackend: async (threadId, backend) => {
			calls.push(["persistRovoAppRunBackend", threadId, backend]);
		},
		resolveRovoAppTurnBackendPreference: async (input) => {
			calls.push(["resolveRovoAppTurnBackendPreference", input]);
			return "rovo";
		},
		...overrides,
	};
	const {
		handleRovoAppManagedRunArtifactRoute,
	} = createRovoAppManagedRunArtifactRouter(dependencies);

	return {
		calls,
		handleRovoAppManagedRunArtifactRoute,
		marks,
		stageTrace: {
			mark: (name, payload) => marks.push([name, payload]),
		},
	};
}

function createBaseRequest(overrides = {}) {
	return {
		activeArtifact: { id: "artifact-1" },
		activeDocument: { id: "doc-1" },
		artifactSteering: { mode: "update" },
		autoPlanTriggered: false,
		effectiveBaseContextDescription: "Base context",
		requestBody: { messages: [] },
		requestIsPlanMode: false,
		requestMessages: [{ role: "user", content: "Create artifact" }],
		requestOrigin: "text",
		routingDecision: {
			intent: "artifact_update",
			presentation: "artifact_preview",
			confidence: 1,
			reason: "test",
		},
		run: { id: "run-1" },
		signal: null,
		streamingArtifact: { id: "stream-1" },
		threadId: "thread-1",
		workItemReportRequest: {},
		...overrides,
	};
}

test("isArtifactRoutingDecision only matches artifact create and update intents", () => {
	assert.equal(isArtifactRoutingDecision({ intent: "artifact_create" }), true);
	assert.equal(isArtifactRoutingDecision({ intent: "artifact_update" }), true);
	assert.equal(isArtifactRoutingDecision({ intent: "chat" }), false);
	assert.equal(isArtifactRoutingDecision(null), false);
});

test("artifact route skips non-artifact decisions", async () => {
	const { calls, handleRovoAppManagedRunArtifactRoute, marks, stageTrace } = createHarness();

	const handled = await handleRovoAppManagedRunArtifactRoute(createBaseRequest({
		routingDecision: {
			intent: "chat",
			presentation: "text",
			confidence: 1,
			reason: "chat",
		},
		stageTrace,
	}));

	assert.equal(handled, false);
	assert.deepEqual(calls, []);
	assert.deepEqual(marks, []);
});

test("artifact route resolves and persists backend before invoking artifact handler", async () => {
	const { calls, handleRovoAppManagedRunArtifactRoute, marks, stageTrace } = createHarness();
	const requestBody = { messages: [] };
	const signal = new AbortController().signal;

	const handled = await handleRovoAppManagedRunArtifactRoute(createBaseRequest({
		autoPlanTriggered: true,
		requestBody,
		signal,
		stageTrace,
	}));

	assert.equal(handled, true);
	assert.equal(calls[0][0], "resolveRovoAppTurnBackendPreference");
	assert.deepEqual(calls[0][1], {
		isPlanModeActive: true,
		isRovoAvailable: calls[0][1].isRovoAvailable,
		requestBody,
		routingDecision: {
			intent: "artifact_update",
			presentation: "artifact_preview",
			confidence: 1,
			reason: "test",
		},
	});
	assert.deepEqual(calls[1], ["persistRovoAppRunBackend", "thread-1", "rovo"]);
	assert.equal(calls[2][0], "handleRovoAppArtifactToolRequest");
	assert.deepEqual(calls[2][1], {
		activeArtifact: { id: "artifact-1" },
		activeDocument: { id: "doc-1" },
		artifactSteering: { mode: "update" },
		artifactBackendPreference: "rovo",
		contextDescription: "Base context",
		requestOrigin: "text",
		requestBody,
		signal,
		streamingArtifact: { id: "stream-1" },
		threadId: "thread-1",
	});
	assert.equal(calls[3][0], "consumeRovoAppManagedResponse");
	assert.deepEqual(marks, [
		[
			"artifact_route_handled",
			{
				intent: "artifact_update",
				threadId: "thread-1",
			},
		],
	]);
});

test("artifact route uses Work Item backend preference without availability resolution", async () => {
	const { calls, handleRovoAppManagedRunArtifactRoute, stageTrace } = createHarness({
		resolveRovoAppTurnBackendPreference: async () => {
			throw new Error("Work Item backend preference should skip resolver");
		},
	});

	const handled = await handleRovoAppManagedRunArtifactRoute(createBaseRequest({
		stageTrace,
		workItemReportRequest: {
			artifactBackendPreference: "ai-gateway",
		},
	}));

	assert.equal(handled, true);
	assert.deepEqual(calls[0], ["persistRovoAppRunBackend", "thread-1", "ai-gateway"]);
	assert.equal(calls[1][0], "handleRovoAppArtifactToolRequest");
	assert.equal(calls[1][1].artifactBackendPreference, "ai-gateway");
});

test("artifact route returns false when artifact handler declines the route", async () => {
	const { calls, handleRovoAppManagedRunArtifactRoute, marks, stageTrace } = createHarness({
		handleRovoAppArtifactToolRequest: async (input) => {
			calls.push(["handleRovoAppArtifactToolRequest", input]);
			return { handled: false };
		},
	});

	const handled = await handleRovoAppManagedRunArtifactRoute(createBaseRequest({
		effectiveBaseContextDescription: "",
		stageTrace,
	}));

	assert.equal(handled, false);
	assert.equal(calls.some(([name]) => name === "consumeRovoAppManagedResponse"), false);
	assert.deepEqual(calls[2][1].contextDescription, null);
	assert.deepEqual(marks, []);
});
