#!/usr/bin/env node

"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
	findBlockedLockfileRegistryUrls,
} = require("./verify-pnpm-lockfile");

const AUTH_SENSITIVE_PACKAGES = [
	{
		name: "@atlassian/logo-third-party",
		registryHint: "atlassian-npm",
	},
];

function parsePackageManager(packageManager) {
	const match = /^([^@]+)@([^+]+)(?:\+(.+))?$/u.exec(packageManager ?? "");
	if (!match) {
		return null;
	}

	return {
		name: match[1],
		version: match[2],
		integrity: match[3] ?? null,
	};
}

function runCommand(command, args, options = {}) {
	if (typeof options.commandRunner === "function") {
		const result = options.commandRunner(command, args, options);
		return {
			status: result.status ?? 0,
			stdout: result.stdout?.trim() ?? "",
			stderr: result.stderr?.trim() ?? "",
			error: result.error ?? null,
		};
	}

	const result = spawnSync(command, args, {
		cwd: options.cwd,
		encoding: "utf8",
		env: options.env,
	});
	return {
		status: result.status,
		stdout: result.stdout?.trim() ?? "",
		stderr: result.stderr?.trim() ?? "",
		error: result.error ?? null,
	};
}

function resolvePnpmVersion({ commandRunner = null, cwd = process.cwd(), env = process.env } = {}) {
	const userAgent = env.npm_config_user_agent;
	const userAgentMatch = /pnpm\/([^\s]+)/u.exec(userAgent ?? "");
	if (userAgentMatch) {
		return {
			source: "npm_config_user_agent",
			version: userAgentMatch[1],
		};
	}

	const result = runCommand("pnpm", ["--version"], { commandRunner, cwd, env });
	if (result.status === 0 && result.stdout) {
		return {
			source: "pnpm --version",
			version: result.stdout,
		};
	}

	return {
		error: result.error?.message ?? result.stderr ?? "Unable to run pnpm --version",
		source: "pnpm --version",
		version: null,
	};
}

function resolveCorepackPnpmVersion({ commandRunner = null, cwd = process.cwd(), env = process.env } = {}) {
	const result = runCommand("corepack", ["pnpm", "--version"], { commandRunner, cwd, env });
	if (result.status === 0 && result.stdout) {
		return {
			source: "corepack pnpm --version",
			version: result.stdout,
		};
	}

	return {
		error: result.error?.message ?? result.stderr ?? "Unable to run corepack pnpm --version",
		source: "corepack pnpm --version",
		version: null,
	};
}

function getNpmrcLayers(cwd = process.cwd(), homeDir = os.homedir()) {
	return [
		path.join(cwd, ".npmrc"),
		path.join(cwd, ".npmrc.local"),
		path.join(homeDir, ".npmrc"),
	].map((filePath) => ({
		exists: fs.existsSync(filePath),
		path: path.relative(cwd, filePath) || filePath,
	}));
}

function readFileIfExists(filePath) {
	try {
		return fs.readFileSync(filePath, "utf8");
	} catch (error) {
		if (error?.code === "ENOENT") {
			return null;
		}
		throw error;
	}
}

function hasRegistryAuthHint(npmrcText, registryHint) {
	if (!npmrcText) {
		return false;
	}
	return npmrcText.includes(registryHint) && /:_authToken\s*=/u.test(npmrcText);
}

function collectRegistryAuthHints({ cwd = process.cwd(), homeDir = os.homedir() } = {}) {
	const npmrcTexts = getNpmrcLayers(cwd, homeDir)
		.filter((layer) => layer.exists)
		.map((layer) => readFileIfExists(path.resolve(cwd, layer.path)) ?? "");

	return AUTH_SENSITIVE_PACKAGES.map((pkg) => ({
		name: pkg.name,
		registryHint: pkg.registryHint,
		authConfigured: npmrcTexts.some((text) => hasRegistryAuthHint(text, pkg.registryHint)),
	}));
}

function getPackageVersion(packageJson, packageName) {
	return packageJson.dependencies?.[packageName] ??
		packageJson.devDependencies?.[packageName] ??
		packageJson.optionalDependencies?.[packageName] ??
		null;
}

function resolveAuthSensitivePackages({
	commandRunner = null,
	cwd = process.cwd(),
	env = process.env,
	packageJson,
	registries,
} = {}) {
	return AUTH_SENSITIVE_PACKAGES.map((pkg) => {
		const expectedVersion = getPackageVersion(packageJson, pkg.name);
		const registry = registries.atlassian;
		if (!expectedVersion) {
			return {
				...pkg,
				expectedVersion: null,
				ok: false,
				registry,
				remediation: `Add ${pkg.name} to package.json or remove it from AUTH_SENSITIVE_PACKAGES.`,
				status: "missing-package-json-version",
			};
		}
		if (!registry) {
			return {
				...pkg,
				expectedVersion,
				ok: false,
				registry,
				remediation: "Set @atlassian:registry in .npmrc, then rerun `corepack pnpm run validate:preflight`.",
				status: "missing-registry",
			};
		}

		const spec = `${pkg.name}@${expectedVersion}`;
		const result = runCommand("corepack", [
			"pnpm",
			"view",
			spec,
			"version",
			`--registry=${registry}`,
		], { commandRunner, cwd, env });
		const resolvedVersion = result.status === 0 ? result.stdout : null;
		const ok = result.status === 0 && resolvedVersion === expectedVersion;
		return {
			...pkg,
			command: `corepack pnpm view ${spec} version --registry=${registry}`,
			expectedVersion,
			ok,
			registry,
			resolvedVersion,
			remediation: `Run: corepack pnpm view ${spec} version --registry=${registry}. If it fails, add an atlassian-npm auth token to ~/.npmrc or refresh ATLASSIAN_NPM_TOKEN in CI.`,
			status: ok ? "resolved" : "resolution-failed",
			stderr: result.stderr,
		};
	});
}

function inspectLockfile(lockfilePath) {
	const lockfileText = readFileIfExists(lockfilePath);
	if (lockfileText === null) {
		return {
			exists: false,
			findings: [],
		};
	}
	return {
		exists: true,
		findings: findBlockedLockfileRegistryUrls(lockfileText),
	};
}

function createPreflightReport({ commandRunner = null, cwd = process.cwd(), env = process.env, homeDir = os.homedir() } = {}) {
	const packageJsonPath = path.join(cwd, "package.json");
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
	const expectedPackageManager = parsePackageManager(packageJson.packageManager);
	const pnpm = resolvePnpmVersion({ commandRunner, cwd, env });
	const corepackPnpm = resolveCorepackPnpmVersion({ commandRunner, cwd, env });
	const registry = runCommand("pnpm", ["config", "get", "registry"], { commandRunner, cwd, env });
	const atlassianRegistry = runCommand("pnpm", ["config", "get", "@atlassian:registry"], { commandRunner, cwd, env });
	const lockfile = inspectLockfile(path.join(cwd, "pnpm-lock.yaml"));
	const registries = {
		atlassian: atlassianRegistry.status === 0 ? atlassianRegistry.stdout : null,
		default: registry.status === 0 ? registry.stdout : null,
	};
	const authPackageResolution = resolveAuthSensitivePackages({
		commandRunner,
		cwd,
		env,
		packageJson,
		registries,
	});
	const authSensitivePackages = collectRegistryAuthHints({ cwd, homeDir }).map((authHint) => ({
		...authHint,
		...authPackageResolution.find((probe) => probe.name === authHint.name),
	}));

	const failures = [];
	const warnings = [];
	if (!expectedPackageManager || expectedPackageManager.name !== "pnpm") {
		failures.push({
			message: "package.json must declare a pnpm packageManager pin.",
			type: "package-manager-pin",
		});
	}
	if (expectedPackageManager?.version && pnpm.version !== expectedPackageManager.version) {
		if (corepackPnpm.version === expectedPackageManager.version) {
			warnings.push({
				message: `Bare pnpm ${pnpm.version ?? "unknown"} does not match packageManager pin ${expectedPackageManager.version}; corepack pnpm matches the pin.`,
				remediation: "Use corepack pnpm for install/update/validation commands in this shell.",
				type: "pnpm-version-drift",
			});
		} else {
			failures.push({
				message: `Active pnpm ${pnpm.version ?? "unknown"} does not match packageManager pin ${expectedPackageManager.version}.`,
				remediation: `Run: corepack enable && corepack prepare pnpm@${expectedPackageManager.version} --activate`,
				type: "pnpm-version",
			});
		}
	}
	if (!lockfile.exists) {
		failures.push({
			message: "pnpm-lock.yaml is missing.",
			type: "lockfile-missing",
		});
	}
	for (const finding of lockfile.findings) {
		failures.push({
			message: `Blocked lockfile registry URL at pnpm-lock.yaml:${finding.line}.`,
			remediation: finding.explanation,
			type: "lockfile-registry",
		});
	}
	for (const pkg of authSensitivePackages) {
		if (!pkg.ok) {
			failures.push({
				message: `${pkg.name}@${pkg.expectedVersion ?? "unknown"} could not be resolved from ${pkg.registry ?? "the configured @atlassian registry"} with corepack pnpm ${corepackPnpm.version ?? "unknown"} (packageManager pin ${expectedPackageManager?.version ?? "unknown"}; bare pnpm ${pnpm.version ?? "unknown"}).`,
				remediation: pkg.remediation,
				type: "auth-sensitive-package-resolution",
			});
		}
	}

	return {
		authSensitivePackages,
		corepackPnpm,
		failures,
		lockfile,
		nodeVersion: process.version,
		npmrcLayers: getNpmrcLayers(cwd, homeDir),
		packageManager: packageJson.packageManager,
		pnpm,
		registries,
		warnings,
		workspaceRoot: cwd,
	};
}

function printReport(report) {
	console.log("Validation preflight");
	console.log(`- workspace: ${report.workspaceRoot}`);
	console.log(`- node: ${report.nodeVersion}`);
	console.log(`- packageManager: ${report.packageManager}`);
	console.log(`- pnpm: ${report.pnpm.version ?? "unavailable"} (${report.pnpm.source})`);
	console.log(`- corepack pnpm: ${report.corepackPnpm.version ?? "unavailable"} (${report.corepackPnpm.source})`);
	console.log(`- registry: ${report.registries.default ?? "unavailable"}`);
	console.log(`- @atlassian registry: ${report.registries.atlassian ?? "unavailable"}`);
	console.log(`- lockfile policy: ${report.lockfile.exists && report.lockfile.findings.length === 0 ? "ok" : "failed"}`);
	console.log("- npmrc layers:");
	for (const layer of report.npmrcLayers) {
		console.log(`  - ${layer.exists ? "found" : "missing"} ${layer.path}`);
	}
	console.log("- auth-sensitive packages:");
	for (const pkg of report.authSensitivePackages) {
		console.log(`  - ${pkg.name}@${pkg.expectedVersion ?? "unknown"}: ${pkg.status}; ${pkg.authConfigured ? "auth hint present" : "auth hint not found"} (${pkg.registryHint})`);
	}

	if (report.warnings.length > 0) {
		console.warn("Preflight warnings:");
		for (const warning of report.warnings) {
			console.warn(`- ${warning.message}`);
			if (warning.remediation) {
				console.warn(`  ${warning.remediation}`);
			}
		}
	}

	if (report.failures.length === 0) {
		console.log("Preflight passed");
		return;
	}

	console.error("Preflight failed:");
	for (const failure of report.failures) {
		console.error(`- ${failure.message}`);
		if (failure.remediation) {
			console.error(`  ${failure.remediation}`);
		}
	}
}

function main() {
	const report = createPreflightReport();
	printReport(report);
	if (report.failures.length > 0) {
		process.exitCode = 1;
	}
}

if (require.main === module) {
	main();
}

module.exports = {
	collectRegistryAuthHints,
	createPreflightReport,
	getNpmrcLayers,
	getPackageVersion,
	hasRegistryAuthHint,
	inspectLockfile,
	parsePackageManager,
	resolveAuthSensitivePackages,
	resolveCorepackPnpmVersion,
	resolvePnpmVersion,
};
