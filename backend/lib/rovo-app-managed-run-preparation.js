"use strict";

const {
	buildRovoAppHermesContextDescription: defaultBuildRovoAppHermesContextDescription,
} = require("./hermes-rovo-context");
const {
	buildNextHermesThreadContext,
} = require("./hermes-thread-context");
const {
	rankHermesSkillCandidates,
	selectHermesSkillIdsFromRankedCandidates,
	shouldDisambiguateRankedCandidates,
} = require("./hermes-skill-auto-selection");
const {
	resolveAmbiguousAutoSelectedSkillIds: defaultResolveAmbiguousAutoSelectedSkillIds,
} = require("./hermes-skill-disambiguation");
const {
	createHiddenRovoAppUserMessage,
	resolveRovoAppDelegatedPrompt,
} = require("./rovo-app-message-helpers");
const {
	resolveRovoAppActiveArtifact: defaultResolveRovoAppActiveArtifact,
} = require("./rovo-app-artifact-routing");
const {
	buildWikiQueryContextDescription: defaultBuildWikiQueryContextDescription,
} = require("./wiki-query-context");
const { getNonEmptyString } = require("./shared-utils");
const {
	WORK_ITEM_REPORT_REQUEST_START,
	buildWorkItemReportRequestContext,
	mergeHermesSkillIds,
	resolveWorkItemReportRequest,
} = require("../../lib/work-item-report-intent");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createRovoAppManagedRunRequestPreparer requires ${name}`);
	}
	return value;
}

function createRovoAppManagedRunRequestPreparer({
	buildRovoAppHermesContextDescription = defaultBuildRovoAppHermesContextDescription,
	buildWikiQueryContextDescription = defaultBuildWikiQueryContextDescription,
	compressUiConversationHistory,
	listHermesSkills,
	logger = console,
	mapUiMessagesToConversation,
	resolveAmbiguousAutoSelectedSkillIds = defaultResolveAmbiguousAutoSelectedSkillIds,
	resolveRovoAppActiveArtifact = defaultResolveRovoAppActiveArtifact,
	rovoAppDocumentManager,
	rovoAppThreadManager,
	runRovoBackgroundTask,
} = {}) {
	requireFunction("buildRovoAppHermesContextDescription", buildRovoAppHermesContextDescription);
	requireFunction("buildWikiQueryContextDescription", buildWikiQueryContextDescription);
	requireFunction("compressUiConversationHistory", compressUiConversationHistory);
	requireFunction("listHermesSkills", listHermesSkills);
	requireFunction("logger.info", logger?.info);
	requireFunction("logger.warn", logger?.warn);
	requireFunction("mapUiMessagesToConversation", mapUiMessagesToConversation);
	requireFunction("resolveAmbiguousAutoSelectedSkillIds", resolveAmbiguousAutoSelectedSkillIds);
	requireFunction("resolveRovoAppActiveArtifact", resolveRovoAppActiveArtifact);
	requireFunction("rovoAppDocumentManager.getDocument", rovoAppDocumentManager?.getDocument);
	requireFunction("rovoAppThreadManager.getThread", rovoAppThreadManager?.getThread);
	requireFunction("rovoAppThreadManager.updateThread", rovoAppThreadManager?.updateThread);
	requireFunction("runRovoBackgroundTask", runRovoBackgroundTask);

	async function prepareRovoAppManagedRunRequest({
		requestBody,
		requestOriginHint,
	}) {
		const threadId = getNonEmptyString(requestBody.id);
		const delegatedMessageId = getNonEmptyString(requestBody.delegatedMessageId);
		const conversationSummary = getNonEmptyString(requestBody.conversationSummary);
		const requestMessages = Array.isArray(requestBody.messages)
			? [...requestBody.messages]
			: [];
		const threadForSession = threadId ? await rovoAppThreadManager.getThread(threadId) : null;
		const requestHermesContext =
			requestBody.hermesContext && typeof requestBody.hermesContext === "object"
				? requestBody.hermesContext
				: null;
		if (threadForSession?.sessionId) {
			requestBody.sessionId = threadForSession.sessionId;
			requestBody.sessionMode = threadForSession.sessionMode ?? "persistent";
		}
		const delegatedThread =
			threadId && delegatedMessageId
				? threadForSession
				: null;
		const delegatedPrompt = delegatedMessageId
			? resolveRovoAppDelegatedPrompt({
				delegatedMessageId,
				requestMessages,
				thread: delegatedThread,
			})
			: null;
		if (delegatedMessageId && !delegatedPrompt) {
			throw new Error("delegatedMessageId did not resolve to a persisted user message");
		}
		if (delegatedPrompt && !requestMessages.some((message) => message?.id === delegatedPrompt.messageId)) {
			const hiddenUserMessage = createHiddenRovoAppUserMessage(
				delegatedPrompt.messageId,
				delegatedPrompt.text,
			);
			if (hiddenUserMessage) {
				requestMessages.push(hiddenUserMessage);
			}
		}
		requestBody.messages = requestMessages;

		const requestOrigin = requestOriginHint;
		const requestVoiceMetadata =
			requestBody.voiceMetadata && typeof requestBody.voiceMetadata === "object"
				? requestBody.voiceMetadata
				: undefined;
		const requestActiveArtifact =
			requestBody.activeArtifact && typeof requestBody.activeArtifact === "object"
				? requestBody.activeArtifact
				: undefined;

		let activeArtifact;
		let activeDocument;
		if (requestActiveArtifact?.id) {
			activeArtifact = requestActiveArtifact;
			activeDocument = null;
		} else {
			const resolved = await resolveRovoAppActiveArtifact({
				activeDocumentId: requestBody.activeDocumentId,
				artifactContext: requestBody.artifactContext,
				rovoAppDocumentManager,
				rovoAppThreadManager,
				threadId,
			});
			activeArtifact = resolved.activeArtifact;
			activeDocument = resolved.activeDocument;
		}

		const artifactSteering =
			requestBody.artifactSteering &&
			typeof requestBody.artifactSteering === "object"
				? requestBody.artifactSteering
				: null;
		const { message: latestUserMessage, conversationHistory: rawConversationHistory } =
			mapUiMessagesToConversation(requestMessages);
		const compressedConversation = compressUiConversationHistory(rawConversationHistory, {
			thresholdChars: 80_000,
			tailCount: 8,
		});
		const conversationHistory = compressedConversation.conversationHistory;
		if (compressedConversation.compressed) {
			logger.info(
				`[HERMES] Compressed managed conversation history: ${compressedConversation.originalLength} -> ${compressedConversation.length} messages`,
			);
		}
		const baseContextDescription = getNonEmptyString(requestBody.contextDescription);
		let workItemReportRequest = resolveWorkItemReportRequest({
			contextDescription: baseContextDescription,
			promptText: latestUserMessage,
		});
		const selectedHermesSkillIds = Array.isArray(requestHermesContext?.selectedSkillIds)
			? requestHermesContext.selectedSkillIds
			: Array.isArray(threadForSession?.hermesContext?.selectedSkillIds)
				? threadForSession.hermesContext.selectedSkillIds
				: [];
		let autoSelectedHermesSkillIds = [];
		try {
			const installedHermesSkills = await listHermesSkills();
			workItemReportRequest = resolveWorkItemReportRequest({
				contextDescription: baseContextDescription,
				promptText: latestUserMessage,
				skills: installedHermesSkills,
			});
			const rankedCandidates = rankHermesSkillCandidates({
				promptText: latestUserMessage,
				selectedSkillIds: selectedHermesSkillIds,
				skills: installedHermesSkills,
			});
			autoSelectedHermesSkillIds = selectHermesSkillIdsFromRankedCandidates(rankedCandidates);
			if (!workItemReportRequest.isIntent && shouldDisambiguateRankedCandidates(rankedCandidates)) {
				try {
					autoSelectedHermesSkillIds = await resolveAmbiguousAutoSelectedSkillIds({
						promptText: latestUserMessage,
						rankedCandidates: rankedCandidates.slice(0, 5),
						runBackgroundTaskImpl: runRovoBackgroundTask,
					});
				} catch (error) {
					logger.warn("[HERMES] Failed to disambiguate auto-selected Hermes skills:", error instanceof Error ? error.message : String(error));
				}
			}
			if (workItemReportRequest.shouldLoadSkill) {
				autoSelectedHermesSkillIds = mergeHermesSkillIds(
					autoSelectedHermesSkillIds,
					workItemReportRequest.skillId,
				);
			}
		} catch (error) {
			logger.warn("[HERMES] Failed to auto-select Hermes skills:", error instanceof Error ? error.message : String(error));
			if (workItemReportRequest.shouldLoadSkill) {
				autoSelectedHermesSkillIds = mergeHermesSkillIds(
					autoSelectedHermesSkillIds,
					workItemReportRequest.skillId,
				);
			}
		}
		const delegationContextDescription = conversationSummary
			? `[Voice delegation summary]\n${conversationSummary}`
			: null;
		let hermesContextDescription = null;
		try {
			hermesContextDescription = await buildRovoAppHermesContextDescription({
				autoSelectedSkillIds: autoSelectedHermesSkillIds,
				selectedSkillIds: selectedHermesSkillIds,
			});
		} catch (error) {
			logger.warn("[HERMES] Failed to build Hermes context for Rovo chat:", error instanceof Error ? error.message : String(error));
		}
		let wikiQueryContextDescription = null;
		try {
			wikiQueryContextDescription = await buildWikiQueryContextDescription(latestUserMessage);
		} catch (error) {
			logger.warn("[WIKI] Failed to build per-turn wiki query context:", error instanceof Error ? error.message : String(error));
		}
		if (threadId && threadForSession) {
			void rovoAppThreadManager.updateThread(threadId, {
				hermesContext: buildNextHermesThreadContext({
					currentHermesContext: threadForSession.hermesContext,
					autoSelectedSkillIds: autoSelectedHermesSkillIds,
					selectedSkillIds: selectedHermesSkillIds,
				}),
			}).catch((error) => {
				logger.warn("[HERMES] Failed to persist resolved Hermes thread context:", error instanceof Error ? error.message : String(error));
			});
		}
		if (workItemReportRequest.shouldCreateArtifact) {
			requestBody.futureArtifactMode = "create";
			requestBody.futureArtifactTitle = workItemReportRequest.title;
			requestBody.futureArtifactKind = "html";
		}

		const streamingArtifact =
			requestBody.streamingArtifact &&
			typeof requestBody.streamingArtifact === "object" &&
			getNonEmptyString(requestBody.streamingArtifact.id)
				? {
					id: requestBody.streamingArtifact.id,
					title: getNonEmptyString(requestBody.streamingArtifact.title) || "Untitled",
					kind: getNonEmptyString(requestBody.streamingArtifact.kind) || "text",
					content: getNonEmptyString(requestBody.streamingArtifact.content) || "",
				}
				: null;
		const resolvedProvider = getNonEmptyString(requestBody.provider);
		const workItemReportContextDescription =
			workItemReportRequest.contextBlock ||
			(baseContextDescription?.includes(WORK_ITEM_REPORT_REQUEST_START)
				? null
				: buildWorkItemReportRequestContext({
					contextDescription: baseContextDescription,
					promptText: latestUserMessage,
					skillId: workItemReportRequest.skillId,
				}));
		const effectiveBaseContextDescription = [
			delegationContextDescription,
			hermesContextDescription,
			wikiQueryContextDescription,
			baseContextDescription,
			workItemReportContextDescription,
		]
			.filter(Boolean)
			.join("\n\n");

		delete requestBody.activeDocumentId;
		delete requestBody.artifactContext;
		delete requestBody.artifactSteering;
		delete requestBody.delegatedMessageId;
		delete requestBody.conversationSummary;
		delete requestBody.streamingArtifact;
		delete requestBody.origin;
		delete requestBody.voiceMetadata;
		delete requestBody.activeArtifact;
		delete requestBody.executionMode;
		delete requestBody.executionTask;
		delete requestBody.hermesContext;

		const requestIsPlanMode = requestBody.isPlanMode === true;
		delete requestBody.isPlanMode;
		const requestCreationMode =
			requestBody.creationMode === "agent" || requestBody.creationMode === "skill"
				? requestBody.creationMode
				: null;

		const requestArtifactCreationRetry = requestBody.artifactCreationRetry === true;
		delete requestBody.artifactCreationRetry;

		const recentHistory = conversationHistory.slice(-5).map((msg) => ({
			role: msg.type === "user" ? "user" : "assistant",
			content: msg.content,
		}));

		return {
			activeArtifact,
			activeDocument,
			artifactSteering,
			conversationHistory,
			effectiveBaseContextDescription,
			latestUserMessage,
			recentHistory,
			requestArtifactCreationRetry,
			requestBody,
			requestCreationMode,
			requestIsPlanMode,
			requestMessages,
			requestOrigin,
			requestVoiceMetadata,
			resolvedProvider,
			streamingArtifact,
			threadForSession,
			threadId,
			workItemReportRequest,
		};
	}

	return {
		prepareRovoAppManagedRunRequest,
	};
}

module.exports = {
	createRovoAppManagedRunRequestPreparer,
};
