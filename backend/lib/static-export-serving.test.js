"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const express = require("express");

const {
	FALLBACK_HTML,
	buildPreloadLinkHeader,
	registerStaticExportServing,
} = require("./static-export-serving");

function createTempPublicDir() {
	return fs.mkdtempSync(path.join(os.tmpdir(), "vpk-static-export-"));
}

function writeFile(filePath, content) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, content);
}

async function withStaticServer(publicPath, run) {
	const app = express();
	registerStaticExportServing(app, {
		expressImpl: express,
		logger: { log() {}, warn() {} },
		publicPath,
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

test("buildPreloadLinkHeader selects the largest CSS and chunk JS assets", () => {
	const publicPath = createTempPublicDir();
	try {
		writeFile(path.join(publicPath, "_next/static/a-small.css"), "a");
		writeFile(path.join(publicPath, "_next/static/b-large.css"), "bbbb");
		writeFile(path.join(publicPath, "_next/static/root-large.js"), "rrrrrrrr");
		writeFile(path.join(publicPath, "_next/static/chunks/chunk-small.js"), "c");
		writeFile(path.join(publicPath, "_next/static/chunks/chunk-large.js"), "cccccc");

		assert.equal(
			buildPreloadLinkHeader({
				logger: { warn() {} },
				publicPath,
			}),
			"</_next/static/b-large.css>; rel=preload; as=style, </_next/static/chunks/chunk-large.js>; rel=preload; as=script; crossorigin",
		);
	} finally {
		fs.rmSync(publicPath, { force: true, recursive: true });
	}
});

test("buildPreloadLinkHeader returns empty when static export chunks are absent", () => {
	const publicPath = createTempPublicDir();
	try {
		assert.equal(
			buildPreloadLinkHeader({
				logger: { warn() {} },
				publicPath,
			}),
			"",
		);
	} finally {
		fs.rmSync(publicPath, { force: true, recursive: true });
	}
});

test("static export fallback returns JSON for unmatched API routes", async () => {
	const publicPath = createTempPublicDir();
	try {
		await withStaticServer(publicPath, async (baseUrl) => {
			const response = await fetch(`${baseUrl}/api/not-real`);

			assert.equal(response.status, 404);
			assert.equal(response.headers.get("link"), null);
			assert.deepEqual(await response.json(), {
				error: "API route not found: /api/not-real",
			});
		});
	} finally {
		fs.rmSync(publicPath, { force: true, recursive: true });
	}
});

test("static export fallback serves index.html with preload links for app routes", async () => {
	const publicPath = createTempPublicDir();
	try {
		writeFile(path.join(publicPath, "index.html"), "<main>App shell</main>");
		writeFile(path.join(publicPath, "_next/static/app.css"), "cccc");
		writeFile(path.join(publicPath, "_next/static/chunks/app.js"), "jjjj");

		await withStaticServer(publicPath, async (baseUrl) => {
			const response = await fetch(`${baseUrl}/projects/rovo`);

			assert.equal(response.status, 200);
			assert.equal(await response.text(), "<main>App shell</main>");
			assert.equal(
				response.headers.get("link"),
				"</_next/static/app.css>; rel=preload; as=style, </_next/static/chunks/app.js>; rel=preload; as=script; crossorigin",
			);
		});
	} finally {
		fs.rmSync(publicPath, { force: true, recursive: true });
	}
});

test("static export fallback preserves service HTML when index.html is missing", async () => {
	const publicPath = createTempPublicDir();
	try {
		await withStaticServer(publicPath, async (baseUrl) => {
			const response = await fetch(`${baseUrl}/projects/rovo`);

			assert.equal(response.status, 200);
			assert.equal(await response.text(), FALLBACK_HTML);
		});
	} finally {
		fs.rmSync(publicPath, { force: true, recursive: true });
	}
});

test("registerStaticExportServing validates required dependencies", () => {
	assert.throws(() => registerStaticExportServing(), /app.use/u);
	assert.throws(() => registerStaticExportServing({
		get() {},
		use() {},
	}, {
		publicPath: "/tmp/public",
	}), /expressImpl.static/u);
	assert.throws(() => registerStaticExportServing({
		get() {},
		use() {},
	}, {
		expressImpl: express,
	}), /publicPath/u);
});
