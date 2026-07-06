"use strict";

const path = require("node:path");

const { createAIGatewayProvider } = require("../lib/ai-gateway-provider");
const { createAgentsRfpDemoStateManager } = require("../lib/agents-rfp-demo-state");
const { createCheckpointManager } = require("../lib/hermes-checkpoints");
const { getHermesSkillsDir } = require("../lib/hermes-config");
const { createHermesJobLinkManager } = require("../lib/hermes-job-links");
const { createHermesJobsProvider } = require("../lib/hermes-jobs-provider");
const { createHermesSkillDraftManager } = require("../lib/hermes-skill-drafts");
const { createSkillsHubClient } = require("../lib/hermes-skills-hub");
const { createOrchestratorLog } = require("../lib/orchestrator-log");
const { createRovoAppDocumentManager } = require("../lib/rovo-app-documents");
const {
	createRovoAppGeneratedFilesManager,
} = require("../lib/rovo-app-generated-files");
const { createRovoAppRunManager } = require("../lib/rovo-app-runs");
const { createRovoAppThreadManager } = require("../lib/rovo-app-threads");
const { createRovoAppUploadManager } = require("../lib/rovo-app-uploads");
const { createRovoAppVoteManager } = require("../lib/rovo-app-votes");

const DEFAULT_CHECKPOINT_LIMIT = 10;

const DEFAULT_FACTORIES = {
	createAIGatewayProvider,
	createAgentsRfpDemoStateManager,
	createCheckpointManager,
	createHermesJobLinkManager,
	createHermesJobsProvider,
	createHermesSkillDraftManager,
	createOrchestratorLog,
	createRovoAppDocumentManager,
	createRovoAppGeneratedFilesManager,
	createRovoAppRunManager,
	createRovoAppThreadManager,
	createRovoAppUploadManager,
	createRovoAppVoteManager,
	createSkillsHubClient,
};

function requireFunction(value, name) {
	if (typeof value !== "function") {
		throw new Error(`createBackendServices requires ${name}`);
	}
}

function createBackendServices({
	baseDir = path.join(__dirname, "..", "data"),
	executeHermesJobTask,
	factories = {},
	logger = console,
	onHermesJobSettled,
	projectRoot = path.join(__dirname, "..", ".."),
	skillsDir = getHermesSkillsDir(),
} = {}) {
	requireFunction(executeHermesJobTask, "executeHermesJobTask");
	requireFunction(onHermesJobSettled, "onHermesJobSettled");

	const serviceFactories = {
		...DEFAULT_FACTORIES,
		...factories,
	};

	const services = {};

	services.aiGatewayProvider = serviceFactories.createAIGatewayProvider({ logger });
	services.agentsRfpDemoStateManager = serviceFactories.createAgentsRfpDemoStateManager({ baseDir });
	services.checkpointManager = serviceFactories.createCheckpointManager({
		baseDir,
		maxCheckpoints: DEFAULT_CHECKPOINT_LIMIT,
	});
	services.hermesJobLinkManager = serviceFactories.createHermesJobLinkManager({ baseDir });
	services.hermesSkillDraftManager = serviceFactories.createHermesSkillDraftManager({ baseDir });
	services.orchestratorLog = serviceFactories.createOrchestratorLog({
		baseDir,
		logger,
	});
	services.rovoAppDocumentManager = serviceFactories.createRovoAppDocumentManager({ baseDir });
	services.rovoAppGeneratedFilesManager = serviceFactories.createRovoAppGeneratedFilesManager({
		baseDir,
		logger,
		projectRoot,
	});
	services.rovoAppRunManager = serviceFactories.createRovoAppRunManager({ logger });
	services.rovoAppThreadManager = serviceFactories.createRovoAppThreadManager({
		baseDir,
		logger,
	});
	services.rovoAppUploadManager = serviceFactories.createRovoAppUploadManager({ baseDir });
	services.rovoAppVoteManager = serviceFactories.createRovoAppVoteManager({ baseDir });
	services.skillsHubClient = serviceFactories.createSkillsHubClient({ skillsDir });
	services.hermesJobsProvider = serviceFactories.createHermesJobsProvider({
		baseDir,
		executeTask: executeHermesJobTask,
		logger,
		onJobSettled: (job) => onHermesJobSettled(job, services),
	});

	return services;
}

module.exports = {
	DEFAULT_CHECKPOINT_LIMIT,
	createBackendServices,
};
