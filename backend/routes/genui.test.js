"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

const {
	createGenuiRouter,
	registerGenuiRoutes,
} = require("./genui");

async function withServer(overrides, run) {
	const app = express();
	app.use(express.json());
	const calls = {
		exportSpec: [],
		genuiChatHandler: [],
		isRovoAvailable: 0,
	};
	const dependencies = {
		exportFormats: ["pdf", "png", "react-code"],
		exportSpecFn: async (spec, format, options) => {
			calls.exportSpec.push({ spec, format, options });
			return {
				contentType: "text/plain; charset=utf-8",
				data: Buffer.from("exported"),
				filename: "artifact.txt",
			};
		},
		genuiChatHandlerFn: async (req, res, options) => {
			calls.genuiChatHandler.push({ body: req.body, options });
			res.status(200).type("text/plain").send("streamed");
		},
		isRovoAvailable: async () => {
			calls.isRovoAvailable += 1;
			return true;
		},
		logger: {
			error() {},
		},
		...overrides,
	};
	registerGenuiRoutes(app, dependencies);

	const server = http.createServer(app);
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	const baseUrl = `http://127.0.0.1:${address.port}`;

	try {
		await run(baseUrl, calls);
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

async function postRaw(baseUrl, path, body) {
	return fetch(`${baseUrl}${path}`, {
		body: JSON.stringify(body),
		headers: { "content-type": "application/json" },
		method: "POST",
	});
}

async function postJson(baseUrl, path, body) {
	const response = await postRaw(baseUrl, path, body);
	return {
		body: await response.json(),
		status: response.status,
	};
}

function createValidSpec() {
	return {
		root: "root",
		elements: {
			root: {
				type: "Text",
				props: { content: "Hello" },
			},
		},
	};
}

test("genui router validates required dependencies", () => {
	assert.throws(
		() => createGenuiRouter({ exportFormats: null }),
		/exportFormats/u,
	);
	assert.throws(
		() => createGenuiRouter({
			exportFormats: [],
			exportSpecFn: null,
			isRovoAvailable: async () => true,
		}),
		/exportSpecFn/u,
	);
});

test("POST /api/genui-chat delegates to the shared GenUI handler", async () => {
	await withServer({}, async (baseUrl, calls) => {
		const response = await postRaw(baseUrl, "/api/genui-chat", {
			prompt: "Build a dashboard",
		});

		assert.equal(response.status, 200);
		assert.equal(await response.text(), "streamed");
		assert.deepEqual(calls.genuiChatHandler[0].body, {
			prompt: "Build a dashboard",
		});
		assert.equal(typeof calls.genuiChatHandler[0].options.isRovoAvailable, "function");
	});
});

test("POST /api/genui-export validates spec and format", async () => {
	await withServer({}, async (baseUrl, calls) => {
		const invalidSpec = await postJson(baseUrl, "/api/genui-export", {
			spec: { root: "root" },
			format: "pdf",
		});
		assert.equal(invalidSpec.status, 400);
		assert.deepEqual(invalidSpec.body, {
			error: "Missing or invalid spec (requires root + elements)",
		});

		const invalidFormat = await postJson(baseUrl, "/api/genui-export", {
			spec: createValidSpec(),
			format: "docx",
		});
		assert.equal(invalidFormat.status, 400);
		assert.deepEqual(invalidFormat.body, {
			error: "Invalid format. Supported: pdf, png, react-code",
		});
		assert.deepEqual(calls.exportSpec, []);
	});
});

test("POST /api/genui-export returns exported bytes and headers", async () => {
	await withServer({}, async (baseUrl, calls) => {
		const spec = createValidSpec();
		const response = await postRaw(baseUrl, "/api/genui-export", {
			spec,
			format: "react-code",
			title: "Demo",
			state: { value: 1 },
			componentName: "DemoComponent",
		});

		assert.equal(response.status, 200);
		assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
		assert.equal(
			response.headers.get("content-disposition"),
			"attachment; filename=\"artifact.txt\"",
		);
		assert.equal(await response.text(), "exported");
		assert.deepEqual(calls.exportSpec, [
			{
				spec,
				format: "react-code",
				options: {
					title: "Demo",
					state: { value: 1 },
					componentName: "DemoComponent",
				},
			},
		]);
	});
});

test("POST /api/genui-export preserves existing export error shape", async () => {
	await withServer({
		exportSpecFn: async () => {
			throw new Error("renderer unavailable");
		},
	}, async (baseUrl) => {
		const result = await postJson(baseUrl, "/api/genui-export", {
			spec: createValidSpec(),
			format: "pdf",
		});

		assert.equal(result.status, 500);
		assert.deepEqual(result.body, {
			error: "Export failed",
			details: "renderer unavailable",
		});
	});
});
