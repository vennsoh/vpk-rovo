const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRovoAppManagedRunResponseCompleter,
} = require("./rovo-app-managed-run-response-completion");

function createHarness(overrides = {}) {
	const calls = [];
	const marks = [];
	const dependencies = {
		consumeRovoAppManagedResponse: async (input) => {
			calls.push(["consumeRovoAppManagedResponse", input]);
		},
		formatRouteDecisionSSE: (routingDecision) => {
			calls.push(["formatRouteDecisionSSE", routingDecision]);
			return `data: ${routingDecision.intent}\n\n`;
		},
		...overrides,
	};
	const {
		completeRovoAppManagedRunResponse,
	} = createRovoAppManagedRunResponseCompleter(dependencies);

	return {
		calls,
		completeRovoAppManagedRunResponse,
		marks,
		stageTrace: {
			mark: (name, payload) => marks.push([name, payload]),
		},
	};
}

test("completeRovoAppManagedRunResponse prepends route decision and marks run complete", async () => {
	const { calls, completeRovoAppManagedRunResponse, marks, stageTrace } = createHarness();
	const requestMessages = [{ role: "user", content: "hello" }];
	const response = new Response("event: done\n\n");
	const routingDecision = {
		intent: "chat",
		presentation: "text",
		confidence: 1,
		reason: "chat",
	};
	const run = { id: "run-1" };

	await completeRovoAppManagedRunResponse({
		requestMessages,
		response,
		routingDecision,
		run,
		stageTrace,
		threadId: "thread-1",
	});

	assert.deepEqual(calls, [
		["formatRouteDecisionSSE", routingDecision],
		[
			"consumeRovoAppManagedResponse",
			{
				initialMessages: requestMessages,
				prependChunk: "data: chat\n\n",
				response,
				run,
				stageTrace,
				threadId: "thread-1",
			},
		],
	]);
	assert.deepEqual(marks, [["run_complete", undefined]]);
});

test("completeRovoAppManagedRunResponse does not mark complete when consumption fails", async () => {
	const { completeRovoAppManagedRunResponse, marks, stageTrace } = createHarness({
		consumeRovoAppManagedResponse: async () => {
			throw new Error("stream failed");
		},
	});

	await assert.rejects(
		completeRovoAppManagedRunResponse({
			requestMessages: [],
			response: new Response("failed"),
			routingDecision: {
				intent: "chat",
				presentation: "text",
				confidence: 1,
				reason: "chat",
			},
			run: { id: "run-1" },
			stageTrace,
			threadId: "thread-1",
		}),
		/stream failed/u,
	);
	assert.deepEqual(marks, []);
});
