const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

function loadStudioContextDescriptionsModule() {
	const result = esbuild.buildSync({
		entryPoints: [path.join(process.cwd(), "components/projects/studio/lib/studio-context-descriptions.ts")],
		bundle: true,
		format: "cjs",
		logLevel: "silent",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "studio-context-descriptions.cjs");
}

const { mergeContextDescriptions } = loadStudioContextDescriptionsModule();

test("mergeContextDescriptions trims and joins non-empty context blocks", () => {
	assert.equal(
		mergeContextDescriptions("  First block  ", null, "Second block", undefined, "\nThird block\n"),
		"First block\n\nSecond block\n\nThird block",
	);
});

test("mergeContextDescriptions returns undefined when all blocks are empty", () => {
	assert.equal(mergeContextDescriptions(null, undefined, "", "   ", "\n\t"), undefined);
});
