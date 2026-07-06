"use strict";

const express = require("express");
const {
	createUIMessageStream,
	pipeUIMessageStreamToResponse,
} = require("ai");

const { createRouteDecisionPart } = require("../lib/route-decision");

const SKIP_QUESTION_FALLBACK_TEXT =
	"I understand you'd like to skip the questions. Let me know how you'd like to proceed, or feel free to rephrase your request.";

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createChatSkipQuestionRouter requires ${name}`);
	}
}

function normalizeRequestOrigin(value) {
	return typeof value === "string" && value.trim().toLowerCase() === "voice"
		? "voice"
		: "text";
}

function buildConversationHistoryFromMessages(rawMessages) {
	return Array.isArray(rawMessages)
		? rawMessages
				.filter(
					(message) =>
						message &&
						typeof message === "object" &&
						(message.role === "user" || message.role === "assistant") &&
						typeof message.content === "string" &&
						message.content.trim().length > 0,
				)
				.map((message) => ({
					type: message.role,
					content: message.content.trim(),
				}))
				.slice(-10)
		: [];
}

function createChatSkipQuestionRouter({
	buildQuestionCardSkipNotification,
	buildUserMessage,
	createRouteDecision = createRouteDecisionPart,
	logger = console,
	streamChatViaRovo,
} = {}) {
	requireFunction("buildQuestionCardSkipNotification", buildQuestionCardSkipNotification);
	requireFunction("buildUserMessage", buildUserMessage);
	requireFunction("createRouteDecision", createRouteDecision);
	requireFunction("streamChatViaRovo", streamChatViaRovo);

	const router = express.Router();

	router.post("/chat-sdk/skip-question", async (req, res) => {
		try {
			const {
				contextDescription,
				messages: rawMessages,
				origin,
				questionTitle,
				sessionId,
			} = req.body || {};
			const requestOrigin = normalizeRequestOrigin(origin);

			const skipMessage = buildQuestionCardSkipNotification(
				typeof questionTitle === "string" ? questionTitle.trim() : undefined,
			);
			const conversationHistory = buildConversationHistoryFromMessages(rawMessages);
			const userMessageText = buildUserMessage(
				skipMessage,
				conversationHistory,
				contextDescription || undefined,
			);

			logger.info?.("[OUTPUT-ROUTING] Question card skip notification", {
				reason: "intent_clarification_skip",
				experience: "text",
				sessionId: typeof sessionId === "string" ? sessionId : undefined,
				questionTitle: typeof questionTitle === "string" ? questionTitle : undefined,
			});

			const stream = createUIMessageStream({
				execute: async ({ writer }) => {
					const textId = `skip-question-response-${Date.now()}`;
					let textStarted = false;

					try {
						await streamChatViaRovo({
							message: userMessageText,
							sessionId: typeof sessionId === "string" ? sessionId : undefined,
							onTextDelta: (delta) => {
								if (!delta) return;
								if (!textStarted) {
									writer.write({ type: "text-start", id: textId });
									textStarted = true;
								}
								writer.write({
									type: "text-delta",
									id: textId,
									delta,
								});
							},
							onThinkingStatus: () => {},
							onThinkingEvent: () => {},
							onToolCallStart: () => {},
							conflictPolicy: "wait-for-turn",
						});
					} catch (error) {
						logger.error?.(
							"[OUTPUT-ROUTING] Skip notification Rovo error:",
							error instanceof Error ? error.message : error,
						);
						if (!textStarted) {
							writer.write({ type: "text-start", id: textId });
							textStarted = true;
						}
						writer.write({
							type: "text-delta",
							id: textId,
							delta: SKIP_QUESTION_FALLBACK_TEXT,
						});
					}

					if (textStarted) {
						writer.write({ type: "text-end", id: textId });
					}

					writer.write(createRouteDecision({
						intent: "chat",
						origin: requestOrigin,
						reason: "intent_clarification_skip",
					}));

					writer.write({
						type: "data-turn-complete",
						data: { timestamp: new Date().toISOString() },
					});
				},
				onError: (error) => {
					if (error instanceof Error) {
						return error.message;
					}
					return "Failed to process question skip notification";
				},
			});

			pipeUIMessageStreamToResponse({
				response: res,
				stream,
			});
		} catch (error) {
			logger.error?.("[OUTPUT-ROUTING] Skip question error:", error);
			return res.status(500).json({
				error: "Failed to process question skip notification",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	return router;
}

function registerChatSkipQuestionRoutes(app, dependencies) {
	app.use("/api", createChatSkipQuestionRouter(dependencies));
}

module.exports = {
	SKIP_QUESTION_FALLBACK_TEXT,
	buildConversationHistoryFromMessages,
	createChatSkipQuestionRouter,
	normalizeRequestOrigin,
	registerChatSkipQuestionRoutes,
};
