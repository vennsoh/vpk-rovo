"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	resolveChatSdkRequestEnvelope,
	resolveChatSdkRequestState,
} = require("./request-normalization");

function createEnvelopeDependencies() {
	return {
		getLatestUserMessageSource: (messages) =>
			messages?.at(-1)?.metadata?.source || null,
		getLatestVisibleUserMessage: (messages) =>
			messages?.findLast((message) => message?.role === "user") || null,
		normalizeApprovalSubmission: (value) => value || null,
		normalizeClarificationSubmission: (value) => value || null,
		normalizeClientTimeZone: (value) =>
			typeof value === "string" && value.trim() ? value.trim() : "UTC",
	};
}

function createStateDependencies({ sessions = new Map(), pausedIds = [] } = {}) {
	const updates = [];
	const clearedPlanSessions = [];
	const clearedDeferredToolCalls = [];
	const logs = [];
	const pausedRovoToolCallStore = new Map(
		pausedIds.map((id) => [id, { toolCallId: id }])
	);

	return {
		clearedDeferredToolCalls,
		clearedPlanSessions,
		dependencies: {
			clearActiveDeferredToolCall: (toolCallId) => {
				clearedDeferredToolCalls.push(toolCallId);
			},
			clearPlanSession: (threadId) => {
				clearedPlanSessions.push(threadId);
				sessions.delete(threadId);
			},
			getPlanSession: (threadId) =>
				sessions.get(threadId) || {
					isActive: false,
					phase: null,
					deferredToolCallId: null,
				},
			getToolCallIdFromApprovalSubmission: (approvalSubmission, rawApproval) =>
				approvalSubmission?.toolCallId || rawApproval?.toolCallId || null,
			getToolCallIdFromClarificationSubmission: (clarificationSubmission) =>
				clarificationSubmission?.toolCallId || null,
			logger: {
				info: (...args) => {
					logs.push(args);
				},
			},
			mapUiMessagesToConversation: (messages) => {
				const latest = messages?.findLast((message) => message.role === "user");
				return {
					message: latest?.content || "",
					conversationHistory: Array.isArray(messages) ? messages : [],
				};
			},
			pausedRovoToolCallStore,
			shouldRestorePlanModeOnResume: ({ pausedToolCallRecord, threadId }) => {
				const session = sessions.get(threadId);
				return {
					shouldRestore: Boolean(pausedToolCallRecord && session?.isActive),
					phase: session?.phase || null,
				};
			},
			updatePlanSession: (threadId, patch) => {
				updates.push({ threadId, patch });
				sessions.set(threadId, {
					isActive: false,
					phase: null,
					deferredToolCallId: null,
					...(sessions.get(threadId) || {}),
					...patch,
				});
			},
		},
		logs,
		updates,
	};
}

test("resolveChatSdkRequestEnvelope normalizes request defaults and trace metadata", () => {
	const envelope = resolveChatSdkRequestEnvelope({
		body: {
			messages: [
				{ role: "assistant", content: "Hello" },
				{
					role: "user",
					content: "Build an agent",
					metadata: { source: "clarification-submit" },
				},
			],
			backendPreference: "unknown",
			clientTimeZone: " Australia/Sydney ",
			provider: "gateway",
			model: "model-a",
			origin: "VOICE",
			chatSdkSource: "rovo",
			id: "thread-from-id",
			sessionId: " session-1 ",
			sessionMode: "ephemeral",
			genuiHint: true,
			hasQueuedPrompts: true,
			resolvedPlanModeActive: true,
		},
		...createEnvelopeDependencies(),
	});

	assert.equal(envelope.backendPreference, "ai-gateway");
	assert.equal(envelope.clientTimeZone, "Australia/Sydney");
	assert.equal(envelope.requestOrigin, "voice");
	assert.equal(envelope.chatSdkSource, "rovo");
	assert.equal(envelope.threadId, "thread-from-id");
	assert.equal(envelope.sessionId, "session-1");
	assert.equal(envelope.sessionMode, "ephemeral");
	assert.equal(envelope.rovoSessionId, null);
	assert.equal(envelope.genuiHint, true);
	assert.equal(envelope.hasQueuedPrompts, true);
	assert.equal(envelope.isPostClarificationTurn, true);
	assert.deepEqual(envelope.stageTraceMeta, {
		path: "/api/chat-sdk",
		origin: "voice",
		source: "rovo",
	});
	assert.deepEqual(envelope.entryTraceData, {
		messageCount: 2,
		backendPreference: "ai-gateway",
		provider: "gateway",
		model: "model-a",
		hasClarification: false,
		hasApproval: false,
		hasDeferredToolResponse: false,
		resolvedPlanModeActive: true,
	});
});

test("resolveChatSdkRequestEnvelope prepends creation mode context", () => {
	const envelope = resolveChatSdkRequestEnvelope({
		body: {
			messages: [{ role: "user", content: "Make a skill" }],
			contextDescription: "Existing context",
			creationMode: "skill",
		},
		...createEnvelopeDependencies(),
	});

	assert.match(envelope.contextDescription, /Existing context$/u);
	assert.notEqual(envelope.contextDescription, "Existing context");
	assert.equal(envelope.creationMode, "skill");
});

test("resolveChatSdkRequestState clears deferred calls and restores plan mode on paused clarification", () => {
	const sessions = new Map([
		[
			"thread-1",
			{
				isActive: true,
				phase: "plan",
				deferredToolCallId: "deferred-1",
			},
		],
	]);
	const envelope = resolveChatSdkRequestEnvelope({
		body: {
			messages: [{ role: "user", content: "Answer clarification" }],
			deferredToolResponse: { tool_call_id: "deferred-1" },
			clarification: { toolCallId: "clarify-1" },
			threadId: "thread-1",
		},
		...createEnvelopeDependencies(),
	});
	const { clearedDeferredToolCalls, dependencies } = createStateDependencies({
		sessions,
		pausedIds: ["clarify-1"],
	});

	const state = resolveChatSdkRequestState({
		envelope,
		...dependencies,
	});

	assert.deepEqual(clearedDeferredToolCalls, ["deferred-1"]);
	assert.equal(state.hasPausedClarificationToolCall, true);
	assert.equal(state.resolvedPlanModeActive, true);
	assert.equal(state.isPlanFeedbackDeferredResumeTurn, true);
	assert.equal(state.latestUserMessage, "Answer clarification");
	assert.equal(state.latestVisiblePromptText, "Answer clarification");
});

test("resolveChatSdkRequestState transitions approval turns to execution", () => {
	const sessions = new Map([
		["thread-1", { isActive: true, phase: "qa", deferredToolCallId: null }],
	]);
	const envelope = resolveChatSdkRequestEnvelope({
		body: {
			messages: [{ role: "user", content: "Build it" }],
			approval: { decision: "auto-accept", toolCallId: "approval-1" },
			threadId: "thread-1",
			resolvedPlanModeActive: true,
		},
		...createEnvelopeDependencies(),
	});
	const { dependencies, updates } = createStateDependencies({ sessions });

	const state = resolveChatSdkRequestState({
		envelope,
		...dependencies,
	});

	assert.equal(state.approvalToolCallId, "approval-1");
	assert.deepEqual(updates, [
		{ threadId: "thread-1", patch: { phase: "execution" } },
	]);
	assert.equal(sessions.get("thread-1").phase, "execution");
});

test("resolveChatSdkRequestState keeps custom approval submissions in planning", () => {
	const sessions = new Map([
		["thread-1", { isActive: true, phase: "qa", deferredToolCallId: null }],
	]);
	const envelope = resolveChatSdkRequestEnvelope({
		body: {
			messages: [{ role: "user", content: "Add rollback steps" }],
			approval: {
				decision: "custom",
				customInstruction: "Add rollback steps",
				toolCallId: "approval-1",
			},
			threadId: "thread-1",
			resolvedPlanModeActive: true,
		},
		...createEnvelopeDependencies(),
	});
	const { dependencies, updates } = createStateDependencies({ sessions });

	const state = resolveChatSdkRequestState({
		envelope,
		...dependencies,
	});

	assert.equal(state.approvalToolCallId, "approval-1");
	assert.deepEqual(updates, []);
	assert.equal(sessions.get("thread-1").phase, "qa");
});

test("resolveChatSdkRequestState preserves missing user message response shape", () => {
	const envelope = resolveChatSdkRequestEnvelope({
		body: {
			messages: [{ role: "assistant", content: "Hello" }],
		},
		...createEnvelopeDependencies(),
	});
	const { dependencies } = createStateDependencies();

	const state = resolveChatSdkRequestState({
		envelope,
		...dependencies,
	});

	assert.deepEqual(state.missingUserMessageResponse, {
		status: 400,
		body: { error: "A user message is required" },
	});
});
