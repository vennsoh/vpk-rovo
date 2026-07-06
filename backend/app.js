const express = require("express");
const {
	registerBodyLimitMiddleware,
} = require("./middleware/body-limits");
const {
	registerAiCostRateLimitMiddleware,
} = require("./middleware/rate-limit");
const {
	createRuntimeAdminControls,
} = require("./middleware/runtime-admin");
const {
	registerSecurityMiddleware,
} = require("./middleware/security");
const {
	registerWikiRoutes,
} = require("./routes/wiki");
const {
	registerPersonalGraphRoutes,
} = require("./routes/personal-graph");
const {
	registerStatusRoutes,
} = require("./routes/status");
const {
	registerJobsRoutes,
} = require("./routes/jobs");
const {
	registerSkillsRoutes,
} = require("./routes/skills");
const {
	registerMediaRoutes,
} = require("./routes/media");
const {
	registerOrchestratorRoutes,
} = require("./routes/orchestrator");
const {
	registerDemosRoutes,
} = require("./routes/demos");
const {
	registerBrowserWorkspacesRoutes,
} = require("./routes/browser-workspaces");
const {
	registerChromiumPreviewRoutes,
} = require("./routes/chromium-preview");
const {
	registerRovoAppRoutes,
} = require("./routes/rovo-app");
const {
	registerRovoChatProxyRoutes,
} = require("./routes/rovo-chat-proxy");
const {
	registerRealtimeRoutes,
} = require("./routes/realtime");
const {
	registerAiUtilitiesRoutes,
} = require("./routes/ai-utilities");
const {
	registerChatControlRoutes,
} = require("./routes/chat-control");
const {
	registerChatSdkRoutes,
} = require("./routes/chat-sdk");
const {
	registerChatSkipQuestionRoutes,
} = require("./routes/chat-skip-question");
const {
	registerAgentModeRoutes,
} = require("./routes/agent-mode");
const {
	registerGenuiRoutes,
} = require("./routes/genui");

function createBackendApp(dependencies = {}, options = {}) {
	const {
		expressImpl = express,
		logger = console,
	} = dependencies;
	const {
		createRuntimeAdmin = createRuntimeAdminControls,
		registerAiCostRateLimit = registerAiCostRateLimitMiddleware,
		registerBodyLimit = registerBodyLimitMiddleware,
		registerRoutes = registerBackendAppRoutes,
		registerSecurity = registerSecurityMiddleware,
	} = options;

	const app = expressImpl();
	const { allowedOrigins } = registerSecurity(app);
	const runtimeAdminControls = createRuntimeAdmin({ allowedOrigins });

	registerAiCostRateLimit(app);
	registerBodyLimit(app, { expressImpl });

	logger.log("[STARTUP] Middleware configured");

	registerRoutes(app, {
		...dependencies,
		...runtimeAdminControls,
	});

	return {
		app,
		allowedOrigins,
		...runtimeAdminControls,
	};
}

function registerBackendAppRoutes(app, dependencies = {}) {
	const {
		abortControllerFromRequest,
		activeRequests,
		advanceAgentsRfpDemoProcessing,
		agentsRfpDemoStateManager,
		appendRuntimeSocketToken,
		archiveHermesSkill,
		browserWorkspaceManager,
		buildLlmRoutingStatus,
		buildQuestionCardSkipNotification,
		buildRuntimeStatusSnapshot,
		buildUserMessage,
		cancelActiveDeferredToolCallRecord,
		cancelChat,
		cancelPausedDeferredToolCallRecord,
		checkpointManager,
		chromiumPreviewManager,
		clearActiveDeferredToolCall,
		clearPlanSession,
		clearRunState,
		collectUploadIdsFromMessages,
		createHermesSkillFromBundle,
		createRovoUnavailableError,
		createRuntimeSocketToken,
		debugLog,
		debugMode,
		deleteAgentsRfpDemoHermesJobs,
		deleteAgentsRfpDemoThread,
		deleteThreadBrowserWorkspace,
		destroyMirrorBrowser,
		detachPausedRovoToolCall,
		ensureThreadBrowserWorkspace,
		generateAgentDataFlowText,
		generateAgentsRfpDemoReportPreview,
		generatedFilesManager,
		generateSuggestedQuestions,
		generateTextViaGateway,
		getAiGatewayConfigReport,
		getAgentMode,
		getEnvVars,
		getHermesRuntimeStatus,
		getHermesSkill,
		getHermesSkillBundle,
		getMergedHermesJob,
		getMirrorBrowser,
		getThreadBrowserWorkspace,
		handleChatSdkRequest,
		hasGatewayUrlConfigured,
		hermesJobLinkManager,
		hermesJobsProvider,
		hermesSkillDraftManager,
		isBrowserWorkspaceNotFoundError,
		isRovoAvailable,
		listHermesSkills,
		listMergedHermesJobs,
		logger = console,
		maybeMigratePersistedThreadBrowserScreenshots,
		orchestratorLog,
		parseOptionalBoolean,
		persistHermesJobLink,
		persistMessageFiles,
		persistRunState,
		proxyRovoAppChatRequest,
		reconcileOrphanedThread,
		requireRuntimeAdmin,
		requireRuntimeSocketTokenRequester,
		rovoAppDocumentManager,
		rovoAppRunManager,
		rovoAppThreadManager,
		rovoAppUploadManager,
		rovoAppVoteManager,
		runtimePort,
		runtimeSocketTokenTtlMs,
		runAgentsRfpDemoJob,
		searchThreads,
		sendGatewayErrorResponse,
		sendHermesUnavailableResponse,
		setAgentMode,
		skillsHubClient,
		startNextQueuedRun,
		streamChatViaRovo,
		syncHermesJobResultsToRovoThreads,
		syncHermesJobsForRovoThreads,
		syncThreadPendingSkillDraftIds,
		toggleHermesSkill,
		updateHermesSkillFromBundle,
		waitForReady,
		wikiRouteHandlers,
	} = dependencies;

	registerAiUtilitiesRoutes(app, {
		abortControllerFromRequest,
		generateAgentDataFlowText,
		generateSuggestedQuestions,
		generateTextViaGateway,
		sendGatewayErrorResponse,
	});

	registerDemosRoutes(app, {
		advanceAgentsRfpDemoProcessing,
		agentsRfpDemoStateManager,
		deleteAgentsRfpDemoHermesJobs,
		deleteAgentsRfpDemoThread,
		generateAgentsRfpDemoReportPreview,
		getMergedHermesJob,
		runAgentsRfpDemoJob,
	});

	registerChatSdkRoutes(app, {
		handleChatSdkRequest,
	});

	registerChatControlRoutes(app, {
		activeRequests,
		cancelActiveDeferredToolCallRecord,
		cancelChat,
		cancelPausedDeferredToolCallRecord,
		clearActiveDeferredToolCall,
		clearPlanSession,
		detachPausedRovoToolCall,
		logger,
		waitForReady,
	});

	registerAgentModeRoutes(app, {
		createRovoUnavailableError,
		getAgentMode,
		isRovoAvailable,
		logger,
		setAgentMode,
	});

	registerChatSkipQuestionRoutes(app, {
		buildQuestionCardSkipNotification,
		buildUserMessage,
		logger,
		streamChatViaRovo,
	});

	registerGenuiRoutes(app, {
		isRovoAvailable,
		logger,
	});

	registerMediaRoutes(app);

	registerBrowserWorkspacesRoutes(app, {
		appendRuntimeSocketToken,
		browserWorkspaceManager,
		getMirrorBrowser,
		isBrowserWorkspaceNotFoundError,
		requireRuntimeAdmin,
		runtimePort,
	});

	registerChromiumPreviewRoutes(app, {
		chromiumPreviewManager,
	});

	registerRovoChatProxyRoutes(app, {
		logger,
		proxyRovoAppChatRequest,
		sendGatewayErrorResponse,
	});

	registerRovoAppRoutes(app, {
		cancelChat,
		checkpointManager,
		clearRunState,
		collectUploadIdsFromMessages,
		deleteThreadBrowserWorkspace,
		destroyMirrorBrowser,
		ensureThreadBrowserWorkspace,
		generatedFilesManager,
		getThreadBrowserWorkspace,
		maybeMigratePersistedThreadBrowserScreenshots,
		persistMessageFiles,
		persistRunState,
		reconcileOrphanedThread,
		requireRuntimeAdmin,
		rovoAppDocumentManager,
		rovoAppRunManager,
		rovoAppThreadManager,
		rovoAppUploadManager,
		rovoAppVoteManager,
		searchThreads,
		startNextQueuedRun,
		syncHermesJobsForRovoThreads,
	});

	registerOrchestratorRoutes(app, {
		orchestratorLog,
		requireRuntimeAdmin,
	});

	registerStatusRoutes(app, {
		buildRuntimeStatusSnapshot,
		buildLlmRoutingStatus,
		debugLog,
		debugMode,
		getAiGatewayConfigReport,
		getEnvVars,
		getHermesRuntimeStatus,
		hermesJobsProvider,
		hasGatewayUrlConfigured,
		isRovoAvailable,
	});

	registerJobsRoutes(app, {
		advanceAgentsRfpDemoProcessing,
		getMergedHermesJob,
		hermesJobLinkManager,
		hermesJobsProvider,
		listMergedHermesJobs,
		persistHermesJobLink,
		requireRuntimeAdmin,
		rovoAppThreadManager,
		sendHermesUnavailableResponse,
		syncHermesJobResultsToRovoThreads,
	});

	registerWikiRoutes(app, {
		requireRuntimeAdmin,
		wikiRouteHandlers,
	});

	registerPersonalGraphRoutes(app);

	registerSkillsRoutes(app, {
		archiveHermesSkill,
		createHermesSkillFromBundle,
		getHermesSkill,
		getHermesSkillBundle,
		hermesSkillDraftManager,
		listHermesSkills,
		parseOptionalBoolean,
		requireRuntimeAdmin,
		skillsHubClient,
		syncThreadPendingSkillDraftIds,
		toggleHermesSkill,
		updateHermesSkillFromBundle,
	});

	registerRealtimeRoutes(app, {
		createRuntimeSocketToken,
		requireRuntimeSocketTokenRequester,
		runtimeSocketTokenTtlMs,
	});
}

module.exports = {
	createBackendApp,
	registerBackendAppRoutes,
};
