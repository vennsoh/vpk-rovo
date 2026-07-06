"use strict";

const express = require("express");

function toHermesJobInput(rawInput) {
	if (!rawInput || typeof rawInput !== "object") {
		return {};
	}

	const nextInput = {};
	const fields = ["name", "schedule", "prompt", "deliver", "skills", "repeat"];
	for (const field of fields) {
		if (field in rawInput) {
			nextInput[field] = rawInput[field];
		}
	}
	if (!("prompt" in nextInput) && "target" in rawInput) {
		nextInput.prompt = rawInput.target;
	}

	return nextInput;
}

function createJobsRouter({
	advanceAgentsRfpDemoProcessing,
	getMergedHermesJob,
	hermesJobLinkManager,
	hermesJobsProvider,
	listMergedHermesJobs,
	persistHermesJobLink,
	requireRuntimeAdmin,
	rovoAppThreadManager,
	sendHermesUnavailableResponse,
	syncHermesJobResultsToRovoThreads,
} = {}) {
	if (typeof advanceAgentsRfpDemoProcessing !== "function") {
		throw new Error("createJobsRouter requires advanceAgentsRfpDemoProcessing");
	}
	if (typeof getMergedHermesJob !== "function") {
		throw new Error("createJobsRouter requires getMergedHermesJob");
	}
	if (!hermesJobLinkManager || typeof hermesJobLinkManager.removeLink !== "function") {
		throw new Error("createJobsRouter requires hermesJobLinkManager");
	}
	if (!hermesJobsProvider || typeof hermesJobsProvider !== "object") {
		throw new Error("createJobsRouter requires hermesJobsProvider");
	}
	if (typeof listMergedHermesJobs !== "function") {
		throw new Error("createJobsRouter requires listMergedHermesJobs");
	}
	if (typeof persistHermesJobLink !== "function") {
		throw new Error("createJobsRouter requires persistHermesJobLink");
	}
	if (typeof requireRuntimeAdmin !== "function") {
		throw new Error("createJobsRouter requires requireRuntimeAdmin");
	}
	if (typeof sendHermesUnavailableResponse !== "function") {
		throw new Error("createJobsRouter requires sendHermesUnavailableResponse");
	}
	if (typeof syncHermesJobResultsToRovoThreads !== "function") {
		throw new Error("createJobsRouter requires syncHermesJobResultsToRovoThreads");
	}

	const router = express.Router();

	router.get("/", async (req, res) => {
		try {
			await advanceAgentsRfpDemoProcessing();
			const jobs = await listMergedHermesJobs(req.query);
			await syncHermesJobResultsToRovoThreads({
				jobs,
				onJobPosted: async (job, metadata) => {
					await persistHermesJobLink(job.id, job, metadata, { mergeExisting: true });
				},
				rovoAppThreadManager,
			});
			return res.json({ jobs });
		} catch (error) {
			return sendHermesUnavailableResponse(res, error, "Failed to list Hermes jobs");
		}
	});

	router.post("/", requireRuntimeAdmin, async (req, res) => {
		try {
			const job = await hermesJobsProvider.createHermesJob(toHermesJobInput(req.body));
			const linkMetadata = await persistHermesJobLink(job.id, req.body);
			return res.status(201).json({
				job: {
					...job,
					...(linkMetadata ?? {}),
				},
			});
		} catch (error) {
			return sendHermesUnavailableResponse(res, error, "Failed to create Hermes job");
		}
	});

	router.get("/:id", async (req, res) => {
		try {
			await advanceAgentsRfpDemoProcessing();
			const job = await getMergedHermesJob(req.params.id);
			return res.json({ job });
		} catch (error) {
			return sendHermesUnavailableResponse(res, error, "Failed to load Hermes job");
		}
	});

	router.patch("/:id", requireRuntimeAdmin, async (req, res) => {
		try {
			const hermesJobInput = toHermesJobInput(req.body);
			const job = Object.keys(hermesJobInput).length > 0
				? await hermesJobsProvider.updateHermesJob(req.params.id, hermesJobInput)
				: await hermesJobsProvider.getHermesJob(req.params.id);
			const linkMetadata = await persistHermesJobLink(req.params.id, req.body, {}, { mergeExisting: true });
			return res.json({
				job: {
					...job,
					...(linkMetadata ?? {}),
				},
			});
		} catch (error) {
			return sendHermesUnavailableResponse(res, error, "Failed to update Hermes job");
		}
	});

	router.delete("/:id", requireRuntimeAdmin, async (req, res) => {
		try {
			await hermesJobsProvider.deleteHermesJob(req.params.id);
			await hermesJobLinkManager.removeLink(req.params.id);
			return res.status(204).end();
		} catch (error) {
			return sendHermesUnavailableResponse(res, error, "Failed to delete Hermes job");
		}
	});

	router.post("/:id/run", requireRuntimeAdmin, async (req, res) => {
		try {
			await hermesJobsProvider.performHermesJobAction(req.params.id, "run");
			const job = await getMergedHermesJob(req.params.id);
			return res.json({ job });
		} catch (error) {
			return sendHermesUnavailableResponse(res, error, "Failed to run Hermes job");
		}
	});

	router.post("/:id/pause", requireRuntimeAdmin, async (req, res) => {
		try {
			await hermesJobsProvider.performHermesJobAction(req.params.id, "pause");
			const job = await getMergedHermesJob(req.params.id);
			return res.json({ job });
		} catch (error) {
			return sendHermesUnavailableResponse(res, error, "Failed to pause Hermes job");
		}
	});

	router.post("/:id/resume", requireRuntimeAdmin, async (req, res) => {
		try {
			await hermesJobsProvider.performHermesJobAction(req.params.id, "resume");
			const job = await getMergedHermesJob(req.params.id);
			return res.json({ job });
		} catch (error) {
			return sendHermesUnavailableResponse(res, error, "Failed to resume Hermes job");
		}
	});

	return router;
}

function registerJobsRoutes(app, dependencies) {
	app.use("/api/jobs", createJobsRouter(dependencies));
}

module.exports = {
	createJobsRouter,
	registerJobsRoutes,
	toHermesJobInput,
};
