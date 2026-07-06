"use strict";

const express = require("express");

const {
	createAbortControllerFromRequest,
} = require("../lib/http-request-abort");
const {
	buildAgentDataFlowMermaid,
	normalizeAgentDataFlowConfig,
	refineAgentDataFlowMermaid,
} = require("../../lib/studio-agent-data-flow");
const {
	generateDescriptionSummary,
} = require("../lib/genui-description-summary");
const {
	generatePlanMetadata,
} = require("../lib/plan-metadata");
const { getNonEmptyString } = require("../lib/shared-utils");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createAiUtilitiesRouter requires ${name}`);
	}
}

function isAbortError(error) {
	return (
		typeof error === "object" &&
		error !== null &&
		"name" in error &&
		error.name === "AbortError"
	);
}

function normalizeConversationHistory(rawConversationHistory, getString) {
	return Array.isArray(rawConversationHistory)
		? rawConversationHistory.flatMap((entry) => {
				if (!entry || typeof entry !== "object") {
					return [];
				}

				const type =
					entry.type === "user" || entry.type === "assistant"
						? entry.type
						: null;
				const content = getString(entry.content);
				return type && content
					? [
							{
								type,
								content,
							},
						]
					: [];
		  })
		: [];
}

function createBackendGatewayTextGenerator(generateTextViaGateway) {
	return (options) =>
		generateTextViaGateway({
			...options,
			backendPreference: "ai-gateway",
		});
}

function createAiUtilitiesRouter({
	abortControllerFromRequest = createAbortControllerFromRequest,
	buildAgentDataFlowMermaidFn = buildAgentDataFlowMermaid,
	generateAgentDataFlowText,
	generateDescriptionSummaryFn = generateDescriptionSummary,
	generatePlanMetadataFn = generatePlanMetadata,
	generateSuggestedQuestions,
	generateTextViaGateway,
	getString = getNonEmptyString,
	logger = console,
	normalizeAgentDataFlowConfigFn = normalizeAgentDataFlowConfig,
	refineAgentDataFlowMermaidFn = refineAgentDataFlowMermaid,
	sendGatewayErrorResponse,
} = {}) {
	requireFunction("abortControllerFromRequest", abortControllerFromRequest);
	requireFunction("buildAgentDataFlowMermaidFn", buildAgentDataFlowMermaidFn);
	requireFunction("generateDescriptionSummaryFn", generateDescriptionSummaryFn);
	requireFunction("generatePlanMetadataFn", generatePlanMetadataFn);
	requireFunction("generateSuggestedQuestions", generateSuggestedQuestions);
	requireFunction("generateTextViaGateway", generateTextViaGateway);
	requireFunction("getString", getString);
	requireFunction("normalizeAgentDataFlowConfigFn", normalizeAgentDataFlowConfigFn);
	requireFunction("refineAgentDataFlowMermaidFn", refineAgentDataFlowMermaidFn);
	requireFunction("sendGatewayErrorResponse", sendGatewayErrorResponse);

	const generateBackendText = createBackendGatewayTextGenerator(generateTextViaGateway);
	const generateAgentDataFlowTextFn = generateAgentDataFlowText || generateTextViaGateway;
	requireFunction("generateAgentDataFlowText", generateAgentDataFlowTextFn);

	const router = express.Router();

	router.post("/rovo/suggestions", async (req, res) => {
		const { abortController, cleanup } = abortControllerFromRequest(req, res);

		try {
			const {
				message: rawMessage,
				conversationHistory: rawConversationHistory,
				assistantResponse: rawAssistantResponse,
			} = req.body || {};
			const message = getString(rawMessage);
			const assistantResponse = getString(rawAssistantResponse);
			const conversationHistory = normalizeConversationHistory(
				rawConversationHistory,
				getString,
			);

			if (!message || !assistantResponse) {
				return res.status(200).json({ questions: [] });
			}

			const questions = await generateSuggestedQuestions({
				message,
				conversationHistory,
				assistantResponse,
				signal: abortController.signal,
			});

			return res.status(200).json({
				questions: Array.isArray(questions) ? questions : [],
			});
		} catch (error) {
			if (
				isAbortError(error) &&
				(abortController.signal.aborted || req.aborted || res.destroyed)
			) {
				return;
			}

			logger.error?.("[SUGGESTIONS] Rovo suggestions request failed:", error);
			return res.status(200).json({ questions: [] });
		} finally {
			cleanup();
		}
	});

	router.post("/studio/agent-data-flow", async (req, res) => {
		const { abortController, cleanup } = abortControllerFromRequest(req, res);
		const requestBody =
			req.body && typeof req.body === "object" && !Array.isArray(req.body)
				? req.body
				: {};
		const config = normalizeAgentDataFlowConfigFn(requestBody.config);
		const { baselineMermaid } = requestBody;
		const baseline =
			typeof baselineMermaid === "string" && baselineMermaid.trim()
				? baselineMermaid
				: buildAgentDataFlowMermaidFn(config);

		try {
			const result = await refineAgentDataFlowMermaidFn({
				config,
				baselineMermaid: baseline,
				generateText: (options) => generateAgentDataFlowTextFn(options),
				signal: abortController.signal,
			});

			return res.status(200).json(result);
		} catch (error) {
			if (
				isAbortError(error) &&
				(abortController.signal.aborted || req.aborted || res.destroyed)
			) {
				return;
			}

			logger.warn?.("[STUDIO] Agent data-flow refinement unavailable:", error?.message || error);
			return res.status(200).json({ mermaid: baseline });
		} finally {
			cleanup();
		}
	});

	router.post("/chat-title", async (req, res) => {
		try {
			const { message } = req.body || {};

			if (!message || typeof message !== "string" || !message.trim()) {
				return res.status(400).json({ error: "A message is required" });
			}

			const titlePrompt = `Generate a very short title (3-6 words) that summarizes this user message. Return ONLY the title text, nothing else. No quotes, no punctuation at the end, no explanation.

User message: ${message.trim()}`;

			const text = await generateBackendText({
				system: "You generate concise chat titles. Respond with only the title, 3-6 words.",
				prompt: titlePrompt,
				maxOutputTokens: 30,
				temperature: 0.7,
			});

			const title = text.trim().replace(/^["']|["']$/g, "").replace(/\.+$/, "").trim();

			if (!title) {
				return res.status(500).json({ error: "Empty title generated" });
			}

			return res.json({ title });
		} catch (error) {
			logger.warn?.("[CHAT-TITLE] AI Gateway unavailable, skipping title generation:", error?.message || error);
			return res.json({ title: null });
		}
	});

	router.post("/plan-title", async (req, res) => {
		try {
			const { title, description, markdown, tasks } = req.body || {};

			if (!title || typeof title !== "string" || !title.trim()) {
				return res.status(400).json({ error: "A title is required" });
			}

			const {
				title: enrichedTitle,
				shortDescription: enrichedShortDescription,
			} = await generatePlanMetadataFn({
				title,
				description,
				markdown,
				tasks,
				generateText: generateBackendText,
			});

			if (!enrichedTitle) {
				return res.status(500).json({ error: "Empty title generated" });
			}

			return res.json({
				title: enrichedTitle,
				shortDescription: enrichedShortDescription,
			});
		} catch (error) {
			logger.error?.("Plan title API error:", error);
			return sendGatewayErrorResponse(res, error, "Failed to generate plan title");
		}
	});

	router.post("/genui-description-summary", async (req, res) => {
		try {
			const { title, description } = req.body || {};

			if (!description || typeof description !== "string" || !description.trim()) {
				return res.status(400).json({ error: "A description is required" });
			}

			const result = await generateDescriptionSummaryFn({
				title,
				description,
				generateText: generateBackendText,
			});

			return res.json(result);
		} catch (error) {
			logger.warn?.("[GENUI-DESCRIPTION] AI Gateway unavailable:", error?.message || error);
			return res.json({ shortDescription: null });
		}
	});

	return router;
}

function registerAiUtilitiesRoutes(app, dependencies) {
	app.use("/api", createAiUtilitiesRouter(dependencies));
}

module.exports = {
	createAiUtilitiesRouter,
	normalizeConversationHistory,
	registerAiUtilitiesRoutes,
};
