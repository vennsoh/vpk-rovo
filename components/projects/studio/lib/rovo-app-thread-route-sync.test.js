const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

function loadStudioRouteSyncModule() {
	const result = esbuild.buildSync({
		entryPoints: [path.join(process.cwd(), "components/projects/studio/lib/rovo-app-thread-route-sync.ts")],
		bundle: true,
		format: "cjs",
		logLevel: "silent",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "studio-rovo-app-thread-route-sync.cjs");
}

const {
	buildRovoAppThreadPath,
	getRovoAppThreadIdFromPath,
	ROVO_APP_ROOT_PATH,
} = loadStudioRouteSyncModule();

test("Studio thread routes use the Studio root path", () => {
	assert.equal(ROVO_APP_ROOT_PATH, "/studio");
	assert.equal(
		buildRovoAppThreadPath("thread/with spaces"),
		"/studio/thread%2Fwith%20spaces",
	);
});

test("Studio thread route parsing keeps reserved surface routes out of thread ids", () => {
	assert.equal(getRovoAppThreadIdFromPath("/studio/thread%2Fwith%20spaces"), "thread/with spaces");
	assert.equal(getRovoAppThreadIdFromPath("/studio"), null);
	assert.equal(getRovoAppThreadIdFromPath("/studio/"), null);
	assert.equal(getRovoAppThreadIdFromPath("/studio/jobs"), null);
	assert.equal(getRovoAppThreadIdFromPath("/rovo/thread-1"), null);
});
