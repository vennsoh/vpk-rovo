"use strict";

const {
	AGENTS_RFP_DEMO_JOB_NAME,
	AGENTS_RFP_DEMO_JOB_PROMPT,
	AGENTS_RFP_DEMO_SURFACE,
	RFP_DRAFTING_AGENT_NAME,
	RFP_DRAFTING_EVENT_TRIGGER,
	RFP_DRAFTING_EVENT_TRIGGER_LABEL,
	advanceRfpDraftingAgentProcessing: defaultAdvanceRfpDraftingAgentProcessing,
	runRfpDraftingAgent: defaultRunRfpDraftingAgent,
} = require("./agents-rfp-demo-state");
const {
	collectRovoAppUploadIdsFromMessages: defaultCollectRovoAppUploadIdsFromMessages,
} = require("./rovo-app-upload-helpers");
const { getNonEmptyString } = require("./shared-utils");
const {
	generateWorkItemVpkHtmlReport: defaultGenerateWorkItemVpkHtmlReport,
} = require("./work-item-vpk-html-report-generator");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createAgentsRfpDemoJobOwner requires ${name}`);
	}
	return value;
}

function isAgentsRfpDemoJobMetadata(jobOrLink) {
	return (
		jobOrLink?.surface === AGENTS_RFP_DEMO_SURFACE &&
		jobOrLink?.trigger?.type === RFP_DRAFTING_EVENT_TRIGGER.type &&
		jobOrLink?.trigger?.board === RFP_DRAFTING_EVENT_TRIGGER.board &&
		jobOrLink?.trigger?.column === RFP_DRAFTING_EVENT_TRIGGER.column
	);
}

function buildAgentsRfpDemoJobLinkMetadata(overrides = {}) {
	return {
		postResultToThread: false,
		runHistory: [],
		surface: AGENTS_RFP_DEMO_SURFACE,
		threadStrategy: "new-per-run",
		trigger: RFP_DRAFTING_EVENT_TRIGGER,
		triggerLabel: RFP_DRAFTING_EVENT_TRIGGER_LABEL,
		...(overrides && typeof overrides === "object" ? overrides : {}),
	};
}

function createAgentsRfpDemoJobOwner({
	advanceRfpDraftingAgentProcessing = defaultAdvanceRfpDraftingAgentProcessing,
	agentsRfpDemoStateManager,
	collectRovoAppUploadIdsFromMessages = defaultCollectRovoAppUploadIdsFromMessages,
	deleteRovoAppThreadBrowserWorkspace,
	destroyMirrorBrowser,
	generateWorkItemVpkHtmlReport = defaultGenerateWorkItemVpkHtmlReport,
	getMergedHermesJob,
	hermesJobLinkManager,
	hermesJobsProvider,
	listMergedHermesJobs,
	persistHermesJobLink,
	rovoAppDocumentManager,
	rovoAppGeneratedFilesManager,
	rovoAppThreadManager,
	rovoAppUploadManager,
	rovoAppVoteManager,
	runRfpDraftingAgent = defaultRunRfpDraftingAgent,
} = {}) {
	requireFunction("advanceRfpDraftingAgentProcessing", advanceRfpDraftingAgentProcessing);
	requireFunction("agentsRfpDemoStateManager.readState", agentsRfpDemoStateManager?.readState);
	requireFunction("agentsRfpDemoStateManager.writeState", agentsRfpDemoStateManager?.writeState);
	requireFunction("collectRovoAppUploadIdsFromMessages", collectRovoAppUploadIdsFromMessages);
	requireFunction("deleteRovoAppThreadBrowserWorkspace", deleteRovoAppThreadBrowserWorkspace);
	requireFunction("destroyMirrorBrowser", destroyMirrorBrowser);
	requireFunction("generateWorkItemVpkHtmlReport", generateWorkItemVpkHtmlReport);
	requireFunction("getMergedHermesJob", getMergedHermesJob);
	requireFunction("hermesJobLinkManager.getLink", hermesJobLinkManager?.getLink);
	requireFunction("hermesJobLinkManager.removeLink", hermesJobLinkManager?.removeLink);
	requireFunction("hermesJobsProvider.createHermesJob", hermesJobsProvider?.createHermesJob);
	requireFunction("hermesJobsProvider.deleteHermesJob", hermesJobsProvider?.deleteHermesJob);
	requireFunction("hermesJobsProvider.runHermesJob", hermesJobsProvider?.runHermesJob);
	requireFunction("listMergedHermesJobs", listMergedHermesJobs);
	requireFunction("persistHermesJobLink", persistHermesJobLink);
	requireFunction("rovoAppDocumentManager.deleteDocumentsByThread", rovoAppDocumentManager?.deleteDocumentsByThread);
	requireFunction("rovoAppGeneratedFilesManager.backfillFromThread", rovoAppGeneratedFilesManager?.backfillFromThread);
	requireFunction("rovoAppGeneratedFilesManager.deleteLegacyRootFiles", rovoAppGeneratedFilesManager?.deleteLegacyRootFiles);
	requireFunction("rovoAppThreadManager.createThread", rovoAppThreadManager?.createThread);
	requireFunction("rovoAppThreadManager.deleteThread", rovoAppThreadManager?.deleteThread);
	requireFunction("rovoAppThreadManager.getThread", rovoAppThreadManager?.getThread);
	requireFunction("rovoAppThreadManager.updateThread", rovoAppThreadManager?.updateThread);
	requireFunction("rovoAppUploadManager.deleteUpload", rovoAppUploadManager?.deleteUpload);
	requireFunction("rovoAppVoteManager.deleteVotesForThread", rovoAppVoteManager?.deleteVotesForThread);
	requireFunction("runRfpDraftingAgent", runRfpDraftingAgent);

	async function ensureAgentsRfpDemoHermesJob() {
		const currentState = await agentsRfpDemoStateManager.readState();
		const stateJobId = getNonEmptyString(currentState.agent?.jobId);
		if (stateJobId) {
			try {
				const job = await getMergedHermesJob(stateJobId);
				if (isAgentsRfpDemoJobMetadata(job)) {
					return job;
				}
			} catch (error) {
				if (error?.code !== "ENOENT") {
					throw error;
				}
			}
		}

		const jobs = await listMergedHermesJobs();
		const existingJob = jobs.find(isAgentsRfpDemoJobMetadata);
		if (existingJob) {
			await persistHermesJobLink(
				existingJob.id,
				buildAgentsRfpDemoJobLinkMetadata({
					runHistory: existingJob.runHistory,
				}),
				{},
				{ mergeExisting: true },
			);
			return getMergedHermesJob(existingJob.id);
		}

		const job = await hermesJobsProvider.createHermesJob({
			deliver: "local",
			name: AGENTS_RFP_DEMO_JOB_NAME,
			prompt: AGENTS_RFP_DEMO_JOB_PROMPT,
			schedule: "manual",
			skills: ["vpk-html"],
		});
		const linkMetadata = await persistHermesJobLink(
			job.id,
			buildAgentsRfpDemoJobLinkMetadata(),
		);
		return {
			...job,
			...(linkMetadata ?? {}),
		};
	}

	async function upsertAgentsRfpDemoThread(threadRecord) {
		const existingThread = await rovoAppThreadManager.getThread(threadRecord.id);
		if (existingThread) {
			return rovoAppThreadManager.updateThread(threadRecord.id, {
				activeDocumentId: threadRecord.activeDocumentId ?? null,
				messages: threadRecord.messages,
				modelId: threadRecord.modelId ?? null,
				provider: threadRecord.provider ?? null,
				realtimeMessages: threadRecord.realtimeMessages ?? [],
				title: threadRecord.title,
				updatedAt: threadRecord.updatedAt,
				visibility: threadRecord.visibility ?? "private",
			});
		}

		return rovoAppThreadManager.createThread(threadRecord);
	}

	async function persistAgentsRfpDemoRunResult({ jobId, result }) {
		await Promise.all(result.threadRecords.map(upsertAgentsRfpDemoThread));
		const currentLink = await hermesJobLinkManager.getLink(jobId);
		await persistHermesJobLink(
			jobId,
			buildAgentsRfpDemoJobLinkMetadata({
				...(currentLink ?? {}),
				runHistory: [
					result.runSummary,
					...((currentLink?.runHistory ?? []).filter((run) => run?.id !== result.runSummary.id)),
				].slice(0, 10),
			}),
			{},
			{ mergeExisting: true },
		);
		await agentsRfpDemoStateManager.writeState(result.state);
	}

	async function advanceAgentsRfpDemoProcessing() {
		const currentState = await agentsRfpDemoStateManager.readState();
		const result = await advanceRfpDraftingAgentProcessing(currentState, {
			createHtmlReport: async ({ contextDescription, fields }) => {
				const report = await generateWorkItemVpkHtmlReport({
					contextDescription,
					generateText: async () => JSON.stringify(fields),
					runSkillValidation: false,
					runVisualVerify: false,
				});
				return { html: report.html, skill: report.skill };
			},
		});
		if (!result.changed) {
			return currentState;
		}

		await Promise.all(result.threadRecords.map(upsertAgentsRfpDemoThread));
		const nextState = await agentsRfpDemoStateManager.writeState(result.state);
		const jobId = getNonEmptyString(nextState.agent?.jobId);
		if (jobId) {
			const currentLink = await hermesJobLinkManager.getLink(jobId);
			await persistHermesJobLink(
				jobId,
				buildAgentsRfpDemoJobLinkMetadata({
					...(currentLink ?? {}),
					runHistory: nextState.agent?.jobRunSummaries ?? currentLink?.runHistory ?? [],
				}),
				{},
				{ mergeExisting: true },
			);
		}
		return nextState;
	}

	async function executeAgentsRfpDemoHermesJob({ context, job, source }) {
		const link = await hermesJobLinkManager.getLink(job.id);
		if (!isAgentsRfpDemoJobMetadata(link)) {
			return null;
		}

		const currentState = await agentsRfpDemoStateManager.readState();
		const ticketCodes = Array.isArray(context?.ticketCodes)
			? context.ticketCodes.filter((ticketCode) => typeof ticketCode === "string" && ticketCode.trim())
			: undefined;
		const result = runRfpDraftingAgent(currentState, {
			jobId: job.id,
			runId: getNonEmptyString(context?.runId) ?? undefined,
			source: getNonEmptyString(source) ?? "manual",
			ticketCodes,
		});
		await persistAgentsRfpDemoRunResult({ jobId: job.id, result });

		return {
			ok: true,
			text: `${RFP_DRAFTING_AGENT_NAME} ${result.runSummary.summary}`,
		};
	}

	async function runAgentsRfpDemoJob({ source = "manual", ticketCodes } = {}) {
		const job = await ensureAgentsRfpDemoHermesJob();
		await hermesJobsProvider.runHermesJob(job.id, source, {
			ticketCodes: Array.isArray(ticketCodes) ? ticketCodes : undefined,
		});
		const [state, mergedJob] = await Promise.all([
			agentsRfpDemoStateManager.readState(),
			getMergedHermesJob(job.id),
		]);
		return { job: mergedJob, state };
	}

	async function deleteAgentsRfpDemoThread(threadId) {
		const thread = await rovoAppThreadManager.getThread(threadId);
		const uploadIds = collectRovoAppUploadIdsFromMessages(thread?.messages);
		if (thread) {
			await rovoAppGeneratedFilesManager.backfillFromThread(thread);
			await rovoAppGeneratedFilesManager.deleteLegacyRootFiles(threadId);
			await deleteRovoAppThreadBrowserWorkspace(threadId).catch(() => ({}));
			await destroyMirrorBrowser(`mirror-${threadId}`);
		}
		await Promise.all(
			uploadIds.map((uploadId) =>
				rovoAppUploadManager.deleteUpload(uploadId).catch(() => {})
			),
		);
		await rovoAppVoteManager.deleteVotesForThread(threadId);
		await rovoAppDocumentManager.deleteDocumentsByThread(threadId);
		await rovoAppThreadManager.deleteThread(threadId);
	}

	async function deleteAgentsRfpDemoHermesJobs(state) {
		const jobIds = new Set();
		const stateJobId = getNonEmptyString(state.agent?.jobId);
		if (stateJobId) {
			jobIds.add(stateJobId);
		}

		const jobs = await listMergedHermesJobs().catch(() => []);
		for (const job of jobs) {
			if (isAgentsRfpDemoJobMetadata(job)) {
				jobIds.add(job.id);
			}
		}

		// Jobs are independent, so clean them up in parallel. Each job keeps its
		// delete -> removeLink order, and the ENOENT-tolerant catch is preserved.
		await Promise.all(
			[...jobIds].map(async (jobId) => {
				await hermesJobsProvider.deleteHermesJob(jobId).catch((error) => {
					if (error?.code !== "ENOENT") {
						throw error;
					}
				});
				await hermesJobLinkManager.removeLink(jobId);
			}),
		);
	}

	return {
		advanceAgentsRfpDemoProcessing,
		deleteAgentsRfpDemoHermesJobs,
		deleteAgentsRfpDemoThread,
		ensureAgentsRfpDemoHermesJob,
		executeAgentsRfpDemoHermesJob,
		persistAgentsRfpDemoRunResult,
		runAgentsRfpDemoJob,
	};
}

module.exports = {
	buildAgentsRfpDemoJobLinkMetadata,
	createAgentsRfpDemoJobOwner,
	isAgentsRfpDemoJobMetadata,
};
