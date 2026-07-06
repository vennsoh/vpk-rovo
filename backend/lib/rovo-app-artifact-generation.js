"use strict";

const {
	WORK_ITEM_REPORT_REQUEST_START,
	hasActiveWorkItemContext,
	isWorkItemReportIntent,
} = require("../../lib/work-item-report-intent");
const {
	buildRovoAppArtifactIntentPrompt,
	normalizeArtifactKind,
	parseRovoAppArtifactIntent,
	resolveFastRovoAppArtifactIntent,
} = require("./rovo-app-artifact-intent");
const {
	buildExcalidrawArtifactSystemPrompt,
	normalizeExcalidrawArtifactOutput,
} = require("./excalidraw-artifact");
const { getNonEmptyString } = require("./shared-utils");
const {
	isExplicitNewRovoAppArtifactRequest,
	isSameRovoAppArtifactVersionRequest,
} = require("./rovo-app-artifact-updates");
const {
	sanitizeRovoAppArtifactTitle,
} = require("./rovo-app-artifact-titles");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createRovoAppArtifactGenerationService requires ${name}`);
	}
	return value;
}

function buildRovoAppArtifactContext(rawArtifactContext) {
	if (!rawArtifactContext || typeof rawArtifactContext !== "object") {
		return null;
	}

	const title = getNonEmptyString(rawArtifactContext.title);
	const kind = getNonEmptyString(rawArtifactContext.kind);
	const content = getNonEmptyString(rawArtifactContext.content);
	if (!content) {
		return null;
	}

	return [
		"[FUTURE CHAT ARTIFACT CONTEXT]",
		title ? `Active artifact title: ${title}` : null,
		kind ? `Active artifact kind: ${kind}` : null,
		"Treat the following artifact content as editable working context for the user's next request.",
		"",
		content,
		"[END FUTURE CHAT ARTIFACT CONTEXT]",
	]
		.filter((entry) => typeof entry === "string" && entry.length > 0)
		.join("\n");
}

function buildRovoAppArtifactSystemPrompt({
	mode,
	title,
	kind,
}) {
	const normalizedKind = getNonEmptyString(kind) || "text";
	if (normalizedKind === "excalidraw") {
		return buildExcalidrawArtifactSystemPrompt({
			mode,
			title,
		});
	}

	const header = mode === "update"
		? `You are updating an existing ${normalizedKind} artifact titled "${title}".`
		: `You are generating a new ${normalizedKind} artifact titled "${title}".`;

	const contentRule = normalizedKind === "code"
		? "Return only the completed code artifact. Do not explain the code before or after it."
		: normalizedKind === "html"
			? [
					"Return only a complete, self-contained HTML document. Do not wrap it in markdown fences or add commentary.",
					"Follow the loaded /vpk-html skill contract: offline single-file HTML, inline CSS, no remote dependencies, no unfilled placeholders, and no invented facts.",
					"Use an Atlassian editorial report style suitable for a Jira Work Item status/readout report. Include a compact information-gaps section when facts are missing.",
				].join(" ")
			: normalizedKind === "sheet"
				? "Return only the table or structured sheet content in markdown. Do not add commentary."
				: "Return only the finished artifact content. Do not add prefatory commentary, assistant framing, or analysis.";

	return [
		header,
		contentRule,
		mode === "update"
			? "Return the complete updated artifact, not a summary of the edits. Apply title changes directly to the artifact content when they affect the document heading."
			: null,
		mode === "update"
			? "When the user changes the artifact title, framing, or subject, regenerate the full artifact so the new version fully matches that request. Do not only rename the heading."
			: null,
		normalizedKind === "html"
			? "If essential details are missing from the Work Item context, mark them as information gaps instead of making assumptions."
			: "If essential details are missing, make the most reasonable default assumptions and continue instead of asking follow-up questions.",
		"Be concise when the request is narrow, and fully detailed when the request explicitly asks for a complete draft.",
	]
		.filter((value) => typeof value === "string" && value.length > 0)
		.join("\n");
}

function deriveRovoAppArtifactDeltaType(kind) {
	return normalizeArtifactKind(kind) === "code" ? "data-codeDelta" : "data-textDelta";
}

function shouldUseWorkItemVpkHtmlReportGenerator({
	artifactKind,
	contextDescription,
	latestUserMessage,
}) {
	return (
		artifactKind === "html" &&
		typeof contextDescription === "string" &&
		hasActiveWorkItemContext(contextDescription) &&
		(
			contextDescription.includes(WORK_ITEM_REPORT_REQUEST_START) ||
			isWorkItemReportIntent(latestUserMessage)
		)
	);
}

function createRovoAppArtifactGenerationService({
	aiGatewayProvider,
	generateTextViaGateway,
	logger = console,
	rovoCancelChat,
	streamTextViaGateway,
} = {}) {
	requireFunction("aiGatewayProvider.generateText", aiGatewayProvider?.generateText);
	requireFunction("generateTextViaGateway", generateTextViaGateway);
	requireFunction("logger.warn", logger?.warn);
	requireFunction("rovoCancelChat", rovoCancelChat);
	requireFunction("streamTextViaGateway", streamTextViaGateway);

	async function generateRovoAppArtifactText({
		mode,
		title,
		kind,
		latestUserMessage,
		conversationHistory,
		contextDescription,
		provider,
		backendPreference = "rovo",
		signal,
		onTextDelta,
	}) {
		const system = buildRovoAppArtifactSystemPrompt({
			mode,
			title,
			kind,
		});
		const prompt = [
			getNonEmptyString(contextDescription),
			latestUserMessage ? `User request:\n${latestUserMessage}` : null,
		].filter((value) => typeof value === "string" && value.length > 0).join("\n\n");
		const normalizedMessages = Array.isArray(conversationHistory)
			? conversationHistory.map((message) => ({
				role: message.type === "assistant" ? "assistant" : "user",
				content: message.content,
			}))
			: [];
		const maxOutputTokens =
			kind === "code"
				? 3200
				: kind === "html"
					? 6000
					: kind === "sheet"
						? 2200
						: kind === "excalidraw"
							? 3200
							: 1800;
		if (kind === "excalidraw") {
			const rawText = await generateTextViaGateway({
				system,
				prompt,
				messages: normalizedMessages,
				maxOutputTokens,
				temperature: 0.2,
				provider,
				signal,
				backendPreference: "ai-gateway",
			});
			const normalizedExcalidraw = normalizeExcalidrawArtifactOutput(rawText);
			if (!normalizedExcalidraw) {
				throw new Error("Excalidraw artifact generation returned invalid scene JSON.");
			}
			if (typeof onTextDelta === "function") {
				onTextDelta(normalizedExcalidraw);
			}
			return normalizedExcalidraw;
		}

		const streamArtifactText = () =>
			streamTextViaGateway({
				system,
				prompt,
				messages: normalizedMessages,
				maxOutputTokens,
				temperature: 0.35,
				provider,
				backendPreference,
				signal,
				onTextDelta,
			});

		try {
			return await streamArtifactText();
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			if (!/pending deferred tool request/i.test(errorMessage)) {
				throw error;
			}

			if (backendPreference === "ai-gateway") {
				logger.warn("[FUTURE-CHAT] AI Gateway artifact generation hit pending deferred tool request; retrying once.");
				return streamArtifactText();
			}

			logger.warn("[FUTURE-CHAT] Artifact generation hit pending deferred tool request; clearing Rovo chat state and retrying once.");
			try {
				await rovoCancelChat();
			} catch (cancelError) {
				logger.warn(
					"[FUTURE-CHAT] Failed to cancel stale Rovo chat state before retry:",
					cancelError instanceof Error ? cancelError.message : cancelError,
				);
			}

			return streamArtifactText();
		}
	}

	async function generateRovoAppArtifactTitleFromContent({
		content,
		provider,
		signal,
	}) {
		const normalizedContent = getNonEmptyString(content);
		if (!normalizedContent) {
			return null;
		}

		const titlePrompt = [
			"Generate a concise artifact title that matches this content.",
			"Return ONLY the title text. No quotes, no punctuation at the end, no explanation.",
			"",
			normalizedContent.slice(0, 4000),
		].join("\n");

		try {
			const text = await aiGatewayProvider.generateText({
				system: "You generate concise artifact titles. Respond with only the title, 2-6 words.",
				prompt: titlePrompt,
				maxOutputTokens: 30,
				temperature: 0.2,
				provider,
				signal,
			});

			return sanitizeRovoAppArtifactTitle(text);
		} catch (error) {
			logger.warn(
				"[FUTURE-CHAT] Failed to generate artifact title from content, falling back:",
				error instanceof Error ? error.message : error,
			);
			return null;
		}
	}

	function resolveRovoAppArtifactKind({
		action,
		activeArtifact,
		decisionKind,
	}) {
		if (action === "updateDocument") {
			return normalizeArtifactKind(decisionKind || activeArtifact?.kind);
		}

		return normalizeArtifactKind(decisionKind);
	}

	async function resolveRovoAppArtifactDecision({
		activeArtifact,
		artifactSteering,
		conversationHistory,
		latestUserMessage,
		provider,
		signal,
		streamingArtifact,
	}) {
		const fastDecision = resolveFastRovoAppArtifactIntent({
			activeArtifact,
			artifactSteering,
			latestUserMessage,
			streamingArtifact,
		});
		if (fastDecision) {
			return fastDecision;
		}

		const prompt = buildRovoAppArtifactIntentPrompt({
			activeArtifact,
			artifactSteering,
			conversationHistory,
			latestUserMessage,
			streamingArtifact,
		});
		const sameArtifactVersionRequest = isSameRovoAppArtifactVersionRequest({
			activeArtifact,
			latestUserMessage,
		});
		const explicitlyRequestsNewArtifact = isExplicitNewRovoAppArtifactRequest({
			latestUserMessage,
		});

		const rawDecision = await generateTextViaGateway({
			system: "You classify whether a request should stay in chat or become a document tool action. Return strict JSON only.",
			prompt,
			maxOutputTokens: 220,
			temperature: 0.1,
			provider,
			signal,
			backendPreference: "ai-gateway",
		});
		const parsedDecision = parseRovoAppArtifactIntent(rawDecision, {
			activeArtifact,
			streamingArtifact,
		});
		if (!parsedDecision) {
			throw new Error(
				`[FUTURE-CHAT] Artifact intent classification returned unparseable result: ${JSON.stringify(rawDecision)}`,
			);
		}

		if (sameArtifactVersionRequest && !explicitlyRequestsNewArtifact) {
			return {
				action: "updateDocument",
				title:
					getNonEmptyString(parsedDecision.title) || getNonEmptyString(activeArtifact?.title),
				kind: parsedDecision.kind || normalizeArtifactKind(activeArtifact?.kind),
				cancelStreaming: streamingArtifact?.id ? true : null,
			};
		}

		return parsedDecision;
	}

	return {
		generateRovoAppArtifactText,
		generateRovoAppArtifactTitleFromContent,
		resolveRovoAppArtifactDecision,
		resolveRovoAppArtifactKind,
	};
}

module.exports = {
	buildRovoAppArtifactContext,
	buildRovoAppArtifactSystemPrompt,
	createRovoAppArtifactGenerationService,
	deriveRovoAppArtifactDeltaType,
	shouldUseWorkItemVpkHtmlReportGenerator,
};
