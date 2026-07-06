const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRovoAppManagedRunExecutor,
} = require("./rovo-app-managed-run-executor");

function createPreparedRun(overrides = {}) {
	return {
		activeArtifact: { id: "artifact-1" },
		activeDocument: { id: "document-1" },
		artifactSteering: { mode: "edit" },
		effectiveBaseContextDescription: "Context",
		latestUserMessage: "Build it",
		recentHistory: [{ role: "user", content: "History" }],
		requestArtifactCreationRetry: false,
		requestCreationMode: "agent",
		requestIsPlanMode: false,
		requestMessages: [{ id: "message-1" }],
		requestOrigin: "voice",
		requestVoiceMetadata: { durationMs: 1200 },
		resolvedProvider: "openai",
		streamingArtifact: { id: "streaming-artifact" },
		threadId: "thread-1",
		workItemReportRequest: { isIntent: false },
		...overrides,
	};
}

function createHarness(overrides = {}) {
	const calls = [];
	const marks = [];
	const stageTraces = [];
	const response = new Response("data: done\n\n");
	const preparedRun = createPreparedRun(overrides.preparedRun);
	const routingResult = overrides.routingResult || {
		autoPlanTriggered: true,
		routingDecision: {
			intent: "chat",
			presentation: "text",
			confidence: 1,
			reason: "plan_mode_active",
		},
	};
	const dependencies = {
		completeRovoAppManagedRunResponse: async (input) => {
			calls.push(["completeRovoAppManagedRunResponse", input]);
		},
		createStageTrace: (input) => {
			calls.push(["createStageTrace", input]);
			const stageTrace = {
				mark: (name, payload) => marks.push([name, payload]),
			};
			stageTraces.push(stageTrace);
			return stageTrace;
		},
		dispatchRovoAppManagedRunChat: async (input) => {
			calls.push(["dispatchRovoAppManagedRunChat", input]);
			return response;
		},
		handleRovoAppManagedRunArtifactRoute: async (input) => {
			calls.push(["handleRovoAppManagedRunArtifactRoute", input]);
			return Boolean(overrides.artifactRouteHandled);
		},
		logger: {
			info: (...args) => calls.push(["logger.info", args]),
		},
		prepareRovoAppManagedRunRequest: async (input) => {
			calls.push(["prepareRovoAppManagedRunRequest", input]);
			return preparedRun;
		},
		resolveRovoAppManagedRunRoute: async (input) => {
			calls.push(["resolveRovoAppManagedRunRoute", input]);
			return routingResult;
		},
		...overrides.dependencies,
	};
	const {
		executeRovoAppManagedRun,
	} = createRovoAppManagedRunExecutor(dependencies);

	return {
		calls,
		executeRovoAppManagedRun,
		marks,
		preparedRun,
		response,
		routingResult,
		stageTraces,
	};
}

test("createRovoAppManagedRunExecutor validates required dependencies", () => {
	assert.throws(() => createRovoAppManagedRunExecutor(), /completeRovoAppManagedRunResponse/u);
	assert.throws(
		() =>
			createRovoAppManagedRunExecutor({
				completeRovoAppManagedRunResponse: async () => {},
				createStageTrace: null,
			}),
		/createStageTrace/u,
	);
});

test("executeRovoAppManagedRun prepares, routes, dispatches, and completes a managed run", async () => {
	const { calls, executeRovoAppManagedRun, marks, response, routingResult, stageTraces } = createHarness();
	const abortController = new AbortController();
	const requestBody = {
		id: "thread-1",
		origin: " voice ",
		messages: [{ id: "message-1" }, { id: "message-2" }],
		delegatedMessageId: "delegated-1",
		activeArtifact: { id: "active-artifact" },
	};
	const run = {
		id: "run-1",
		threadId: "thread-1",
		requestBody,
		abortController,
	};

	await executeRovoAppManagedRun(run);

	assert.deepEqual(calls.map(([name]) => name), [
		"createStageTrace",
		"prepareRovoAppManagedRunRequest",
		"resolveRovoAppManagedRunRoute",
		"handleRovoAppManagedRunArtifactRoute",
		"dispatchRovoAppManagedRunChat",
		"completeRovoAppManagedRunResponse",
	]);
	assert.deepEqual(calls[0][1], {
		scope: "rovo-app-run",
		logger: { info: calls[0][1].logger.info },
		baseMeta: {
			path: "/api/rovo/chat",
			origin: "voice",
			threadId: "thread-1",
			runId: "run-1",
		},
	});
	assert.deepEqual(marks, [
		[
			"entry",
			{
				messageCount: 2,
				hasDelegatedMessageId: true,
				hasActiveArtifact: true,
			},
		],
	]);
	assert.notEqual(calls[1][1].requestBody, requestBody);
	assert.deepEqual(calls[1][1], {
		requestBody,
		requestOriginHint: "voice",
	});
	assert.equal(calls[2][1].signal, abortController.signal);
	assert.equal(calls[2][1].stageTrace, stageTraces[0]);
	assert.deepEqual(calls[2][1].latestUserMessage, "Build it");
	assert.equal(calls[3][1].routingDecision, routingResult.routingDecision);
	assert.equal(calls[3][1].run, run);
	assert.equal(calls[4][1].routingDecision, routingResult.routingDecision);
	assert.equal(calls[5][1].response, response);
	assert.deepEqual(calls[5][1].requestMessages, [{ id: "message-1" }]);
});

test("executeRovoAppManagedRun defaults non-object request bodies to text origin", async () => {
	const { calls, executeRovoAppManagedRun, marks } = createHarness({
		preparedRun: {
			requestOrigin: "text",
		},
	});

	await executeRovoAppManagedRun({
		id: "run-1",
		threadId: "thread-1",
		requestBody: null,
		abortController: new AbortController(),
	});

	assert.equal(calls[0][1].baseMeta.origin, "text");
	assert.deepEqual(calls[1][1], {
		requestBody: {},
		requestOriginHint: "text",
	});
	assert.deepEqual(marks[0], [
		"entry",
		{
			messageCount: 0,
			hasDelegatedMessageId: false,
			hasActiveArtifact: false,
		},
	]);
});

test("executeRovoAppManagedRun returns after an artifact route handles the run", async () => {
	const { calls, executeRovoAppManagedRun } = createHarness({
		artifactRouteHandled: true,
	});

	await executeRovoAppManagedRun({
		id: "run-1",
		threadId: "thread-1",
		requestBody: { id: "thread-1" },
		abortController: new AbortController(),
	});

	assert.deepEqual(calls.map(([name]) => name), [
		"createStageTrace",
		"prepareRovoAppManagedRunRequest",
		"resolveRovoAppManagedRunRoute",
		"handleRovoAppManagedRunArtifactRoute",
	]);
});
