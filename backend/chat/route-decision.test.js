"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildRouteDecisionResolvedTraceData,
	buildRovoTurnRoutingTelemetry,
	resolveRovoAppTurnBackendPreference,
	resolveManagedRunDeterministicRouteDecision,
	shouldDelegateRovoAppTurnToRovo,
} = require("./route-decision");

test("agent creation mode stays in chat before artifact heuristics", () => {
	const decision = resolveManagedRunDeterministicRouteDecision({
		requestCreationMode: "agent",
		requestOrigin: "voice",
		workItemReportRequest: { shouldCreateArtifact: true },
	});

	assert.deepEqual(decision, {
		intent: "chat",
		presentation: "text",
		confidence: 1,
		reason: "agent_creation_mode",
		origin: "voice",
	});
});

test("work item report missing context routes to chat", () => {
	const decision = resolveManagedRunDeterministicRouteDecision({
		requestOrigin: "text",
		workItemReportRequest: { isIntent: true, hasContext: false },
	});

	assert.equal(decision.intent, "chat");
	assert.equal(decision.reason, "work_item_report_missing_context");
});

test("work item report artifact intent routes to artifact create", () => {
	const decision = resolveManagedRunDeterministicRouteDecision({
		workItemReportRequest: { shouldCreateArtifact: true },
	});

	assert.deepEqual(decision, {
		intent: "artifact_create",
		presentation: "artifact_preview",
		confidence: 1,
		reason: "work_item_report_intent",
		origin: "text",
	});
});

test("plan mode wins before artifact retry", () => {
	const decision = resolveManagedRunDeterministicRouteDecision({
		autoPlanTriggered: true,
		requestArtifactCreationRetry: true,
	});

	assert.equal(decision.intent, "chat");
	assert.equal(decision.reason, "plan_mode_active");
});

test("artifact retry only routes to create when no active artifact exists", () => {
	assert.equal(
		resolveManagedRunDeterministicRouteDecision({
			activeArtifact: { id: "artifact-1" },
			requestArtifactCreationRetry: true,
		}),
		null
	);

	const retryDecision = resolveManagedRunDeterministicRouteDecision({
		requestArtifactCreationRetry: true,
	});
	assert.equal(retryDecision.intent, "artifact_create");
	assert.equal(retryDecision.reason, "artifact_creation_retry");
});

test("ambiguous requests fall through to the async classifier", () => {
	assert.equal(resolveManagedRunDeterministicRouteDecision(), null);
});

test("trace payload preserves existing route_decision_resolved shape", () => {
	assert.deepEqual(
		buildRouteDecisionResolvedTraceData({
			stageMs: 12,
			routingDecision: {
				intent: "chat",
				confidence: 0.5,
				reason: "classifier",
			},
		}),
		{
			stageMs: 12,
			intent: "chat",
			confidence: 0.5,
			reason: "classifier",
		}
	);
});

test("shouldDelegateRovoAppTurnToRovo detects explicit Rovo and route signals", () => {
	assert.equal(
		shouldDelegateRovoAppTurnToRovo({
			requestBody: { backendPreference: "rovo" },
		}),
		true,
	);
	assert.equal(
		shouldDelegateRovoAppTurnToRovo({
			routingDecision: { intent: "artifact_create" },
		}),
		true,
	);
	assert.equal(
		shouldDelegateRovoAppTurnToRovo({
			routingDecision: { intent: "artifact_update" },
		}),
		true,
	);
	assert.equal(
		shouldDelegateRovoAppTurnToRovo({ isPlanModeActive: true }),
		true,
	);
	assert.equal(shouldDelegateRovoAppTurnToRovo(), false);
});

test("shouldDelegateRovoAppTurnToRovo detects stateful Rovo app body fields", () => {
	for (const requestBody of [
		{ activeArtifact: { id: "artifact-1" } },
		{ artifactContext: { id: "artifact-1" } },
		{ streamingArtifact: { id: "artifact-1" } },
		{ delegatedMessageId: "message-1" },
		{ deferredToolResponse: { tool_call_id: "tool-1" } },
		{ approval: { decision: "auto-accept" } },
		{ executionMode: "task" },
		{ executionTask: { id: "task-1" } },
	]) {
		assert.equal(
			shouldDelegateRovoAppTurnToRovo({ requestBody }),
			true,
			JSON.stringify(requestBody),
		);
	}

	assert.equal(
		shouldDelegateRovoAppTurnToRovo({
			requestBody: { activeArtifact: {}, backendPreference: "ai-gateway" },
			routingDecision: { intent: "chat" },
		}),
		false,
	);
});

test("resolveRovoAppTurnBackendPreference skips availability checks for AI Gateway turns", async () => {
	let availabilityChecks = 0;
	const backendPreference = await resolveRovoAppTurnBackendPreference({
		isRovoAvailable: async () => {
			availabilityChecks += 1;
			return true;
		},
		requestBody: { backendPreference: "ai-gateway" },
		routingDecision: { intent: "chat" },
	});

	assert.equal(backendPreference, "ai-gateway");
	assert.equal(availabilityChecks, 0);
});

test("resolveRovoAppTurnBackendPreference falls back to AI Gateway when Rovo is unavailable", async () => {
	assert.equal(
		await resolveRovoAppTurnBackendPreference({
			isPlanModeActive: true,
			isRovoAvailable: async () => true,
		}),
		"rovo",
	);
	assert.equal(
		await resolveRovoAppTurnBackendPreference({
			isPlanModeActive: true,
			isRovoAvailable: async () => false,
		}),
		"ai-gateway",
	);
	assert.equal(
		await resolveRovoAppTurnBackendPreference({
			isPlanModeActive: true,
			isRovoAvailable: async () => {
				throw new Error("probe failed");
			},
		}),
		"ai-gateway",
	);
});

test("buildRovoTurnRoutingTelemetry preserves timestamp and summary fields", () => {
	const telemetry = buildRovoTurnRoutingTelemetry({
		assistantText: "Hello",
		hasEmittedPlanWidget: true,
		hasObservedActionableToolCall: true,
		isPostClarificationTurn: true,
		now: () => new Date("2026-07-04T12:34:56.000Z"),
	});

	assert.deepEqual(telemetry, {
		timestamp: "2026-07-04T12:34:56.000Z",
		experience: "text",
		toolsDetected: true,
		questionCardEmitted: false,
		planWidgetEmitted: true,
		genuiWidgetEmitted: false,
		toolFirstMatched: false,
		isPostClarification: true,
		assistantTextLength: 5,
	});
});

test("buildRovoTurnRoutingTelemetry preserves experience precedence", () => {
	assert.equal(
		buildRovoTurnRoutingTelemetry({
			hasEmittedGenuiWidget: true,
			hasEmittedQuestionCard: true,
		}).experience,
		"question_card",
	);
	assert.equal(
		buildRovoTurnRoutingTelemetry({
			hasEmittedGenuiWidget: true,
		}).experience,
		"generative_ui",
	);
	assert.equal(buildRovoTurnRoutingTelemetry().experience, "text");
});

test("buildRovoTurnRoutingTelemetry preserves strict tool-first tool detection", () => {
	assert.equal(
		buildRovoTurnRoutingTelemetry({
			hasObservedActionableToolCall: true,
			isStrictToolFirstTurn: true,
			routeToolsDetected: false,
		}).toolsDetected,
		false,
	);
	assert.equal(
		buildRovoTurnRoutingTelemetry({
			hasObservedToolExecution: true,
			isStrictToolFirstTurn: false,
			routeToolsDetected: false,
		}).toolsDetected,
		true,
	);
});
