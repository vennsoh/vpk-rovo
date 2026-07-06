"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	resolveSmartRouteGate,
} = require("./smart-route-gate");

function createLogger() {
	const logs = [];
	return {
		logs,
		logger: {
			info: (...args) => logs.push(args),
		},
	};
}

test("resolveSmartRouteGate passes through prompt intent flags", () => {
	const result = resolveSmartRouteGate({
		promptIntent: {
			isConversational: true,
			isCreateIntentRequest: true,
			isTaskLike: true,
			prefersGenuiCardExperience: true,
		},
	});

	assert.equal(result.isTaskLikeRequest, true);
	assert.equal(result.prefersGenuiCardExperience, true);
	assert.equal(result.isCreateIntentRequestPrompt, true);
});

test("forced audio route activates when smart generation is inactive", () => {
	const { logs, logger } = createLogger();
	const result = resolveSmartRouteGate({
		inferredPromptIntent: "audio",
		logger,
		smartGeneration: { enabled: false, surface: null },
		smartGenerationActive: false,
	});

	assert.equal(result.forceSmartAudioRoute, true);
	assert.equal(result.smartRoutingActive, true);
	assert.equal(result.smartIntentResult, null);
	assert.deepEqual(logs, [
		["[SMART-GENERATION] Forcing smart audio route for explicit audio request"],
	]);
});

test("genui hint produces the existing layer-one smart intent result", () => {
	const { logs, logger } = createLogger();
	const result = resolveSmartRouteGate({
		allowedSurfaces: new Set(["studio", "rovo"]),
		genuiHint: true,
		logger,
		smartGeneration: {
			enabled: true,
			surface: "studio",
			containerWidthPx: 720,
			viewportWidthPx: 1280,
			widthClass: "wide",
		},
		smartGenerationActive: true,
	});

	assert.deepEqual(result.smartIntentResult, {
		intent: "genui",
		confidence: 1,
		reason: "layer1-genui-hint",
		rawOutput: null,
		error: null,
		timedOut: false,
	});
	assert.deepEqual(logs, [
		[
			"[SMART-GENERATION] Route gating",
			{
				enabled: true,
				surface: "studio",
				active: true,
				forcedAudioRoute: false,
				containerWidthPx: 720,
				viewportWidthPx: 1280,
				widthClass: "wide",
				allowedSurfaces: ["studio", "rovo"],
			},
		],
		["[SMART-GENERATION] GenUI intent from Layer 1 routing hint"],
	]);
});

test("strict tool-first turns suppress genui smart intent result", () => {
	const { logger } = createLogger();
	const result = resolveSmartRouteGate({
		genuiHint: true,
		isStrictToolFirstTurn: true,
		logger,
		smartGeneration: { enabled: true, surface: "studio" },
		smartGenerationActive: true,
	});

	assert.equal(result.smartRoutingActive, true);
	assert.equal(result.smartIntentResult, null);
});

test("inactive non-audio turn without hint does not activate smart routing", () => {
	const result = resolveSmartRouteGate({
		genuiHint: false,
		inferredPromptIntent: "normal",
		smartGeneration: { enabled: false, surface: null },
		smartGenerationActive: false,
	});

	assert.equal(result.forceSmartAudioRoute, false);
	assert.equal(result.smartRoutingActive, false);
	assert.equal(result.smartIntentResult, null);
});
