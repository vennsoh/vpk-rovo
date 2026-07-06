#!/usr/bin/env node

const { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { buildSync } = require("esbuild");
const ts = require("typescript");

const OUTPUT_PATH = ".agents/knowledge/repo-map.json";
const ROUTE_MANIFEST_PATH = "backend/routes/route-manifest.json";
const COMPONENT_MANIFEST_ENTRY = "app/data/component-manifest.ts";
const APP_DIR = "app";
const PACKAGE_JSON_PATH = "package.json";
const LOCAL_SKILLS_DIR = ".agents/skills";

const VALIDATION_COMMANDS = [
	{
		command: "pnpm run verify:repo-map",
		scope: ".agents/knowledge/repo-map.json",
		reason: "Verify the generated repo map matches the current manifests.",
	},
	{
		command: "pnpm run verify:route-manifest",
		scope: "backend/routes/route-manifest.json",
		reason: "Verify route manifest extraction before trusting route ownership.",
	},
	{
		command: "pnpm run verify:catalog",
		scope: "app/data/component-manifest.ts",
		reason: "Verify component manifest and demo catalog consistency.",
	},
	{
		command: "pnpm run verify:lazy-load",
		scope: "app/**/page.tsx",
		reason: "Verify route shells do not statically import heavyweight optional runtimes.",
	},
	{
		command: "pnpm run perf:budget:warn",
		scope: "app components components/website app/data",
		reason: "Warn on bundle-budget drift after bundle-sensitive frontend or catalog changes.",
	},
	{
		command: "pnpm run verify:source-guardrails",
		scope: "app components backend hooks lib rovo scripts tests types",
		reason: "Verify source-suppression and legacy React context ratchets stay on the reviewed baseline.",
	},
	{
		command: "pnpm run verify:doc-scripts",
		scope: "AGENTS.md .agents/**/*.md .agents/**/*.mdc",
		reason: "Verify documented pnpm run commands still exist in package.json.",
	},
	{
		command: "pnpm run lint",
		scope: "repo",
		reason: "Run the standard lint gate after source changes.",
	},
	{
		command: "pnpm run typecheck",
		scope: "repo",
		reason: "Run the standard TypeScript gate after source changes.",
	},
];

function compareStrings(left, right) {
	if (left < right) {
		return -1;
	}
	if (left > right) {
		return 1;
	}
	return 0;
}

function toPosixPath(filePath) {
	return filePath.split(path.sep).join("/");
}

function stripSourceLocation(source) {
	if (typeof source !== "string" || source.length === 0) {
		return "unknown";
	}
	return source.replace(/:\d+(?::\d+)?$/u, "");
}

function readJson(filePath, cwd = process.cwd()) {
	return JSON.parse(readFileSync(path.join(cwd, filePath), "utf8"));
}

function readJsonIfExists(filePath, cwd = process.cwd(), fallback = null) {
	const absolutePath = path.join(cwd, filePath);
	if (!existsSync(absolutePath)) {
		return fallback;
	}
	return JSON.parse(readFileSync(absolutePath, "utf8"));
}

function walkFiles(rootDir) {
	if (!existsSync(rootDir)) {
		return [];
	}

	const entries = [];
	for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
		const entryPath = path.join(rootDir, entry.name);
		if (entry.isDirectory()) {
			entries.push(...walkFiles(entryPath));
			continue;
		}
		if (entry.isFile()) {
			entries.push(entryPath);
		}
	}
	return entries;
}

function bundleModule(entryPoint, cwd = process.cwd()) {
	const tempDir = mkdtempSync(path.join(os.tmpdir(), "vpk-repo-map-"));
	const outfile = path.join(tempDir, "module.cjs");
	try {
		buildSync({
			bundle: true,
			entryPoints: [path.join(cwd, entryPoint)],
			external: ["*.css"],
			format: "cjs",
			logLevel: "silent",
			outfile,
			platform: "node",
			tsconfig: path.join(cwd, "tsconfig.json"),
		});
		return {
			module: require(outfile),
			tempDir,
		};
	} catch (error) {
		rmSync(tempDir, { force: true, recursive: true });
		throw error;
	}
}

function loadComponentManifest(entryPoint = COMPONENT_MANIFEST_ENTRY, cwd = process.cwd()) {
	const bundled = bundleModule(entryPoint, cwd);
	try {
		if (typeof bundled.module.getAllComponents !== "function") {
			throw new Error(`${entryPoint} must export getAllComponents().`);
		}
		return bundled.module.getAllComponents();
	} finally {
		rmSync(bundled.tempDir, { force: true, recursive: true });
	}
}

function normalizeBackendRoute(route) {
	const normalized = {
		method: route.method,
		path: route.path,
		source: route.source,
	};
	if (typeof route.runtimeAdmin === "boolean") {
		normalized.runtimeAdmin = route.runtimeAdmin;
	}
	return normalized;
}

function normalizeTarget(target) {
	return {
		method: target.method,
		path: target.path,
		source: target.source,
	};
}

function normalizeNextApiRoute(route) {
	const targets = Array.isArray(route.targets)
		? route.targets.map(normalizeTarget).sort(compareRouteEntries)
		: [];
	return {
		method: route.method,
		path: route.nextPath ?? route.path,
		source: route.source,
		targets,
	};
}

function compareRouteEntries(left, right) {
	return (
		compareStrings(left.path ?? "", right.path ?? "") ||
		compareStrings(left.method ?? "", right.method ?? "") ||
		compareStrings(left.source ?? "", right.source ?? "")
	);
}

function addOwnerRoute(ownerMap, kind, route) {
	const owner = stripSourceLocation(route.source);
	const key = `${kind}:${owner}`;
	if (!ownerMap.has(key)) {
		ownerMap.set(key, {
			kind,
			owner,
			routeCount: 0,
			routes: [],
		});
	}
	const record = ownerMap.get(key);
	record.routes.push(route);
	record.routeCount += 1;
}

function buildRouteMap(routeManifest) {
	const backendRoutes = Array.isArray(routeManifest.backendRoutes) ? routeManifest.backendRoutes : [];
	const nextApiRoutes = Array.isArray(routeManifest.nextApiRoutes) ? routeManifest.nextApiRoutes : [];
	const ownerMap = new Map();

	for (const route of backendRoutes.map(normalizeBackendRoute)) {
		addOwnerRoute(ownerMap, "backend", route);
	}
	for (const route of nextApiRoutes.map(normalizeNextApiRoute)) {
		addOwnerRoute(ownerMap, "next-api", route);
	}

	const owners = [...ownerMap.values()]
		.map((owner) => ({
			...owner,
			routes: owner.routes.sort(compareRouteEntries),
		}))
		.sort((left, right) => {
			return (
				compareStrings(left.kind, right.kind) ||
				compareStrings(left.owner, right.owner)
			);
		});

	return {
		summary: {
			backendRouteCount: backendRoutes.length,
			nextApiRouteCount: nextApiRoutes.length,
			ownerCount: owners.length,
			runtimeAdminRouteCount: backendRoutes.filter((route) => route.runtimeAdmin === true).length,
		},
		owners,
	};
}

function normalizeComponent(component) {
	return {
		category: component.category,
		slug: component.slug,
		name: component.name,
		importPath: component.importPath,
	};
}

function buildComponentMap(components) {
	const categoryMap = new Map();

	for (const component of components.map(normalizeComponent)) {
		if (!categoryMap.has(component.category)) {
			categoryMap.set(component.category, []);
		}
		categoryMap.get(component.category).push(component);
	}

	const categories = [...categoryMap.entries()]
		.map(([category, entries]) => ({
			category,
			entryCount: entries.length,
			entries: entries.sort((left, right) => {
				return (
					compareStrings(left.slug, right.slug) ||
					compareStrings(left.name, right.name) ||
					compareStrings(left.importPath, right.importPath)
				);
			}),
		}))
		.sort((left, right) => compareStrings(left.category, right.category));

	return {
		summary: {
			manifestEntryCount: components.length,
			categoryCount: categories.length,
		},
		categories,
	};
}

function routePathFromPageFile(filePath, appDir = APP_DIR) {
	const relativePath = toPosixPath(path.relative(appDir, filePath));
	const routePart = relativePath.replace(/\/?page\.tsx$/u, "");
	if (!routePart) {
		return "/";
	}

	const visibleSegments = routePart
		.split("/")
		.filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));
	return `/${visibleSegments.join("/")}`.replace(/\/+$/u, "") || "/";
}

function getImportSymbols(importClause) {
	if (!importClause) {
		return [];
	}

	const symbols = [];
	if (importClause.name) {
		symbols.push(importClause.name.text);
	}
	if (importClause.namedBindings && ts.isNamespaceImport(importClause.namedBindings)) {
		symbols.push(importClause.namedBindings.name.text);
	}
	if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
		for (const element of importClause.namedBindings.elements) {
			symbols.push(element.name.text);
		}
	}
	return [...new Set(symbols)].sort(compareStrings);
}

function collectJsxIdentifiers(sourceFile) {
	const identifiers = new Set();

	function addJsxTagName(tagName) {
		if (ts.isIdentifier(tagName)) {
			if (/^[A-Z]/u.test(tagName.text)) {
				identifiers.add(tagName.text);
			}
			return;
		}
		if (ts.isPropertyAccessExpression(tagName) && /^[A-Z]/u.test(tagName.getText(sourceFile))) {
			identifiers.add(tagName.getText(sourceFile));
		}
	}

	function visit(node) {
		if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
			addJsxTagName(node.tagName);
		}
		ts.forEachChild(node, visit);
	}

	visit(sourceFile);
	return identifiers;
}

function normalizeLocalImportSource({ importPath, sourceFilePath }) {
	if (importPath.startsWith("@/")) {
		return importPath.slice(2);
	}
	if (!importPath.startsWith(".")) {
		return null;
	}

	return toPosixPath(path.normalize(path.join(path.dirname(sourceFilePath), importPath)));
}

function isAppPageOwnerImport(source) {
	return (
		source.startsWith("app/") ||
		source.startsWith("components/")
	);
}

function collectAppPageRoutes({ appDir = APP_DIR, cwd = process.cwd() } = {}) {
	const absoluteAppDir = path.join(cwd, appDir);
	return walkFiles(absoluteAppDir)
		.filter((filePath) => filePath.endsWith(`${path.sep}page.tsx`))
		.map((absolutePagePath) => {
			const source = toPosixPath(path.relative(cwd, absolutePagePath));
			const sourceFile = ts.createSourceFile(
				source,
				readFileSync(absolutePagePath, "utf8"),
				ts.ScriptTarget.Latest,
				true,
				ts.ScriptKind.TSX,
			);
			const owners = [];
			const jsxIdentifiers = collectJsxIdentifiers(sourceFile);

			for (const statement of sourceFile.statements) {
				if (
					!ts.isImportDeclaration(statement) ||
					!ts.isStringLiteral(statement.moduleSpecifier)
				) {
					continue;
				}

				const importPath = statement.moduleSpecifier.text;
				const normalizedSource = normalizeLocalImportSource({
					importPath,
					sourceFilePath: source,
				});
				if (!normalizedSource || !isAppPageOwnerImport(normalizedSource)) {
					continue;
				}

				owners.push({
					importPath,
					source: normalizedSource,
					symbols: getImportSymbols(statement.importClause),
				});
			}
			const shellOwners = owners
				.filter((owner) => owner.symbols.some((symbol) => jsxIdentifiers.has(symbol)))
				.map((owner) => ({ ...owner }))
				.sort((left, right) => compareStrings(left.source, right.source));

			return {
				ownerCount: owners.length,
				owners: owners.sort((left, right) => compareStrings(left.source, right.source)),
				routePath: routePathFromPageFile(source, appDir),
				shellOwnerCount: shellOwners.length,
				shellOwners,
				source,
			};
		})
		.sort((left, right) => compareStrings(left.routePath, right.routePath) || compareStrings(left.source, right.source));
}

function buildAppPageMap(appPageRoutes) {
	const ownerCount = appPageRoutes.reduce((total, route) => total + route.ownerCount, 0);
	return {
		summary: {
			ownerImportCount: ownerCount,
			pageCount: appPageRoutes.length,
		},
		pages: appPageRoutes,
	};
}

function extractPrefixSelections(command) {
	const prefixMatch = /--prefix(?:=|\s+)(?:"([^"]+)"|'([^']+)'|([^\s]+))/u.exec(command);
	if (!prefixMatch) {
		return [];
	}
	const rawPrefixes = prefixMatch[1] ?? prefixMatch[2] ?? prefixMatch[3] ?? "";
	return rawPrefixes
		.split(",")
		.map((prefix) => prefix.trim())
		.filter(Boolean)
		.sort(compareStrings);
}

function extractExplicitNodeTestFiles(command) {
	const files = [];
	const nodeTestPattern = /node\s+--test\s+([^&]+)/gu;
	let match = nodeTestPattern.exec(command);
	while (match) {
		files.push(...match[1]
			.trim()
			.split(/\s+/u)
			.filter((part) => /\.test\.[cm]?[jt]s$/u.test(part)));
		match = nodeTestPattern.exec(command);
	}
	return [...new Set(files)].sort(compareStrings);
}

function buildTestSliceMap(packageJson = {}) {
	const scripts = packageJson.scripts ?? {};
	const slices = Object.entries(scripts)
		.filter(([name]) => name.startsWith("test:"))
		.map(([name, command]) => ({
			command,
			files: extractExplicitNodeTestFiles(command),
			name,
			prefixes: extractPrefixSelections(command),
		}))
		.sort((left, right) => compareStrings(left.name, right.name));

	return {
		summary: {
			sliceCount: slices.length,
		},
		slices,
	};
}

function parseSkillFrontmatter(source) {
	const lines = source.split(/\r?\n/u);
	if (lines[0] !== "---") {
		return {};
	}

	const fields = {};
	for (let index = 1; index < lines.length; index += 1) {
		const line = lines[index];
		if (line === "---") {
			break;
		}
		const match = /^([A-Za-z0-9_-]+):\s*(.*)$/u.exec(line);
		if (!match) {
			continue;
		}
		const [, key, rawValue] = match;
		const inlineValue = rawValue.trim().replace(/^["']|["']$/gu, "");
		if (["|", "|-", "|+", ">", ">-", ">+"].includes(inlineValue)) {
			const blockLines = [];
			while (index + 1 < lines.length) {
				const nextLine = lines[index + 1];
				if (nextLine === "---" || /^[A-Za-z0-9_-]+:/u.test(nextLine)) {
					break;
				}
				index += 1;
				if (nextLine.trim()) {
					blockLines.push(nextLine.trim());
				}
			}
			fields[key] = blockLines.join(" ").trim();
			continue;
		}
		const continuationLines = [];
		while (index + 1 < lines.length) {
			const nextLine = lines[index + 1];
			if (nextLine === "---" || /^[A-Za-z0-9_-]+:/u.test(nextLine)) {
				break;
			}
			index += 1;
			if (nextLine.trim()) {
				continuationLines.push(nextLine.trim());
			}
		}
		fields[key] = [inlineValue, ...continuationLines].filter(Boolean).join(" ").trim();
	}
	return fields;
}

function collectLocalSkills({ cwd = process.cwd(), skillsDir = LOCAL_SKILLS_DIR } = {}) {
	const absoluteSkillsDir = path.join(cwd, skillsDir);
	if (!existsSync(absoluteSkillsDir)) {
		return [];
	}

	return readdirSync(absoluteSkillsDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => {
			const skillPath = toPosixPath(path.join(skillsDir, entry.name));
			const skillFilePath = path.join(cwd, skillPath, "SKILL.md");
			if (!existsSync(skillFilePath)) {
				return null;
			}
			const frontmatter = parseSkillFrontmatter(readFileSync(skillFilePath, "utf8"));
			return {
				description: frontmatter.description ?? "",
				name: frontmatter.name ?? entry.name,
				path: `${skillPath}/SKILL.md`,
				validationCommand: `node scripts/validate-skills.js --target ${skillPath}`,
			};
		})
		.filter(Boolean)
		.sort((left, right) => compareStrings(left.name, right.name));
}

function buildSkillMap(localSkills = []) {
	return {
		summary: {
			localSkillCount: localSkills.length,
		},
		localSkills,
	};
}

function cloneValidationCommands(validationCommands = VALIDATION_COMMANDS) {
	return validationCommands.map((command) => ({ ...command }));
}

function buildRepoMap({
	appPageRoutes = [],
	routeManifest,
	components,
	localSkills = [],
	packageJson = {},
	routeManifestPath = ROUTE_MANIFEST_PATH,
	componentManifestEntry = COMPONENT_MANIFEST_ENTRY,
	validationCommands = VALIDATION_COMMANDS,
}) {
	return {
		version: 1,
		generatedBy: "scripts/generate-repo-map.js",
		sources: {
			routeManifest: routeManifestPath,
			componentManifest: componentManifestEntry,
			appPages: `${APP_DIR}/**/page.tsx`,
			packageJson: PACKAGE_JSON_PATH,
			localSkills: `${LOCAL_SKILLS_DIR}/*/SKILL.md`,
		},
		routes: buildRouteMap(routeManifest),
		appPages: buildAppPageMap(appPageRoutes),
		components: buildComponentMap(components),
		testSlices: buildTestSliceMap(packageJson),
		skills: buildSkillMap(localSkills),
		validationCommands: cloneValidationCommands(validationCommands),
	};
}

function serializeRepoMap(repoMap) {
	return `${JSON.stringify(repoMap, null, "\t")}\n`;
}

function generateRepoMapText({
	cwd = process.cwd(),
	routeManifestPath = ROUTE_MANIFEST_PATH,
	componentManifestEntry = COMPONENT_MANIFEST_ENTRY,
	components,
	appPageRoutes,
	localSkills,
	packageJson,
} = {}) {
	const routeManifest = readJson(routeManifestPath, cwd);
	const componentEntries = components ?? loadComponentManifest(componentManifestEntry, cwd);
	const pageRoutes = appPageRoutes ?? collectAppPageRoutes({ cwd });
	const skills = localSkills ?? collectLocalSkills({ cwd });
	const packageData = packageJson ?? readJsonIfExists(PACKAGE_JSON_PATH, cwd, { scripts: {} });
	return serializeRepoMap(buildRepoMap({
		appPageRoutes: pageRoutes,
		componentManifestEntry,
		components: componentEntries,
		localSkills: skills,
		packageJson: packageData,
		routeManifest,
		routeManifestPath,
	}));
}

function writeRepoMap({
	cwd = process.cwd(),
	outputPath = OUTPUT_PATH,
	routeManifestPath = ROUTE_MANIFEST_PATH,
	componentManifestEntry = COMPONENT_MANIFEST_ENTRY,
	components,
	appPageRoutes,
	localSkills,
	packageJson,
} = {}) {
	const text = generateRepoMapText({
		appPageRoutes,
		componentManifestEntry,
		components,
		cwd,
		localSkills,
		packageJson,
		routeManifestPath,
	});
	const absoluteOutputPath = path.join(cwd, outputPath);
	mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
	writeFileSync(absoluteOutputPath, text);
	return text;
}

function checkRepoMap({
	cwd = process.cwd(),
	outputPath = OUTPUT_PATH,
	routeManifestPath = ROUTE_MANIFEST_PATH,
	componentManifestEntry = COMPONENT_MANIFEST_ENTRY,
	components,
	appPageRoutes,
	localSkills,
	packageJson,
} = {}) {
	const expectedText = generateRepoMapText({
		appPageRoutes,
		componentManifestEntry,
		components,
		cwd,
		localSkills,
		packageJson,
		routeManifestPath,
	});
	const absoluteOutputPath = path.join(cwd, outputPath);
	const actualText = existsSync(absoluteOutputPath)
		? readFileSync(absoluteOutputPath, "utf8")
		: null;
	return {
		actualText,
		expectedText,
		isCurrent: actualText === expectedText,
		outputPath,
	};
}

function parseArgs(argv) {
	const options = {
		check: false,
	};

	for (const arg of argv) {
		if (arg === "--check") {
			options.check = true;
			continue;
		}
		if (arg === "--help" || arg === "-h") {
			options.help = true;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}

	return options;
}

function printHelp() {
	console.log([
		"Usage: node scripts/generate-repo-map.js [--check]",
		"",
		"Generates .agents/knowledge/repo-map.json from route and component manifests.",
		"",
		"Options:",
		"  --check  Verify the generated file is current without writing it.",
		"  --help   Show this help.",
	].join("\n"));
}

function main(argv = process.argv.slice(2), cwd = process.cwd()) {
	const options = parseArgs(argv);

	if (options.help) {
		printHelp();
		return;
	}

	if (options.check) {
		const result = checkRepoMap({ cwd });
		if (!result.isCurrent) {
			console.error(`${result.outputPath} is out of date. Run: node scripts/generate-repo-map.js`);
			process.exitCode = 1;
			return;
		}
		console.log(`${result.outputPath} is current.`);
		return;
	}

	writeRepoMap({ cwd });
	console.log(`Generated ${OUTPUT_PATH}.`);
}

if (require.main === module) {
	try {
		main();
	} catch (error) {
		console.error(error.message);
		process.exitCode = 1;
	}
}

module.exports = {
	buildAppPageMap,
	buildComponentMap,
	buildRepoMap,
	buildSkillMap,
	buildTestSliceMap,
	buildRouteMap,
	checkRepoMap,
	collectAppPageRoutes,
	collectLocalSkills,
	extractExplicitNodeTestFiles,
	extractPrefixSelections,
	generateRepoMapText,
	loadComponentManifest,
	normalizeLocalImportSource,
	routePathFromPageFile,
	serializeRepoMap,
	stripSourceLocation,
	writeRepoMap,
};
