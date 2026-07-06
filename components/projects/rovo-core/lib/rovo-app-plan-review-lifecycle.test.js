const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	acceptRovoAppPlanReview,
	sendRovoAppPlanReviewResult,
	submitRovoAppPlanApproval,
} = loadRovoCoreModule("lib/rovo-app-plan-review-lifecycle.ts");

function createPlanWidget(overrides = {}) {
	return {
		title: "Build plan",
		markdown: "## Build plan",
		deferredToolCallId: "tool-1",
		toolCallId: "tool-1",
		tasks: [
			{
				id: "task-1",
				label: "Implement",
				description: "Implement the plan",
				agentName: "Builder",
				blockedBy: [],
			},
		],
		...overrides,
	};
}

function createPlanReviewResultInput(overrides = {}) {
	const calls = [];
	let dismissedKeys = new Set(["thread-1:tool:tool-1", "thread-2:other"]);
	let planningSession = "unset";
	const input = {
		appendLocalUserMessage: ({ metadata, text }) => {
			calls.push(["append", text, metadata]);
			const message = {
				id: "user-1",
				role: "user",
				parts: [{ type: "text", text }],
				metadata,
			};
			return { message, messageId: message.id };
		},
		ensureThread: async (title) => {
			calls.push(["ensure-thread", title]);
			return "thread-1";
		},
		isPlanMode: false,
		lastUseChatBusyAtRef: { current: 0 },
		markLocalThreadRunPending: (threadId) => {
			calls.push(["mark-run", threadId]);
		},
		messageMetadata: undefined,
		planModeSyncRequestIdRef: { current: 0 },
		planWidget: createPlanWidget(),
		releaseCompletedUseChatTurnIfNeeded: async () => {
			calls.push(["release-turn"]);
		},
		resetPendingArtifactAssociation: () => {
			calls.push(["reset-artifact-association"]);
		},
		result: "Accept.",
		rovoMessagesRef: {
			current: [
				{
					id: "assistant-baseline",
					role: "assistant",
					parts: [{ type: "text", text: "Plan" }],
				},
			],
		},
		sendMessage: async (message, options) => {
			calls.push(["send", message, options]);
		},
		clearPlanExecutionTrackerDismissalsForThread: (threadId) => {
			dismissedKeys = new Set(
				[...dismissedKeys].filter((key) => !key.startsWith(`${threadId}:`)),
			);
			calls.push(["dismissed-keys", [...dismissedKeys]]);
		},
		setPlanningSession: (updater) => {
			planningSession = typeof updater === "function" ? updater(planningSession) : updater;
			calls.push(["planning-session", planningSession]);
		},
		syncAgentModeForDispatch: async (mode) => {
			calls.push(["sync-mode", mode]);
		},
		userMessageText: "Accepted the plan.",
		useChatStatusRef: { current: "ready" },
		...overrides,
	};

	return {
		calls,
		getDismissedKeys: () => dismissedKeys,
		getPlanningSession: () => planningSession,
		input,
	};
}

test("acceptRovoAppPlanReview submits the auto-accept plan review payload", async () => {
	const sent = [];
	const planWidget = createPlanWidget();

	await acceptRovoAppPlanReview({
		planWidget,
		sendPlanReviewResult: async (payload) => {
			sent.push(payload);
		},
	});

	assert.deepEqual(sent, [
		{
			isPlanMode: false,
			messageMetadata: {
				source: "plan-approval-submit",
				planApprovalDecision: "auto-accept",
				planApprovalPlanKey: "tool:tool-1",
			},
			planWidget,
			result: "Accept.",
			userMessageText: "Accepted the plan.",
		},
	]);
});

test("submitRovoAppPlanApproval builds a custom revision approval payload", async () => {
	const sent = [];
	const planWidget = createPlanWidget();

	await submitRovoAppPlanApproval({
		acceptPlanReview: async () => {
			throw new Error("custom decision should not auto-accept");
		},
		planWidget,
		selection: {
			decision: "custom",
			customInstruction: "  Add rollback steps  ",
		},
		sendPlanReviewResult: async (payload) => {
			sent.push(payload);
		},
	});

	assert.equal(sent.length, 1);
	assert.equal(sent[0].isPlanMode, true);
	assert.equal(sent[0].result, "Add rollback steps");
	assert.deepEqual(sent[0].messageMetadata, {
		source: "plan-approval-submit",
		planApprovalDecision: "custom",
		planApprovalPlanKey: "tool:tool-1",
	});
	assert.deepEqual(sent[0].approval, {
		decision: "custom",
		customInstruction: "Add rollback steps",
		planTitle: "Build plan",
		planTasks: [],
		toolCallId: "tool-1",
		deferredToolCallId: "tool-1",
	});
	assert.match(sent[0].userMessageText, /Decision: Custom instruction\./u);
	assert.match(sent[0].userMessageText, /Additional instruction: Add rollback steps/u);
});

test("sendRovoAppPlanReviewResult sends plan-mode approval bodies and restarts planning", async () => {
	const approval = {
		decision: "continue-planning",
		deferredToolCallId: "tool-1",
	};
	const { calls, getDismissedKeys, getPlanningSession, input } = createPlanReviewResultInput({
		approval,
		isPlanMode: true,
		messageMetadata: {
			source: "plan-approval-submit",
			planApprovalDecision: "continue-planning",
			planApprovalPlanKey: "tool:tool-1",
		},
		result: "Continue planning.",
		userMessageText: "I reviewed the plan.",
	});

	await sendRovoAppPlanReviewResult(input);

	const sendCall = calls.find((call) => call[0] === "send");
	assert.ok(sendCall);
	assert.deepEqual(sendCall[1], {
		text: "I reviewed the plan.",
		files: [],
		messageId: "user-1",
		metadata: {
			source: "plan-approval-submit",
			planApprovalDecision: "continue-planning",
			planApprovalPlanKey: "tool:tool-1",
		},
	});
	assert.equal(sendCall[2].body.id, "thread-1");
	assert.equal(sendCall[2].body.isPlanMode, true);
	assert.match(sendCall[2].body.contextDescription, /POST-CLARIFICATION/u);
	assert.deepEqual(sendCall[2].body.approval, approval);
	assert.equal(sendCall[2].body.deferredToolResponse, undefined);
	assert.deepEqual([...getDismissedKeys()], ["thread-2:other"]);
	assert.deepEqual(getPlanningSession(), {
		requestId: 1,
		phase: "awaiting-plan",
		hasStreamStarted: false,
		retryUsed: false,
		baselineAssistantMessageId: "assistant-baseline",
	});
	assert.deepEqual(
		calls
			.filter((call) => ["release-turn", "ensure-thread", "sync-mode", "append", "reset-artifact-association", "mark-run", "send"].includes(call[0]))
			.map((call) => call[0]),
		[
			"release-turn",
			"ensure-thread",
			"sync-mode",
			"append",
			"reset-artifact-association",
			"mark-run",
			"send",
		],
	);
});

test("sendRovoAppPlanReviewResult resumes deferred tools for accepted plans", async () => {
	const { calls, input } = createPlanReviewResultInput();

	await sendRovoAppPlanReviewResult(input);

	const sendCall = calls.find((call) => call[0] === "send");
	assert.ok(sendCall);
	assert.deepEqual(sendCall[2].body, {
		id: "thread-1",
		isPlanMode: false,
		contextDescription: undefined,
		deferredToolResponse: {
			tool_call_id: "tool-1",
			result: "Accept.",
		},
	});
	assert.deepEqual(
		calls.find((call) => call[0] === "planning-session"),
		["planning-session", null],
	);
});

test("sendRovoAppPlanReviewResult rejects plan reviews without a resumable tool", async () => {
	const { input } = createPlanReviewResultInput({
		planWidget: createPlanWidget({
			deferredToolCallId: null,
			toolCallId: null,
		}),
	});

	await assert.rejects(
		() => sendRovoAppPlanReviewResult(input),
		/The pending plan review is missing a deferred tool call/u,
	);
});
