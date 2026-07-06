"use strict";

function createFallbackRovoConfigBuilders() {
	return {
		buildUserMessage: (message) => message,
		buildQuestionCardSkipNotification: () => "[Question Card Dismissed]\nThe user skipped the clarification questions.\n[End Question Card Dismissed]",
		buildAIGatewaySystemPrompt: ({ runtimeContext } = {}) => runtimeContext || "",
	};
}

function normalizeRovoConfigBuilders(config) {
	const fallback = createFallbackRovoConfigBuilders();
	return {
		buildUserMessage:
			typeof config?.buildUserMessage === "function"
				? config.buildUserMessage
				: fallback.buildUserMessage,
		buildQuestionCardSkipNotification:
			typeof config?.buildQuestionCardSkipNotification === "function"
				? config.buildQuestionCardSkipNotification
				: fallback.buildQuestionCardSkipNotification,
		buildAIGatewaySystemPrompt:
			typeof config?.buildAIGatewaySystemPrompt === "function"
				? config.buildAIGatewaySystemPrompt
				: fallback.buildAIGatewaySystemPrompt,
	};
}

function loadRovoConfigBuilders({
	loadDockerConfig = () => require("../rovo/config"),
	loadLocalConfig = () => require("../../rovo/config"),
	logger = console,
} = {}) {
	try {
		let config;
		try {
			config = loadDockerConfig();
			logger.log("[STARTUP] config loaded from ./rovo (Docker path)");
		} catch {
			config = loadLocalConfig();
			logger.log("[STARTUP] config loaded from ../rovo (local dev path)");
		}
		const builders = normalizeRovoConfigBuilders(config);
		logger.log("[STARTUP] rovo config loaded successfully");
		return builders;
	} catch (error) {
		logger.warn("[STARTUP] rovo config failed to load:", error.message);
		logger.warn("[STARTUP] Using fallback functions - config did not load!");
		return createFallbackRovoConfigBuilders();
	}
}

module.exports = {
	createFallbackRovoConfigBuilders,
	loadRovoConfigBuilders,
	normalizeRovoConfigBuilders,
};
