const assert = require("node:assert/strict");
const express = require("express");
const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	collectRuntimeRouteStackRoutes,
	collectRouteManifest,
	collectProxyHelperBypasses,
	findUnregisteredServerRouteRegistrars,
	extractPathsFromExpression,
	findProxyTargetParityFailures,
	getConcreteRoutePath,
	getRouteContext,
	normalizeBackendTargetPath,
	readRouteManifest,
} = require("./route-manifest");
const {
	registerBackendAppRoutes,
} = require("../app");
const ts = require("typescript");

function parseExpression(source) {
	const sourceFile = ts.createSourceFile(
		"expression.ts",
		`const value = ${source};`,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS,
	);
	const statement = sourceFile.statements[0];
	return statement.declarationList.declarations[0].initializer;
}

function parseRouteFunction(source, fileName = "app/api/status/route.ts") {
	const sourceFile = ts.createSourceFile(
		fileName,
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS,
	);
	const functionNode = sourceFile.statements.find((statement) => ts.isFunctionDeclaration(statement));
	assert.ok(functionNode, "expected source to include a route function declaration");
	return {
		functionNode,
		sourceFile,
	};
}

function withTempProject(callback) {
	const tempDir = mkdtempSync(path.join(os.tmpdir(), "route-manifest-"));
	try {
		mkdirSync(path.join(tempDir, "backend/routes"), { recursive: true });
		return callback(tempDir);
	} finally {
		rmSync(tempDir, { force: true, recursive: true });
	}
}

function noopMiddleware(_req, _res, next) {
	next?.();
}

function noop() {}

function createMethodBag(methodNames) {
	return Object.fromEntries(methodNames.map((methodName) => [methodName, noop]));
}

function createRuntimeRouteStackTestDependencies() {
	return {
		abortControllerFromRequest: () => new AbortController(),
		activeRequests: new Map(),
		advanceAgentsRfpDemoProcessing: noop,
		agentsRfpDemoStateManager: createMethodBag(["readState", "writeState", "resetState", "updateState"]),
		appendRuntimeSocketToken: noop,
		archiveHermesSkill: noop,
		browserWorkspaceManager: createMethodBag([
			"activateWorkspaceTab",
			"clickWorkspace",
			"clickWorkspaceRef",
			"closeWorkspaceTab",
			"createWorkspace",
			"createWorkspacePreviewSession",
			"createWorkspaceTab",
			"deleteWorkspace",
			"deleteWorkspacePreviewSession",
			"fillWorkspaceRef",
			"getWorkspaceScreenshot",
			"getWorkspaceSnapshot",
			"getWorkspaceState",
			"getWorkspaceStream",
			"getWorkspaceTabs",
			"goBack",
			"goForward",
			"hoverWorkspaceRef",
			"listWorkspaces",
			"navigateWorkspace",
			"pressWorkspaceKey",
			"reloadWorkspace",
			"resizeWorkspace",
			"scrollWorkspace",
			"selectWorkspaceRef",
			"typeWorkspaceRef",
			"typeWorkspaceText",
			"wheelWorkspace",
		]),
		buildLlmRoutingStatus: () => ({
			chatSdk: {
				backend: "ai-gateway",
				requiresRovo: false,
			},
		}),
		buildQuestionCardSkipNotification: noop,
		buildRuntimeStatusSnapshot: () => ({}),
		buildUserMessage: noop,
		cancelActiveDeferredToolCallRecord: noop,
		cancelChat: noop,
		cancelPausedDeferredToolCallRecord: noop,
		checkpointManager: createMethodBag(["create", "delete", "list", "rollback"]),
		chromiumPreviewManager: createMethodBag([
			"click",
			"clickRef",
			"fillRef",
			"getState",
			"getStreamConfig",
			"goBack",
			"goForward",
			"hoverRef",
			"insertText",
			"navigate",
			"press",
			"reload",
			"screenshot",
			"scroll",
			"selectRef",
			"setViewport",
			"snapshot",
			"typeRef",
			"wheel",
		]),
		clearActiveDeferredToolCall: noop,
		clearPlanSession: noop,
		clearRunState: noop,
		collectUploadIdsFromMessages: () => [],
		createHermesSkillFromBundle: noop,
		createRovoUnavailableError: () => new Error("Rovo unavailable"),
		createRuntimeSocketToken: () => "runtime-token",
		debugLog: noop,
		debugMode: false,
		deleteAgentsRfpDemoHermesJobs: noop,
		deleteAgentsRfpDemoThread: noop,
		deleteThreadBrowserWorkspace: noop,
		destroyMirrorBrowser: noop,
		detachPausedRovoToolCall: noop,
		ensureThreadBrowserWorkspace: noop,
		generateAgentDataFlowText: noop,
		generateAgentsRfpDemoReportPreview: noop,
		generatedFilesManager: createMethodBag(["backfillFromThread", "deleteLegacyRootFiles"]),
		generateSuggestedQuestions: noop,
		generateTextViaGateway: noop,
		getAiGatewayConfigReport: () => ({}),
		getAgentMode: () => null,
		getEnvVars: () => ({}),
		getHermesRuntimeStatus: () => ({}),
		getHermesSkill: noop,
		getHermesSkillBundle: noop,
		getMergedHermesJob: noop,
		getMirrorBrowser: () => null,
		getThreadBrowserWorkspace: noop,
		handleChatSdkRequest: noop,
		hasGatewayUrlConfigured: () => false,
		hermesJobLinkManager: {
			removeLink: noop,
		},
		hermesJobsProvider: {},
		hermesSkillDraftManager: createMethodBag(["approveDraft", "deleteDraft", "getDraft", "listDrafts", "rejectDraft"]),
		isBrowserWorkspaceNotFoundError: () => false,
		isRovoAvailable: () => false,
		listHermesSkills: () => [],
		listMergedHermesJobs: () => [],
		logger: {
			error: noop,
			log: noop,
			warn: noop,
		},
		maybeMigratePersistedThreadBrowserScreenshots: noop,
		orchestratorLog: {
			clear: noop,
			getEntries: () => [],
			getStats: () => ({}),
			toTimeline: () => [],
		},
		parseOptionalBoolean: () => null,
		persistHermesJobLink: noop,
		persistMessageFiles: noop,
		persistRunState: noop,
		proxyRovoAppChatRequest: noop,
		reconcileOrphanedThread: noop,
		requireRuntimeAdmin: noopMiddleware,
		requireRuntimeSocketTokenRequester: noopMiddleware,
		rovoAppDocumentManager: createMethodBag([
			"appendDocumentVersion",
			"createDocument",
			"deleteAllDocuments",
			"deleteDocument",
			"deleteDocumentsByThread",
			"getDocument",
			"listDocuments",
			"patchDocumentMetadata",
		]),
		rovoAppRunManager: createMethodBag(["attachSubscriber", "cancelRun", "getRun", "listRuns", "setRunStatus"]),
		rovoAppThreadManager: createMethodBag([
			"createThread",
			"deleteAllThreads",
			"deleteThread",
			"getRealtimeMessages",
			"getThread",
			"listThreads",
			"replaceRealtimeMessages",
			"updateThread",
			"upsertRealtimeMessage",
		]),
		rovoAppUploadManager: createMethodBag(["createUploadFromDataUrl", "deleteAllUploads", "deleteUpload", "getUpload"]),
		rovoAppVoteManager: createMethodBag(["deleteAllVotes", "deleteVotesForThread", "listVotes", "setVote"]),
		runtimePort: 8080,
		runtimeSocketTokenTtlMs: 1000,
		runAgentsRfpDemoJob: noop,
		searchThreads: noop,
		sendGatewayErrorResponse: noop,
		sendHermesUnavailableResponse: noop,
		setAgentMode: noop,
		skillsHubClient: {},
		startNextQueuedRun: noop,
		streamChatViaRovo: noop,
		syncHermesJobResultsToRovoThreads: noop,
		syncHermesJobsForRovoThreads: noop,
		syncThreadPendingSkillDraftIds: noop,
		toggleHermesSkill: noop,
		updateHermesSkillFromBundle: noop,
		waitForReady: noop,
		wikiRouteHandlers: createMethodBag([
			"handleWikiCapture",
			"handleWikiMemories",
			"handleWikiMemoryBlockDelete",
			"handleWikiMemoryBrief",
			"handleWikiMemoryDeck",
			"handleWikiMemoryExplorer",
			"handleWikiMemoryExplorerExport",
			"handleWikiMemoryProposalDelete",
			"handleWikiMemoryReset",
			"handleWikiSearch",
			"handleWikiStatus",
			"handleWikiSync",
			"handleWikiSynthesisSave",
		]),
	};
}

test("route context normalizes Next dynamic segments to backend-style path params", () => {
	assert.deepEqual(getRouteContext("app/api/jobs/[id]/run/route.ts"), {
		catchAllParams: [],
		dynamicParams: ["id"],
		nextPath: "/api/jobs/:id/run",
		relativeRouteFile: "app/api/jobs/[id]/run/route.ts",
	});

	assert.deepEqual(getRouteContext("app/api/personal-graph/page/[...slug]/route.ts"), {
		catchAllParams: ["slug"],
		dynamicParams: [],
		nextPath: "/api/personal-graph/page/*slug",
		relativeRouteFile: "app/api/personal-graph/page/[...slug]/route.ts",
	});
});

test("target path extraction strips query-only template spans", () => {
	const context = getRouteContext("app/api/jobs/[id]/route.ts");
	assert.deepEqual(extractPathsFromExpression(
		parseExpression("`/api/jobs/${encodeURIComponent(id)}${request.nextUrl.search}`"),
		context,
	), ["/api/jobs/:id"]);

	assert.deepEqual(extractPathsFromExpression(
		parseExpression("query ? `/api/skills/hub/search${request.nextUrl.search}` : `/api/skills/hub/browse${request.nextUrl.search}`"),
		getRouteContext("app/api/skills/hub/route.ts"),
	), [
		"/api/skills/hub/search",
		"/api/skills/hub/browse",
	]);
});

test("normalizes backend target paths before comparison", () => {
	assert.equal(normalizeBackendTargetPath("/api/status?verbose=true"), "/api/status");
	assert.equal(normalizeBackendTargetPath("/api/status/"), "/api/status");
});

test("route path samples make Express dynamic and catch-all paths matchable", () => {
	assert.equal(getConcreteRoutePath("/api/jobs/:id/run"), "/api/jobs/__id__/run");
	assert.equal(getConcreteRoutePath("/api/personal-graph/page/*slug"), "/api/personal-graph/page/__slug__");
});

test("collector follows route-local proxy helper path arguments", () => {
	const manifest = collectRouteManifest();
	const briefRoute = manifest.nextApiRoutes.find((route) => {
		return route.method === "POST" && route.nextPath === "/api/wiki/memory-explorer/brief";
	});
	const deckRoute = manifest.nextApiRoutes.find((route) => {
		return route.method === "POST" && route.nextPath === "/api/wiki/memory-explorer/deck";
	});

	assert.deepEqual(briefRoute?.targets.map((target) => `${target.method} ${target.path}`), [
		"POST /api/wiki/memory-explorer/brief",
	]);
	assert.deepEqual(deckRoute?.targets.map((target) => `${target.method} ${target.path}`), [
		"POST /api/wiki/memory-explorer/deck",
	]);
});

test("collector flags direct backend fetches inside Next API route handlers", () => {
	const routeFile = "app/api/items/[id]/route.ts";
	const { functionNode, sourceFile } = parseRouteFunction([
		"export async function POST() {",
		"\treturn fetch(`${getBackendUrl()}/api/items/${id}?verbose=true`, { method: \"PUT\" });",
		"}",
		"",
	].join("\n"), routeFile);

	assert.deepEqual(
		collectProxyHelperBypasses(functionNode, sourceFile, getRouteContext(routeFile), "POST"),
		[
			{
				method: "PUT",
				path: "/api/items/:id",
				source: "app/api/items/[id]/route.ts:2",
			},
		],
	);
});

test("collector does not flag shared backend proxy helpers as bypasses", () => {
	const routeFile = "app/api/status/route.ts";
	const { functionNode, sourceFile } = parseRouteFunction([
		"export async function GET() {",
		"\treturn fetchBackend(\"/api/status\");",
		"}",
		"",
	].join("\n"), routeFile);

	assert.deepEqual(
		collectProxyHelperBypasses(functionNode, sourceFile, getRouteContext(routeFile), "GET"),
		[],
	);
});

test("checked-in route manifest matches source collectors", () => {
	const checkedInManifest = readRouteManifest();
	assert.ok(checkedInManifest, "route-manifest.json should exist");
	assert.deepEqual(collectRouteManifest(), checkedInManifest);
});

test("runtime Express route stack registers every backend manifest route", () => {
	const app = express();
	registerBackendAppRoutes(app, createRuntimeRouteStackTestDependencies());
	const manifest = collectRouteManifest();
	const runtimeRouteKeys = collectRuntimeRouteStackRoutes(app, manifest.backendRoutes)
		.map((route) => `${route.method} ${route.path}`)
		.sort((a, b) => a.localeCompare(b));
	const manifestRouteKeys = manifest.backendRoutes
		.map((route) => `${route.method} ${route.path}`)
		.sort((a, b) => a.localeCompare(b));

	assert.deepEqual(runtimeRouteKeys, manifestRouteKeys);
});

test("Next API proxy targets are backed by registered backend routes", () => {
	const manifest = readRouteManifest();
	assert.deepEqual(findProxyTargetParityFailures(manifest), []);
});

test("Next API route adapters cannot directly fetch backend API routes", () => {
	const manifest = {
		backendRoutes: [
			{
				method: "GET",
				path: "/api/status",
			},
		],
		nextApiRoutes: [
			{
				method: "GET",
				nextPath: "/api/status",
				proxyHelperBypasses: [
					{
						method: "GET",
						path: "/api/status",
						source: "app/api/status/route.ts:2",
					},
				],
				source: "app/api/status/route.ts:1",
				targets: [],
			},
		],
	};

	assert.deepEqual(findProxyTargetParityFailures(manifest), [
		{
			nextRoute: "GET /api/status",
			source: "app/api/status/route.ts:2",
			target: "GET /api/status",
			type: "route-proxy-helper-bypass",
		},
	]);
});

test("proxy target parity checks dynamic targets instead of skipping them", () => {
	const manifest = {
		backendRoutes: [
			{
				method: "GET",
				path: "/api/items/:id",
			},
		],
		nextApiRoutes: [
			{
				method: "GET",
				nextPath: "/api/items/:id",
				source: "app/api/items/[id]/route.ts:1",
				targets: [
					{
						method: "GET",
						path: "/api/items/:id",
						source: "app/api/items/[id]/route.ts:4",
					},
				],
			},
			{
				method: "GET",
				nextPath: "/api/missing/:id",
				source: "app/api/missing/[id]/route.ts:1",
				targets: [
					{
						method: "GET",
						path: "/api/missing/:id",
						source: "app/api/missing/[id]/route.ts:4",
					},
				],
			},
		],
	};

	assert.deepEqual(findProxyTargetParityFailures(manifest), [
		{
			nextRoute: "GET /api/missing/:id",
			source: "app/api/missing/[id]/route.ts:4",
			target: "GET /api/missing/:id",
			type: "unbacked-proxy-target",
		},
	]);
});

test("route-local Next API handlers must be explicitly classified", () => {
	const manifest = {
		backendRoutes: [],
		nextApiRoutes: [
			{
				method: "GET",
				nextPath: "/api/realtime/ws-url",
				source: "app/api/realtime/ws-url/route.ts:12",
				targets: [],
			},
			{
				method: "POST",
				nextPath: "/api/unclassified-local",
				source: "app/api/unclassified-local/route.ts:1",
				targets: [],
			},
		],
	};

	assert.deepEqual(findProxyTargetParityFailures(manifest), [
		{
			nextRoute: "POST /api/unclassified-local",
			source: "app/api/unclassified-local/route.ts:1",
			type: "unclassified-local-next-route",
		},
	]);
});

test("dynamic proxy fan-out exceptions must keep their backing routes registered", () => {
	const nextRoute = {
		method: "POST",
		nextPath: "/api/chromium-preview/:action",
		source: "app/api/chromium-preview/[action]/route.ts:22",
		targets: [
			{
				method: "POST",
				path: "/api/chromium-preview/:action",
				source: "app/api/chromium-preview/[action]/route.ts:43",
			},
		],
	};
	const backingRoutes = [
		"back",
		"click",
		"click-ref",
		"fill-ref",
		"forward",
		"hover-ref",
		"press",
		"reload",
		"scroll",
		"select-ref",
		"type",
		"type-ref",
		"viewport",
		"wheel",
	].map((action) => ({
		method: "POST",
		path: `/api/chromium-preview/${action}`,
	}));

	assert.deepEqual(findProxyTargetParityFailures({
		backendRoutes: backingRoutes,
		nextApiRoutes: [nextRoute],
	}), []);

	assert.deepEqual(findProxyTargetParityFailures({
		backendRoutes: backingRoutes.filter((route) => route.path !== "/api/chromium-preview/wheel"),
		nextApiRoutes: [nextRoute],
	}), [
		{
			missingBackingTargets: ["POST /api/chromium-preview/wheel"],
			nextRoute: "POST /api/chromium-preview/:action",
			reason: "Route-local action validation fans one dynamic Next segment out to static backend Chromium preview action endpoints.",
			source: "app/api/chromium-preview/[action]/route.ts:43",
			target: "POST /api/chromium-preview/:action",
			type: "incomplete-proxy-target-fanout",
		},
	]);
});

test("server route manifest reports exported route registrars missing from SERVER_ROUTE_FILES", () => {
	withTempProject((cwd) => {
		writeFileSync(
			path.join(cwd, "backend/routes/status.js"),
			[
				"function registerStatusRoutes(app) {",
				"\tapp.get('/api/status', () => {});",
				"}",
				"module.exports = { registerStatusRoutes };",
				"",
			].join("\n"),
		);
		writeFileSync(
			path.join(cwd, "backend/routes/new-surface.js"),
			[
				"function registerNewSurfaceRoutes(app) {",
				"\tapp.get('/api/new-surface', () => {});",
				"}",
				"module.exports = { registerNewSurfaceRoutes };",
				"",
			].join("\n"),
		);
		writeFileSync(
			path.join(cwd, "backend/routes/utility.js"),
			"module.exports = { helper: () => null };\n",
		);

		assert.deepEqual(findUnregisteredServerRouteRegistrars(cwd), [
			{
				filePath: "backend/routes/new-surface.js",
				registrars: ["registerNewSurfaceRoutes"],
			},
		]);
	});
});
