const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	buildUpdatedAllowlist,
	collectForbiddenImportViolationsFromSource,
	collectSourceGuardrailViolationsFromSource,
	evaluateSourceGuardrails,
	formatFailure,
	hasBroadAny,
	hasLegacyReactContext,
	isSourceFile,
	listSourceFiles,
} = require("./verify-source-guardrails");

test("detects source guardrail patterns with stable occurrences", () => {
	const violations = collectSourceGuardrailViolationsFromSource([
		"/* eslint-disable react-hooks/exhaustive-deps */",
		"// @ts-ignore legacy boundary",
		"const value = payload as any;",
		"const context = useContext(AppContext);",
		"const reactContext = React.useContext(AppContext);",
		"const other = payload as any;",
	].join("\n"), "components/example.tsx");

	assert.deepEqual(violations.map((violation) => ({
		line: violation.line,
		occurrence: violation.occurrence,
		text: violation.text,
		type: violation.type,
	})), [
		{
			line: 1,
			occurrence: 1,
			text: "/* eslint-disable react-hooks/exhaustive-deps */",
			type: "eslint-disable",
		},
		{
			line: 2,
			occurrence: 1,
			text: "// @ts-ignore legacy boundary",
			type: "ts-ignore",
		},
		{
			line: 3,
			occurrence: 1,
			text: "const value = payload as any;",
			type: "broad-any",
		},
		{
			line: 4,
			occurrence: 1,
			text: "const context = useContext(AppContext);",
			type: "legacy-react-context",
		},
		{
			line: 5,
			occurrence: 1,
			text: "const reactContext = React.useContext(AppContext);",
			type: "legacy-react-context",
		},
		{
			line: 6,
			occurrence: 1,
			text: "const other = payload as any;",
			type: "broad-any",
		},
	]);
});

test("matches broad any and legacy React context patterns narrowly", () => {
	assert.equal(hasBroadAny("type Item = Record<string, any>;"), true);
	assert.equal(hasBroadAny("const value = thing as unknown;"), false);
	assert.equal(hasLegacyReactContext("const context = use(Context);"), false);
	assert.equal(hasLegacyReactContext("const context = useContext(Context);"), true);
});

test("detects forbidden session-agent provider imports", () => {
	const violations = collectForbiddenImportViolationsFromSource([
		'import { normalizeSessionAgentEntry } from "@/components/projects/rovo-core/lib/agent-records/session-agent-entry";',
		'import {',
		"\tcreateSessionAgentEntryFromResult,",
		"\tnormalizeSessionAgentResult,",
		'} from "@/components/projects/rovo-core/lib/agent-records/session-agent-entry";',
		'import { readSessionAgentRecords } from "@/components/projects/rovo-core/lib/agent-records/session-agent-storage";',
		'import { createStudioAgentVersionRecord } from "@/components/projects/rovo-core/lib/agent-records/agent-versioning";',
	].join("\n"), "app/contexts/context-rovo-chat.tsx");

	assert.deepEqual(violations.map((violation) => ({
		line: violation.line,
		text: violation.text,
		type: violation.type,
	})), [
		{
			line: 2,
			text: "forbidden import createSessionAgentEntryFromResult from @/components/projects/rovo-core/lib/agent-records/session-agent-entry",
			type: "forbidden-import",
		},
		{
			line: 2,
			text: "forbidden import normalizeSessionAgentResult from @/components/projects/rovo-core/lib/agent-records/session-agent-entry",
			type: "forbidden-import",
		},
		{
			line: 6,
			text: "forbidden import from @/components/projects/rovo-core/lib/agent-records/session-agent-storage",
			type: "forbidden-import",
		},
		{
			line: 7,
			text: "forbidden import from @/components/projects/rovo-core/lib/agent-records/agent-versioning",
			type: "forbidden-import",
		},
	]);

	assert.deepEqual(
		collectForbiddenImportViolationsFromSource(
			'import { createSessionAgentEntryFromResult } from "@/components/projects/rovo-core/lib/agent-records/session-agent-entry";',
			"components/projects/rovo-core/lib/agent-records/session-agent-registry.ts",
		),
		[],
	);
});

test("evaluates new and stale source guardrail entries against an allowlist", () => {
	const violations = collectSourceGuardrailViolationsFromSource([
		"const allowed = value as any;",
		"const newValue = value as any;",
	].join("\n"), "components/example.tsx");
	const allowlist = buildUpdatedAllowlist([violations[0]]);

	allowlist.items.push({
		filePath: "components/deleted.tsx",
		occurrence: 1,
		reason: "existing baseline",
		text: "const deleted = value as any;",
		type: "broad-any",
	});
	allowlist.items.push({
		filePath: "components/missing-reason.tsx",
		occurrence: 1,
		text: "const missing = value as any;",
		type: "broad-any",
	});

	const failures = evaluateSourceGuardrails(violations, allowlist);
	assert.deepEqual(failures.map((failure) => failure.type), [
		"allowlist-entry-missing-reason",
		"new-source-guardrail-violation",
		"stale-source-guardrail-allowlist-entry",
		"stale-source-guardrail-allowlist-entry",
	]);
	assert.match(formatFailure(failures[1]), /components\/example\.tsx:2/u);
});

test("lists tracked and untracked source files only", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-source-guardrails-"));
	try {
		spawnSync("git", ["init"], { cwd, stdio: "ignore" });
		mkdirSync(path.join(cwd, "components"), { recursive: true });
		writeFileSync(path.join(cwd, ".gitignore"), "ignored.ts\n");
		writeFileSync(path.join(cwd, "components", "tracked.tsx"), "tracked\n");
		writeFileSync(path.join(cwd, "components", "untracked.ts"), "untracked\n");
		writeFileSync(path.join(cwd, "components", "notes.md"), "notes\n");
		writeFileSync(path.join(cwd, "ignored.ts"), "ignored\n");
		spawnSync("git", ["add", ".gitignore", "components/tracked.tsx"], { cwd, stdio: "ignore" });

		assert.deepEqual(listSourceFiles({ cwd, targets: ["components", "ignored.ts"] }), [
			"components/tracked.tsx",
			"components/untracked.ts",
		]);
	} finally {
		rmSync(cwd, { force: true, recursive: true });
	}
});

test("package scripts expose the source guardrail verifier", () => {
	const packageJson = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8"));

	assert.equal(packageJson.scripts["verify:source-guardrails"], "node scripts/verify-source-guardrails.js");
	assert.match(packageJson.scripts["validate:local"], /corepack pnpm run verify:source-guardrails/u);
	assert.match(packageJson.scripts["ci:pr"], /pnpm run verify:source-guardrails/u);
});

test("recognizes configured source extensions", () => {
	assert.equal(isSourceFile("components/example.tsx"), true);
	assert.equal(isSourceFile("scripts/example.mjs"), true);
	assert.equal(isSourceFile("AGENTS.md"), false);
});
