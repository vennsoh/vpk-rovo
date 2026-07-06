"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createBackendServiceComposition,
} = require("./backend-service-composition");

function createServices() {
	return {
		agentsRfpDemoStateManager: { name: "agents-rfp-demo-state" },
		aiGatewayProvider: { generateText: async () => "gateway text" },
		checkpointManager: { name: "checkpoints" },
		hermesJobLinkManager: { name: "job-links" },
		hermesJobsProvider: { name: "jobs" },
		hermesSkillDraftManager: { name: "skill-drafts" },
		orchestratorLog: { name: "orchestrator-log" },
		rovoAppDocumentManager: { name: "documents" },
		rovoAppGeneratedFilesManager: { name: "generated-files" },
		rovoAppRunManager: { name: "runs" },
		rovoAppThreadManager: { name: "threads" },
		rovoAppUploadManager: { name: "uploads" },
		rovoAppVoteManager: { name: "votes" },
		skillsHubClient: { name: "skills-hub" },
	};
}

function createDependencies(overrides = {}) {
	return {
		createRovoUnavailableError: () => new Error("Rovo unavailable"),
		debugLog: () => {},
		deleteRovoAppThreadBrowserWorkspace: async () => {},
		destroyMirrorBrowser: async () => {},
		executeRovoTask: async () => ({ source: "rovo-task" }),
		generateTextViaRovo: async () => "rovo text",
		logger: {
			info() {},
			warn() {},
		},
		normalizeAIGatewayError: (error) => error,
		resolvePreferredBackend: async () => ({ backend: "ai-gateway" }),
		streamViaRovo: async () => {},
		syncHermesJobResultsToRovoThreads: async () => {},
		waitForTurnTimeoutMs: 123,
		...overrides,
	};
}

function createHarness(overrides = {}) {
	const calls = [];
	const captured = {};
	const services = createServices();
	const values = {
		agentsRfpDemoJobOwner: {
			advanceAgentsRfpDemoProcessing: async () => {},
			deleteAgentsRfpDemoHermesJobs: async () => {},
			deleteAgentsRfpDemoThread: async () => {},
			executeAgentsRfpDemoHermesJob: async (input) => {
				calls.push(["executeAgentsRfpDemoHermesJob", input]);
				return overrides.rfpJobResult ?? null;
			},
			runAgentsRfpDemoJob: async () => {},
		},
		gatewayTextGeneration: {
			compressUiConversationHistory: () => [],
			generateSmartGenuiResult: async () => ({}),
			generateTextViaGateway: async () => "gateway",
			mapUiMessagesToConversation: () => [],
			streamTextViaGateway: async () => "stream",
		},
		hermesJobLinks: {
			getMergedHermesJob: async (jobId) => {
				calls.push(["getMergedHermesJob", jobId]);
				return { id: jobId, merged: true };
			},
			listMergedHermesJobs: async () => [],
			persistHermesJobLink: async (...args) => {
				calls.push(["persistHermesJobLink", ...args]);
				return { persisted: true };
			},
			syncHermesJobsForRovoThreads: async () => {},
		},
		syncThreadPendingSkillDraftIds: async () => {},
	};
	const dependencies = createDependencies({
		executeRovoTask: async (input) => {
			calls.push(["executeRovoTask", input]);
			return { source: "rovo-task", input };
		},
		syncHermesJobResultsToRovoThreads: async (input) => {
			calls.push(["syncHermesJobResultsToRovoThreads", input]);
			if (typeof input.onJobPosted === "function") {
				await input.onJobPosted({ id: "job-1" }, { linkedThreadId: "thread-1" });
			}
		},
		...overrides.dependencies,
	});
	const factories = {
		createAgentsRfpDemoJobOwner: (input) => {
			captured.agentsRfpDemoJobOwner = input;
			return values.agentsRfpDemoJobOwner;
		},
		createBackendServices: (input) => {
			captured.backendServices = input;
			return services;
		},
		createGatewayTextGenerationService: (input) => {
			captured.gatewayTextGeneration = input;
			return values.gatewayTextGeneration;
		},
		createHermesJobLinkService: (input) => {
			captured.hermesJobLinkService = input;
			return values.hermesJobLinks;
		},
		createSyncThreadPendingSkillDraftIds: (input) => {
			captured.syncThreadPendingSkillDraftIds = input;
			return values.syncThreadPendingSkillDraftIds;
		},
	};
	const result = createBackendServiceComposition(
		{
			baseDir: "/repo/backend/data",
			projectRoot: "/repo",
			...dependencies,
		},
		factories,
	);

	return {
		calls,
		captured,
		dependencies,
		result,
		services,
		values,
	};
}

test("createBackendServiceComposition wires service graph factories and owners", () => {
	const {
		captured,
		dependencies,
		result,
		services,
		values,
	} = createHarness();

	assert.equal(captured.backendServices.baseDir, "/repo/backend/data");
	assert.equal(captured.backendServices.projectRoot, "/repo");
	assert.equal(captured.backendServices.logger, dependencies.logger);
	assert.equal(typeof captured.backendServices.executeHermesJobTask, "function");
	assert.equal(typeof captured.backendServices.onHermesJobSettled, "function");

	assert.equal(captured.gatewayTextGeneration.aiGatewayProvider, services.aiGatewayProvider);
	assert.equal(captured.gatewayTextGeneration.waitForTurnTimeoutMs, 123);
	assert.equal(captured.hermesJobLinkService.hermesJobsProvider, services.hermesJobsProvider);
	assert.equal(captured.hermesJobLinkService.rovoAppThreadManager, services.rovoAppThreadManager);
	assert.equal(captured.hermesJobLinkService.syncHermesJobResultsToRovoThreads, dependencies.syncHermesJobResultsToRovoThreads);
	assert.equal(captured.agentsRfpDemoJobOwner.getMergedHermesJob, values.hermesJobLinks.getMergedHermesJob);
	assert.equal(captured.agentsRfpDemoJobOwner.persistHermesJobLink, values.hermesJobLinks.persistHermesJobLink);
	assert.equal(captured.agentsRfpDemoJobOwner.deleteRovoAppThreadBrowserWorkspace, dependencies.deleteRovoAppThreadBrowserWorkspace);
	assert.equal(captured.agentsRfpDemoJobOwner.destroyMirrorBrowser, dependencies.destroyMirrorBrowser);
	assert.deepEqual(captured.syncThreadPendingSkillDraftIds, {
		hermesSkillDraftManager: services.hermesSkillDraftManager,
		rovoAppThreadManager: services.rovoAppThreadManager,
	});

	assert.equal(result.services, services);
	assert.equal(result.gatewayTextGeneration, values.gatewayTextGeneration);
	assert.equal(result.hermesJobLinks, values.hermesJobLinks);
	assert.equal(result.agentsRfpDemoJobOwner, values.agentsRfpDemoJobOwner);
	assert.equal(result.syncThreadPendingSkillDraftIds, values.syncThreadPendingSkillDraftIds);
});

test("Hermes job execution delegates to RFP owner after construction before falling back to Rovo", async () => {
	const demoResult = { source: "rfp-demo" };
	const demoHarness = createHarness({ rfpJobResult: demoResult });

	const result = await demoHarness.captured.backendServices.executeHermesJobTask({
		context: { key: "value" },
		job: { id: "job-1", name: "RFP job" },
		prompt: "Do the work",
		selectedSkillIds: ["vpk-html"],
		source: "manual",
	});

	assert.equal(result, demoResult);
	assert.deepEqual(demoHarness.calls, [
		[
			"executeAgentsRfpDemoHermesJob",
			{
				context: { key: "value" },
				job: { id: "job-1", name: "RFP job" },
				source: "manual",
			},
		],
	]);

	const fallbackHarness = createHarness();
	const fallbackResult = await fallbackHarness.captured.backendServices.executeHermesJobTask({
		job: { id: "job-2", name: "Nightly sync" },
		prompt: "Run sync",
		selectedSkillIds: ["wiki"],
	});

	assert.equal(fallbackResult.source, "rovo-task");
	assert.deepEqual(fallbackHarness.calls[0], [
		"executeAgentsRfpDemoHermesJob",
		{
			context: undefined,
			job: { id: "job-2", name: "Nightly sync" },
			source: undefined,
		},
	]);
	assert.equal(fallbackHarness.calls[1][0], "executeRovoTask");
	assert.equal(fallbackHarness.calls[1][1].prompt, "Run sync");
	assert.deepEqual(fallbackHarness.calls[1][1].selectedSkillIds, ["wiki"]);
	assert.match(fallbackHarness.calls[1][1].system, /\[Hermes Job Runner\]/u);
	assert.match(fallbackHarness.calls[1][1].system, /Job name: Nightly sync/u);
});

test("settled Hermes jobs use initialized job-link helpers and merge persisted metadata", async () => {
	const { calls, captured, services } = createHarness();

	await captured.backendServices.onHermesJobSettled({ id: "job-1" }, services);

	assert.equal(calls[0][0], "getMergedHermesJob");
	assert.equal(calls[0][1], "job-1");
	assert.equal(calls[1][0], "syncHermesJobResultsToRovoThreads");
	assert.deepEqual(calls[1][1].jobs, [{ id: "job-1", merged: true }]);
	assert.equal(calls[1][1].rovoAppThreadManager, services.rovoAppThreadManager);
	assert.deepEqual(calls[2], [
		"persistHermesJobLink",
		"job-1",
		{ id: "job-1" },
		{ linkedThreadId: "thread-1" },
		{ mergeExisting: true },
	]);
});

test("createBackendServiceComposition validates required live dependencies", () => {
	assert.throws(
		() => createBackendServiceComposition(createDependencies({ executeRovoTask: null })),
		/executeRovoTask/u,
	);
	assert.throws(
		() => createBackendServiceComposition(createDependencies({ syncHermesJobResultsToRovoThreads: null })),
		/syncHermesJobResultsToRovoThreads/u,
	);
});
