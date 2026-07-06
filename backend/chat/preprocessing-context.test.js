"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	appendContextBlock,
	buildAskUserQuestionsResultBlock,
	resolveChatSdkPreprocessingContext,
} = require("./preprocessing-context");

function createDependencies({ logs = [] } = {}) {
	return {
		adaptClarificationAnswersForToolContract: (sessionId, answers) => ({
			sessionId,
			answers,
			adapted: true,
		}),
		buildAIGatewayDeferredToolResultBlock: ({ toolName, toolCallId, result }) =>
			[
				`[${toolName} Result]`,
				`tool_call_id: ${toolCallId}`,
				`result: ${JSON.stringify(result)}`,
				`[End ${toolName} Result]`,
			].join("\n"),
		buildAIGatewayPlanApprovalResult: (approvalSubmission, rawApproval) => ({
			decision: approvalSubmission.decision,
			rawToolCallId: rawApproval?.toolCallId || null,
		}),
		buildClarificationResumeDenyMessage: () => "User dismissed clarification.",
		isAIGatewayDeferredToolCallId: (toolCallId) =>
			typeof toolCallId === "string" && toolCallId.startsWith("ai-gateway-"),
		logger: {
			info: (...args) => {
				logs.push(args);
			},
		},
	};
}

test("appendContextBlock preserves empty and existing context behavior", () => {
	assert.equal(appendContextBlock(null, "block"), "block");
	assert.equal(appendContextBlock("base", "block"), "base\n\nblock");
	assert.equal(appendContextBlock("base", ""), "base");
});

test("buildAskUserQuestionsResultBlock preserves legacy ask_user_questions shape", () => {
	assert.equal(
		buildAskUserQuestionsResultBlock({
			adaptedAnswers: { q1: "answer" },
		}),
		[
			"[ask_user_questions Result]",
			"The user answered your ask_user_questions tool call. Here are their answers:",
			"{\"q1\":\"answer\"}",
			"[End ask_user_questions Result]",
		].join("\n")
	);
});

test("clarification submissions use AI Gateway synthetic result on gateway backend", () => {
	const context = resolveChatSdkPreprocessingContext({
		...createDependencies(),
		backendPreference: "ai-gateway",
		clarificationSubmission: {
			sessionId: "session-1",
			answers: { q1: "Yes" },
		},
		clarificationToolCallId: "tool-1",
		contextDescription: "Existing",
	});

	assert.equal(
		context,
		[
			"Existing",
			"",
			"[ask_user_questions Result]",
			"tool_call_id: tool-1",
			"result: {\"sessionId\":\"session-1\",\"answers\":{\"q1\":\"Yes\"},\"adapted\":true}",
			"[End ask_user_questions Result]",
		].join("\n")
	);
});

test("dismissed clarification submissions pass the deny message as the synthetic result", () => {
	const context = resolveChatSdkPreprocessingContext({
		...createDependencies(),
		backendPreference: "ai-gateway",
		clarificationSubmission: {
			sessionId: "session-1",
			answers: {},
			status: "dismissed",
		},
		clarificationToolCallId: "tool-1",
	});

	assert.match(context, /result: "User dismissed clarification\."/u);
});

test("Rovo clarification submissions keep the legacy ask_user_questions block when not paused", () => {
	const context = resolveChatSdkPreprocessingContext({
		...createDependencies(),
		backendPreference: "rovo",
		clarificationSubmission: {
			sessionId: "session-2",
			answers: { q2: "No" },
		},
		clarificationToolCallId: "rovo-tool-1",
	});

	assert.match(context, /^\[ask_user_questions Result\]/u);
	assert.match(context, /"sessionId":"session-2"/u);
});

test("paused clarification and approval submissions are not injected", () => {
	const context = resolveChatSdkPreprocessingContext({
		...createDependencies(),
		approvalSubmission: {
			decision: "auto-accept",
			toolCallId: "approval-1",
		},
		backendPreference: "rovo",
		clarificationSubmission: {
			sessionId: "session-2",
			answers: { q2: "No" },
		},
		contextDescription: "Existing",
		hasPausedApprovalToolCall: true,
		hasPausedClarificationToolCall: true,
	});

	assert.equal(context, "Existing");
});

test("legacy deferred tool responses are adapted into clarification context and logged", () => {
	const logs = [];
	const context = resolveChatSdkPreprocessingContext({
		...createDependencies({ logs }),
		contextDescription: "Existing",
		rawDeferredToolResponse: {
			tool_call_id: "rovo-tool-1",
			result: { q1: "A" },
		},
	});

	assert.match(context, /Existing\n\n\[ask_user_questions Result\]/u);
	assert.match(context, /"sessionId":"request-user-input-rovo-tool-1"/u);
	assert.deepEqual(logs[0], [
		"[CHAT-SDK] Normalized legacy deferred tool response into clarification context",
		{
			toolCallId: "rovo-tool-1",
			resultKeys: ["sessionId", "answers", "adapted"],
		},
	]);
});

test("AI Gateway exit_plan_mode deferred responses use a synthetic exit_plan_mode result", () => {
	const context = resolveChatSdkPreprocessingContext({
		...createDependencies(),
		rawDeferredToolResponse: {
			tool_call_id: "ai-gateway-exit_plan_mode-1",
			result: { decision: "accept" },
		},
	});

	assert.match(context, /^\[exit_plan_mode Result\]/u);
	assert.match(context, /tool_call_id: ai-gateway-exit_plan_mode-1/u);
});

test("approvals use AI Gateway synthetic result when tool call id is gateway generated", () => {
	const context = resolveChatSdkPreprocessingContext({
		...createDependencies(),
		approvalSubmission: {
			decision: "auto-accept",
			customInstruction: "Ship it",
			toolCallId: "ai-gateway-exit_plan_mode-2",
		},
		rawApproval: {
			toolCallId: "ai-gateway-exit_plan_mode-2",
		},
	});

	assert.match(context, /^\[exit_plan_mode Result\]/u);
	assert.match(context, /"decision":"auto-accept"/u);
});

test("non-gateway approvals preserve the plain Plan approval block", () => {
	const context = resolveChatSdkPreprocessingContext({
		...createDependencies(),
		approvalSubmission: {
			decision: "custom",
			customInstruction: "Revise the plan",
			toolCallId: "rovo-approval-1",
		},
	});

	assert.equal(
		context,
		"Plan approval: {\"decision\":\"custom\",\"customInstruction\":\"Revise the plan\",\"toolCallId\":\"rovo-approval-1\"}"
	);
});
