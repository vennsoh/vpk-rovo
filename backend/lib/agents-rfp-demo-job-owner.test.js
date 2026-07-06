const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildAgentsRfpDemoJobLinkMetadata,
	createAgentsRfpDemoJobOwner,
	isAgentsRfpDemoJobMetadata,
} = require("./agents-rfp-demo-job-owner");

function createEnoentError(message = "missing") {
	const error = new Error(message);
	error.code = "ENOENT";
	return error;
}

function createThreadRecord(id = "thread-1") {
	return {
		id,
		activeDocumentId: null,
		messages: [],
		modelId: null,
		provider: null,
		realtimeMessages: [],
		title: `Thread ${id}`,
		updatedAt: "2026-06-03T15:00:00.000Z",
		visibility: "private",
	};
}

function createHarness({
	advanceRfpDraftingAgentProcessing,
	collectRovoAppUploadIdsFromMessages,
	deleteHermesJob,
	generateWorkItemVpkHtmlReport,
	listMergedJobs = [],
	links = [],
	mergedJobs = [],
	runRfpDraftingAgent,
	state = { agent: null },
	threads = [],
} = {}) {
	const calls = [];
	let currentState = state;
	const linkRecords = new Map(links);
	const mergedJobRecords = new Map(mergedJobs);
	const threadRecords = new Map(threads);

	const owner = createAgentsRfpDemoJobOwner({
		advanceRfpDraftingAgentProcessing: advanceRfpDraftingAgentProcessing ?? (async (current) => ({
			changed: false,
			state: current,
			threadRecords: [],
		})),
		agentsRfpDemoStateManager: {
			readState: async () => {
				calls.push(["readState"]);
				return currentState;
			},
			writeState: async (nextState) => {
				calls.push(["writeState", nextState]);
				currentState = nextState;
				return nextState;
			},
		},
		collectRovoAppUploadIdsFromMessages: collectRovoAppUploadIdsFromMessages ?? ((messages) => {
			calls.push(["collectUploads", messages]);
			return [];
		}),
		deleteRovoAppThreadBrowserWorkspace: async (threadId) => {
			calls.push(["deleteWorkspace", threadId]);
		},
		destroyMirrorBrowser: async (mirrorId) => {
			calls.push(["destroyMirror", mirrorId]);
		},
		generateWorkItemVpkHtmlReport: generateWorkItemVpkHtmlReport ?? (async (input) => {
			calls.push(["generateHtmlReport", input]);
			return { html: "<main>Report</main>", skill: "vpk-html" };
		}),
		getMergedHermesJob: async (jobId) => {
			calls.push(["getMergedHermesJob", jobId]);
			const record = mergedJobRecords.get(jobId);
			if (record instanceof Error) {
				throw record;
			}
			if (!record) {
				throw createEnoentError();
			}
			return record;
		},
		hermesJobLinkManager: {
			getLink: async (jobId) => {
				calls.push(["getLink", jobId]);
				return linkRecords.get(jobId) ?? null;
			},
			removeLink: async (jobId) => {
				calls.push(["removeLink", jobId]);
				linkRecords.delete(jobId);
			},
		},
		hermesJobsProvider: {
			createHermesJob: async (input) => {
				calls.push(["createHermesJob", input]);
				const job = { id: "job-created", ...input };
				mergedJobRecords.set(job.id, job);
				return job;
			},
			deleteHermesJob: deleteHermesJob ?? (async (jobId) => {
				calls.push(["deleteHermesJob", jobId]);
			}),
			runHermesJob: async (jobId, source, context) => {
				calls.push(["runHermesJob", jobId, source, context]);
			},
		},
		listMergedHermesJobs: async () => {
			calls.push(["listMergedHermesJobs"]);
			return listMergedJobs;
		},
		persistHermesJobLink: async (jobId, rawInput, metadata = {}, options = {}) => {
			calls.push(["persistHermesJobLink", jobId, rawInput, metadata, options]);
			const nextLink = {
				...(options.mergeExisting ? linkRecords.get(jobId) ?? {} : {}),
				...(rawInput ?? {}),
				...(metadata ?? {}),
			};
			linkRecords.set(jobId, nextLink);
			return nextLink;
		},
		rovoAppDocumentManager: {
			deleteDocumentsByThread: async (threadId) => {
				calls.push(["deleteDocuments", threadId]);
			},
		},
		rovoAppGeneratedFilesManager: {
			backfillFromThread: async (thread) => {
				calls.push(["backfillFromThread", thread.id]);
			},
			deleteLegacyRootFiles: async (threadId) => {
				calls.push(["deleteLegacyRootFiles", threadId]);
			},
		},
		rovoAppThreadManager: {
			createThread: async (thread) => {
				calls.push(["createThread", thread.id]);
				threadRecords.set(thread.id, thread);
				return thread;
			},
			deleteThread: async (threadId) => {
				calls.push(["deleteThread", threadId]);
				threadRecords.delete(threadId);
			},
			getThread: async (threadId) => {
				calls.push(["getThread", threadId]);
				return threadRecords.get(threadId) ?? null;
			},
			updateThread: async (threadId, patch) => {
				calls.push(["updateThread", threadId, patch]);
				const nextThread = { ...(threadRecords.get(threadId) ?? {}), ...patch, id: threadId };
				threadRecords.set(threadId, nextThread);
				return nextThread;
			},
		},
		rovoAppUploadManager: {
			deleteUpload: async (uploadId) => {
				calls.push(["deleteUpload", uploadId]);
			},
		},
		rovoAppVoteManager: {
			deleteVotesForThread: async (threadId) => {
				calls.push(["deleteVotes", threadId]);
			},
		},
		runRfpDraftingAgent: runRfpDraftingAgent ?? ((current, input) => {
			calls.push(["runRfpDraftingAgent", current, input]);
			return {
				runSummary: { id: "run-1", summary: "processed one ticket." },
				state: current,
				threadRecords: [],
			};
		}),
	});

	return {
		calls,
		get state() {
			return currentState;
		},
		linkRecords,
		owner,
		threadRecords,
	};
}

test("RFP demo job metadata matches only the configured surface and trigger", () => {
	const metadata = buildAgentsRfpDemoJobLinkMetadata({
		runHistory: [{ id: "run-1" }],
	});

	assert.equal(isAgentsRfpDemoJobMetadata(metadata), true);
	assert.equal(metadata.postResultToThread, false);
	assert.equal(metadata.threadStrategy, "new-per-run");
	assert.deepEqual(metadata.runHistory, [{ id: "run-1" }]);
	assert.equal(isAgentsRfpDemoJobMetadata({
		...metadata,
		trigger: { ...metadata.trigger, column: "Review" },
	}), false);
	assert.equal(isAgentsRfpDemoJobMetadata({
		...metadata,
		surface: "studio",
	}), false);
});

test("ensureAgentsRfpDemoHermesJob prefers the valid state job", async () => {
	const metadata = buildAgentsRfpDemoJobLinkMetadata();
	const { calls, owner } = createHarness({
		mergedJobs: [["job-state", { id: "job-state", ...metadata }]],
		state: { agent: { jobId: " job-state " } },
	});

	assert.deepEqual(await owner.ensureAgentsRfpDemoHermesJob(), { id: "job-state", ...metadata });
	assert.deepEqual(calls.map((call) => call[0]), ["readState", "getMergedHermesJob"]);
});

test("ensureAgentsRfpDemoHermesJob reuses existing demo jobs and creates one when absent", async () => {
	const metadata = buildAgentsRfpDemoJobLinkMetadata({ runHistory: [{ id: "run-existing" }] });
	const reusableHarness = createHarness({
		listMergedJobs: [{ id: "job-existing", ...metadata }],
		mergedJobs: [
			["job-state", createEnoentError()],
			["job-existing", { id: "job-existing", ...metadata, reused: true }],
		],
		state: { agent: { jobId: "job-state" } },
	});

	assert.deepEqual(await reusableHarness.owner.ensureAgentsRfpDemoHermesJob(), {
		id: "job-existing",
		...metadata,
		reused: true,
	});
	assert.equal(reusableHarness.calls.some((call) => (
		call[0] === "persistHermesJobLink" &&
		call[1] === "job-existing" &&
		call[2].runHistory?.[0]?.id === "run-existing" &&
		call[4].mergeExisting === true
	)), true);

	const createdHarness = createHarness({
		listMergedJobs: [],
		state: { agent: null },
	});
	const createdJob = await createdHarness.owner.ensureAgentsRfpDemoHermesJob();

	assert.equal(createdJob.id, "job-created");
	assert.equal(createdJob.name, "RFP Drafter - Enterprise RFP Response");
	assert.equal(createdJob.surface, "agents-rfp-demo");
	assert.deepEqual(
		createdHarness.calls.find((call) => call[0] === "createHermesJob")?.[1].skills,
		["vpk-html"],
	);
});

test("advanceAgentsRfpDemoProcessing persists changed state, threads, and job run history", async () => {
	const resultState = {
		agent: {
			jobId: "job-1",
			jobRunSummaries: [{ id: "run-next" }],
		},
	};
	const harness = createHarness({
		advanceRfpDraftingAgentProcessing: async (currentState, { createHtmlReport }) => {
			const report = await createHtmlReport({
				contextDescription: "RFP context",
				fields: { key: "RFP-1" },
			});
			harness.calls.push(["createdReport", report]);
			return {
				changed: true,
				state: resultState,
				threadRecords: [createThreadRecord("thread-new")],
			};
		},
		links: [["job-1", buildAgentsRfpDemoJobLinkMetadata({ runHistory: [{ id: "run-old" }] })]],
		state: { agent: { jobId: "job-1" } },
	});

	assert.deepEqual(await harness.owner.advanceAgentsRfpDemoProcessing(), resultState);
	assert.equal(harness.threadRecords.has("thread-new"), true);
	assert.deepEqual(harness.calls.find((call) => call[0] === "createdReport")?.[1], {
		html: "<main>Report</main>",
		skill: "vpk-html",
	});
	const persistedLink = harness.calls.findLast((call) => call[0] === "persistHermesJobLink");
	assert.equal(persistedLink[1], "job-1");
	assert.deepEqual(persistedLink[2].runHistory, [{ id: "run-next" }]);
	assert.deepEqual(persistedLink[4], { mergeExisting: true });
});

test("executeAgentsRfpDemoHermesJob ignores non-demo links and persists demo run results", async () => {
	const threadRecord = createThreadRecord("thread-run");
	const harness = createHarness({
		links: [["job-1", { surface: "jobs" }]],
		runRfpDraftingAgent: (currentState, input) => {
			harness.calls.push(["runRfpDraftingAgent", currentState, input]);
			return {
				runSummary: { id: "run-next", summary: "processed RFP-1." },
				state: { agent: { jobId: "job-1" } },
				threadRecords: [threadRecord],
			};
		},
		state: { agent: { jobId: "job-1" } },
	});

	assert.equal(await harness.owner.executeAgentsRfpDemoHermesJob({
		context: { ticketCodes: ["RFP-1"] },
		job: { id: "job-1" },
		source: "manual",
	}), null);
	assert.equal(harness.calls.some((call) => call[0] === "runRfpDraftingAgent"), false);

	harness.linkRecords.set("job-1", buildAgentsRfpDemoJobLinkMetadata({
		runHistory: [{ id: "run-old" }, { id: "run-next" }],
	}));
	const result = await harness.owner.executeAgentsRfpDemoHermesJob({
		context: { runId: " run-explicit ", ticketCodes: ["RFP-1", "", 42] },
		job: { id: "job-1" },
		source: " jira-column-entered ",
	});

	assert.deepEqual(result, {
		ok: true,
		text: "RFP Drafter processed RFP-1.",
	});
	assert.deepEqual(harness.calls.find((call) => call[0] === "runRfpDraftingAgent")?.[2], {
		jobId: "job-1",
		runId: "run-explicit",
		source: "jira-column-entered",
		ticketCodes: ["RFP-1"],
	});
	const persistedLink = harness.linkRecords.get("job-1");
	assert.deepEqual(persistedLink.runHistory.map((run) => run.id), ["run-next", "run-old"]);
	assert.deepEqual(harness.state, { agent: { jobId: "job-1" } });
	assert.equal(harness.threadRecords.has("thread-run"), true);
});

test("deleteAgentsRfpDemoThread cleans existing thread resources before deleting the thread", async () => {
	const thread = {
		id: "thread-1",
		messages: [{ id: "message-1" }],
	};
	const harness = createHarness({
		collectRovoAppUploadIdsFromMessages: (messages) => {
			harness.calls.push(["collectUploads", messages]);
			return ["upload-1", "upload-2"];
		},
		threads: [["thread-1", thread]],
	});

	await harness.owner.deleteAgentsRfpDemoThread("thread-1");

	assert.deepEqual(harness.calls.map((call) => call[0]), [
		"getThread",
		"collectUploads",
		"backfillFromThread",
		"deleteLegacyRootFiles",
		"deleteWorkspace",
		"destroyMirror",
		"deleteUpload",
		"deleteUpload",
		"deleteVotes",
		"deleteDocuments",
		"deleteThread",
	]);
	assert.deepEqual(harness.calls.find((call) => call[0] === "destroyMirror"), [
		"destroyMirror",
		"mirror-thread-1",
	]);
	assert.equal(harness.threadRecords.has("thread-1"), false);
});

test("deleteAgentsRfpDemoThread skips browser cleanup for missing threads", async () => {
	const harness = createHarness();

	await harness.owner.deleteAgentsRfpDemoThread("missing-thread");

	assert.equal(harness.calls.some((call) => call[0] === "deleteWorkspace"), false);
	assert.equal(harness.calls.some((call) => call[0] === "destroyMirror"), false);
	assert.deepEqual(harness.calls.slice(-3), [
		["deleteVotes", "missing-thread"],
		["deleteDocuments", "missing-thread"],
		["deleteThread", "missing-thread"],
	]);
});

test("deleteAgentsRfpDemoHermesJobs removes state and demo jobs with ENOENT tolerance", async () => {
	const deleteOrder = [];
	const harness = createHarness({
		deleteHermesJob: async (jobId) => {
			harness.calls.push(["deleteHermesJob", jobId]);
			deleteOrder.push(["delete", jobId]);
			if (jobId === "job-state") {
				throw createEnoentError();
			}
		},
		listMergedJobs: [
			{ id: "job-demo", ...buildAgentsRfpDemoJobLinkMetadata() },
			{ id: "job-other", surface: "jobs" },
		],
	});

	await harness.owner.deleteAgentsRfpDemoHermesJobs({
		agent: { jobId: "job-state" },
	});

	assert.deepEqual(harness.calls.filter((call) => call[0] === "deleteHermesJob").map((call) => call[1]).sort(), [
		"job-demo",
		"job-state",
	]);
	assert.deepEqual(harness.calls.filter((call) => call[0] === "removeLink").map((call) => call[1]).sort(), [
		"job-demo",
		"job-state",
	]);
	for (const jobId of ["job-state", "job-demo"]) {
		const deleteIndex = harness.calls.findIndex((call) => call[0] === "deleteHermesJob" && call[1] === jobId);
		const removeIndex = harness.calls.findIndex((call) => call[0] === "removeLink" && call[1] === jobId);
		assert.equal(deleteIndex < removeIndex, true, `${jobId} removes its link after delete`);
	}
	assert.deepEqual(deleteOrder, [
		["delete", "job-state"],
		["delete", "job-demo"],
	]);
});
