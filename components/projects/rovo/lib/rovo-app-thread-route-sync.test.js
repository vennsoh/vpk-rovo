const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

function loadRovoRouteSyncModule() {
	const result = esbuild.buildSync({
		entryPoints: [path.join(process.cwd(), "components/projects/rovo/lib/rovo-app-thread-route-sync.ts")],
		bundle: true,
		format: "cjs",
		logLevel: "silent",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "rovo-app-thread-route-sync.cjs");
}

const {
	buildRovoAppThreadPath,
	getRovoAppThreadIdFromPath,
	ROVO_APP_ROOT_PATH,
} = loadRovoRouteSyncModule();

test("Rovo thread routes use the Rovo root path", () => {
	assert.equal(ROVO_APP_ROOT_PATH, "/rovo");
	assert.equal(
		buildRovoAppThreadPath("thread/with spaces"),
		"/rovo/thread%2Fwith%20spaces",
	);
});

test("Rovo thread route parsing keeps reserved surface routes out of thread ids", () => {
	assert.equal(getRovoAppThreadIdFromPath("/rovo/thread%2Fwith%20spaces"), "thread/with spaces");
	assert.equal(getRovoAppThreadIdFromPath("/rovo"), null);
	assert.equal(getRovoAppThreadIdFromPath("/rovo/"), null);
	assert.equal(getRovoAppThreadIdFromPath("/rovo/jobs"), null);
	assert.equal(getRovoAppThreadIdFromPath("/studio/thread-1"), null);
});
