const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

let titlePrefix;

test.before(async () => {
	const result = await esbuild.build({
		entryPoints: [path.join(process.cwd(), "lib/document-title-prefix.ts")],
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	titlePrefix = loadCjsModuleFromText(result.outputFiles[0].text, "document-title-prefix.cjs");
});

test("getDocumentTitlePrefix derives readable local host labels", () => {
	assert.equal(
		titlePrefix.getDocumentTitlePrefix({
			host: "vpk-rovo.localhost",
			hostname: "vpk-rovo.localhost",
		}),
		"vpk-rovo",
	);
	assert.equal(
		titlePrefix.getDocumentTitlePrefix({
			host: "branch.vpk-rovo.localhost",
			hostname: "branch.vpk-rovo.localhost",
		}),
		"branch.vpk-rovo",
	);
	assert.equal(
		titlePrefix.getDocumentTitlePrefix({
			host: "branch.vpk-rovo.localhost:3440",
			hostname: "branch.vpk-rovo.localhost",
		}),
		"branch.vpk-rovo:3440",
	);
});

test("getDocumentTitlePrefix preserves host labels where the port disambiguates the tab", () => {
	assert.equal(
		titlePrefix.getDocumentTitlePrefix({
			host: "127.0.0.1:3000",
			hostname: "127.0.0.1",
		}),
		"127.0.0.1:3000",
	);
	assert.equal(
		titlePrefix.getDocumentTitlePrefix({
			host: "localhost:3000",
			hostname: "localhost",
		}),
		"localhost:3000",
	);
	assert.equal(
		titlePrefix.getDocumentTitlePrefix({
			host: "",
			hostname: "",
		}),
		null,
	);
});

test("formatDocumentTitleWithPrefix prefixes page-specific and root titles", () => {
	assert.equal(
		titlePrefix.formatDocumentTitleWithPrefix("Alert Dialog — UI — VPK", "vpk-rovo"),
		"vpk-rovo:Alert Dialog — UI — VPK",
	);
	assert.equal(
		titlePrefix.formatDocumentTitleWithPrefix("V—P—K: Venn Prototype Kit", "vpk-rovo"),
		"vpk-rovo:V—P—K: Venn Prototype Kit",
	);
});

test("formatDocumentTitleWithPrefix is idempotent for already-prefixed titles", () => {
	assert.equal(
		titlePrefix.formatDocumentTitleWithPrefix("vpk-rovo:Alert Dialog — UI — VPK", "vpk-rovo"),
		"vpk-rovo:Alert Dialog — UI — VPK",
	);
	assert.equal(
		titlePrefix.stripDocumentTitlePrefix("vpk-rovo:Alert Dialog — UI — VPK", "vpk-rovo"),
		"Alert Dialog — UI — VPK",
	);
	assert.equal(
		titlePrefix.formatDocumentTitleWithPrefix("", "vpk-rovo"),
		"vpk-rovo",
	);
});

test("formatDocumentTitleWithPrefix normalizes the previous dash-prefixed title form", () => {
	assert.equal(
		titlePrefix.formatDocumentTitleWithPrefix("vpk-rovo — Alert Dialog — UI — VPK", "vpk-rovo"),
		"vpk-rovo:Alert Dialog — UI — VPK",
	);
	assert.equal(
		titlePrefix.stripDocumentTitlePrefix("vpk-rovo — Alert Dialog — UI — VPK", "vpk-rovo"),
		"Alert Dialog — UI — VPK",
	);
});

test("formatDocumentTitleWithPrefix preserves transient wake-lock warning titles", () => {
	assert.equal(
		titlePrefix.formatDocumentTitleWithPrefix("⚠ Keep this page active", "vpk-rovo"),
		"⚠ Keep this page active",
	);
	assert.equal(
		titlePrefix.formatDocumentTitleWithPrefix("vpk-rovo:⚠ Keep this page active", "vpk-rovo"),
		"⚠ Keep this page active",
	);
});
