"use strict";

const path = require("node:path");
const {
	createBackendServiceComposition: defaultCreateBackendServiceComposition,
} = require("./services/backend-service-composition");
const {
	createBackendApp: defaultCreateBackendApp,
} = require("./app");
const {
	buildBackendAppDependencies: defaultBuildBackendAppDependencies,
} = require("./app-dependency-composition");
const {
	archiveHermesSkill: defaultArchiveHermesSkill,
	createHermesSkillFromBundle: defaultCreateHermesSkillFromBundle,
	getHermesSkill: defaultGetHermesSkill,
	getHermesSkillBundle: defaultGetHermesSkillBundle,
	listHermesSkills: defaultListHermesSkills,
	toggleHermesSkill: defaultToggleHermesSkill,
	updateHermesSkillFromBundle: defaultUpdateHermesSkillFromBundle,
} = require("./lib/hermes-skills");
const { getHermesRuntimeStatus: defaultGetHermesRuntimeStatus } = require("./lib/hermes-status");
const {
	areHermesCompanionsEnabled: defaultAreHermesCompanionsEnabled,
	areHermesJobsEnabled: defaultAreHermesJobsEnabled,
	parseOptionalBoolean: defaultParseOptionalBoolean,
} = require("./lib/hermes-feature-flags");
const {
	createWikiRouteHandlerComposition: defaultCreateWikiRouteHandlerComposition,
} = require("./services/wiki-route-handler-composition");
const {
	executeRovoTask: defaultExecuteRovoTask,
	runRovoBackgroundTask: defaultRunRovoBackgroundTask,
} = require("./lib/rovo-task-executor");
const {
	syncHermesJobResultsToRovoThreads: defaultSyncHermesJobResultsToRovoThreads,
} = require("./lib/hermes-rovo-job-sync");
const {
	createPreferredBackendResolver: defaultCreatePreferredBackendResolver,
} = require("./lib/chat-backend-selection");
const { buildRuntimeStatusSnapshot: defaultBuildRuntimeStatusSnapshot } = require("./lib/runtime-status");
const { searchThreads: defaultSearchThreads } = require("./lib/hermes-session-search");
const {
	createAbortControllerFromRequest: defaultCreateAbortControllerFromRequest,
} = require("./lib/http-request-abort");
const {
	collectRovoAppUploadIdsFromMessages: defaultCollectRovoAppUploadIdsFromMessages,
} = require("./lib/rovo-app-upload-helpers");
const {
	createRovoRuntimeAvailabilityComposition: defaultCreateRovoRuntimeAvailabilityComposition,
} = require("./lib/rovo-runtime-availability-composition");
const {
	loadRovoConfigBuilders: defaultLoadRovoConfigBuilders,
} = require("./lib/rovo-config-loader");
const {
	ensureWikiJobs: defaultEnsureWikiJobs,
} = require("./lib/wiki-clipper");
const {
	createChatSdkServerComposition: defaultCreateChatSdkServerComposition,
} = require("./chat/chat-sdk-server-composition");
const {
	createChatRuntimeComposition: defaultCreateChatRuntimeComposition,
} = require("./chat/chat-runtime-composition");
const {
	streamViaRovo: defaultStreamViaRovo,
	replayViaRovo: defaultReplayViaRovo,
	generateTextViaRovo: defaultGenerateTextViaRovo,
	isChatInProgressError: defaultIsChatInProgressError,
	initPool: defaultInitPool,
	WAIT_FOR_TURN_TIMEOUT_MS: DEFAULT_WAIT_FOR_TURN_TIMEOUT_MS,
} = require("./lib/rovo-gateway");
const { classifyRovoHealthCheck: defaultClassifyRovoHealthCheck } = require("./lib/rovo-health");
const {
	ensureRovoSession: defaultEnsureRovoSession,
	getCurrentRovoSession: defaultGetCurrentRovoSession,
} = require("./lib/rovo-session");
const {
	buildLlmRoutingStatus: defaultBuildLlmRoutingStatus,
	describeChatBackend: defaultDescribeChatBackend,
} = require("./lib/llm-routing-status");
const {
	clearPlanSession: defaultClearPlanSession,
} = require("./lib/plan-session");
const {
	healthCheck: defaultRovoHealthCheck,
	cancelChat: defaultRovoCancelChat,
	resumeToolCalls: defaultRovoResumeToolCalls,
} = require("./lib/rovo-client");
const {
	setAgentMode: defaultSetAgentMode,
	getAgentMode: defaultGetAgentMode,
} = require("./lib/rovo-agent-mode");
const {
	cancelActiveDeferredToolCallRecord: defaultCancelActiveDeferredToolCallRecord,
	cancelPausedDeferredToolCallRecord: defaultCancelPausedDeferredToolCallRecord,
} = require("./lib/deferred-tool-cancel");
const { createRovoPool: defaultCreateRovoPool } = require("./lib/rovo-pool");
const {
	createListeningPidReader: defaultCreateListeningPidReader,
} = require("./lib/rovo-port-recovery");
const {
	resolveRovoPorts: defaultResolveRovoPorts,
} = require("./lib/rovo-port-discovery");
const {
	getRovoBasePort: defaultGetRovoBasePort,
} = require("../scripts/lib/worktree-ports");
const {
	getEnvVars: defaultGetEnvVars,
	getAIGatewayConfigReport: defaultGetAIGatewayConfigReport,
	hasGatewayUrlConfigured: defaultHasGatewayUrlConfigured,
	getRealtimeConfig: defaultGetRealtimeConfig,
} = require("./lib/ai-gateway-helpers");
const { chromiumPreviewManager: defaultChromiumPreviewManager } = require("./lib/chromium-preview");
const {
	browserWorkspaceManager: defaultBrowserWorkspaceManager,
	isBrowserWorkspaceNotFoundError: defaultIsBrowserWorkspaceNotFoundError,
} = require("./lib/browser-workspace-manager");
const {
	deleteRovoAppThreadBrowserWorkspace: defaultDeleteRovoAppThreadBrowserWorkspace,
	ensureRovoAppThreadBrowserWorkspace: defaultEnsureRovoAppThreadBrowserWorkspace,
	getRovoAppThreadBrowserWorkspace: defaultGetRovoAppThreadBrowserWorkspace,
} = require("./lib/rovo-app-browser-workspace");
const {
	getMirrorBrowser: defaultGetMirrorBrowser,
	destroyMirrorBrowser: defaultDestroyMirrorBrowser,
} = require("./lib/rovo-app-browser-mirror");
const {
	createGatewayErrorResponseSender: defaultCreateGatewayErrorResponseSender,
	createRovoUnavailableError: defaultCreateRovoUnavailableError,
	normalizeAIGatewayError: defaultNormalizeAIGatewayError,
} = require("./chat/error-response");
const {
	createHermesUnavailableResponseSender: defaultCreateHermesUnavailableResponseSender,
} = require("./lib/hermes-error-response");
const {
	createStageTrace: defaultCreateStageTrace,
	createStageTraceFromRequestResolver: defaultCreateStageTraceFromRequestResolver,
} = require("./lib/stage-trace");

function createDebugLogger({
	debugMode,
	logger = console,
}) {
	return (section, message, data) => {
		if (!debugMode) {
			return;
		}
		logger.log(`[DEBUG][${section}] ${message}`, data ? JSON.stringify(data, null, 2) : "");
	};
}

function createBackendRuntimeComposition({
	backendDir = __dirname,
	env = process.env,
	logger = console,
	projectRoot = path.join(backendDir, ".."),
} = {}, implementations = {}) {
	const {
		archiveHermesSkill = defaultArchiveHermesSkill,
		areHermesCompanionsEnabled = defaultAreHermesCompanionsEnabled,
		areHermesJobsEnabled = defaultAreHermesJobsEnabled,
		browserWorkspaceManager = defaultBrowserWorkspaceManager,
		buildBackendAppDependencies = defaultBuildBackendAppDependencies,
		buildLlmRoutingStatus = defaultBuildLlmRoutingStatus,
		buildRuntimeStatusSnapshot = defaultBuildRuntimeStatusSnapshot,
		cancelActiveDeferredToolCallRecord = defaultCancelActiveDeferredToolCallRecord,
		cancelPausedDeferredToolCallRecord = defaultCancelPausedDeferredToolCallRecord,
		chromiumPreviewManager = defaultChromiumPreviewManager,
		classifyRovoHealthCheck = defaultClassifyRovoHealthCheck,
		clearPlanSession = defaultClearPlanSession,
		collectRovoAppUploadIdsFromMessages = defaultCollectRovoAppUploadIdsFromMessages,
		createAbortControllerFromRequest = defaultCreateAbortControllerFromRequest,
		createBackendApp = defaultCreateBackendApp,
		createBackendServiceComposition = defaultCreateBackendServiceComposition,
		createChatRuntimeComposition = defaultCreateChatRuntimeComposition,
		createChatSdkServerComposition = defaultCreateChatSdkServerComposition,
		createGatewayErrorResponseSender = defaultCreateGatewayErrorResponseSender,
		createHermesSkillFromBundle = defaultCreateHermesSkillFromBundle,
		createHermesUnavailableResponseSender = defaultCreateHermesUnavailableResponseSender,
		createListeningPidReader = defaultCreateListeningPidReader,
		createPreferredBackendResolver = defaultCreatePreferredBackendResolver,
		createRovoPool = defaultCreateRovoPool,
		createRovoRuntimeAvailabilityComposition = defaultCreateRovoRuntimeAvailabilityComposition,
		createRovoUnavailableError = defaultCreateRovoUnavailableError,
		createStageTrace = defaultCreateStageTrace,
		createStageTraceFromRequestResolver = defaultCreateStageTraceFromRequestResolver,
		createWikiRouteHandlerComposition = defaultCreateWikiRouteHandlerComposition,
		deleteRovoAppThreadBrowserWorkspace = defaultDeleteRovoAppThreadBrowserWorkspace,
		describeChatBackend = defaultDescribeChatBackend,
		destroyMirrorBrowser = defaultDestroyMirrorBrowser,
		ensureRovoAppThreadBrowserWorkspace = defaultEnsureRovoAppThreadBrowserWorkspace,
		ensureRovoSession = defaultEnsureRovoSession,
		ensureWikiJobs = defaultEnsureWikiJobs,
		executeRovoTask = defaultExecuteRovoTask,
		generateTextViaRovo = defaultGenerateTextViaRovo,
		getAgentMode = defaultGetAgentMode,
		getAiGatewayConfigReport = defaultGetAIGatewayConfigReport,
		getCurrentRovoSession = defaultGetCurrentRovoSession,
		getEnvVars = defaultGetEnvVars,
		getHermesRuntimeStatus = defaultGetHermesRuntimeStatus,
		getHermesSkill = defaultGetHermesSkill,
		getHermesSkillBundle = defaultGetHermesSkillBundle,
		getMirrorBrowser = defaultGetMirrorBrowser,
		getRealtimeConfig = defaultGetRealtimeConfig,
		getRovoAppThreadBrowserWorkspace = defaultGetRovoAppThreadBrowserWorkspace,
		getRovoBasePort = defaultGetRovoBasePort,
		hasGatewayUrlConfigured = defaultHasGatewayUrlConfigured,
		initPool = defaultInitPool,
		isBrowserWorkspaceNotFoundError = defaultIsBrowserWorkspaceNotFoundError,
		isChatInProgressError = defaultIsChatInProgressError,
		listHermesSkills = defaultListHermesSkills,
		loadRovoConfigBuilders = defaultLoadRovoConfigBuilders,
		normalizeAIGatewayError = defaultNormalizeAIGatewayError,
		parseOptionalBoolean = defaultParseOptionalBoolean,
		replayViaRovo = defaultReplayViaRovo,
		resolveRovoPorts = defaultResolveRovoPorts,
		rovoCancelChat = defaultRovoCancelChat,
		rovoHealthCheck = defaultRovoHealthCheck,
		rovoResumeToolCalls = defaultRovoResumeToolCalls,
		runRovoBackgroundTask = defaultRunRovoBackgroundTask,
		searchThreads = defaultSearchThreads,
		setAgentMode = defaultSetAgentMode,
		streamViaRovo = defaultStreamViaRovo,
		syncHermesJobResultsToRovoThreads = defaultSyncHermesJobResultsToRovoThreads,
		toggleHermesSkill = defaultToggleHermesSkill,
		updateHermesSkillFromBundle = defaultUpdateHermesSkillFromBundle,
		waitForTurnTimeoutMs = DEFAULT_WAIT_FOR_TURN_TIMEOUT_MS,
	} = implementations;
	const debugMode = env.DEBUG === "true";
	const debugLog = createDebugLogger({ debugMode, logger });
	const wikiRouteHandlers = createWikiRouteHandlerComposition({ logger });
	const {
		clearActiveDeferredToolCall,
		detachPausedRovoToolCall,
		getRovoPool,
		isRovoAvailable,
		pausedRovoToolCallStore: _pausedRovoToolCallStore,
		refreshRovoAvailability,
		registerActiveDeferredToolCall,
		registerPausedRovoToolCall,
		resolveRovoAppPortAvailability,
		setStartNextQueuedRovoAppRun,
		shutdownRovoPool,
		takePausedRovoToolCall,
		waitForPortReady,
	} = createRovoRuntimeAvailabilityComposition({
		cancelPausedDeferredToolCallRecord,
		classifyRovoHealthCheck,
		createRovoPool,
		debugLog,
		getBasePort: getRovoBasePort,
		initPool,
		logger,
		projectRoot,
		resolveRovoPorts,
		rovoCancelChat,
		rovoHealthCheck,
	});
	const port = env.PORT || 8080;
	logger.log(`[STARTUP] Port configured: ${port}`);
	const sendGatewayErrorResponse = createGatewayErrorResponseSender({
		isChatInProgressError,
	});
	const sendHermesUnavailableResponse = createHermesUnavailableResponseSender();
	const activeRequests = new Map();
	const getListeningPidsForPort = createListeningPidReader();
	const resolvePreferredBackend = createPreferredBackendResolver({
		isRovoAvailable,
	});
	const {
		buildAIGatewaySystemPrompt,
		buildQuestionCardSkipNotification,
		buildUserMessage,
	} = loadRovoConfigBuilders({
		logger,
	});
	const {
		createChatSdkHandler,
		interactiveChatForcePortRecoveryMaxAttempts,
		interactiveChatForcePortRecoveryTimeoutMs,
		requestUserInputQuestionMetaStore: _requestUserInputQuestionMetaStore,
	} = createChatSdkServerComposition({
		waitForTurnTimeoutMs,
	});
	const {
		agentsRfpDemoJobOwner,
		gatewayTextGeneration,
		hermesJobLinks,
		services: backendServices,
		syncThreadPendingSkillDraftIds,
	} = createBackendServiceComposition({
		baseDir: path.join(backendDir, "data"),
		createRovoUnavailableError,
		debugLog,
		deleteRovoAppThreadBrowserWorkspace,
		destroyMirrorBrowser,
		executeRovoTask,
		generateTextViaRovo,
		logger,
		normalizeAIGatewayError,
		projectRoot,
		resolvePreferredBackend,
		streamViaRovo,
		syncHermesJobResultsToRovoThreads,
		waitForTurnTimeoutMs,
	});
	const {
		compressUiConversationHistory,
		generateSmartGenuiResult,
		generateTextViaGateway,
		mapUiMessagesToConversation,
		streamTextViaGateway,
	} = gatewayTextGeneration;
	const {
		agentsRfpDemoStateManager,
		aiGatewayProvider,
		hermesJobsProvider,
		hermesSkillDraftManager,
		rovoAppDocumentManager,
		rovoAppGeneratedFilesManager,
		rovoAppRunManager,
		rovoAppThreadManager,
		rovoAppUploadManager,
	} = backendServices;
	const resolveStageTraceFromRequest = createStageTraceFromRequestResolver({
		logger,
	});
	const {
		handleChatSdkRequest,
		rovoAppRuntime,
	} = createChatRuntimeComposition({
		_pausedRovoToolCallStore,
		activeRequests,
		agentsRfpDemoStateManager,
		aiGatewayProvider,
		areHermesCompanionsEnabled,
		buildAIGatewaySystemPrompt,
		buildUserMessage,
		clearActiveDeferredToolCall,
		compressUiConversationHistory,
		createAbortControllerFromRequest,
		createChatSdkHandler,
		createRovoUnavailableError,
		createStageTrace,
		ensureRovoSession,
		generateSmartGenuiResult,
		generateTextViaGateway,
		getCurrentRovoSession,
		getListeningPidsForPort,
		hasGatewayUrlConfigured,
		hermesSkillDraftManager,
		isRovoAvailable,
		listHermesSkills,
		logger,
		mapUiMessagesToConversation,
		requestUserInputQuestionMetaStore: _requestUserInputQuestionMetaStore,
		refreshRovoAvailability,
		registerActiveDeferredToolCall,
		registerPausedRovoToolCall,
		replayViaRovo,
		resolvePreferredBackend,
		resolveRovoAppPortAvailability,
		resolveStageTraceFromRequest,
		rovoAppDocumentManager,
		rovoAppGeneratedFilesManager,
		rovoAppRunManager,
		rovoAppThreadManager,
		rovoAppUploadManager,
		rovoCancelChat,
		rovoHealthCheck,
		rovoResumeToolCalls,
		runRovoBackgroundTask,
		sendGatewayErrorResponse,
		setStartNextQueuedRovoAppRun,
		streamTextViaGateway,
		streamViaRovo,
		takePausedRovoToolCall,
	});
	const {
		app,
		isAllowedRuntimeSocketOrigin,
		isRuntimeSocketTokenValid,
		runtimeAdminRequired,
		runtimeAdminToken,
	} = createBackendApp(buildBackendAppDependencies({
		activeRequests,
		agentMode: {
			getAgentMode,
			setAgentMode,
		},
		agentsRfpDemoJobOwner,
		backendServices,
		browserWorkspace: {
			browserWorkspaceManager,
			chromiumPreviewManager,
			deleteThreadBrowserWorkspace: deleteRovoAppThreadBrowserWorkspace,
			destroyMirrorBrowser,
			ensureThreadBrowserWorkspace: ensureRovoAppThreadBrowserWorkspace,
			getMirrorBrowser,
			getThreadBrowserWorkspace: getRovoAppThreadBrowserWorkspace,
			isBrowserWorkspaceNotFoundError,
		},
		chatControl: {
			abortControllerFromRequest: createAbortControllerFromRequest,
			buildQuestionCardSkipNotification,
			buildUserMessage,
			cancelActiveDeferredToolCallRecord,
			cancelChat: rovoCancelChat,
			cancelPausedDeferredToolCallRecord,
			clearActiveDeferredToolCall,
			clearPlanSession,
			createRovoUnavailableError,
			detachPausedRovoToolCall,
			sendGatewayErrorResponse,
			sendHermesUnavailableResponse,
			streamChatViaRovo: streamViaRovo,
			waitForReady: waitForPortReady,
		},
		chatSdk: {
			handleChatSdkRequest,
		},
		collectUploadIdsFromMessages: collectRovoAppUploadIdsFromMessages,
		gatewayTextGeneration,
		hermes: {
			archiveHermesSkill,
			createHermesSkillFromBundle,
			getHermesRuntimeStatus,
			getHermesSkill,
			getHermesSkillBundle,
			listHermesSkills,
			parseOptionalBoolean,
			syncHermesJobResultsToRovoThreads,
			syncThreadPendingSkillDraftIds,
			toggleHermesSkill,
			updateHermesSkillFromBundle,
		},
		hermesJobLinks,
		rovoAppRuntime,
		runtime: {
			buildLlmRoutingStatus,
			buildRuntimeStatusSnapshot,
			debugLog,
			debugMode,
			getAiGatewayConfigReport,
			getEnvVars,
			hasGatewayUrlConfigured,
			isRovoAvailable,
			logger,
			runtimePort: port,
		},
		searchThreads,
		wikiRouteHandlers,
	}));

	return {
		activeRequests,
		app,
		backendServices,
		debugMode,
		hermesJobsProvider,
		port,
		serverReadyDependencies: {
			areHermesJobsEnabled,
			buildLlmRoutingStatus,
			debugMode,
			describeChatBackend,
			ensureWikiJobs,
			getEnvVars,
			getRealtimeConfig,
			getRovoPool,
			hasGatewayUrlConfigured,
			hermesJobsProvider,
			interactiveChatForcePortRecoveryMaxAttempts,
			interactiveChatForcePortRecoveryTimeoutMs,
			logger,
			port,
			refreshRovoAvailability,
		},
		shutdownRuntime: () => {
			hermesJobsProvider.stopJobTicker?.();
			shutdownRovoPool();
		},
		webSocketRelayDependencies: {
			browserWorkspaceManager,
			debugMode,
			getMirrorBrowser,
			isAllowedRuntimeSocketOrigin,
			isRuntimeSocketTokenValid,
			runtimeAdminRequired,
			runtimeAdminToken,
		},
	};
}

module.exports = {
	createBackendRuntimeComposition,
	createDebugLogger,
};
