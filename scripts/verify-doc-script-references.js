#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const DEFAULT_DOC_TARGETS = [
	"AGENTS.md",
	".agents/docs",
	".agents/rules",
	".agents/skills",
];
const PROVIDER_COMPOSITION_DOC_PATH = ".agents/docs/architecture-overview.md";
const PROVIDERS_SOURCE_PATH = "app/providers.tsx";
const DOC_EXTENSIONS = new Set([".md", ".mdc"]);
const AGENTS_FRESHNESS_DOC_PATH = "AGENTS.md";
const AGENTS_FRESHNESS_BEGIN = "<!-- validation-freshness:begin -->";
const AGENTS_FRESHNESS_END = "<!-- validation-freshness:end -->";
const REQUIRED_AGENTS_FRESHNESS_COMMANDS = [
	"pnpm run validate:preflight",
	"pnpm run verify:route-manifest",
	"pnpm run verify:api-surfaces",
	"pnpm run verify:repo-map",
	"pnpm run verify:file-size",
	"pnpm run verify:catalog",
	"pnpm run verify:lazy-load",
	"pnpm run verify:source-guardrails",
	"pnpm run verify:doc-scripts",
	"pnpm run lint",
	"pnpm run typecheck",
];
const REQUIRED_AGENTS_FRESHNESS_LINKS = [
	".agents/docs/architecture-overview.md",
	".agents/docs/workflows-extended.md",
	".agents/rules/api-surfaces.md",
	".agents/rules/token-priority.md",
	".agents/rules/component-architecture.md",
	".agents/rules/agent-operations.md",
];

function toPosixPath(filePath) {
	return filePath.split(path.sep).join("/");
}

function compareStrings(left, right) {
	if (left < right) {
		return -1;
	}
	if (left > right) {
		return 1;
	}
	return 0;
}

function isDocumentationFile(filePath) {
	return DOC_EXTENSIONS.has(path.extname(filePath));
}

function collectDocumentationFiles({ cwd = process.cwd(), targets = DEFAULT_DOC_TARGETS } = {}) {
	const files = [];

	function visit(absolutePath) {
		if (!fs.existsSync(absolutePath)) {
			return;
		}
		const stat = fs.statSync(absolutePath);
		if (stat.isDirectory()) {
			for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
				if (entry.name.startsWith(".")) {
					continue;
				}
				visit(path.join(absolutePath, entry.name));
			}
			return;
		}
		if (stat.isFile() && isDocumentationFile(absolutePath)) {
			files.push(toPosixPath(path.relative(cwd, absolutePath)));
		}
	}

	for (const target of targets) {
		visit(path.resolve(cwd, target));
	}

	return [...new Set(files)].sort(compareStrings);
}

function getLineNumber(content, index) {
	return content.slice(0, index).split(/\r?\n/u).length;
}

function extractPnpmRunScriptReferences(content, filePath = "unknown") {
	const references = [];
	const pattern = /(?:\bcorepack\s+)?\bpnpm\s+run\s+([A-Za-z0-9:_-]+)/gu;
	let match = pattern.exec(content);
	while (match) {
		references.push({
			command: match[0],
			filePath,
			line: getLineNumber(content, match.index),
			scriptName: match[1],
		});
		match = pattern.exec(content);
	}
	return references;
}

function extractLocalSkillEntrypointReferences(content, filePath = "unknown") {
	const references = [];
	const pattern = /(^|[\s`"'([:])((?:\.\/)?\.agents\/skills\/([A-Za-z0-9_-]+)\/SKILL\.md)/gmu;
	let match = pattern.exec(content);
	while (match) {
		const referencePath = match[2].replace(/^\.\//u, "");
		references.push({
			filePath,
			line: getLineNumber(content, match.index + match[1].length),
			referencePath,
			skillName: match[3],
		});
		match = pattern.exec(content);
	}
	return references;
}

function normalizeProviderName(name) {
	const parts = name.split(/[.:]/u);
	return parts[parts.length - 1] ?? name;
}

function getJsxTagName(tagName, sourceFile) {
	return normalizeProviderName(tagName.getText(sourceFile));
}

function unwrapExpression(expression) {
	if (ts.isParenthesizedExpression(expression)) {
		return unwrapExpression(expression.expression);
	}
	return expression;
}

function getPrimaryJsxElementChain(node, sourceFile) {
	const expression = unwrapExpression(node);
	if (ts.isJsxSelfClosingElement(expression)) {
		return [getJsxTagName(expression.tagName, sourceFile)];
	}
	if (ts.isJsxElement(expression)) {
		const name = getJsxTagName(expression.openingElement.tagName, sourceFile);
		const child = expression.children.find((item) => ts.isJsxElement(item));
		return child ? [name, ...getPrimaryJsxElementChain(child, sourceFile)] : [name];
	}
	if (ts.isJsxFragment(expression)) {
		const child = expression.children.find((item) => ts.isJsxElement(item));
		return child ? getPrimaryJsxElementChain(child, sourceFile) : [];
	}
	return [];
}

function extractProviderCompositionFromSource(source, filePath = PROVIDERS_SOURCE_PATH) {
	const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
	let providerStack = null;

	function visit(node) {
		if (
			providerStack === null &&
			ts.isFunctionDeclaration(node) &&
			node.name?.text === "Providers" &&
			node.body
		) {
			function findReturn(child) {
				if (providerStack !== null) {
					return;
				}
				if (ts.isReturnStatement(child) && child.expression) {
					providerStack = getPrimaryJsxElementChain(child.expression, sourceFile);
					return;
				}
				ts.forEachChild(child, findReturn);
			}
			ts.forEachChild(node.body, findReturn);
			return;
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);
	return providerStack ?? [];
}

function extractProviderCompositionFromDocs(content, filePath = PROVIDER_COMPOSITION_DOC_PATH) {
	const headingMatch = /^## Provider Composition\b.*$/mu.exec(content);
	if (!headingMatch) {
		return {
			filePath,
			line: 1,
			stack: [],
		};
	}

	const sectionStart = headingMatch.index;
	const sectionBodyStart = sectionStart + headingMatch[0].length;
	const remainingContent = content.slice(sectionBodyStart);
	const nextSectionMatch = /^## /mu.exec(remainingContent);
	const sectionBody = nextSectionMatch
		? remainingContent.slice(0, nextSectionMatch.index)
		: remainingContent;
	const blockMatch = /```text\s*([\s\S]*?)```/u.exec(sectionBody);
	if (!blockMatch) {
		return {
			filePath,
			line: getLineNumber(content, sectionBodyStart),
			stack: [],
		};
	}

	const blockStart = sectionBodyStart + sectionBody.indexOf(blockMatch[0]);
	return {
		filePath,
		line: getLineNumber(content, blockStart),
		stack: blockMatch[1]
			.split(/\r?\n/u)
			.map((line) => line.trim().replace(/^->\s*/u, "").trim())
			.filter(Boolean)
			.map(normalizeProviderName),
	};
}

function readPackageScripts(cwd = process.cwd()) {
	const packageJson = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
	return packageJson.scripts ?? {};
}

function formatProviderStack(stack) {
	return stack.join(" -> ");
}

function verifyProviderCompositionDocs({ cwd = process.cwd(), files = collectDocumentationFiles({ cwd }) } = {}) {
	if (!files.includes(PROVIDER_COMPOSITION_DOC_PATH)) {
		return {
			actualStack: [],
			documentedStack: [],
			failures: [],
		};
	}

	const docPath = path.join(cwd, PROVIDER_COMPOSITION_DOC_PATH);
	const sourcePath = path.join(cwd, PROVIDERS_SOURCE_PATH);
	const documented = extractProviderCompositionFromDocs(
		fs.readFileSync(docPath, "utf8"),
		PROVIDER_COMPOSITION_DOC_PATH,
	);
	const actualStack = fs.existsSync(sourcePath)
		? extractProviderCompositionFromSource(fs.readFileSync(sourcePath, "utf8"), PROVIDERS_SOURCE_PATH)
		: [];
	const documentedStack = documented.stack;

	if (
		documentedStack.length === actualStack.length &&
		documentedStack.every((item, index) => item === actualStack[index])
	) {
		return {
			actualStack,
			documentedStack,
			failures: [],
		};
	}

	return {
		actualStack,
		documentedStack,
		failures: [{
			filePath: PROVIDER_COMPOSITION_DOC_PATH,
			line: documented.line,
			message: `Provider Composition is out of sync with ${PROVIDERS_SOURCE_PATH}. Documented: ${formatProviderStack(documentedStack) || "(missing)"}. Actual: ${formatProviderStack(actualStack) || "(missing)"}.`,
			type: "provider-composition",
		}],
	};
}

function extractMarkedSection(content, beginMarker, endMarker, filePath = "unknown") {
	const beginIndex = content.indexOf(beginMarker);
	if (beginIndex === -1) {
		return {
			body: "",
			filePath,
			line: 1,
			missing: true,
		};
	}

	const bodyStart = beginIndex + beginMarker.length;
	const endIndex = content.indexOf(endMarker, bodyStart);
	if (endIndex === -1) {
		return {
			body: content.slice(bodyStart),
			filePath,
			line: getLineNumber(content, beginIndex),
			missingEnd: true,
		};
	}

	return {
		body: content.slice(bodyStart, endIndex),
		filePath,
		line: getLineNumber(content, beginIndex),
	};
}

function verifyAgentsFreshnessSection({ cwd = process.cwd(), files = collectDocumentationFiles({ cwd }) } = {}) {
	if (!files.includes(AGENTS_FRESHNESS_DOC_PATH)) {
		return {
			failures: [],
		};
	}

	const content = fs.readFileSync(path.join(cwd, AGENTS_FRESHNESS_DOC_PATH), "utf8");
	const section = extractMarkedSection(
		content,
		AGENTS_FRESHNESS_BEGIN,
		AGENTS_FRESHNESS_END,
		AGENTS_FRESHNESS_DOC_PATH,
	);
	if (section.missing) {
		return {
			failures: [{
				filePath: AGENTS_FRESHNESS_DOC_PATH,
				line: 1,
				message: `Missing ${AGENTS_FRESHNESS_BEGIN} block with validation freshness details.`,
				type: "agents-freshness",
			}],
		};
	}
	if (section.missingEnd) {
		return {
			failures: [{
				filePath: AGENTS_FRESHNESS_DOC_PATH,
				line: section.line,
				message: `Missing ${AGENTS_FRESHNESS_END} marker for validation freshness details.`,
				type: "agents-freshness",
			}],
		};
	}

	const failures = [];
	if (!/Last validated:\s*\d{4}-\d{2}-\d{2}/u.test(section.body)) {
		failures.push({
			filePath: AGENTS_FRESHNESS_DOC_PATH,
			line: section.line,
			message: "Validation freshness block must include `Last validated: YYYY-MM-DD`.",
			type: "agents-freshness",
		});
	}
	for (const command of REQUIRED_AGENTS_FRESHNESS_COMMANDS) {
		if (!section.body.includes(command)) {
			failures.push({
				filePath: AGENTS_FRESHNESS_DOC_PATH,
				line: section.line,
				message: `Validation freshness block is missing required command \`${command}\`.`,
				type: "agents-freshness",
			});
		}
	}
	for (const link of REQUIRED_AGENTS_FRESHNESS_LINKS) {
		if (!section.body.includes(link)) {
			failures.push({
				filePath: AGENTS_FRESHNESS_DOC_PATH,
				line: section.line,
				message: `Validation freshness block is missing required reference \`${link}\`.`,
				type: "agents-freshness",
			});
		}
	}

	return {
		failures,
	};
}

function verifyDocumentedScripts({
	cwd = process.cwd(),
	files = collectDocumentationFiles({ cwd }),
	packageScripts = readPackageScripts(cwd),
} = {}) {
	const scriptNames = new Set(Object.keys(packageScripts));
	const documents = files.map((filePath) => ({
		content: fs.readFileSync(path.join(cwd, filePath), "utf8"),
		filePath,
	}));
	const references = documents.flatMap(({ content, filePath }) => {
		return extractPnpmRunScriptReferences(content, filePath);
	});
	const skillReferences = documents.flatMap(({ content, filePath }) => {
		return extractLocalSkillEntrypointReferences(content, filePath);
	});
	const scriptFailures = references
		.filter((reference) => !scriptNames.has(reference.scriptName))
		.map((reference) => ({
			...reference,
			message: `Documented command \`${reference.command}\` references missing package.json script \`${reference.scriptName}\`.`,
		}));
	const skillFailures = skillReferences
		.filter((reference) => !fs.existsSync(path.join(cwd, reference.referencePath)))
		.map((reference) => ({
			...reference,
			message: `Documented local skill \`${reference.referencePath}\` does not exist.`,
		}));
	const providerComposition = verifyProviderCompositionDocs({ cwd, files });
	const agentsFreshness = verifyAgentsFreshnessSection({ cwd, files });

	return {
		failures: [...scriptFailures, ...skillFailures, ...providerComposition.failures, ...agentsFreshness.failures],
		fileCount: files.length,
		providerComposition: {
			actualStack: providerComposition.actualStack,
			documentedStack: providerComposition.documentedStack,
		},
		referenceCount: references.length,
		references,
		skillReferenceCount: skillReferences.length,
		skillReferences,
	};
}

function formatFailure(failure) {
	if (failure.command) {
		return `${failure.filePath}:${failure.line} ${failure.message}`;
	}
	if (failure.referencePath) {
		return `${failure.filePath}:${failure.line} ${failure.message}`;
	}
	if (failure.type === "provider-composition") {
		return `${failure.filePath}:${failure.line} ${failure.message}`;
	}
	if (failure.type === "agents-freshness") {
		return `${failure.filePath}:${failure.line} ${failure.message}`;
	}
	return `${failure.filePath ?? "unknown"}:${failure.line ?? 0} ${failure.message ?? "Unknown documentation reference failure."}`;
}

function parseArgs(argv) {
	const options = {
		json: false,
		targets: [],
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--json") {
			options.json = true;
			continue;
		}
		if (arg === "--target") {
			const value = argv[index + 1];
			if (!value) {
				throw new Error("--target requires a value");
			}
			options.targets.push(value);
			index += 1;
			continue;
		}
		if (arg.startsWith("--target=")) {
			const value = arg.slice("--target=".length);
			if (!value) {
				throw new Error("--target requires a value");
			}
			options.targets.push(value);
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}

	return options;
}

function main(argv = process.argv.slice(2), cwd = process.cwd()) {
	const options = parseArgs(argv);
	const targets = options.targets.length > 0 ? options.targets : DEFAULT_DOC_TARGETS;
	const result = verifyDocumentedScripts({
		cwd,
		files: collectDocumentationFiles({ cwd, targets }),
	});

	if (options.json) {
		console.log(JSON.stringify(result, null, "\t"));
	}

	if (result.failures.length > 0) {
		if (!options.json) {
			console.error("Documentation references are out of sync:");
			for (const failure of result.failures) {
				console.error(`- ${formatFailure(failure)}`);
			}
		}
		process.exitCode = 1;
		return;
	}

	if (!options.json) {
		console.log(`Verified documented pnpm run references (${result.referenceCount} references) and local skill entrypoints (${result.skillReferenceCount} references) in ${result.fileCount} files.`);
	}
}

if (require.main === module) {
	try {
		main();
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	}
}

module.exports = {
	DEFAULT_DOC_TARGETS,
	collectDocumentationFiles,
	extractProviderCompositionFromDocs,
	extractProviderCompositionFromSource,
	extractLocalSkillEntrypointReferences,
	extractPnpmRunScriptReferences,
	formatFailure,
	parseArgs,
	verifyAgentsFreshnessSection,
	verifyProviderCompositionDocs,
	verifyDocumentedScripts,
};
