"use strict";

const { getNonEmptyString } = require("../lib/shared-utils");
const {
	generateSuggestedQuestionsViaAIGateway: defaultGenerateSuggestedQuestionsViaAIGateway,
} = require("../lib/suggested-questions");
const {
	generatePlanMetadata: defaultGeneratePlanMetadata,
} = require("../lib/plan-metadata");

function buildArtifactPreviewSummary(title) {
	const normalizedTitle = getNonEmptyString(title) ?? "App";
	return normalizedTitle === "App"
		? "Generated app preview ready to open"
		: `${normalizedTitle} preview ready to open`;
}

function withStudioAgentGatewayFallbackTimeout(promise, timeoutMs) {
	let timeoutHandle = null;
	const timeoutPromise = new Promise((resolve) => {
		timeoutHandle = setTimeout(
			() => resolve({ timedOut: true, value: "" }),
			timeoutMs,
		);
	});
	const trackedPromise = promise.then(
		(value) => ({ timedOut: false, value }),
		(error) => {
			throw error;
		},
	);

	return Promise.race([trackedPromise, timeoutPromise]).finally(() => {
		if (timeoutHandle) {
			clearTimeout(timeoutHandle);
		}
	});
}

function createChatGenerationHelpers({
	aiGatewayProvider,
	generatePlanMetadata = defaultGeneratePlanMetadata,
	generateSuggestedQuestionsViaAIGateway = defaultGenerateSuggestedQuestionsViaAIGateway,
	generateTextViaGateway,
	hasGatewayUrlConfigured,
	logger = console,
} = {}) {
	if (!aiGatewayProvider || typeof aiGatewayProvider.generateText !== "function") {
		throw new Error("createChatGenerationHelpers requires aiGatewayProvider.generateText");
	}
	if (typeof generatePlanMetadata !== "function") {
		throw new Error("createChatGenerationHelpers requires generatePlanMetadata");
	}
	if (typeof generateSuggestedQuestionsViaAIGateway !== "function") {
		throw new Error("createChatGenerationHelpers requires generateSuggestedQuestionsViaAIGateway");
	}
	if (typeof generateTextViaGateway !== "function") {
		throw new Error("createChatGenerationHelpers requires generateTextViaGateway");
	}
	if (typeof hasGatewayUrlConfigured !== "function") {
		throw new Error("createChatGenerationHelpers requires hasGatewayUrlConfigured");
	}

	async function generateSuggestedQuestions({
		message,
		conversationHistory,
		assistantResponse,
		signal,
	}) {
		if (!assistantResponse || !assistantResponse.trim()) {
			return [];
		}

		if (!hasGatewayUrlConfigured()) {
			logger.info?.("[SUGGESTIONS] Skipping AI Gateway (not configured)");
			return [];
		}

		return generateSuggestedQuestionsViaAIGateway({
			message,
			conversationHistory,
			assistantResponse,
			signal,
			generateText: (options) => aiGatewayProvider.generateText(options),
			logger,
		});
	}

	async function generatePlanMetadataViaGateway({
		title,
		description,
		markdown,
		tasks,
	}) {
		return generatePlanMetadata({
			title,
			description,
			markdown,
			tasks,
			generateText: (options) =>
				generateTextViaGateway({
					...options,
					backendPreference: "ai-gateway",
				}),
		});
	}

	return {
		buildArtifactPreviewSummary,
		generatePlanMetadataViaGateway,
		generateSuggestedQuestions,
		withStudioAgentGatewayFallbackTimeout,
	};
}

module.exports = {
	buildArtifactPreviewSummary,
	createChatGenerationHelpers,
	withStudioAgentGatewayFallbackTimeout,
};
