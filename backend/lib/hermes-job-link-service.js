"use strict";

const {
	getNonEmptyString,
} = require("./shared-utils");

function extractHermesJobLinkMetadata(rawInput) {
	if (!rawInput || typeof rawInput !== "object") {
		return null;
	}

	const linkedThreadId = getNonEmptyString(rawInput.linkedThreadId);
	return {
		artifactTarget: getNonEmptyString(rawInput.artifactTarget),
		lastPostedRunMarker: getNonEmptyString(rawInput.lastPostedRunMarker),
		linkedThreadId,
		postResultToThread: rawInput.postResultToThread === true,
		runHistory: Array.isArray(rawInput.runHistory)
			? rawInput.runHistory
			: [],
		surface: getNonEmptyString(rawInput.surface),
		threadStrategy:
			rawInput.threadStrategy === "fixed" || rawInput.threadStrategy === "new-per-run"
				? rawInput.threadStrategy
				: linkedThreadId
					? "fixed"
					: "new-per-run",
		trigger:
			rawInput.trigger && typeof rawInput.trigger === "object"
				? rawInput.trigger
				: null,
		triggerLabel: getNonEmptyString(rawInput.triggerLabel),
	};
}

function buildHermesJobLinkMetadata(rawInput, overrides = {}) {
	return extractHermesJobLinkMetadata({
		...(rawInput && typeof rawInput === "object" ? rawInput : {}),
		...(overrides && typeof overrides === "object" ? overrides : {}),
	});
}

function createHermesJobLinkService({
	hermesJobLinkManager,
	hermesJobsProvider,
	logger = console,
	rovoAppThreadManager,
	syncHermesJobResultsToRovoThreads,
} = {}) {
	async function persistHermesJobLink(jobId, rawInput, overrides = {}, { mergeExisting = false } = {}) {
		const baseMetadata = mergeExisting
			? (await hermesJobLinkManager.getLink(jobId)) ?? {}
			: {};
		const linkMetadata = buildHermesJobLinkMetadata({
			...baseMetadata,
			...(rawInput && typeof rawInput === "object" ? rawInput : {}),
		}, overrides);
		await hermesJobLinkManager.setLink(jobId, linkMetadata);
		return linkMetadata;
	}

	async function listMergedHermesJobs(searchParams) {
		const jobs = await hermesJobsProvider.listHermesJobs(searchParams);
		return hermesJobLinkManager.mergeJobsWithLinks(jobs);
	}

	async function getMergedHermesJob(jobId) {
		const [job, link] = await Promise.all([
			hermesJobsProvider.getHermesJob(jobId),
			hermesJobLinkManager.getLink(jobId),
		]);
		return {
			...job,
			...(link ?? {}),
		};
	}

	async function syncHermesJobsForRovoThreads(threadId = null) {
		try {
			const jobs = await listMergedHermesJobs();
			await syncHermesJobResultsToRovoThreads({
				jobs,
				onJobPosted: async (job, metadata) => {
					await persistHermesJobLink(job.id, job, metadata, { mergeExisting: true });
				},
				rovoAppThreadManager,
				threadId,
			});
		} catch (error) {
			logger.warn("[HERMES-JOBS] Failed to sync Hermes job results into Rovo threads:", error instanceof Error ? error.message : String(error));
		}
	}

	return {
		getMergedHermesJob,
		listMergedHermesJobs,
		persistHermesJobLink,
		syncHermesJobsForRovoThreads,
	};
}

module.exports = {
	buildHermesJobLinkMetadata,
	createHermesJobLinkService,
	extractHermesJobLinkMetadata,
};
