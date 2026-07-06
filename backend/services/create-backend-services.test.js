"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	DEFAULT_CHECKPOINT_LIMIT,
	createBackendServices,
} = require("./create-backend-services");

const SERVICE_FACTORY_NAMES = [
	"createAIGatewayProvider",
	"createAgentsRfpDemoStateManager",
	"createCheckpointManager",
	"createHermesJobLinkManager",
	"createHermesJobsProvider",
	"createHermesSkillDraftManager",
	"createOrchestratorLog",
	"createRovoAppDocumentManager",
	"createRovoAppGeneratedFilesManager",
	"createRovoAppRunManager",
	"createRovoAppThreadManager",
	"createRovoAppUploadManager",
	"createRovoAppVoteManager",
	"createSkillsHubClient",
];

function createFactoryHarness() {
	const calls = [];
	const factories = Object.fromEntries(
		SERVICE_FACTORY_NAMES.map((name) => [
			name,
			(options = {}) => {
				const service = {
					name,
				};
				calls.push({
					name,
					options,
					service,
				});
				return service;
			},
		]),
	);

	return {
		calls,
		factories,
		getCall: (name) => calls.find((call) => call.name === name),
	};
}

test("createBackendServices creates the backend service graph with shared paths and logger", () => {
	const harness = createFactoryHarness();
	const logger = { log() {} };
	const services = createBackendServices({
		baseDir: "/tmp/backend-data",
		executeHermesJobTask: async () => ({ ok: true }),
		factories: harness.factories,
		logger,
		onHermesJobSettled: async () => {},
		projectRoot: "/repo",
		skillsDir: "/repo/.agents/skills",
	});

	assert.deepEqual(Object.keys(services).sort(), [
		"agentsRfpDemoStateManager",
		"aiGatewayProvider",
		"checkpointManager",
		"hermesJobLinkManager",
		"hermesJobsProvider",
		"hermesSkillDraftManager",
		"orchestratorLog",
		"rovoAppDocumentManager",
		"rovoAppGeneratedFilesManager",
		"rovoAppRunManager",
		"rovoAppThreadManager",
		"rovoAppUploadManager",
		"rovoAppVoteManager",
		"skillsHubClient",
	]);

	assert.deepEqual(harness.getCall("createRovoAppThreadManager").options, {
		baseDir: "/tmp/backend-data",
		logger,
	});
	assert.deepEqual(harness.getCall("createCheckpointManager").options, {
		baseDir: "/tmp/backend-data",
		maxCheckpoints: DEFAULT_CHECKPOINT_LIMIT,
	});
	assert.deepEqual(harness.getCall("createSkillsHubClient").options, {
		skillsDir: "/repo/.agents/skills",
	});
	assert.deepEqual(harness.getCall("createRovoAppGeneratedFilesManager").options, {
		baseDir: "/tmp/backend-data",
		logger,
		projectRoot: "/repo",
	});
	assert.deepEqual(harness.getCall("createOrchestratorLog").options, {
		baseDir: "/tmp/backend-data",
		logger,
	});
	assert.deepEqual(harness.getCall("createAIGatewayProvider").options, {
		logger,
	});
	assert.deepEqual(harness.getCall("createRovoAppRunManager").options, {
		logger,
	});

	for (const name of [
		"createAgentsRfpDemoStateManager",
		"createHermesJobLinkManager",
		"createHermesSkillDraftManager",
		"createRovoAppDocumentManager",
		"createRovoAppUploadManager",
		"createRovoAppVoteManager",
	]) {
		assert.deepEqual(harness.getCall(name).options, {
			baseDir: "/tmp/backend-data",
		});
	}
});

test("createBackendServices wires Hermes job callbacks with the created services", async () => {
	const harness = createFactoryHarness();
	const jobTaskCalls = [];
	const settledCalls = [];
	const executeHermesJobTask = async (payload) => {
		jobTaskCalls.push(payload);
		return { result: "done" };
	};
	const onHermesJobSettled = async (job, services) => {
		settledCalls.push({
			job,
			threadManager: services.rovoAppThreadManager,
		});
	};

	const services = createBackendServices({
		baseDir: "/tmp/backend-data",
		executeHermesJobTask,
		factories: harness.factories,
		onHermesJobSettled,
		skillsDir: "/repo/.agents/skills",
	});
	const jobsOptions = harness.getCall("createHermesJobsProvider").options;

	assert.equal(jobsOptions.baseDir, "/tmp/backend-data");
	assert.equal(jobsOptions.executeTask, executeHermesJobTask);
	assert.equal(typeof jobsOptions.onJobSettled, "function");

	assert.deepEqual(await jobsOptions.executeTask({ job: { id: "job-1" } }), {
		result: "done",
	});
	assert.deepEqual(jobTaskCalls, [{ job: { id: "job-1" } }]);

	await jobsOptions.onJobSettled({ id: "job-1" });

	assert.deepEqual(settledCalls, [{
		job: { id: "job-1" },
		threadManager: services.rovoAppThreadManager,
	}]);
});

test("createBackendServices requires Hermes job lifecycle callbacks", () => {
	const harness = createFactoryHarness();
	const baseOptions = {
		factories: harness.factories,
		skillsDir: "/repo/.agents/skills",
	};

	assert.throws(
		() => createBackendServices({
			...baseOptions,
			onHermesJobSettled: async () => {},
		}),
		/executeHermesJobTask/u,
	);
	assert.throws(
		() => createBackendServices({
			...baseOptions,
			executeHermesJobTask: async () => {},
		}),
		/onHermesJobSettled/u,
	);
});
