"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Guardrail: third-party brand logos must render through `LogoThirdParty`
 * (package-backed), NOT raw `public/3p/<id>/…` asset paths. The only files
 * allowed to reference `/3p/` are the LogoThirdParty module internals (the
 * package-less fallback + usage metadata). Any other `/3p/` in app/data/component
 * source means a surface bypassed the package — convert it to a brand `name`.
 *
 * See app/data/directory + components/ui/logo-mark for the `name`/`brandName`
 * pattern, and the `project_3p_logo_migration` memory for context.
 */

const ALLOWLIST = new Set([
	"components/ui/logo-third-party.tsx",
	"components/ui/data/logo-third-party-data.ts",
	"components/ui/data/logo-third-party-icons.ts",
	"components/ui/data/logo-usage.ts",
	"components/ui/data/logo-usage.json",
]);

const SCANNED_DIRS = ["components", "app", "lib"];
const SCANNED_EXTENSIONS = new Set([".ts", ".tsx", ".json"]);

function listTrackedFiles() {
	const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
		encoding: "utf8",
	}).trim();
	const output = execFileSync("git", ["ls-files", ...SCANNED_DIRS], {
		cwd: repoRoot,
		encoding: "utf8",
		maxBuffer: 64 * 1024 * 1024,
	});
	return { repoRoot, files: output.split("\n").filter(Boolean) };
}

test("no raw /3p/ asset paths outside the LogoThirdParty module", () => {
	const { repoRoot, files } = listTrackedFiles();
	const offenders = [];

	for (const file of files) {
		if (!SCANNED_EXTENSIONS.has(path.extname(file))) {
			continue;
		}
		if (ALLOWLIST.has(file)) {
			continue;
		}
		const filePath = path.join(repoRoot, file);
		if (!fs.existsSync(filePath)) {
			continue;
		}
		const contents = fs.readFileSync(filePath, "utf8");
		if (contents.includes("/3p/")) {
			offenders.push(file);
		}
	}

	assert.deepEqual(
		offenders,
		[],
		`These files reference raw public/3p logo paths. Render 3P brands through ` +
			`LogoThirdParty (or BrandLogoMark name=/a brandName field) instead:\n` +
			offenders.map((file) => `  - ${file}`).join("\n"),
	);
});
