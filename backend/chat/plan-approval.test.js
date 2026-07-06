"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildAIGatewayPlanApprovalResult,
	buildApprovalResumeDecision,
	getToolCallIdFromApprovalSubmission,
	normalizeApprovalDecision,
	normalizeApprovalSubmission,
} = require("./plan-approval");

test("normalizeApprovalDecision accepts the frontend allowlisted decisions", () => {
	assert.equal(normalizeApprovalDecision("auto-accept"), "auto-accept");
	assert.equal(normalizeApprovalDecision("continue-planning"), "continue-planning");
	assert.equal(normalizeApprovalDecision("custom"), "custom");
});

test("normalizeApprovalDecision rejects invalid values without throwing", () => {
	assert.equal(normalizeApprovalDecision("ship-it"), null);
	assert.equal(normalizeApprovalDecision(""), null);
	assert.equal(normalizeApprovalDecision(null), null);
});

test("normalizeApprovalSubmission accepts aliases and normalizes task fields", () => {
	const fromChoice = normalizeApprovalSubmission({
		choice: "auto-accept",
		planTitle: "Todo board",
		customInstruction: "  add swimlanes  ",
		planTasks: [
			{ id: "task-1", label: "Build board", blockedBy: ["task-0", ""], agent: "ui" },
			" Polish empty state ",
			{ id: "bad-task" },
		],
		deferredToolCallId: "deferred-123",
	});

	assert.deepEqual(fromChoice, {
		decision: "auto-accept",
		customInstruction: "add swimlanes",
		planTitle: "Todo board",
		planTasks: [
			{
				id: "task-1",
				label: "Build board",
				agent: "ui",
				blockedBy: ["task-0"],
			},
			{
				id: "",
				label: "Polish empty state",
				agent: undefined,
				blockedBy: [],
			},
		],
		toolCallId: "deferred-123",
		deferredToolCallId: "deferred-123",
	});

	const fromSelection = normalizeApprovalSubmission({ selection: "continue-planning" });
	assert.equal(fromSelection.decision, "continue-planning");
});

test("normalizeApprovalSubmission no longer throws on valid approval payloads", () => {
	assert.doesNotThrow(() => {
		const result = normalizeApprovalSubmission({
			decision: "auto-accept",
			planTitle: "Kanban To-Do App",
			planTasks: [{ id: "task-1", label: "Create route files", blockedBy: [] }],
		});
		assert.equal(result?.decision, "auto-accept");
	});
});

test("getToolCallIdFromApprovalSubmission preserves submission precedence", () => {
	assert.equal(
		getToolCallIdFromApprovalSubmission(
			{ toolCallId: "approval-tool", deferredToolCallId: "approval-deferred" },
			{ toolCallId: "raw-tool", deferredToolCallId: "raw-deferred" },
		),
		"approval-tool",
	);
	assert.equal(
		getToolCallIdFromApprovalSubmission(
			{ deferredToolCallId: "approval-deferred" },
			{ toolCallId: "raw-tool" },
		),
		"approval-deferred",
	);
	assert.equal(
		getToolCallIdFromApprovalSubmission(
			{},
			{ deferredToolCallId: "raw-deferred" },
		),
		"raw-deferred",
	);
	assert.equal(getToolCallIdFromApprovalSubmission(null, null), null);
});

test("buildApprovalResumeDecision returns null for accepted plans", () => {
	const approval = normalizeApprovalSubmission({
		decision: "auto-accept",
		planTitle: "Approved plan",
	});

	assert.equal(buildApprovalResumeDecision(approval), null);
});

test("buildApprovalResumeDecision summarizes continue-planning revisions", () => {
	const approval = normalizeApprovalSubmission({
		decision: "continue-planning",
		planTitle: "Build plan",
		planTasks: [
			{
				id: "task-1",
				label: "Create route",
				agent: "frontend",
				blockedBy: ["task-0"],
			},
		],
	});

	const summary = buildApprovalResumeDecision(approval);
	assert.match(summary, /Decision: No, keep planning/u);
	assert.match(summary, /Plan title: Build plan/u);
	assert.match(summary, /id="task-1" Create route \[Agent: frontend\] \(blockedBy: task-0\)/u);
	assert.match(summary, /Do not start implementation or call update_todo\./u);
});

test("buildApprovalResumeDecision treats custom instructions as plan revisions", () => {
	const approval = normalizeApprovalSubmission({
		decision: "custom",
		customInstruction: "Add rollback steps",
		planTitle: "Build plan",
		planTasks: [
			{
				id: "task-2",
				label: "Wire deploy controls",
				agent: "backend",
				blockedBy: ["task-1"],
			},
		],
	});

	const summary = buildApprovalResumeDecision(approval);
	assert.match(summary, /Decision: Custom instruction/u);
	assert.match(summary, /Additional instruction: Add rollback steps/u);
	assert.match(summary, /The user wants revisions before approving this plan\./u);
	assert.match(summary, /id="task-2" Wire deploy controls \[Agent: backend\] \(blockedBy: task-1\)/u);
	assert.match(summary, /Do not start implementation or call update_todo\./u);
});

test("buildAIGatewayPlanApprovalResult preserves approved plan metadata", () => {
	const approval = normalizeApprovalSubmission({
		decision: "auto-accept",
		planTitle: "Approved plan",
		planTasks: [{ id: "task-1", label: "Build", blockedBy: [] }],
		toolCallId: "normalized-tool",
	});

	assert.deepEqual(
		buildAIGatewayPlanApprovalResult(approval, {
			toolCallId: " raw-tool ",
			deferredToolCallId: "raw-deferred",
		}),
		{
			decision: "auto-accept",
			customInstruction: undefined,
			toolCallId: "raw-tool",
			instructions: [
				"The user approved this plan.",
				"Continue from the approved plan without asking clarification questions again unless the user explicitly requests a new plan.",
			],
			planTitle: "Approved plan",
			planTasks: [
				{ id: "task-1", label: "Build", agent: undefined, blockedBy: [] },
			],
		},
	);
});

test("buildAIGatewayPlanApprovalResult instructs planning for rejected and custom decisions", () => {
	const continuePlanning = normalizeApprovalSubmission({
		decision: "continue-planning",
		deferredToolCallId: "normalized-deferred",
	});
	const custom = normalizeApprovalSubmission({
		decision: "custom",
		customInstruction: "Add rollback steps",
		toolCallId: "normalized-tool",
	});

	assert.deepEqual(
		buildAIGatewayPlanApprovalResult(continuePlanning, {
			deferredToolCallId: "raw-deferred",
		}),
		{
			decision: "continue-planning",
			customInstruction: undefined,
			toolCallId: "raw-deferred",
			instructions: [
				"The user rejected this plan and wants revisions.",
				"Stay in plan mode and call exit_plan_mode again with the updated plan.",
				"Do not start implementation.",
			],
		},
	);
	assert.deepEqual(buildAIGatewayPlanApprovalResult(custom, {}), {
		decision: "custom",
		customInstruction: "Add rollback steps",
		toolCallId: "normalized-tool",
		instructions: [
			"The user wants revisions before approving this plan.",
			"Stay in plan mode and call exit_plan_mode again with the updated plan.",
			"Do not start implementation.",
		],
	});
	assert.equal(buildAIGatewayPlanApprovalResult(null, {}), null);
});
