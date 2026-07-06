"use strict";

const { getNonEmptyString } = require("../lib/shared-utils");

const APPROVAL_DECISIONS = new Set(["auto-accept", "continue-planning", "custom"]);

function normalizePlanTasks(value) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((task) => {
			if (typeof task === "string") {
				const label = getNonEmptyString(task);
				return label ? { id: "", label, agent: undefined, blockedBy: [] } : null;
			}

			if (task && typeof task === "object") {
				const label = getNonEmptyString(task.label);
				if (!label) return null;

				return {
					id: getNonEmptyString(task.id) || "",
					label,
					agent: getNonEmptyString(task.agent) || undefined,
					blockedBy: Array.isArray(task.blockedBy)
						? task.blockedBy
								.map((item) => getNonEmptyString(item))
								.filter(Boolean)
						: [],
				};
			}

			return null;
		})
		.filter(Boolean)
		.slice(0, 20);
}

function normalizeApprovalDecision(value) {
	const normalizedDecision = getNonEmptyString(value);
	if (!normalizedDecision || !APPROVAL_DECISIONS.has(normalizedDecision)) {
		return null;
	}

	return normalizedDecision;
}

function normalizeApprovalSubmission(value) {
	if (!value || typeof value !== "object") {
		return null;
	}

	const decision =
		normalizeApprovalDecision(value.decision) ||
		normalizeApprovalDecision(value.choice) ||
		normalizeApprovalDecision(value.selection);
	if (!decision) {
		return null;
	}

	return {
		decision,
		customInstruction:
			getNonEmptyString(value.customInstruction) ||
			getNonEmptyString(value.note) ||
			undefined,
		planTitle:
			getNonEmptyString(value.planTitle) ||
			getNonEmptyString(value.title) ||
			undefined,
		planTasks: normalizePlanTasks(value.planTasks || value.tasks),
		toolCallId:
			getNonEmptyString(value.toolCallId) ||
			getNonEmptyString(value.deferredToolCallId) ||
			undefined,
		deferredToolCallId:
			getNonEmptyString(value.deferredToolCallId) ||
			getNonEmptyString(value.toolCallId) ||
			undefined,
	};
}

function getApprovalDecisionLabel(decision) {
	if (decision === "auto-accept") {
		return "Yes, let's start cooking";
	}

	if (decision === "continue-planning") {
		return "No, keep planning";
	}

	return "Custom instruction";
}

function shouldContinuePlanning(decision) {
	return decision === "continue-planning" || decision === "custom";
}

function buildApprovalSummary(approvalSubmission) {
	if (!approvalSubmission) {
		return "";
	}

	const lines = [
		`Decision: ${getApprovalDecisionLabel(approvalSubmission.decision)}`,
	];

	if (approvalSubmission.planTitle) {
		lines.push(`Plan title: ${approvalSubmission.planTitle}`);
	}

	if (approvalSubmission.customInstruction) {
		lines.push(`Additional instruction: ${approvalSubmission.customInstruction}`);
	}

	if (approvalSubmission.planTasks.length > 0) {
		lines.push("Plan tasks:");
		for (const task of approvalSubmission.planTasks) {
			const agentSuffix = task.agent ? ` [Agent: ${task.agent}]` : "";
			const blockedSuffix = task.blockedBy.length > 0 ? ` (blockedBy: ${task.blockedBy.join(", ")})` : "";
			lines.push(`  - id="${task.id}" ${task.label}${agentSuffix}${blockedSuffix}`);
		}
	}

	if (shouldContinuePlanning(approvalSubmission.decision)) {
		lines.push(
			approvalSubmission.decision === "custom"
				? "The user wants revisions before approving this plan."
				: "The user rejected this plan and wants revisions.",
			"Stay in plan mode. Revise the plan based on any feedback provided above.",
			"Call exit_plan_mode again with the updated plan.",
			"Do not start implementation or call update_todo."
		);
	} else {
		lines.push(
			"This approval applies to the existing generated plan. Continue from it.",
			"Stay in the current Rovo Serve execution loop.",
			"Maintain a single evolving update_todo list for implementation progress.",
			"Do not ask clarification questions again unless the user explicitly requests a new plan.",
			"Do not restate the plan as a fresh request or generate a new preview unless the user explicitly asks for one."
		);
	}

	return lines.join("\n");
}

function buildAIGatewayPlanApprovalResult(approvalSubmission, rawApproval) {
	if (!approvalSubmission) {
		return null;
	}

	const result = {
		decision: approvalSubmission.decision,
		customInstruction: approvalSubmission.customInstruction,
		toolCallId:
			getNonEmptyString(rawApproval?.toolCallId) ||
			getNonEmptyString(rawApproval?.deferredToolCallId) ||
			approvalSubmission.toolCallId ||
			approvalSubmission.deferredToolCallId ||
			undefined,
	};

	if (shouldContinuePlanning(approvalSubmission.decision)) {
		result.instructions = [
			approvalSubmission.decision === "custom"
				? "The user wants revisions before approving this plan."
				: "The user rejected this plan and wants revisions.",
			"Stay in plan mode and call exit_plan_mode again with the updated plan.",
			"Do not start implementation.",
		];
	} else {
		result.instructions = [
			"The user approved this plan.",
			"Continue from the approved plan without asking clarification questions again unless the user explicitly requests a new plan.",
		];
	}

	if (approvalSubmission.planTitle) {
		result.planTitle = approvalSubmission.planTitle;
	}
	if (approvalSubmission.planTasks.length > 0) {
		result.planTasks = approvalSubmission.planTasks;
	}

	return result;
}

function getToolCallIdFromApprovalSubmission(approvalSubmission, rawApproval) {
	return (
		getNonEmptyString(approvalSubmission?.toolCallId) ||
		getNonEmptyString(approvalSubmission?.deferredToolCallId) ||
		getNonEmptyString(rawApproval?.toolCallId) ||
		getNonEmptyString(rawApproval?.deferredToolCallId) ||
		null
	);
}

function buildApprovalResumeDecision(approvalSubmission) {
	if (!approvalSubmission) {
		return null;
	}

	if (approvalSubmission.decision === "auto-accept") {
		return null;
	}

	return buildApprovalSummary(approvalSubmission);
}

module.exports = {
	buildAIGatewayPlanApprovalResult,
	buildApprovalResumeDecision,
	getToolCallIdFromApprovalSubmission,
	normalizeApprovalDecision,
	normalizeApprovalSubmission,
};
