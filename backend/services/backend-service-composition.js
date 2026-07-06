"use strict";

const path = require("node:path");

const {
	createAgentsRfpDemoJobOwner: defaultCreateAgentsRfpDemoJobOwner,
} = require("../lib/agents-rfp-demo-job-owner");
const {
	createGatewayTextGenerationService: defaultCreateGatewayTextGenerationService,
} = require("../lib/gateway-text-generation");
const {
	createHermesJobLinkService: defaultCreateHermesJobLinkService,
} = require("../lib/hermes-job-link-service");
const {
	createSyncThreadPendingSkillDraftIds: defaultCreateSyncThreadPendingSkillDraftIds,
} = require("../lib/hermes-thread-context");
const {
	createBackendServices: defaultCreateBackendServices,
} = require("./create-backend-services");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createBackendServiceComposition requires ${name}`);
	}
	return value;
}

function createBackendServiceComposition({
	baseDir = path.join(__dirname, "..", "data"),
	createRovoUnavailableError,
	debugLog,
	deleteRovoAppThreadBrowserWorkspace,
	destroyMirrorBrowser,
	executeRovoTask,
	generateTextViaRovo,
	logger = console,
	normalizeAIGatewayError,
	projectRoot = path.join(__dirname, "..", ".."),
	resolvePreferredBackend,
	streamViaRovo,
	syncHermesJobResultsToRovoThreads,
	waitForTurnTimeoutMs,
} = {}, factories = {}) {
	const {
		createAgentsRfpDemoJobOwner = defaultCreateAgentsRfpDemoJobOwner,
		createBackendServices = defaultCreateBackendServices,
		createGatewayTextGenerationService = defaultCreateGatewayTextGenerationService,
		createHermesJobLinkService = defaultCreateHermesJobLinkService,
		createSyncThreadPendingSkillDraftIds = defaultCreateSyncThreadPendingSkillDraftIds,
	} = factories;

	requireFunction("createRovoUnavailableError", createRovoUnavailableError);
	requireFunction("debugLog", debugLog);
	requireFunction("deleteRovoAppThreadBrowserWorkspace", deleteRovoAppThreadBrowserWorkspace);
	requireFunction("destroyMirrorBrowser", destroyMirrorBrowser);
	requireFunction("executeRovoTask", executeRovoTask);
	requireFunction("generateTextViaRovo", generateTextViaRovo);
	requireFunction("normalizeAIGatewayError", normalizeAIGatewayError);
	requireFunction("resolvePreferredBackend", resolvePreferredBackend);
	requireFunction("streamViaRovo", streamViaRovo);
	requireFunction("syncHermesJobResultsToRovoThreads", syncHermesJobResultsToRovoThreads);

	let executeAgentsRfpDemoHermesJob = async () => null;
	let getMergedHermesJob = async () => {
		throw new Error("Hermes job link service is not initialized");
	};
	let persistHermesJobLink = async () => {
		throw new Error("Hermes job link service is not initialized");
	};

	const services = createBackendServices({
		baseDir,
		executeHermesJobTask: async ({
			context,
			job,
			prompt,
			selectedSkillIds,
			source,
		}) => {
			const rfpJobResult = await executeAgentsRfpDemoHermesJob({
				context,
				job,
				source,
			});
			if (rfpJobResult) {
				return rfpJobResult;
			}

			return executeRovoTask({
				prompt,
				selectedSkillIds,
				system: [
					"[Hermes Job Runner]",
					"You are executing a scheduled Hermes job through the shared Rovo executor.",
					job?.name ? `Job name: ${job.name}` : null,
					"Complete the requested work using the same tool-capable runtime used by interactive Rovo chat.",
					"[End Hermes Job Runner]",
				]
					.filter(Boolean)
					.join("\n"),
			});
		},
		logger,
		onHermesJobSettled: async (job, createdServices) => {
			const mergedJob = await getMergedHermesJob(job.id);
			await syncHermesJobResultsToRovoThreads({
				jobs: [mergedJob],
				onJobPosted: async (syncedJob, metadata) => {
					await persistHermesJobLink(syncedJob.id, syncedJob, metadata, {
						mergeExisting: true,
					});
				},
				rovoAppThreadManager: createdServices.rovoAppThreadManager,
			});
		},
		projectRoot,
	});

	const gatewayTextGeneration = createGatewayTextGenerationService({
		aiGatewayProvider: services.aiGatewayProvider,
		createRovoUnavailableError,
		debugLog,
		generateTextViaRovo,
		normalizeAIGatewayError,
		resolvePreferredBackend,
		streamViaRovo,
		waitForTurnTimeoutMs,
	});

	const hermesJobLinks = createHermesJobLinkService({
		hermesJobLinkManager: services.hermesJobLinkManager,
		hermesJobsProvider: services.hermesJobsProvider,
		logger,
		rovoAppThreadManager: services.rovoAppThreadManager,
		syncHermesJobResultsToRovoThreads,
	});
	getMergedHermesJob = hermesJobLinks.getMergedHermesJob;
	persistHermesJobLink = hermesJobLinks.persistHermesJobLink;

	const agentsRfpDemoJobOwner = createAgentsRfpDemoJobOwner({
		agentsRfpDemoStateManager: services.agentsRfpDemoStateManager,
		deleteRovoAppThreadBrowserWorkspace,
		destroyMirrorBrowser,
		getMergedHermesJob: hermesJobLinks.getMergedHermesJob,
		hermesJobLinkManager: services.hermesJobLinkManager,
		hermesJobsProvider: services.hermesJobsProvider,
		listMergedHermesJobs: hermesJobLinks.listMergedHermesJobs,
		persistHermesJobLink: hermesJobLinks.persistHermesJobLink,
		rovoAppDocumentManager: services.rovoAppDocumentManager,
		rovoAppGeneratedFilesManager: services.rovoAppGeneratedFilesManager,
		rovoAppThreadManager: services.rovoAppThreadManager,
		rovoAppUploadManager: services.rovoAppUploadManager,
		rovoAppVoteManager: services.rovoAppVoteManager,
	});
	executeAgentsRfpDemoHermesJob = agentsRfpDemoJobOwner.executeAgentsRfpDemoHermesJob;

	const syncThreadPendingSkillDraftIds = createSyncThreadPendingSkillDraftIds({
		hermesSkillDraftManager: services.hermesSkillDraftManager,
		rovoAppThreadManager: services.rovoAppThreadManager,
	});

	return {
		agentsRfpDemoJobOwner,
		gatewayTextGeneration,
		hermesJobLinks,
		services,
		syncThreadPendingSkillDraftIds,
	};
}

module.exports = {
	createBackendServiceComposition,
};
