const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	runRovoAppPlanRetryLifecycle,
} = loadRovoCoreModule("lib/rovo-app-plan-retry-lifecycle.ts");

function createSession(overrides = {}) {
	return {
		requestId: 1,
		phase: "awaiting-plan",
		hasStreamStarted: true,
		retryUsed: false,
		baselineAssistantMessageId: "assistant-baseline",
		...overrides,
	};
}

function createTextMessage(id, role, text) {
	return {
		id,
		role,
		parts: [{ type: "text", text }],
	};
}

function createWidgetMessage(id, type, payload) {
	return {
		id,
		role: "assistant",
		parts: [
			{
				type: "data-widget-data",
				data: { type, payload },
			},
		],
	};
}

function createRetryLifecycleInput(overrides = {}) {
	const calls = [];
	let planningSession = overrides.planningSession === undefined
		? createSession()
		: overrides.planningSession;
	const input = {
		activeThreadIdRef: { current: "thread-1" },
		appendLocalUserMessage: ({ metadata, text }) => {
			calls.push(["append", text, metadata]);
			const message = {
				id: "user-retry",
				role: "user",
				parts: [{ type: "text", text }],
				metadata,
			};
			return { message, messageId: message.id };
		},
		isStreaming: false,
		lastUseChatBusyAtRef: { current: 0 },
		messages: [
			createTextMessage("assistant-baseline", "assistant", "Initial"),
			createTextMessage("assistant-latest", "assistant", "No plan here"),
		],
		planningSession,
		releaseCompletedUseChatTurnIfNeeded: async () => {
			calls.push(["release-turn"]);
		},
		rovoMessagesRef: {
			current: [
				createTextMessage("assistant-baseline", "assistant", "Initial"),
				createTextMessage("assistant-latest", "assistant", "No plan here"),
			],
		},
		scheduleMicrotask: (callback) => {
			callback();
		},
		sendMessage: async (message, options) => {
			calls.push(["send", message, options]);
		},
		setPlanningSession: (updater) => {
			planningSession = typeof updater === "function" ? updater(planningSession) : updater;
			calls.push(["planning-session", planningSession]);
		},
		syncAgentModeForDispatch: async (mode) => {
			calls.push(["sync-mode", mode]);
		},
		threads: [
			{
				id: "thread-1",
				sessionId: "session-1",
				sessionMode: "ephemeral",
			},
		],
		useChatStatusRef: { current: "ready" },
		...overrides,
	};

	return {
		calls,
		getPlanningSession: () => planningSession,
		input: {
			...input,
			setPlanningSession: (updater) => {
				planningSession = typeof updater === "function" ? updater(planningSession) : updater;
				calls.push(["planning-session", planningSession]);
			},
		},
	};
}

test("runRovoAppPlanRetryLifecycle marks a planning session once streaming starts", async () => {
	const { calls, getPlanningSession, input } = createRetryLifecycleInput({
		isStreaming: true,
		planningSession: createSession({ hasStreamStarted: false }),
	});

	const result = await runRovoAppPlanRetryLifecycle(input);

	assert.equal(result, "streaming");
	assert.equal(getPlanningSession().hasStreamStarted, true);
	assert.deepEqual(calls, [
		["planning-session", createSession({ hasStreamStarted: true })],
	]);
});

test("runRovoAppPlanRetryLifecycle clears the session when a plan widget appears", async () => {
	const { calls, getPlanningSession, input } = createRetryLifecycleInput({
		messages: [
			createTextMessage("assistant-baseline", "assistant", "Initial"),
			createWidgetMessage("assistant-plan", "plan", {
				tasks: [{ id: "task-1", label: "Implement" }],
			}),
		],
	});

	const result = await runRovoAppPlanRetryLifecycle(input);

	assert.equal(result, "cleared");
	assert.equal(getPlanningSession(), null);
	assert.deepEqual(calls, [["planning-session", null]]);
});

test("runRovoAppPlanRetryLifecycle waits when the response asks clarification questions", async () => {
	const { calls, getPlanningSession, input } = createRetryLifecycleInput({
		messages: [
			createTextMessage("assistant-baseline", "assistant", "Initial"),
			createWidgetMessage("assistant-question", "question-card", {
				questions: [{ id: "q-1", label: "Scope?" }],
			}),
		],
	});

	const result = await runRovoAppPlanRetryLifecycle(input);

	assert.equal(result, "awaiting-clarification");
	assert.deepEqual(getPlanningSession(), createSession());
	assert.deepEqual(calls, []);
});

test("runRovoAppPlanRetryLifecycle sends the hidden retry when no plan is produced", async () => {
	const { calls, getPlanningSession, input } = createRetryLifecycleInput();

	const result = await runRovoAppPlanRetryLifecycle(input);

	assert.equal(result, "retried");
	assert.deepEqual(getPlanningSession(), {
		...createSession(),
		phase: "retrying-missing-plan",
		hasStreamStarted: false,
		retryUsed: true,
		baselineAssistantMessageId: "assistant-latest",
	});
	assert.deepEqual(
		calls
			.filter((call) => ["planning-session", "release-turn", "append", "sync-mode", "send"].includes(call[0]))
			.map((call) => call[0]),
		["planning-session", "release-turn", "append", "sync-mode", "send"],
	);

	const appendCall = calls.find((call) => call[0] === "append");
	assert.deepEqual(appendCall[2], {
		source: "plan-retry",
		visibility: "hidden",
	});

	const sendCall = calls.find((call) => call[0] === "send");
	assert.ok(sendCall);
	assert.equal(sendCall[1].messageId, "user-retry");
	assert.deepEqual(sendCall[1].metadata, {
		source: "plan-retry",
		visibility: "hidden",
	});
	assert.deepEqual(sendCall[2].body, {
		id: "thread-1",
		isPlanMode: true,
		contextDescription: [
			"[POST-CLARIFICATION — Plan Mode]",
			"Plan mode is enabled. The user has already answered clarification questions for this planning request.",
			"If the answers provide enough detail, proceed directly to plan generation now by calling exit_plan_mode with a concise markdown plan.",
			"If essential details are still missing, you may call ask_user_questions again to gather what you need before planning.",
			"Use the answered clarification details to finish planning, not implementation.",
			"Do not use free-form text, suggestion chips, invoke_subagents, or update_todo as a substitute for the exit_plan_mode handoff.",
			"[End POST-CLARIFICATION]",
		].join(" "),
		sessionId: "session-1",
		sessionMode: "ephemeral",
	});
});

test("runRovoAppPlanRetryLifecycle clears without retry when the active thread lacks a session", async () => {
	const { calls, getPlanningSession, input } = createRetryLifecycleInput({
		threads: [
			{
				id: "thread-1",
				sessionId: null,
				sessionMode: null,
			},
		],
	});

	const result = await runRovoAppPlanRetryLifecycle(input);

	assert.equal(result, "cleared");
	assert.equal(getPlanningSession(), null);
	assert.equal(calls.some((call) => call[0] === "send"), false);
});

test("runRovoAppPlanRetryLifecycle suppresses a second retry attempt", async () => {
	const { calls, getPlanningSession, input } = createRetryLifecycleInput({
		planningSession: createSession({ retryUsed: true }),
	});

	const result = await runRovoAppPlanRetryLifecycle(input);

	assert.equal(result, "cleared");
	assert.equal(getPlanningSession(), null);
	assert.deepEqual(calls, [["planning-session", null]]);
});
