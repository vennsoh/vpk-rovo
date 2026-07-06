const assert = require("node:assert/strict");
const { mkdirSync, mkdtempSync, rmSync, writeFileSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	collectDemoFiles,
	collectRegistryData,
	getComponentAddPlan,
	loadComponentEntries,
	resolveProjectImport,
	resolveRegistryImport,
	summarizeDiagnostics,
	validateComponentCatalog,
} = require("./verify-component-catalog");

test("component add plan derives split ui registry and detail targets", () => {
	const plan = getComponentAddPlan({
		category: "ui",
		components: [],
		detailRecords: { ui: {} },
		registryData: {
			primary: { ui: {} },
			variants: { ui: {} },
		},
		slug: "new-button",
	});

	assert.equal(plan.key, "ui/new-button");
	assert.equal(plan.importPath, "@/components/ui/new-button");
	assert.equal(plan.paths.source, "components/ui/new-button");
	assert.equal(plan.paths.detailLeaf, "app/data/details/ui/new-button.ts");
	assert.equal(plan.paths.detailBarrel, "app/data/details/ui.ts");
	assert.equal(plan.paths.demo, "components/website/demos/ui/new-button-demo.tsx");
	assert.equal(plan.paths.primaryRegistry, "components/website/registry/ui/primary.ts");
	assert.equal(plan.paths.variantRegistry, "components/website/registry/ui/variants-*.ts");
	assert.equal(plan.snippets.detailImport, 'import { NEW_BUTTON_DETAIL } from "./ui/new-button";');
	assert.equal(plan.snippets.detailRecord, '"new-button": NEW_BUTTON_DETAIL,');
	assert.equal(plan.snippets.manifestEntry, 'uiComponent("new-button", "New Button")');
	assert.equal(plan.snippets.primaryRegistryEntry, '"new-button": dynamic(() => import("../../demos/ui/new-button-demo"), { ssr: false }),');
	assert.deepEqual(plan.status, {
		detail: false,
		manifest: false,
		primaryRegistry: false,
		variantRegistrySlugs: [],
	});
});

test("component add plan reports existing graph entries and utility demo paths", () => {
	const plan = getComponentAddPlan({
		category: "utility",
		components: [
			{
				category: "utility",
				importPath: "@/components/website/demos/utils/agent-browser-demo",
				name: "Agent Browser",
				slug: "agent-browser",
			},
		],
		detailRecords: {
			utility: {
				"agent-browser": { description: "Browser utility" },
			},
		},
		registryData: {
			primary: {
				utility: {
					"agent-browser": { imports: [] },
				},
			},
			variants: {
				utility: {
					"agent-browser-empty": { imports: [] },
				},
			},
		},
		slug: "agent-browser",
	});

	assert.equal(plan.paths.source, "components/website/demos/utils/agent-browser-demo");
	assert.equal(plan.paths.demo, "components/website/demos/utils/agent-browser-demo.tsx");
	assert.equal(plan.paths.primaryRegistry, "components/website/registry/utility.ts");
	assert.equal(plan.snippets.manifestEntry, 'utilityComponent("agent-browser", "Agent Browser")');
	assert.equal(plan.snippets.primaryRegistryEntry, '"agent-browser": dynamic(() => import("../demos/utils/agent-browser-demo"), { ssr: false }),');
	assert.deepEqual(plan.status, {
		detail: true,
		manifest: true,
		primaryRegistry: true,
		variantRegistrySlugs: ["agent-browser-empty"],
	});
});

test("component catalog validator reports missing registry imports and example slugs", () => {
	const diagnostics = validateComponentCatalog({
		cwd: process.cwd(),
		components: [
			{
				category: "ui",
				detail: {
					description: "Button",
					examples: [{ title: "Missing", demoSlug: "button-demo-missing" }],
				},
				importPath: "@/components/ui/button",
				name: "Button",
				slug: "button",
			},
			{
				category: "ui",
				detail: { description: "Duplicate" },
				importPath: "@/components/ui/button",
				name: "Button duplicate",
				slug: "button",
			},
		],
		detailRecords: {
			ui: {
				button: { description: "Button" },
				orphan: { description: "Orphan" },
			},
		},
		registryData: {
			primary: {
				ui: {
					button: { imports: ["./demos/ui/definitely-missing-demo"] },
					orphan: { imports: [] },
				},
			},
			variants: {
				ui: {},
			},
		},
	});
	const summary = summarizeDiagnostics(diagnostics);

	assert.match(summary.errors.map((error) => error.message).join("\n"), /Duplicate component manifest entry ui\/button/);
	assert.match(summary.errors.map((error) => error.message).join("\n"), /imports missing module/);
	assert.match(summary.warnings.map((warning) => warning.message).join("\n"), /button-demo-missing/);
	assert.match(summary.warnings.map((warning) => warning.message).join("\n"), /Detail record ui\/orphan/);
	assert.match(summary.warnings.map((warning) => warning.message).join("\n"), /Primary registry entry ui\/orphan/);
});

test("component catalog validator accepts primary and variant example slugs", () => {
	const diagnostics = validateComponentCatalog({
		cwd: process.cwd(),
		components: [
			{
				category: "ui",
				detail: {
					description: "Button",
					examples: [
						{ title: "Primary example", demoSlug: "button" },
						{ title: "Variant", demoSlug: "button-demo-variant" },
					],
				},
				importPath: "@/components/ui/button",
				name: "Button",
				slug: "button",
			},
		],
		detailRecords: {
			ui: {
				button: { description: "Button" },
			},
		},
		registryData: {
			primary: {
				ui: {
					button: { imports: ["./demos/ui/button-demo"] },
				},
			},
			variants: {
				ui: {
					"button-demo-variant": { imports: ["./demos/ui/button-group-demo"] },
				},
			},
		},
	});

	assert.deepEqual(summarizeDiagnostics(diagnostics), {
		errors: [],
		warnings: [],
	});
});

test("component catalog validator reports registry keys without demo imports", () => {
	const diagnostics = validateComponentCatalog({
		cwd: process.cwd(),
		components: [
			{
				category: "ui",
				detail: { description: "Button" },
				importPath: "@/components/ui/button",
				name: "Button",
				slug: "button",
			},
		],
		detailRecords: {
			ui: {
				button: { description: "Button" },
			},
		},
		registryData: {
			primary: {
				ui: {
					button: { imports: [] },
				},
			},
			variants: {
				ui: {},
			},
		},
	});
	const summary = summarizeDiagnostics(diagnostics);

	assert.match(summary.errors.map((error) => error.message).join("\n"), /primary registry ui\/button has no demo import/);
});

test("component catalog validator reports manifest entries without primary registry entries", () => {
	const diagnostics = validateComponentCatalog({
		cwd: process.cwd(),
		components: [
			{
				category: "blocks",
				detail: { description: "Work item detail" },
				importPath: "@/components/blocks/work-item-detail",
				name: "Work Item Detail",
				slug: "work-item-detail",
			},
		],
		detailRecords: {
			blocks: {
				"work-item-detail": { description: "Work item detail" },
			},
		},
		registryData: {
			primary: {
				blocks: {},
			},
			variants: {
				blocks: {},
			},
		},
	});
	const summary = summarizeDiagnostics(diagnostics);

	assert.match(summary.warnings.map((warning) => warning.message).join("\n"), /blocks\/work-item-detail has no primary registry entry/);
});

test("component loader reads the editable manifest source", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-catalog-manifest-source-"));
	try {
		mkdirSync(path.join(cwd, "app/data"), { recursive: true });
		writeFileSync(path.join(cwd, "tsconfig.json"), "{}\n");
		writeFileSync(
			path.join(cwd, "app/data/component-manifest.ts"),
			[
				"export function getAllComponents() {",
				'\treturn [{ category: "ui", importPath: "@/components/ui/button", name: "Button", slug: "button" }];',
				"}",
				"",
			].join("\n"),
		);
		writeFileSync(
			path.join(cwd, "app/data/components.ts"),
			[
				"export function getAllComponents() {",
				'\treturn [{ category: "ui", importPath: "@/components/ui/badge", name: "Badge", slug: "badge" }];',
				"}",
				"",
			].join("\n"),
		);

		assert.deepEqual(loadComponentEntries(cwd), [
			{ category: "ui", importPath: "@/components/ui/button", name: "Button", slug: "button" },
		]);
	} finally {
		rmSync(cwd, { force: true, recursive: true });
	}
});

test("registry import resolver only accepts directories through an index module", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-catalog-import-"));
	try {
		const registryDir = path.join(cwd, "components/website");
		mkdirSync(path.join(registryDir, "demos/ui/folder-demo"), { recursive: true });
		assert.equal(resolveRegistryImport("./demos/ui/folder-demo", cwd), null);

		const indexPath = path.join(registryDir, "demos/ui/folder-demo/index.tsx");
		writeFileSync(indexPath, "export default function Demo() { return null; }\n");
		assert.equal(resolveRegistryImport("./demos/ui/folder-demo", cwd), indexPath);
	} finally {
		rmSync(cwd, { force: true, recursive: true });
	}
});

test("project import resolver follows repo alias imports", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-catalog-project-import-"));
	try {
		const demoDir = path.join(cwd, "components/website/demos/visual");
		mkdirSync(demoDir, { recursive: true });
		const demoPath = path.join(demoDir, "shader-demo.tsx");
		writeFileSync(demoPath, "export default function Demo() { return null; }\n");

		assert.equal(resolveProjectImport("@/components/website/demos/visual/shader-demo", cwd), demoPath);
		assert.equal(resolveProjectImport("./components/website/demos/visual/shader-demo", cwd), null);
	} finally {
		rmSync(cwd, { force: true, recursive: true });
	}
});

test("component catalog validator reports orphan demo files absent from registry and manifest", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-catalog-orphan-demo-"));
	try {
		const demoDir = path.join(cwd, "components/website/demos/ui");
		const visualDemoDir = path.join(cwd, "components/website/demos/visual");
		const variantDemoDir = path.join(demoDir, "button");
		mkdirSync(demoDir, { recursive: true });
		mkdirSync(variantDemoDir, { recursive: true });
		mkdirSync(visualDemoDir, { recursive: true });
		writeFileSync(path.join(demoDir, "button-demo.tsx"), "export default function Demo() { return null; }\n");
		writeFileSync(path.join(demoDir, "orphan-demo.tsx"), "export default function Demo() { return null; }\n");
		writeFileSync(path.join(variantDemoDir, "button-demo-default.tsx"), "export default function Demo() { return null; }\n");
		writeFileSync(path.join(variantDemoDir, "button-demo-helper.ts"), "export function helper() { return null; }\n");
		writeFileSync(path.join(visualDemoDir, "shared-shader-demo.tsx"), "export default function Demo() { return null; }\n");
		writeFileSync(path.join(visualDemoDir, "shared-shader-demo.test.js"), "module.exports = {};\n");

		const demoFiles = collectDemoFiles(cwd);
		assert.deepEqual(demoFiles, [
			"components/website/demos/ui/button-demo.tsx",
			"components/website/demos/ui/button/button-demo-default.tsx",
			"components/website/demos/ui/orphan-demo.tsx",
			"components/website/demos/visual/shared-shader-demo.tsx",
		]);

		const diagnostics = validateComponentCatalog({
			cwd,
			components: [
				{
					category: "ui",
					detail: { description: "Button" },
					importPath: "@/components/ui/button",
					name: "Button",
					slug: "button",
				},
				{
					category: "visual",
					detail: { description: "Shared shader" },
					importPath: "@/components/website/demos/visual/shared-shader-demo",
					name: "Shared shader",
					slug: "shared-shader",
				},
			],
			demoFiles,
			detailRecords: {
				ui: {
					button: { description: "Button" },
				},
				visual: {
					"shared-shader": { description: "Shared shader" },
				},
			},
			registryData: {
				primary: {
					ui: {
						button: {
							imports: [{
								importPath: "./demos/ui/button-demo",
								sourceFile: "components/website/registry.ts",
							}],
						},
					},
					visual: {
						"shared-shader": {
							imports: [{
								importPath: "./demos/visual/shared-shader-demo",
								sourceFile: "components/website/registry.ts",
							}],
						},
					},
				},
				variants: {
					ui: {
						"button-demo-default": {
							imports: [{
								importPath: "./demos/ui/button/button-demo-default",
								sourceFile: "components/website/registry.ts",
							}],
						},
					},
					visual: {},
				},
			},
		});
		const summary = summarizeDiagnostics(diagnostics);

		assert.equal(summary.errors.length, 0);
		assert.deepEqual(
			summary.warnings.map((warning) => warning.message),
			["Demo file components/website/demos/ui/orphan-demo.tsx is not referenced by the registry or component manifest."],
		);
	} finally {
		rmSync(cwd, { force: true, recursive: true });
	}
});

test("registry collector follows the split registry shim and imported category maps", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-catalog-split-"));
	try {
		const registryDir = path.join(cwd, "components/website/registry");
		const demoDir = path.join(cwd, "components/website/demos/ui");
		mkdirSync(registryDir, { recursive: true });
		mkdirSync(demoDir, { recursive: true });
		writeFileSync(path.join(cwd, "components/website/registry.ts"), 'export { getDemoComponent } from "./registry/index";\n');
		writeFileSync(path.join(registryDir, "index.ts"), [
			'import { UI_DEMO, UI_VARIANT_DEMOS as UI_VARIANTS } from "./ui";',
			"const CATEGORY_REGISTRIES = { ui: UI_DEMO };",
			"const VARIANT_REGISTRIES = { ui: UI_VARIANTS };",
			"export function getDemoComponent() { return null; }",
			"",
		].join("\n"));
		writeFileSync(path.join(registryDir, "ui.ts"), [
			'import dynamic from "next/dynamic";',
			'import type { ComponentType } from "react";',
			"export const UI_DEMO: Record<string, ComponentType> = {",
			'\tbutton: dynamic(() => import("../demos/ui/button-demo"), { ssr: false }),',
			"};",
			"export const UI_VARIANT_DEMOS: Record<string, ComponentType> = {",
			'\t"button-demo-variant": dynamic(() => import("../demos/ui/button-demo-variant"), { ssr: false }),',
			"};",
			"",
		].join("\n"));
		writeFileSync(path.join(demoDir, "button-demo.tsx"), "export default function Demo() { return null; }\n");
		writeFileSync(path.join(demoDir, "button-demo-variant.tsx"), "export default function Demo() { return null; }\n");

		const registryData = collectRegistryData(cwd);
		assert.deepEqual(Object.keys(registryData.primary.ui), ["button"]);
		assert.deepEqual(Object.keys(registryData.variants.ui), ["button-demo-variant"]);
		assert.equal(
			resolveRegistryImport(
				registryData.primary.ui.button.imports[0].importPath,
				cwd,
				registryData.primary.ui.button.imports[0].sourceFile,
			),
			path.join(demoDir, "button-demo.tsx"),
		);
	} finally {
		rmSync(cwd, { force: true, recursive: true });
	}
});

test("registry collector follows spread shards in imported category maps", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-catalog-spread-shards-"));
	try {
		const registryDir = path.join(cwd, "components/website/registry");
		const demoDir = path.join(cwd, "components/website/demos/ui");
		mkdirSync(path.join(registryDir, "ui"), { recursive: true });
		mkdirSync(demoDir, { recursive: true });
		writeFileSync(path.join(cwd, "components/website/registry.ts"), 'export { getDemoComponent } from "./registry/index";\n');
		writeFileSync(path.join(registryDir, "index.ts"), [
			'import { UI_DEMO, UI_VARIANT_DEMOS } from "./ui";',
			"const CATEGORY_REGISTRIES = { ui: UI_DEMO };",
			"const VARIANT_REGISTRIES = { ui: UI_VARIANT_DEMOS };",
			"export function getDemoComponent() { return null; }",
			"",
		].join("\n"));
		writeFileSync(path.join(registryDir, "ui.ts"), [
			'import { UI_BASE_DEMOS } from "./ui/base";',
			'import { UI_BASE_VARIANT_DEMOS } from "./ui/base-variants";',
			"export const UI_DEMO = {",
			"\t...UI_BASE_DEMOS,",
			"};",
			"export const UI_VARIANT_DEMOS = {",
			"\t...UI_BASE_VARIANT_DEMOS,",
			"};",
			"",
		].join("\n"));
		writeFileSync(path.join(registryDir, "ui/base.ts"), [
			'import dynamic from "next/dynamic";',
			"export const UI_BASE_DEMOS = {",
			'\tbutton: dynamic(() => import("../../demos/ui/button-demo"), { ssr: false }),',
			"};",
			"",
		].join("\n"));
		writeFileSync(path.join(registryDir, "ui/base-variants.ts"), [
			'import dynamic from "next/dynamic";',
			"export const UI_BASE_VARIANT_DEMOS = {",
			'\t"button-demo-variant": dynamic(() => import("../../demos/ui/button-demo-variant"), { ssr: false }),',
			"};",
			"",
		].join("\n"));
		writeFileSync(path.join(demoDir, "button-demo.tsx"), "export default function Demo() { return null; }\n");
		writeFileSync(path.join(demoDir, "button-demo-variant.tsx"), "export default function Demo() { return null; }\n");

		const registryData = collectRegistryData(cwd);
		assert.deepEqual(Object.keys(registryData.primary.ui), ["button"]);
		assert.deepEqual(Object.keys(registryData.variants.ui), ["button-demo-variant"]);
		assert.equal(
			resolveRegistryImport(
				registryData.primary.ui.button.imports[0].importPath,
				cwd,
				registryData.primary.ui.button.imports[0].sourceFile,
			),
			path.join(demoDir, "button-demo.tsx"),
		);
	} finally {
		rmSync(cwd, { force: true, recursive: true });
	}
});

test("registry collector fails clearly for unresolved imported registry maps", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-catalog-missing-import-"));
	try {
		const registryDir = path.join(cwd, "components/website/registry");
		mkdirSync(registryDir, { recursive: true });
		writeFileSync(path.join(cwd, "components/website/registry.ts"), 'export { getDemoComponent } from "./registry/index";\n');
		writeFileSync(path.join(registryDir, "index.ts"), [
			'import { UI_DEMO_MISSING } from "./ui";',
			"const CATEGORY_REGISTRIES = { ui: UI_DEMO_MISSING };",
			"const VARIANT_REGISTRIES = {};",
			"export function getDemoComponent() { return null; }",
			"",
		].join("\n"));
		writeFileSync(path.join(registryDir, "ui.ts"), "export const UI_DEMO = {};\n");

		assert.throws(() => collectRegistryData(cwd), /Could not resolve imported registry object UI_DEMO_MISSING/u);
	} finally {
		rmSync(cwd, { force: true, recursive: true });
	}
});
