"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

const {
	registerJobsRoutes,
	toHermesJobInput,
} = require("./jobs");

async function withServer(run, overrides = {}) {
	const app = express();
	app.use(express.json());

	const calls = {
		actions: [],
		advance: 0,
		create: [],
		delete: [],
		getMerged: [],
		list: [],
		persist: [],
		removeLink: [],
		sync: [],
		update: [],
	};
	const rovoAppThreadManager = { name: "thread-manager" };

	registerJobsRoutes(app, {
		advanceAgentsRfpDemoProcessing: async () => {
			calls.advance += 1;
		},
		getMergedHermesJob: async (jobId) => {
			calls.getMerged.push(jobId);
			return { id: jobId, linkedThreadId: "thread-merged" };
		},
		hermesJobLinkManager: {
			removeLink: async (jobId) => {
				calls.removeLink.push(jobId);
			},
		},
		hermesJobsProvider: {
			createHermesJob: async (input) => {
				calls.create.push(input);
				return { id: "job-created", prompt: input.prompt, state: "created" };
			},
			deleteHermesJob: async (jobId) => {
				calls.delete.push(jobId);
			},
			getHermesJob: async (jobId) => ({ id: jobId, state: "existing" }),
			performHermesJobAction: async (jobId, action) => {
				calls.actions.push({ action, jobId });
			},
			updateHermesJob: async (jobId, input) => {
				calls.update.push({ input, jobId });
				return { id: jobId, ...input };
			},
		},
		listMergedHermesJobs: async (query) => {
			calls.list.push(Object.fromEntries(Object.entries(query)));
			return [{ id: "job-1", state: "running" }];
		},
		persistHermesJobLink: async (jobId, rawInput, metadata = {}, options = {}) => {
			calls.persist.push({ jobId, metadata, options, rawInput });
			return { linkedThreadId: rawInput?.linkedThreadId ?? metadata.threadId ?? "thread-created" };
		},
		requireRuntimeAdmin: (req, res, next) => {
			if (req.headers["x-runtime-admin"] !== "allowed") {
				return res.status(403).json({ error: "runtime admin required" });
			}
			return next();
		},
		rovoAppThreadManager,
		sendHermesUnavailableResponse: (res, error, message) => {
			return res.status(503).json({
				error: message,
				details: error instanceof Error ? error.message : String(error),
			});
		},
		syncHermesJobResultsToRovoThreads: async ({ jobs, onJobPosted, rovoAppThreadManager: manager }) => {
			calls.sync.push({ jobs, rovoAppThreadManager: manager });
			await onJobPosted({ id: "job-1", state: "running" }, { threadId: "thread-1" });
		},
		...overrides,
	});

	const server = http.createServer(app);
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	const baseUrl = `http://127.0.0.1:${address.port}`;

	try {
		await run(baseUrl, calls, { rovoAppThreadManager });
	} finally {
		await new Promise((resolve, reject) => {
			server.close((error) => {
				if (error) {
					reject(error);
					return;
				}
				resolve();
			});
		});
	}
}

test("toHermesJobInput preserves the existing allowed fields and target fallback", () => {
	assert.deepEqual(toHermesJobInput(null), {});
	assert.deepEqual(toHermesJobInput({
		deliver: "report",
		ignored: true,
		name: "Daily summary",
		repeat: "daily",
		schedule: "0 9 * * *",
		skills: ["writer"],
		target: "Fallback prompt",
	}), {
		deliver: "report",
		name: "Daily summary",
		prompt: "Fallback prompt",
		repeat: "daily",
		schedule: "0 9 * * *",
		skills: ["writer"],
	});
	assert.deepEqual(toHermesJobInput({
		prompt: "Explicit prompt",
		target: "Fallback prompt",
	}), {
		prompt: "Explicit prompt",
	});
});

test("jobs router lists merged jobs, advances demo processing, and syncs Rovo threads", async () => {
	await withServer(async (baseUrl, calls, { rovoAppThreadManager }) => {
		const response = await fetch(`${baseUrl}/api/jobs?status=running&limit=2`);
		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), {
			jobs: [{ id: "job-1", state: "running" }],
		});
		assert.equal(calls.advance, 1);
		assert.deepEqual(calls.list, [{ limit: "2", status: "running" }]);
		assert.deepEqual(calls.sync, [{
			jobs: [{ id: "job-1", state: "running" }],
			rovoAppThreadManager,
		}]);
		assert.deepEqual(calls.persist, [{
			jobId: "job-1",
			metadata: { threadId: "thread-1" },
			options: { mergeExisting: true },
			rawInput: { id: "job-1", state: "running" },
		}]);
	});
});

test("jobs router keeps runtime-admin protection on mutating routes", async () => {
	await withServer(async (baseUrl) => {
		for (const [method, path] of [
			["POST", "/api/jobs"],
			["PATCH", "/api/jobs/job-1"],
			["DELETE", "/api/jobs/job-1"],
			["POST", "/api/jobs/job-1/run"],
			["POST", "/api/jobs/job-1/pause"],
			["POST", "/api/jobs/job-1/resume"],
		]) {
			const response = await fetch(`${baseUrl}${path}`, {
				headers: method === "DELETE" ? undefined : { "content-type": "application/json" },
				method,
				body: method === "DELETE" ? undefined : "{}",
			});
			assert.equal(response.status, 403, `${method} ${path}`);
		}
	});
});

test("jobs router creates jobs and returns merged link metadata", async () => {
	await withServer(async (baseUrl, calls) => {
		const response = await fetch(`${baseUrl}/api/jobs`, {
			body: JSON.stringify({
				ignored: true,
				linkedThreadId: "thread-new",
				name: "Demo job",
				target: "Draft a plan",
			}),
			headers: {
				"content-type": "application/json",
				"x-runtime-admin": "allowed",
			},
			method: "POST",
		});
		assert.equal(response.status, 201);
		assert.deepEqual(await response.json(), {
			job: {
				id: "job-created",
				linkedThreadId: "thread-new",
				prompt: "Draft a plan",
				state: "created",
			},
		});
		assert.deepEqual(calls.create, [{
			name: "Demo job",
			prompt: "Draft a plan",
		}]);
		assert.equal(calls.persist[0].jobId, "job-created");
		assert.equal(calls.persist[0].rawInput.linkedThreadId, "thread-new");
	});
});

test("jobs router updates link metadata without forcing a Hermes update for link-only payloads", async () => {
	await withServer(async (baseUrl, calls) => {
		const response = await fetch(`${baseUrl}/api/jobs/job-1`, {
			body: JSON.stringify({ linkedThreadId: "thread-only" }),
			headers: {
				"content-type": "application/json",
				"x-runtime-admin": "allowed",
			},
			method: "PATCH",
		});
		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), {
			job: {
				id: "job-1",
				linkedThreadId: "thread-only",
				state: "existing",
			},
		});
		assert.deepEqual(calls.update, []);
		assert.deepEqual(calls.persist, [{
			jobId: "job-1",
			metadata: {},
			options: { mergeExisting: true },
			rawInput: { linkedThreadId: "thread-only" },
		}]);
	});
});

test("jobs router actions return merged job metadata", async () => {
	await withServer(async (baseUrl, calls) => {
		const response = await fetch(`${baseUrl}/api/jobs/job-1/run`, {
			body: "{}",
			headers: {
				"content-type": "application/json",
				"x-runtime-admin": "allowed",
			},
			method: "POST",
		});
		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), {
			job: { id: "job-1", linkedThreadId: "thread-merged" },
		});
		assert.deepEqual(calls.actions, [{ action: "run", jobId: "job-1" }]);
		assert.deepEqual(calls.getMerged, ["job-1"]);
	});
});
