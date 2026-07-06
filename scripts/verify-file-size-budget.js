#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const path = require("node:path");

const ALLOWLIST_PATH = path.join(__dirname, "file-size-allowlist.json");
const DEFAULT_THRESHOLD = 1000;
const DEFAULT_GROWTH_BUDGET_PERCENT = 5;
const TRACKED_TEXT_EXTENSIONS = new Set([
	".cjs",
	".css",
	".js",
	".jsx",
	".md",
	".mdx",
	".mjs",
	".ts",
	".tsx",
]);

function countLines(source) {
	if (!source) {
		return 0;
	}

	const newlineCount = source.match(/\n/g)?.length ?? 0;
	return source.endsWith("\n") || source.endsWith("\r") ? newlineCount : newlineCount + 1;
}

function isBudgetedTextFile(filePath) {
	return TRACKED_TEXT_EXTENSIONS.has(path.extname(filePath));
}

function listTrackedFiles({ cwd = process.cwd() } = {}) {
	const result = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "inherit"],
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}

	return result.stdout
		.split("\n")
		.map((filePath) => filePath.trim())
		.filter(Boolean);
}

function readBudgetEntries(filePaths, { cwd = process.cwd() } = {}) {
	return filePaths
		.filter(isBudgetedTextFile)
		.filter((filePath) => existsSync(path.join(cwd, filePath)))
		.map((filePath) => {
			const absolutePath = path.join(cwd, filePath);
			const source = readFileSync(absolutePath);
			if (source.includes(0)) {
				return null;
			}

			return {
				filePath,
				lines: countLines(source.toString("utf8")),
			};
		})
		.filter(Boolean);
}

function readAllowlist(filePath = ALLOWLIST_PATH) {
	if (!existsSync(filePath)) {
		return {
			version: 1,
			threshold: DEFAULT_THRESHOLD,
			growthBudgetPercent: DEFAULT_GROWTH_BUDGET_PERCENT,
			files: {},
		};
	}

	return JSON.parse(readFileSync(filePath, "utf8"));
}

function getGrowthLimit(recordedLines, growthBudgetPercent) {
	return Math.ceil(recordedLines * (1 + growthBudgetPercent / 100));
}

function evaluateFileSizeBudget(entries, allowlist) {
	const threshold = allowlist.threshold ?? DEFAULT_THRESHOLD;
	const growthBudgetPercent = allowlist.growthBudgetPercent ?? DEFAULT_GROWTH_BUDGET_PERCENT;
	const allowlistedFiles = allowlist.files ?? {};
	const maxLinesByPath = allowlist.maxLines ?? {};
	const currentByPath = new Map(entries.map((entry) => [entry.filePath, entry.lines]));
	const failures = [];

	for (const entry of entries) {
		const maxLines = maxLinesByPath[entry.filePath];
		if (typeof maxLines === "number" && entry.lines > maxLines) {
			failures.push({
				type: "max-lines-exceeded",
				filePath: entry.filePath,
				lines: entry.lines,
				maxLines,
			});
			continue;
		}

		const recordedLines = allowlistedFiles[entry.filePath];
		if (entry.lines <= threshold && recordedLines === undefined) {
			continue;
		}

		if (recordedLines === undefined) {
			failures.push({
				type: "new-oversized-file",
				filePath: entry.filePath,
				lines: entry.lines,
				threshold,
			});
			continue;
		}

		const growthLimit = getGrowthLimit(recordedLines, growthBudgetPercent);
		if (entry.lines > growthLimit) {
			failures.push({
				type: "allowlisted-file-grew",
				filePath: entry.filePath,
				lines: entry.lines,
				recordedLines,
				growthLimit,
				growthBudgetPercent,
			});
		}
	}

	for (const filePath of Object.keys(allowlistedFiles)) {
		if (!currentByPath.has(filePath)) {
			failures.push({
				type: "stale-allowlist-entry",
				filePath,
				recordedLines: allowlistedFiles[filePath],
			});
		}
	}

	for (const filePath of Object.keys(maxLinesByPath)) {
		if (!currentByPath.has(filePath)) {
			failures.push({
				type: "stale-max-lines-entry",
				filePath,
				maxLines: maxLinesByPath[filePath],
			});
		}
	}

	return failures;
}

function buildUpdatedAllowlist(entries, allowlist) {
	const threshold = allowlist.threshold ?? DEFAULT_THRESHOLD;
	const currentLargeFiles = entries
		.filter((entry) => entry.lines > threshold)
		.sort((a, b) => a.filePath.localeCompare(b.filePath));
	const files = {};

	for (const entry of currentLargeFiles) {
		files[entry.filePath] = entry.lines;
	}

	const updatedAllowlist = {
		version: 1,
		threshold,
		growthBudgetPercent: allowlist.growthBudgetPercent ?? DEFAULT_GROWTH_BUDGET_PERCENT,
		files,
	};
	if (allowlist.maxLines && Object.keys(allowlist.maxLines).length > 0) {
		updatedAllowlist.maxLines = allowlist.maxLines;
	}
	return updatedAllowlist;
}

function formatFailure(failure) {
	if (failure.type === "max-lines-exceeded") {
		return `${failure.filePath}: ${failure.lines} lines exceeds the explicit ${failure.maxLines}-line architecture budget.`;
	}

	if (failure.type === "new-oversized-file") {
		return `${failure.filePath}: ${failure.lines} lines exceeds the ${failure.threshold}-line threshold and is not allowlisted.`;
	}

	if (failure.type === "allowlisted-file-grew") {
		return `${failure.filePath}: ${failure.lines} lines exceeds recorded budget ${failure.recordedLines} + ${failure.growthBudgetPercent}% (${failure.growthLimit}).`;
	}

	if (failure.type === "stale-allowlist-entry") {
		return `${failure.filePath}: allowlisted at ${failure.recordedLines} lines but the tracked file no longer exists.`;
	}

	if (failure.type === "stale-max-lines-entry") {
		return `${failure.filePath}: architecture budgeted at ${failure.maxLines} lines but the tracked file no longer exists.`;
	}

	return `${failure.filePath}: unknown file-size budget failure.`;
}

function main() {
	const shouldUpdate = process.argv.includes("--update");
	const entries = readBudgetEntries(listTrackedFiles());
	const allowlist = readAllowlist();

	if (shouldUpdate) {
		const updatedAllowlist = buildUpdatedAllowlist(entries, allowlist);
		writeFileSync(ALLOWLIST_PATH, `${JSON.stringify(updatedAllowlist, null, "\t")}\n`);
		console.log(`Updated ${path.relative(process.cwd(), ALLOWLIST_PATH)} with ${Object.keys(updatedAllowlist.files).length} oversized files.`);
		return;
	}

	const failures = evaluateFileSizeBudget(entries, allowlist);
	if (failures.length === 0) {
		console.log("Verified file-size budget");
		return;
	}

	console.error("File-size budget failed:");
	for (const failure of failures) {
		console.error(`- ${formatFailure(failure)}`);
	}
	console.error("Split the file, or run `node scripts/verify-file-size-budget.js --update` after an intentional architecture-budget change.");
	process.exitCode = 1;
}

if (require.main === module) {
	main();
}

module.exports = {
	buildUpdatedAllowlist,
	countLines,
	evaluateFileSizeBudget,
	formatFailure,
	getGrowthLimit,
	isBudgetedTextFile,
	listTrackedFiles,
	readBudgetEntries,
};
