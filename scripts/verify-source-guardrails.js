#!/usr/bin/env node

"use strict";

const { spawnSync } = require("node:child_process");
const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const path = require("node:path");

const ALLOWLIST_PATH = path.join(__dirname, "source-guardrails-allowlist.json");
const SOURCE_EXTENSIONS = new Set([
	".cjs",
	".js",
	".jsx",
	".mjs",
	".ts",
	".tsx",
]);
const DEFAULT_TARGETS = [
	"app",
	"components",
	"backend",
	"hooks",
	"lib",
	"rovo",
	"scripts",
	"tests",
	"types",
	"next.config.ts",
	"tailwind.config.ts",
	"twg-install.test.js",
];
const BROAD_ANY_PATTERNS = [
	/:\s*any\b/u,
	/\bas\s+any\b/u,
	/<\s*any\b/u,
	/\bArray\s*<\s*any\b/u,
	/\bRecord\s*<[^>\n]*\bany\b/u,
	/\bPromise\s*<\s*any\b/u,
];
const FORBIDDEN_IMPORT_RULES = [
	{
		filePathPattern: /^app\/contexts\/context-rovo-chat\.tsx$/u,
		modulePath: "@/components/projects/rovo-core/lib/agent-records/agent-versioning",
	},
	{
		filePathPattern: /^app\/contexts\/context-rovo-chat\.tsx$/u,
		modulePath: "@/components/projects/rovo-core/lib/agent-records/session-agent-storage",
	},
	{
		filePathPattern: /^app\/contexts\/context-rovo-chat\.tsx$/u,
		modulePath: "@/components/projects/rovo-core/lib/agent-records/session-agent-entry",
		forbiddenSpecifiers: [
			"buildSessionAgentProfileFromResult",
			"createSessionAgentEntriesFromRecords",
			"createSessionAgentEntryFromResult",
			"getStudioSessionAgentResultDisplayName",
			"normalizeSessionAgentResult",
		],
	},
];

function compareStrings(left, right) {
	return left.localeCompare(right);
}

function isSourceFile(filePath) {
	return SOURCE_EXTENSIONS.has(path.extname(filePath));
}

function listSourceFiles({ cwd = process.cwd(), targets = DEFAULT_TARGETS } = {}) {
	const result = spawnSync("git", [
		"ls-files",
		"--cached",
		"--others",
		"--exclude-standard",
		"--",
		...targets,
	], {
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
		.filter(Boolean)
		.filter(isSourceFile)
		.sort(compareStrings);
}

function hasBroadAny(line) {
	return BROAD_ANY_PATTERNS.some((pattern) => pattern.test(line));
}

function hasLegacyReactContext(line) {
	return /\b(?:React\.)?useContext\s*\(/u.test(line);
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function getLineNumber(source, index) {
	return source.slice(0, index).split(/\r?\n/u).length;
}

function addViolation(violations, occurrenceCounts, violation) {
	const baseKey = `${violation.type}|${violation.filePath}|${violation.text}`;
	const occurrence = (occurrenceCounts.get(baseKey) ?? 0) + 1;
	occurrenceCounts.set(baseKey, occurrence);
	violations.push({
		...violation,
		occurrence,
	});
}

function collectStaticImports(source) {
	return [...source.matchAll(/import\s+(?:type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["'];/gu)]
		.map((match) => ({
			line: getLineNumber(source, match.index ?? 0),
			modulePath: match[2],
			source: match[0].replace(/\s+/gu, " ").trim(),
			specifiers: match[1],
		}));
}

function collectForbiddenImportViolationsFromSource(source, filePath) {
	const violations = [];
	const occurrenceCounts = new Map();
	const imports = collectStaticImports(source);
	const rules = FORBIDDEN_IMPORT_RULES.filter((rule) => rule.filePathPattern.test(filePath));

	for (const importDeclaration of imports) {
		for (const rule of rules) {
			if (importDeclaration.modulePath !== rule.modulePath) {
				continue;
			}

			const forbiddenSpecifiers = rule.forbiddenSpecifiers ?? [];
			if (forbiddenSpecifiers.length === 0) {
				addViolation(violations, occurrenceCounts, {
					filePath,
					line: importDeclaration.line,
					text: `forbidden import from ${rule.modulePath}`,
					type: "forbidden-import",
				});
				continue;
			}

			for (const specifier of forbiddenSpecifiers) {
				const specifierPattern = new RegExp(`\\b${escapeRegExp(specifier)}\\b`, "u");
				if (!specifierPattern.test(importDeclaration.specifiers)) {
					continue;
				}

				addViolation(violations, occurrenceCounts, {
					filePath,
					line: importDeclaration.line,
					text: `forbidden import ${specifier} from ${rule.modulePath}`,
					type: "forbidden-import",
				});
			}
		}
	}

	return violations;
}

function collectSourceGuardrailViolationsFromSource(source, filePath) {
	const violations = [];
	const occurrenceCounts = new Map();
	const lines = source.split(/\r?\n/u);

	lines.forEach((rawLine, index) => {
		const line = rawLine.trim();
		if (!line) {
			return;
		}

		const baseViolation = {
			filePath,
			line: index + 1,
			text: line,
		};

		if (/eslint-disable(?:-next-line|-line)?/u.test(line)) {
			addViolation(violations, occurrenceCounts, {
				...baseViolation,
				type: "eslint-disable",
			});
		}

		if (/@ts-ignore\b/u.test(line)) {
			addViolation(violations, occurrenceCounts, {
				...baseViolation,
				type: "ts-ignore",
			});
		}

		if (hasBroadAny(line)) {
			addViolation(violations, occurrenceCounts, {
				...baseViolation,
				type: "broad-any",
			});
		}

		if (hasLegacyReactContext(line)) {
			addViolation(violations, occurrenceCounts, {
				...baseViolation,
				type: "legacy-react-context",
			});
		}
	});

	return [
		...violations,
		...collectForbiddenImportViolationsFromSource(source, filePath),
	];
}

function collectSourceGuardrailViolations({ cwd = process.cwd(), files = listSourceFiles({ cwd }) } = {}) {
	return files
		.filter((filePath) => existsSync(path.join(cwd, filePath)))
		.flatMap((filePath) => {
			const source = readFileSync(path.join(cwd, filePath), "utf8");
			return collectSourceGuardrailViolationsFromSource(source, filePath);
		})
		.sort((left, right) => {
			return compareStrings(left.filePath, right.filePath) ||
				left.line - right.line ||
				compareStrings(left.type, right.type) ||
				left.occurrence - right.occurrence;
		});
}

function readAllowlist(filePath = ALLOWLIST_PATH) {
	if (!existsSync(filePath)) {
		return {
			version: 1,
			items: [],
		};
	}
	return JSON.parse(readFileSync(filePath, "utf8"));
}

function getFingerprint(item) {
	return `${item.type}|${item.filePath}|${item.occurrence ?? 1}|${item.text}`;
}

function buildUpdatedAllowlist(violations) {
	return {
		version: 1,
		items: violations.map((violation) => ({
			filePath: violation.filePath,
			occurrence: violation.occurrence,
			reason: "existing baseline",
			text: violation.text,
			type: violation.type,
		})),
	};
}

function evaluateSourceGuardrails(violations, allowlist) {
	const allowlistItems = allowlist.items ?? [];
	const allowedByFingerprint = new Map(
		allowlistItems.map((item) => [getFingerprint(item), item]),
	);
	const currentFingerprints = new Set(violations.map(getFingerprint));
	const failures = [];

	for (const item of allowlistItems) {
		if (!item.reason) {
			failures.push({
				...item,
				type: "allowlist-entry-missing-reason",
				violationType: item.type,
			});
		}
	}

	for (const violation of violations) {
		if (!allowedByFingerprint.has(getFingerprint(violation))) {
			failures.push({
				...violation,
				type: "new-source-guardrail-violation",
				violationType: violation.type,
			});
		}
	}

	for (const item of allowlistItems) {
		if (!currentFingerprints.has(getFingerprint(item))) {
			failures.push({
				...item,
				type: "stale-source-guardrail-allowlist-entry",
				violationType: item.type,
			});
		}
	}

	return failures;
}

function formatFailure(failure) {
	if (failure.type === "allowlist-entry-missing-reason") {
		return `${failure.filePath}: allowlisted ${failure.violationType} entry is missing a reason: ${failure.text}`;
	}

	if (failure.type === "stale-source-guardrail-allowlist-entry") {
		return `${failure.filePath}: stale ${failure.violationType} allowlist entry can be removed: ${failure.text}`;
	}

	if (failure.type === "new-source-guardrail-violation") {
		return `${failure.filePath}:${failure.line}: new ${failure.violationType} requires removal or an allowlist reason: ${failure.text}`;
	}

	return `${failure.filePath}: unknown source guardrail failure.`;
}

function main() {
	const shouldUpdate = process.argv.includes("--update");
	const violations = collectSourceGuardrailViolations();

	if (shouldUpdate) {
		const updatedAllowlist = buildUpdatedAllowlist(violations);
		writeFileSync(ALLOWLIST_PATH, `${JSON.stringify(updatedAllowlist, null, "\t")}\n`);
		console.log(`Updated ${path.relative(process.cwd(), ALLOWLIST_PATH)} with ${updatedAllowlist.items.length} source guardrail baseline entries.`);
		return;
	}

	const failures = evaluateSourceGuardrails(violations, readAllowlist());
	if (failures.length === 0) {
		console.log("Verified source guardrail ratchets");
		return;
	}

	console.error("Source guardrail ratchets failed:");
	for (const failure of failures) {
		console.error(`- ${formatFailure(failure)}`);
	}
	console.error("Remove the pattern, or run `node scripts/verify-source-guardrails.js --update` after an intentional architecture-budget change.");
	process.exitCode = 1;
}

if (require.main === module) {
	main();
}

module.exports = {
	buildUpdatedAllowlist,
	collectSourceGuardrailViolations,
	collectForbiddenImportViolationsFromSource,
	collectSourceGuardrailViolationsFromSource,
	evaluateSourceGuardrails,
	formatFailure,
	hasBroadAny,
	hasLegacyReactContext,
	isSourceFile,
	listSourceFiles,
};
