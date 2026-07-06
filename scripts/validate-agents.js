#!/usr/bin/env node

"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_TARGET = ".agents/agents";
const VALIDATOR_PATH = ".agents/skills/agent-creator/scripts/validate-agent.mjs";

function buildValidateAgentsCommand({
	cwd = process.cwd(),
	target = DEFAULT_TARGET,
	extraArgs = [],
} = {}) {
	return {
		args: [
			path.join(cwd, VALIDATOR_PATH),
			target,
			"--root",
			cwd,
			...extraArgs,
		],
		command: process.execPath,
	};
}

function parseArgs(argv) {
	const extraArgs = [];
	let target = DEFAULT_TARGET;

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--json") {
			extraArgs.push(arg);
			continue;
		}
		if (arg === "--target") {
			const value = argv[index + 1];
			if (!value) {
				throw new Error("--target requires a value");
			}
			target = value;
			index += 1;
			continue;
		}
		if (arg.startsWith("--target=")) {
			target = arg.slice("--target=".length);
			if (!target) {
				throw new Error("--target requires a value");
			}
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}

	return {
		extraArgs,
		target,
	};
}

function validateAgents({
	cwd = process.cwd(),
	run = spawnSync,
	target = DEFAULT_TARGET,
	extraArgs = [],
} = {}) {
	const validatorPath = path.join(cwd, VALIDATOR_PATH);
	if (!fs.existsSync(validatorPath)) {
		console.error(`Agent validator not found: ${path.relative(cwd, validatorPath)}`);
		return 1;
	}

	const { args, command } = buildValidateAgentsCommand({ cwd, extraArgs, target });
	const result = run(command, args, {
		cwd,
		stdio: "inherit",
	});
	return result.status ?? 1;
}

function main() {
	let options;
	try {
		options = parseArgs(process.argv.slice(2));
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		console.error("Usage: validate-agents.js [--target .agents/agents] [--json]");
		process.exitCode = 2;
		return;
	}

	process.exitCode = validateAgents(options);
}

if (require.main === module) {
	main();
}

module.exports = {
	DEFAULT_TARGET,
	VALIDATOR_PATH,
	buildValidateAgentsCommand,
	parseArgs,
	validateAgents,
};
