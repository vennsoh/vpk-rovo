const assert = require("node:assert/strict");
const { mkdtempSync, rmSync, writeFileSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	collectRegistryAuthHints,
	createPreflightReport,
	hasRegistryAuthHint,
	inspectLockfile,
	parsePackageManager,
} = require("./validate-local-preflight");

function createCommandRunner({ corepackVersion = "11.1.2" } = {}) {
	return (command, args) => {
		const commandText = [command, ...args].join(" ");
		if (commandText === "corepack pnpm --version") {
			return { status: 0, stdout: corepackVersion };
		}
		if (commandText === "pnpm config get registry") {
			return { status: 0, stdout: "https://registry.npmjs.org/" };
		}
		if (commandText === "pnpm config get @atlassian:registry") {
			return {
				status: 0,
				stdout: "https://packages.atlassian.com/artifactory/api/npm/atlassian-npm/",
			};
		}
		if (commandText === "corepack pnpm view @atlassian/logo-third-party@0.1.2 version --registry=https://packages.atlassian.com/artifactory/api/npm/atlassian-npm/") {
			return { status: 0, stdout: "0.1.2" };
		}
		return { status: 0, stdout: "" };
	};
}

test("parsePackageManager extracts the pinned package manager version", () => {
	assert.deepEqual(parsePackageManager("pnpm@11.1.2+sha512.example"), {
		integrity: "sha512.example",
		name: "pnpm",
		version: "11.1.2",
	});
	assert.equal(parsePackageManager("not-a-pin"), null);
});

test("hasRegistryAuthHint detects auth tokens without exposing values", () => {
	assert.equal(hasRegistryAuthHint("//packages.atlassian.com/api/npm/atlassian-npm/:_authToken=${TOKEN}", "atlassian-npm"), true);
	assert.equal(hasRegistryAuthHint("@atlassian:registry=https://packages.atlassian.com/api/npm/atlassian-npm/", "atlassian-npm"), false);
});

test("inspectLockfile reports blocked registry URLs", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-preflight-lockfile-"));
	try {
		const lockfilePath = path.join(cwd, "pnpm-lock.yaml");
		writeFileSync(lockfilePath, "resolution: {tarball: https://packages.atlassian.com/api/npm/npm-remote/foo.tgz}\n");
		const result = inspectLockfile(lockfilePath);
		assert.equal(result.exists, true);
		assert.equal(result.findings.length, 1);
		assert.equal(result.findings[0].line, 1);
	} finally {
		rmSync(cwd, { recursive: true, force: true });
	}
});

test("collectRegistryAuthHints scans repo and user npmrc layers", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-preflight-cwd-"));
	const homeDir = mkdtempSync(path.join(os.tmpdir(), "vpk-preflight-home-"));
	try {
		writeFileSync(path.join(cwd, ".npmrc"), "@atlassian:registry=https://packages.atlassian.com/api/npm/atlassian-npm/\n");
		writeFileSync(path.join(homeDir, ".npmrc"), "//packages.atlassian.com/api/npm/atlassian-npm/:_authToken=${TOKEN}\n");
		assert.deepEqual(collectRegistryAuthHints({ cwd, homeDir }), [{
			authConfigured: true,
			name: "@atlassian/logo-third-party",
			registryHint: "atlassian-npm",
		}]);
	} finally {
		rmSync(cwd, { recursive: true, force: true });
		rmSync(homeDir, { recursive: true, force: true });
	}
});

test("createPreflightReport warns when bare pnpm drifts but corepack matches the pin", () => {
		const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-preflight-report-"));
		try {
			writeFileSync(path.join(cwd, "package.json"), JSON.stringify({
				dependencies: {
					"@atlassian/logo-third-party": "0.1.2",
				},
				packageManager: "pnpm@11.1.2+sha512.example",
			}));
		writeFileSync(path.join(cwd, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
		const report = createPreflightReport({
			commandRunner: createCommandRunner({ corepackVersion: "11.1.2" }),
			cwd,
			env: {
				...process.env,
				npm_config_user_agent: "pnpm/11.7.0 node/v24.0.0 darwin arm64",
			},
			homeDir: cwd,
		});
		assert.equal(report.pnpm.version, "11.7.0");
		assert.equal(report.corepackPnpm.version, "11.1.2");
		assert.equal(report.failures.length, 0);
		assert.equal(report.warnings.length, 1);
		assert.equal(report.warnings[0].type, "pnpm-version-drift");
		assert.match(report.warnings[0].remediation, /corepack pnpm/u);
	} finally {
		rmSync(cwd, { recursive: true, force: true });
	}
	});

test("createPreflightReport fails with an actionable auth-sensitive package resolution message", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-preflight-auth-package-"));
	try {
		writeFileSync(path.join(cwd, "package.json"), JSON.stringify({
			dependencies: {
				"@atlassian/logo-third-party": "0.1.2",
			},
			packageManager: "pnpm@11.1.2+sha512.example",
		}));
		writeFileSync(path.join(cwd, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
		const report = createPreflightReport({
			commandRunner: (command, args) => {
				const commandText = [command, ...args].join(" ");
				if (commandText === "corepack pnpm --version") {
					return { status: 0, stdout: "11.1.2" };
				}
				if (commandText === "pnpm config get registry") {
					return { status: 0, stdout: "https://registry.npmjs.org/" };
				}
				if (commandText === "pnpm config get @atlassian:registry") {
					return {
						status: 0,
						stdout: "https://packages.atlassian.com/artifactory/api/npm/atlassian-npm/",
					};
				}
				if (commandText === "corepack pnpm view @atlassian/logo-third-party@0.1.2 version --registry=https://packages.atlassian.com/artifactory/api/npm/atlassian-npm/") {
					return { status: 1, stderr: "ERR_PNPM_FETCH_401" };
				}
				return { status: 0, stdout: "" };
			},
			cwd,
			env: {
				...process.env,
				npm_config_user_agent: "pnpm/11.1.2 node/v24.0.0 darwin arm64",
			},
			homeDir: cwd,
		});

		assert.equal(report.authSensitivePackages[0].status, "resolution-failed");
		assert.equal(report.failures.length, 1);
		assert.equal(report.failures[0].type, "auth-sensitive-package-resolution");
		assert.match(report.failures[0].message, /@atlassian\/logo-third-party@0\.1\.2/u);
		assert.match(report.failures[0].message, /corepack pnpm 11\.1\.2/u);
		assert.match(report.failures[0].message, /packageManager pin 11\.1\.2/u);
		assert.match(report.failures[0].remediation, /corepack pnpm view @atlassian\/logo-third-party@0\.1\.2/u);
		assert.match(report.failures[0].remediation, /ATLASSIAN_NPM_TOKEN/u);
	} finally {
		rmSync(cwd, { recursive: true, force: true });
	}
});

test("createPreflightReport fails when neither bare pnpm nor corepack matches the pin", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-preflight-report-"));
	try {
		writeFileSync(path.join(cwd, "package.json"), JSON.stringify({
			dependencies: {
				"@atlassian/logo-third-party": "0.1.2",
			},
			packageManager: "pnpm@11.1.2+sha512.example",
		}));
		writeFileSync(path.join(cwd, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
		const report = createPreflightReport({
			commandRunner: createCommandRunner({ corepackVersion: "11.7.0" }),
			cwd,
			env: {
				...process.env,
				npm_config_user_agent: "pnpm/11.7.0 node/v24.0.0 darwin arm64",
			},
			homeDir: cwd,
		});
		assert.equal(report.failures.length, 1);
		assert.equal(report.failures[0].type, "pnpm-version");
		assert.match(report.failures[0].remediation, /corepack prepare pnpm@11\.1\.2/u);
	} finally {
		rmSync(cwd, { recursive: true, force: true });
	}
});
