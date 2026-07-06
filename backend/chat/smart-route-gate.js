"use strict";

function createLayerOneGenuiIntentResult() {
	return {
		intent: "genui",
		confidence: 1,
		reason: "layer1-genui-hint",
		rawOutput: null,
		error: null,
		timedOut: false,
	};
}

function resolveSmartRouteGate({
	allowedSurfaces = [],
	genuiHint = false,
	inferredPromptIntent = null,
	isStrictToolFirstTurn = false,
	logger = console,
	promptIntent = {},
	smartGeneration = {},
	smartGenerationActive = false,
} = {}) {
	const effectiveLogger =
		logger && typeof logger.info === "function" ? logger : null;
	const isTaskLikeRequest = promptIntent.isTaskLike;
	const prefersGenuiCardExperience = promptIntent.prefersGenuiCardExperience;
	const isCreateIntentRequestPrompt = promptIntent.isCreateIntentRequest;
	const forceSmartAudioRoute =
		!smartGenerationActive && inferredPromptIntent === "audio";
	const smartRoutingActive = smartGenerationActive || forceSmartAudioRoute;

	if (smartGeneration.enabled || smartGeneration.surface) {
		effectiveLogger?.info("[SMART-GENERATION] Route gating", {
			enabled: smartGeneration.enabled,
			surface: smartGeneration.surface,
			active: smartGenerationActive,
			forcedAudioRoute: forceSmartAudioRoute,
			containerWidthPx: smartGeneration.containerWidthPx,
			viewportWidthPx: smartGeneration.viewportWidthPx,
			widthClass: smartGeneration.widthClass,
			allowedSurfaces: Array.from(allowedSurfaces),
		});
	}

	if (forceSmartAudioRoute) {
		effectiveLogger?.info("[SMART-GENERATION] Forcing smart audio route for explicit audio request");
	}

	let smartIntentResult = null;
	if (smartRoutingActive && !isStrictToolFirstTurn && genuiHint) {
		smartIntentResult = createLayerOneGenuiIntentResult();
		effectiveLogger?.info("[SMART-GENERATION] GenUI intent from Layer 1 routing hint");
	}

	return {
		forceSmartAudioRoute,
		isCreateIntentRequestPrompt,
		isTaskLikeRequest,
		prefersGenuiCardExperience,
		smartIntentResult,
		smartRoutingActive,
	};
}

module.exports = {
	resolveSmartRouteGate,
};
