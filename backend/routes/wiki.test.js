"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

const {
	registerWikiRoutes,
} = require("./wiki");

async function withServer(run) {
	const app = express();
	app.use(express.json());
	registerWikiRoutes(app, {
		requireRuntimeAdmin: (req, res, next) => {
			if (req.headers["x-runtime-admin"] !== "allowed") {
				return res.status(403).json({ error: "runtime admin required" });
			}
			return next();
		},
		wikiRouteHandlers: createStubWikiHandlers(),
	});

	const server = http.createServer(app);
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	const baseUrl = `http://127.0.0.1:${address.port}`;

	try {
		await run(baseUrl);
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

function createHandler(name) {
	return (_req, res) => res.json({ handler: name });
}

function createStubWikiHandlers() {
	return {
		handleWikiCapture: createHandler("capture"),
		handleWikiMemoryBrief: createHandler("memory-brief"),
		handleWikiMemoryDeck: createHandler("memory-deck"),
		handleWikiMemoryExplorer: createHandler("memory-explorer"),
		handleWikiMemoryExplorerExport: createHandler("memory-explorer-export"),
		handleWikiMemories: createHandler("memories"),
		handleWikiMemoryBlockDelete: createHandler("memory-block-delete"),
		handleWikiMemoryProposalDelete: createHandler("memory-proposal-delete"),
		handleWikiMemoryReset: createHandler("memory-reset"),
		handleWikiSearch: createHandler("search"),
		handleWikiSynthesisSave: createHandler("synthesis"),
		handleWikiStatus: createHandler("status"),
		handleWikiSync: createHandler("sync"),
	};
}

test("wiki router mounts public wiki routes under /api/wiki", async () => {
	await withServer(async (baseUrl) => {
		const statusResponse = await fetch(`${baseUrl}/api/wiki/status`);
		assert.equal(statusResponse.status, 200);
		assert.deepEqual(await statusResponse.json(), { handler: "status" });

		const explorerResponse = await fetch(`${baseUrl}/api/wiki/memory-explorer`);
		assert.equal(explorerResponse.status, 200);
		assert.deepEqual(await explorerResponse.json(), { handler: "memory-explorer" });
	});
});

test("wiki router keeps runtime-admin protection on mutating routes", async () => {
	await withServer(async (baseUrl) => {
		const blockedResponse = await fetch(`${baseUrl}/api/wiki/captures`, {
			method: "POST",
		});
		assert.equal(blockedResponse.status, 403);

		const allowedResponse = await fetch(`${baseUrl}/api/wiki/captures`, {
			headers: {
				"x-runtime-admin": "allowed",
			},
			method: "POST",
		});
		assert.equal(allowedResponse.status, 200);
		assert.deepEqual(await allowedResponse.json(), { handler: "capture" });

		const deleteResponse = await fetch(`${baseUrl}/api/wiki/memories/work/blocks/block-1`, {
			headers: {
				"x-runtime-admin": "allowed",
			},
			method: "DELETE",
		});
		assert.equal(deleteResponse.status, 200);
		assert.deepEqual(await deleteResponse.json(), { handler: "memory-block-delete" });
	});
});
