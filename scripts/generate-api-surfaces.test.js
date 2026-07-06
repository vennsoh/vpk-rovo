"use strict";

const assert = require("node:assert/strict");
const { mkdtempSync, mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	GENERATED_BEGIN,
	GENERATED_END,
	buildGeneratedSection,
	replaceGeneratedSection,
	updateApiSurfacesDocument,
} = require("./generate-api-surfaces");

function createManifest() {
	return {
		version: 1,
		backendRoutes: [
			{
				method: "POST",
				path: "/api/jobs",
				runtimeAdmin: true,
				source: "backend/routes/jobs.js:10",
			},
			{
				method: "GET",
				path: "/api/health",
				runtimeAdmin: false,
				source: "backend/server.js:20",
			},
		],
		nextApiRoutes: [
			{
				method: "POST",
				nextPath: "/api/jobs",
				source: "app/api/jobs/route.ts:4",
				targets: [
					{
						method: "POST",
						path: "/api/jobs",
						source: "app/api/jobs/route.ts:5",
					},
				],
			},
		],
	};
}

test("buildGeneratedSection renders backend and Next API route tables", () => {
	const section = buildGeneratedSection(createManifest());

	assert.match(section, new RegExp(GENERATED_BEGIN, "u"));
	assert.match(section, new RegExp(GENERATED_END, "u"));
	assert.match(section, /Backend routes: 2; runtime-admin routes: 1; Next API routes: 1/u);
	assert.match(section, /\| `GET` \| `\/api\/health` \| no \| `backend\/server\.js:20` \|/u);
	assert.match(section, /\| `POST` \| `\/api\/jobs` \| yes \| `backend\/routes\/jobs\.js:10` \|/u);
	assert.match(section, /\| `POST` \| `\/api\/jobs` \| `POST \/api\/jobs` \| `app\/api\/jobs\/route\.ts:4` \|/u);
});

test("replaceGeneratedSection replaces a legacy backend section", () => {
	const documentText = [
		"# API Surfaces",
		"",
		"## Dev Proxy JSON Contracts",
		"",
		"- Keep this prose.",
		"",
		"## Backend (`backend/server.js`)",
		"",
		"- stale hand-written route",
		"",
	].join("\n");
	const generatedSection = buildGeneratedSection(createManifest());

	assert.equal(
		replaceGeneratedSection(documentText, generatedSection),
		[
			"# API Surfaces",
			"",
			"## Dev Proxy JSON Contracts",
			"",
			"- Keep this prose.",
			"",
			generatedSection,
		].join("\n"),
	);
});

test("updateApiSurfacesDocument writes generated output and detects staleness", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-api-surfaces-"));
	mkdirSync(path.join(cwd, ".agents/rules"), { recursive: true });
	mkdirSync(path.join(cwd, "backend/routes"), { recursive: true });
	writeFileSync(
		path.join(cwd, ".agents/rules/api-surfaces.md"),
		[
			"# API Surfaces",
			"",
			"## Dev Proxy JSON Contracts",
			"",
			"- Keep this prose.",
			"",
			"## Backend (`backend/server.js`)",
			"",
			"- stale hand-written route",
			"",
		].join("\n"),
	);
	writeFileSync(
		path.join(cwd, "backend/routes/route-manifest.json"),
		`${JSON.stringify(createManifest(), null, "\t")}\n`,
	);

	const writeResult = updateApiSurfacesDocument({ cwd });
	assert.equal(writeResult.changed, true);
	assert.match(
		readFileSync(path.join(cwd, ".agents/rules/api-surfaces.md"), "utf8"),
		/\| `POST` \| `\/api\/jobs` \| yes \|/u,
	);

	const checkResult = updateApiSurfacesDocument({ cwd, write: false });
	assert.equal(checkResult.changed, false);
});
