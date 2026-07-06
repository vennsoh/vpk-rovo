const assert = require("node:assert/strict");
const { mkdirSync, mkdtempSync, rmSync, writeFileSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	DEFAULT_TARGET,
	VALIDATOR_PATH,
	buildValidateAgentsCommand,
	parseArgs,
	validateAgents,
} = require("./validate-agents");

test("buildValidateAgentsCommand delegates to the canonical agent validator", () => {
	const cwd = "/repo";
	assert.deepEqual(buildValidateAgentsCommand({ cwd }), {
		args: [
			path.join(cwd, VALIDATOR_PATH),
			DEFAULT_TARGET,
			"--root",
			cwd,
		],
		command: process.execPath,
	});
});

test("parseArgs supports a custom target and json passthrough", () => {
	assert.deepEqual(parseArgs(["--target", ".agents/agents/example.md", "--json"]), {
		extraArgs: ["--json"],
		target: ".agents/agents/example.md",
	});
	assert.deepEqual(parseArgs(["--target=.agents/agents/example.md"]), {
		extraArgs: [],
		target: ".agents/agents/example.md",
	});
	assert.throws(() => parseArgs(["--target"]), /requires a value/);
	assert.throws(() => parseArgs(["--unknown"]), /Unknown argument/);
});

test("validateAgents reports a missing canonical validator", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-validate-agents-missing-"));
	const originalError = console.error;
	const errors = [];
	try {
		console.error = (message) => {
			errors.push(String(message));
		};
		assert.equal(validateAgents({ cwd }), 1);
		assert.deepEqual(errors, ["Agent validator not found: .agents/skills/agent-creator/scripts/validate-agent.mjs"]);
	} finally {
		console.error = originalError;
		rmSync(cwd, { recursive: true, force: true });
	}
});

test("validateAgents invokes node with the configured target", () => {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "vpk-validate-agents-"));
	try {
		const validatorPath = path.join(cwd, VALIDATOR_PATH);
		mkdirSync(path.dirname(validatorPath), { recursive: true });
		writeFileSync(validatorPath, "", { flag: "w" });
		const calls = [];
		const status = validateAgents({
			cwd,
			extraArgs: ["--json"],
			run(command, args, options) {
				calls.push({ args, command, options });
				return { status: 0 };
			},
			target: ".agents/agents/example.md",
		});
		assert.equal(status, 0);
		assert.deepEqual(calls, [{
			args: [
				validatorPath,
				".agents/agents/example.md",
				"--root",
				cwd,
				"--json",
			],
			command: process.execPath,
			options: {
				cwd,
				stdio: "inherit",
			},
		}]);
	} finally {
		rmSync(cwd, { recursive: true, force: true });
	}
});
