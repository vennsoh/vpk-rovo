const assert = require("node:assert/strict");
const test = require("node:test");

test("component test report separates classified and legacy-drift node:test files", async () => {
	const { buildComponentTestReport } = await import("./run-js-unit-tests.mjs");
	const report = buildComponentTestReport([
		{
			filePath: "components/allowed.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/skipped.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/not-node-test.test.js",
			source: "module.exports = {};",
		},
		{
			filePath: "lib/included-by-prefix.test.js",
			source: 'const test = require("node:test");',
		},
	], {
		classificationByFile: new Map([["components/allowed.test.js", "stable"]]),
		includedTestFiles: new Set(["components/allowed.test.js"]),
		includedTestPrefixes: ["lib/"],
		excludedTestFiles: new Set(),
	});

	assert.deepEqual(report, {
		version: 1,
		componentRoot: "components/",
		includedCount: 1,
		excludedCount: 1,
		includedFiles: ["components/allowed.test.js"],
		excludedFiles: [
			{
				classification: "legacy-drift",
				filePath: "components/skipped.test.js",
				reason: "legacy-drift",
			},
		],
	});
});

test("runnable test selection includes manifest classifications in the CI gate", async () => {
	const { selectRunnableTestFiles } = await import("./run-js-unit-tests.mjs");
	const runnableFiles = selectRunnableTestFiles([
		{
			filePath: "components/stable.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/source-contract.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/legacy-drift.test.js",
			source: 'const test = require("node:test");',
		},
	], {
		classificationByFile: new Map([
			["components/stable.test.js", "stable"],
			["components/source-contract.test.js", "source-contract"],
			["components/legacy-drift.test.js", "legacy-drift"],
		]),
		excludedTestFiles: new Set(),
		includedTestFiles: new Set(),
		includedTestPrefixes: [],
	});

	assert.deepEqual(runnableFiles, [
		"components/stable.test.js",
		"components/source-contract.test.js",
	]);
});

test("runnable test selection preserves the existing prefix and explicit-file gates", async () => {
	const { selectRunnableTestFiles } = await import("./run-js-unit-tests.mjs");
	const runnableFiles = selectRunnableTestFiles([
		{
			filePath: "backend/included-by-prefix.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/allowed.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/skipped.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "scripts/not-node-test.test.js",
			source: "module.exports = {};",
		},
	], {
		includedTestFiles: new Set(["components/allowed.test.js"]),
		includedTestPrefixes: ["backend/", "scripts/"],
		excludedTestFiles: new Set(),
	});

	assert.deepEqual(runnableFiles, [
		"backend/included-by-prefix.test.js",
		"components/allowed.test.js",
	]);
});

test("CLI selection options can narrow tests to named slices", async () => {
	const { buildSelectionOptions, parseTestSelectionArgs, selectRunnableTestFiles } = await import("./run-js-unit-tests.mjs");
	const selection = parseTestSelectionArgs([
		"--prefix",
		"backend/,app/api/",
		"--file=components/allowed.test.js",
	]);
	const options = {
		...buildSelectionOptions(selection),
		classificationByFile: new Map([
			["components/stable-outside-selection.test.js", "stable"],
		]),
	};
	const runnableFiles = selectRunnableTestFiles([
		{
			filePath: "backend/included.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "app/api/included.test.ts",
			source: 'import test from "node:test";',
		},
		{
			filePath: "components/allowed.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "components/stable-outside-selection.test.js",
			source: 'const test = require("node:test");',
		},
		{
			filePath: "lib/excluded.test.js",
			source: 'const test = require("node:test");',
		},
	], options);

	assert.deepEqual(selection, {
		files: ["components/allowed.test.js"],
		prefixes: ["backend/", "app/api/"],
	});
	assert.deepEqual(runnableFiles, [
		"backend/included.test.js",
		"app/api/included.test.ts",
		"components/allowed.test.js",
	]);
});

test("CLI selection rejects unknown or incomplete arguments", async () => {
	const { parseTestSelectionArgs } = await import("./run-js-unit-tests.mjs");

	assert.throws(() => parseTestSelectionArgs(["--prefix"]), /requires a value/);
	assert.throws(() => parseTestSelectionArgs(["--unknown"]), /Unknown argument/);
});

test("component coverage report is skipped for non-component slices", async () => {
	const { shouldReportComponentCoverage } = await import("./run-js-unit-tests.mjs");

	assert.equal(shouldReportComponentCoverage(), true);
	assert.equal(shouldReportComponentCoverage({ prefixes: ["backend/"] }), false);
	assert.equal(shouldReportComponentCoverage({ prefixes: ["components/website/"] }), true);
	assert.equal(shouldReportComponentCoverage({ files: ["components/ui/button.test.js"] }), true);
});

test("test discovery skips files deleted or moved before staging", async () => {
	const { filterExistingTestFiles } = await import("./run-js-unit-tests.mjs");

	assert.deepEqual(
		filterExistingTestFiles([
			"components/projects/rovo/components/deleted.test.js",
			"components/projects/rovo-core/components/moved.test.js",
		], (filePath) => filePath.includes("rovo-core")),
		["components/projects/rovo-core/components/moved.test.js"],
	);
});

test("test batching groups ordinary node tests by directory and isolates vm-module tests", async () => {
	const { buildTestFileBatches } = await import("./run-js-unit-tests.mjs");
	const sourceByFile = new Map([
		["backend/a.test.js", 'const test = require("node:test");'],
		["backend/b.test.js", 'const test = require("node:test");'],
		["backend/lib/c.test.js", 'const test = require("node:test");'],
		["scripts/vm.test.js", "const module = new vm.SourceTextModule('');"],
		["scripts/ordinary.test.js", 'const test = require("node:test");'],
	]);

	assert.deepEqual(
		buildTestFileBatches([...sourceByFile.keys()], {
			readFile: (filePath) => sourceByFile.get(filePath),
		}),
		[
			{
				files: ["backend/a.test.js", "backend/b.test.js"],
				nodeArgs: [],
				reason: "directory",
			},
			{
				files: ["backend/lib/c.test.js"],
				nodeArgs: [],
				reason: "directory",
			},
			{
				files: ["scripts/vm.test.js"],
				nodeArgs: ["--experimental-vm-modules"],
				reason: "vm-modules",
			},
			{
				files: ["scripts/ordinary.test.js"],
				nodeArgs: [],
				reason: "directory",
			},
		],
	);
});

test("runTestFiles invokes node:test once per batch", async () => {
	const { runTestFiles } = await import("./run-js-unit-tests.mjs");
	const calls = [];
	const sourceByFile = new Map([
		["backend/a.test.js", 'const test = require("node:test");'],
		["backend/b.test.js", 'const test = require("node:test");'],
		["scripts/vm.test.js", "const module = new vm.SyntheticModule([], () => {});"],
	]);

	runTestFiles([...sourceByFile.keys()], {
		readFile: (filePath) => sourceByFile.get(filePath),
		spawn: (command, args, options) => {
			calls.push({ args, command, options });
			return { status: 0 };
		},
	});

	assert.deepEqual(calls, [
		{
			command: process.execPath,
			args: ["--test", "backend/a.test.js", "backend/b.test.js"],
			options: { stdio: "inherit" },
		},
		{
			command: process.execPath,
			args: ["--experimental-vm-modules", "--test", "scripts/vm.test.js"],
			options: { stdio: "inherit" },
		},
	]);
});
