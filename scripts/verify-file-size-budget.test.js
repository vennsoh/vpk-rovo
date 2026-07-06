const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { mkdtempSync, rmSync, writeFileSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	buildUpdatedAllowlist,
	countLines,
	evaluateFileSizeBudget,
	formatFailure,
	getGrowthLimit,
	isBudgetedTextFile,
	listTrackedFiles,
	readBudgetEntries,
} = require("./verify-file-size-budget");

test("counts logical lines with and without trailing newlines", () => {
	assert.equal(countLines(""), 0);
	assert.equal(countLines("one"), 1);
	assert.equal(countLines("one\n"), 1);
	assert.equal(countLines("one\ntwo"), 2);
	assert.equal(countLines("one\ntwo\n"), 2);
});

test("budgets only tracked source and documentation text extensions", () => {
	assert.equal(isBudgetedTextFile("backend/server.js"), true);
	assert.equal(isBudgetedTextFile("components/example.tsx"), true);
	assert.equal(isBudgetedTextFile(".agents/skills/example/SKILL.md"), true);
	assert.equal(isBudgetedTextFile("package.json"), false);
	assert.equal(isBudgetedTextFile("public/icon.svg"), false);
});

test("detects new oversized files, growth, and stale allowlist entries", () => {
	const failures = evaluateFileSizeBudget([
		{
			filePath: "backend/server.js",
			lines: 110,
		},
		{
			filePath: "components/new.tsx",
			lines: 101,
		},
		{
			filePath: "components/small.tsx",
			lines: 20,
		},
		{
			filePath: "backend/runtime.js",
			lines: 51,
		},
	], {
		threshold: 100,
		growthBudgetPercent: 5,
		files: {
			"backend/server.js": 100,
			"components/deleted.tsx": 120,
		},
		maxLines: {
			"backend/runtime.js": 50,
			"backend/deleted-runtime.js": 75,
		},
	});

	assert.deepEqual(failures, [
		{
			type: "allowlisted-file-grew",
			filePath: "backend/server.js",
			lines: 110,
			recordedLines: 100,
			growthLimit: 105,
			growthBudgetPercent: 5,
		},
		{
			type: "new-oversized-file",
			filePath: "components/new.tsx",
			lines: 101,
			threshold: 100,
		},
		{
			type: "max-lines-exceeded",
			filePath: "backend/runtime.js",
			lines: 51,
			maxLines: 50,
		},
		{
			type: "stale-allowlist-entry",
			filePath: "components/deleted.tsx",
			recordedLines: 120,
		},
		{
			type: "stale-max-lines-entry",
			filePath: "backend/deleted-runtime.js",
			maxLines: 75,
		},
	]);
});

test("builds an updated allowlist from current files above the threshold and preserves strict budgets", () => {
	const allowlist = buildUpdatedAllowlist([
		{
			filePath: "components/a.tsx",
			lines: 101,
		},
		{
			filePath: "components/b.tsx",
			lines: 100,
		},
		{
			filePath: "backend/server.js",
			lines: 140,
		},
	], {
		threshold: 100,
		growthBudgetPercent: 7,
		maxLines: {
			"backend/server.js": 150,
		},
		files: {
			"components/deleted.tsx": 200,
		},
	});

	assert.deepEqual(allowlist, {
		version: 1,
		threshold: 100,
		growthBudgetPercent: 7,
		maxLines: {
			"backend/server.js": 150,
		},
		files: {
			"backend/server.js": 140,
			"components/a.tsx": 101,
		},
	});
});

test("skips deleted tracked paths while reading current budget entries", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-file-budget-entries-"));
	try {
		writeFileSync(path.join(cwd, "existing.ts"), "one\ntwo\n");

		assert.deepEqual(readBudgetEntries(["existing.ts", "missing.ts"], { cwd }), [
			{
				filePath: "existing.ts",
				lines: 2,
			},
		]);
	} finally {
		rmSync(cwd, { force: true, recursive: true });
	}
});

test("formats actionable failures", () => {
	assert.equal(getGrowthLimit(100, 5), 105);
	assert.match(formatFailure({
		type: "max-lines-exceeded",
		filePath: "backend/server.js",
		lines: 501,
		maxLines: 500,
	}), /explicit 500-line architecture budget/u);
	assert.match(formatFailure({
		type: "new-oversized-file",
		filePath: "components/new.tsx",
		lines: 101,
		threshold: 100,
	}), /components\/new\.tsx/);
});

test("lists tracked and untracked non-ignored files", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-file-budget-"));
	try {
		spawnSync("git", ["init"], { cwd, stdio: "ignore" });
		writeFileSync(path.join(cwd, ".gitignore"), "ignored.ts\n");
		writeFileSync(path.join(cwd, "tracked.ts"), "tracked\n");
		writeFileSync(path.join(cwd, "untracked.ts"), "untracked\n");
		writeFileSync(path.join(cwd, "ignored.ts"), "ignored\n");
		spawnSync("git", ["add", ".gitignore", "tracked.ts"], { cwd, stdio: "ignore" });

		assert.deepEqual(listTrackedFiles({ cwd }).sort(), [
			".gitignore",
			"tracked.ts",
			"untracked.ts",
		]);
	} finally {
		rmSync(cwd, { force: true, recursive: true });
	}
});
