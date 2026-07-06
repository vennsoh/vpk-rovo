"use strict";

const { buildRouteDecision } = require("../lib/route-decision");

function resolveManagedRunDeterministicRouteDecision({
	activeArtifact,
	autoPlanTriggered = false,
	requestArtifactCreationRetry = false,
	requestCreationMode = null,
	requestIsPlanMode = false,
	requestOrigin = "text",
	workItemReportRequest = {},
} = {}) {
	if (requestCreationMode === "agent") {
		return buildRouteDecision({
			intent: "chat",
			presentation: "text",
			confidence: 1,
			reason: "agent_creation_mode",
			origin: requestOrigin,
		});
	}

	if (workItemReportRequest.isIntent && !workItemReportRequest.hasContext) {
		return buildRouteDecision({
			intent: "chat",
			presentation: "text",
			confidence: 1,
			reason: "work_item_report_missing_context",
			origin: requestOrigin,
		});
	}

	if (workItemReportRequest.shouldCreateArtifact) {
		return buildRouteDecision({
			intent: "artifact_create",
			presentation: "artifact_preview",
			confidence: 1,
			reason: "work_item_report_intent",
			origin: requestOrigin,
		});
	}

	if (requestIsPlanMode || autoPlanTriggered) {
		return buildRouteDecision({
			intent: "chat",
			presentation: "text",
			confidence: 1,
			reason: "plan_mode_active",
			origin: requestOrigin,
		});
	}

	if (requestArtifactCreationRetry && !activeArtifact?.id) {
		return buildRouteDecision({
			intent: "artifact_create",
			presentation: "artifact_preview",
			confidence: 1,
			reason: "artifact_creation_retry",
			origin: requestOrigin,
		});
	}

	return null;
}

function buildRouteDecisionResolvedTraceData({ routingDecision, stageMs = 0 } = {}) {
	return {
		stageMs,
		intent: routingDecision.intent,
		confidence: routingDecision.confidence,
		reason: routingDecision.reason,
	};
}

function shouldDelegateRovoAppTurnToRovo({
	isPlanModeActive = false,
	requestBody,
	routingDecision,
} = {}) {
	if (requestBody?.backendPreference === "rovo") {
		return true;
	}

	if (
		routingDecision?.intent === "artifact_create" ||
		routingDecision?.intent === "artifact_update"
	) {
		return true;
	}

	if (isPlanModeActive) {
		return true;
	}

	return Boolean(
		requestBody?.activeArtifact?.id ||
		requestBody?.artifactContext?.id ||
		requestBody?.streamingArtifact?.id ||
		requestBody?.delegatedMessageId ||
		requestBody?.deferredToolResponse ||
		requestBody?.approval ||
		requestBody?.executionMode ||
		requestBody?.executionTask
	);
}

async function resolveRovoAppTurnBackendPreference({
	isPlanModeActive = false,
	isRovoAvailable,
	requestBody,
	routingDecision,
} = {}) {
	if (!shouldDelegateRovoAppTurnToRovo({ isPlanModeActive, requestBody, routingDecision })) {
		return "ai-gateway";
	}

	try {
		return (await isRovoAvailable()) ? "rovo" : "ai-gateway";
	} catch {
		return "ai-gateway";
	}
}

function buildRovoTurnRoutingTelemetry({
	assistantText = "",
	hasEmittedGenuiWidget = false,
	hasEmittedPlanWidget = false,
	hasEmittedQuestionCard = false,
	hasObservedActionableToolCall = false,
	hasObservedToolExecution = false,
	isPostClarificationTurn = false,
	isStrictToolFirstTurn = false,
	now = () => new Date(),
	routeToolsDetected = false,
} = {}) {
	const toolsDetected = isStrictToolFirstTurn
		? routeToolsDetected
		: hasObservedActionableToolCall || hasObservedToolExecution;

	return {
		timestamp: now().toISOString(),
		experience: hasEmittedQuestionCard
			? "question_card"
			: hasEmittedGenuiWidget
				? "generative_ui"
				: "text",
		toolsDetected,
		questionCardEmitted: hasEmittedQuestionCard,
		planWidgetEmitted: hasEmittedPlanWidget,
		genuiWidgetEmitted: hasEmittedGenuiWidget,
		toolFirstMatched: isStrictToolFirstTurn,
		isPostClarification: isPostClarificationTurn,
		assistantTextLength:
			typeof assistantText === "string" ? assistantText.length : 0,
	};
}

module.exports = {
	buildRouteDecisionResolvedTraceData,
	buildRovoTurnRoutingTelemetry,
	resolveRovoAppTurnBackendPreference,
	resolveManagedRunDeterministicRouteDecision,
	shouldDelegateRovoAppTurnToRovo,
};
