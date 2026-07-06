#!/usr/bin/env node

"use strict";

const { readFileSync, writeFileSync } = require("node:fs");
const path = require("node:path");

const DOC_PATH = ".agents/rules/api-surfaces.md";
const ROUTE_MANIFEST_PATH = "backend/routes/route-manifest.json";
const GENERATED_BEGIN = "<!-- generated:begin -->";
const GENERATED_END = "<!-- generated:end -->";

function readJson(filePath, cwd = process.cwd()) {
	return JSON.parse(readFileSync(path.join(cwd, filePath), "utf8"));
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

function compareRoutes(left, right) {
	return (
		compareStrings(left.path ?? left.nextPath ?? "", right.path ?? right.nextPath ?? "") ||
		compareStrings(left.method ?? "", right.method ?? "") ||
		compareStrings(left.source ?? "", right.source ?? "")
	);
}

function escapeMarkdownTableCell(value) {
	return String(value ?? "")
		.replace(/\|/gu, "\\|")
		.replace(/\n/gu, "<br>");
}

function formatBoolean(value) {
	return value ? "yes" : "no";
}

function formatBackendRouteRow(route) {
	return `| \`${escapeMarkdownTableCell(route.method)}\` | \`${escapeMarkdownTableCell(route.path)}\` | ${formatBoolean(route.runtimeAdmin)} | \`${escapeMarkdownTableCell(route.source)}\` |`;
}

function formatNextApiTargets(route) {
	if (!Array.isArray(route.targets) || route.targets.length === 0) {
		return "";
	}

	return route.targets
		.slice()
		.sort(compareRoutes)
		.map((target) => `\`${escapeMarkdownTableCell(target.method)} ${escapeMarkdownTableCell(target.path)}\``)
		.join("<br>");
}

function formatNextApiRouteRow(route) {
	return `| \`${escapeMarkdownTableCell(route.method)}\` | \`${escapeMarkdownTableCell(route.nextPath)}\` | ${formatNextApiTargets(route)} | \`${escapeMarkdownTableCell(route.source)}\` |`;
}

function buildGeneratedSection(routeManifest) {
	const backendRoutes = Array.isArray(routeManifest.backendRoutes)
		? routeManifest.backendRoutes.slice().sort(compareRoutes)
		: [];
	const nextApiRoutes = Array.isArray(routeManifest.nextApiRoutes)
		? routeManifest.nextApiRoutes.slice().sort(compareRoutes)
		: [];
	const runtimeAdminCount = backendRoutes.filter((route) => route.runtimeAdmin === true).length;

	return [
		"## Generated Endpoint Tables",
		"",
		GENERATED_BEGIN,
		"<!-- Do not edit this section by hand. Run `node scripts/generate-api-surfaces.js`. -->",
		"",
		`Generated from \`${ROUTE_MANIFEST_PATH}\`. Backend routes: ${backendRoutes.length}; runtime-admin routes: ${runtimeAdminCount}; Next API routes: ${nextApiRoutes.length}.`,
		"",
		"### Backend Routes",
		"",
		"| Method | Path | Runtime admin | Source |",
		"| --- | --- | --- | --- |",
		...backendRoutes.map(formatBackendRouteRow),
		"",
		"### Next API Proxy Routes",
		"",
		"| Method | Next path | Backend targets | Source |",
		"| --- | --- | --- | --- |",
		...nextApiRoutes.map(formatNextApiRouteRow),
		"",
		GENERATED_END,
		"",
	].join("\n");
}

function replaceGeneratedSection(documentText, generatedSection) {
	const beginIndex = documentText.indexOf(GENERATED_BEGIN);
	const endIndex = documentText.indexOf(GENERATED_END);
	if (beginIndex !== -1 || endIndex !== -1) {
		if (beginIndex === -1 || endIndex === -1 || endIndex < beginIndex) {
			throw new Error("api-surfaces generated markers are malformed.");
		}

		const sectionStart = documentText.lastIndexOf("\n## ", beginIndex);
		const replacementStart = sectionStart === -1 ? beginIndex : sectionStart + 1;
		const replacementEnd = documentText.indexOf("\n", endIndex);
		return [
			documentText.slice(0, replacementStart),
			generatedSection,
			documentText.slice(replacementEnd === -1 ? documentText.length : replacementEnd + 1),
		].join("");
	}

	const legacySectionStart = documentText.indexOf("\n## Backend ");
	if (legacySectionStart !== -1) {
		return `${documentText.slice(0, legacySectionStart + 1)}${generatedSection}`;
	}

	return `${documentText.replace(/\s*$/u, "\n\n")}${generatedSection}`;
}

function updateApiSurfacesDocument({
	docPath = DOC_PATH,
	manifestPath = ROUTE_MANIFEST_PATH,
	cwd = process.cwd(),
	write = true,
} = {}) {
	const absoluteDocPath = path.join(cwd, docPath);
	const documentText = readFileSync(absoluteDocPath, "utf8");
	const routeManifest = readJson(manifestPath, cwd);
	const nextDocumentText = replaceGeneratedSection(
		documentText,
		buildGeneratedSection(routeManifest),
	);

	if (write && nextDocumentText !== documentText) {
		writeFileSync(absoluteDocPath, nextDocumentText);
	}

	return {
		changed: nextDocumentText !== documentText,
		docPath,
		nextDocumentText,
	};
}

function main() {
	const check = process.argv.includes("--check");
	const result = updateApiSurfacesDocument({ write: !check });

	if (check && result.changed) {
		console.error(`${result.docPath} is out of date. Run: node scripts/generate-api-surfaces.js`);
		process.exitCode = 1;
		return;
	}

	console.log(
		result.changed
			? `Updated ${result.docPath}`
			: `Verified ${result.docPath}`,
	);
}

if (require.main === module) {
	main();
}

module.exports = {
	DOC_PATH,
	GENERATED_BEGIN,
	GENERATED_END,
	ROUTE_MANIFEST_PATH,
	buildGeneratedSection,
	replaceGeneratedSection,
	updateApiSurfacesDocument,
};
