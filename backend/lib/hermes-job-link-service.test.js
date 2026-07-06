const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildHermesJobLinkMetadata,
	createHermesJobLinkService,
	extractHermesJobLinkMetadata,
} = require("./hermes-job-link-service");

test("extractHermesJobLinkMetadata normalizes optional link fields", () => {
	assert.equal(extractHermesJobLinkMetadata(null), null);
	assert.deepEqual(extractHermesJobLinkMetadata({
		artifactTarget: " report ",
		lastPostedRunMarker: " marker ",
		linkedThreadId: " thread-1 ",
		postResultToThread: true,
		runHistory: [{ id: "run-1" }],
		surface: " studio ",
		threadStrategy: "unexpected",
		trigger: { type: "manual" },
		triggerLabel: " Manual ",
	}), {
		artifactTarget: "report",
		lastPostedRunMarker: "marker",
		linkedThreadId: "thread-1",
		postResultToThread: true,
		runHistory: [{ id: "run-1" }],
		surface: "studio",
		threadStrategy: "fixed",
		trigger: { type: "manual" },
		triggerLabel: "Manual",
	});
	assert.equal(extractHermesJobLinkMetadata({ threadStrategy: "fixed" }).threadStrategy, "fixed");
	assert.equal(extractHermesJobLinkMetadata({}).threadStrategy, "new-per-run");
});

test("buildHermesJobLinkMetadata applies overrides before normalization", () => {
	assert.deepEqual(buildHermesJobLinkMetadata({
		linkedThreadId: "thread-1",
		postResultToThread: false,
		surface: "jobs",
	}, {
		linkedThreadId: " thread-2 ",
		postResultToThread: true,
	}), {
		artifactTarget: null,
		lastPostedRunMarker: null,
		linkedThreadId: "thread-2",
		postResultToThread: true,
		runHistory: [],
		surface: "jobs",
		threadStrategy: "fixed",
		trigger: null,
		triggerLabel: null,
	});
});

function createService({ syncImpl } = {}) {
	const calls = [];
	const links = new Map([
		[
			"job-existing",
			{
				linkedThreadId: "thread-existing",
				runHistory: [{ id: "run-existing" }],
				surface: "jobs",
			},
		],
	]);
	const service = createHermesJobLinkService({
		hermesJobLinkManager: {
			getLink: async (jobId) => {
				calls.push(["getLink", jobId]);
				return links.get(jobId) ?? null;
			},
			mergeJobsWithLinks: async (jobs) => {
				calls.push(["mergeJobsWithLinks", jobs]);
				return jobs.map((job) => ({
					...job,
					...(links.get(job.id) ?? {}),
				}));
			},
			setLink: async (jobId, metadata) => {
				calls.push(["setLink", jobId, metadata]);
				links.set(jobId, metadata);
				return metadata;
			},
		},
		hermesJobsProvider: {
			getHermesJob: async (jobId) => {
				calls.push(["getHermesJob", jobId]);
				return { id: jobId, name: `Job ${jobId}` };
			},
			listHermesJobs: async (searchParams) => {
				calls.push(["listHermesJobs", searchParams]);
				return [
					{ id: "job-existing", name: "Existing job" },
					{ id: "job-new", name: "New job" },
				];
			},
		},
		logger: {
			warn: (...args) => calls.push(["warn", ...args]),
		},
		rovoAppThreadManager: { name: "thread-manager" },
		syncHermesJobResultsToRovoThreads: syncImpl ?? (async (input) => {
			calls.push(["syncHermesJobResultsToRovoThreads", input]);
			await input.onJobPosted({ id: "job-existing", surface: "jobs" }, {
				lastPostedRunMarker: "run-2",
			});
		}),
	});

	return { calls, links, service };
}

test("persistHermesJobLink merges existing metadata when requested", async () => {
	const { calls, service } = createService();

	const metadata = await service.persistHermesJobLink(
		"job-existing",
		{ artifactTarget: "report", linkedThreadId: "" },
		{ postResultToThread: true },
		{ mergeExisting: true },
	);

	assert.deepEqual(metadata, {
		artifactTarget: "report",
		lastPostedRunMarker: null,
		linkedThreadId: null,
		postResultToThread: true,
		runHistory: [{ id: "run-existing" }],
		surface: "jobs",
		threadStrategy: "new-per-run",
		trigger: null,
		triggerLabel: null,
	});
	assert.deepEqual(calls.slice(0, 2), [
		["getLink", "job-existing"],
		["setLink", "job-existing", metadata],
	]);
});

test("listMergedHermesJobs and getMergedHermesJob merge provider jobs with links", async () => {
	const { service } = createService();

	const jobs = await service.listMergedHermesJobs({ q: "open" });
	assert.deepEqual(jobs, [
		{
			id: "job-existing",
			name: "Existing job",
			linkedThreadId: "thread-existing",
			runHistory: [{ id: "run-existing" }],
			surface: "jobs",
		},
		{ id: "job-new", name: "New job" },
	]);

	assert.deepEqual(await service.getMergedHermesJob("job-existing"), {
		id: "job-existing",
		name: "Job job-existing",
		linkedThreadId: "thread-existing",
		runHistory: [{ id: "run-existing" }],
		surface: "jobs",
	});
});

test("syncHermesJobsForRovoThreads syncs merged jobs and persists posted metadata", async () => {
	const { calls, service } = createService();

	await service.syncHermesJobsForRovoThreads("thread-1");

	const syncCall = calls.find((call) => call[0] === "syncHermesJobResultsToRovoThreads");
	assert.equal(syncCall?.[1].threadId, "thread-1");
	assert.equal(syncCall?.[1].rovoAppThreadManager.name, "thread-manager");
	assert.deepEqual(syncCall?.[1].jobs.map((job) => job.id), ["job-existing", "job-new"]);
	assert.equal(calls.some((call) => {
		return call[0] === "setLink" &&
			call[1] === "job-existing" &&
			call[2].lastPostedRunMarker === "run-2" &&
			call[2].runHistory.length === 1;
	}), true);
});

test("syncHermesJobsForRovoThreads logs and swallows sync failures", async () => {
	const { calls, service } = createService({
		syncImpl: async () => {
			throw new Error("sync failed");
		},
	});

	await service.syncHermesJobsForRovoThreads();

	assert.equal(calls.some((call) => {
		return call[0] === "warn" &&
			call[1] === "[HERMES-JOBS] Failed to sync Hermes job results into Rovo threads:" &&
			call[2] === "sync failed";
	}), true);
});
