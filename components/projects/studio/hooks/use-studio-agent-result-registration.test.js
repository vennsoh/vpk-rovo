const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

function loadStudioAgentResultRegistrationModule() {
	const result = esbuild.buildSync({
		entryPoints: [path.join(process.cwd(), "components/projects/studio/hooks/use-studio-agent-result-registration.ts")],
		bundle: true,
		format: "cjs",
		logLevel: "silent",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "use-studio-agent-result-registration.cjs");
}

const {
	buildStudioAgentResultKey,
	buildStudioAgentResultSourceKey,
	registerStudioAutomationArtifactListAgents,
	selectCompletedStudioAgentResult,
} = loadStudioAgentResultRegistrationModule();

function buildAgentResult(overrides = {}) {
	return {
		action: "create",
		agentId: "agent-1",
		name: "Sprint Digest Agent",
		summary: "Summarizes active sprint work.",
		...overrides,
	};
}

function buildMessage(id, parts) {
	return { id, parts };
}

function buildTurnCompletePart() {
	return {
		type: "data-turn-complete",
		data: { timestamp: "2026-07-05T00:00:00.000Z" },
	};
}

function buildAgentResultPart(agentResult) {
	return {
		type: "data-agent-result",
		data: agentResult,
	};
}

function buildAutomationArtifactListPart(agentResult) {
	return {
		type: "data-widget-data",
		data: {
			type: "studio-automation-artifact-list",
			payload: {
				type: "studio-automation-artifact-list",
				title: "Generated automation agents",
				agents: [{
					item: {
						id: agentResult.agentId,
						title: agentResult.name,
					},
					agentResult,
				}],
			},
		},
	};
}

test("buildStudioAgentResultKey preserves message and artifact-list key formats", () => {
	assert.equal(
		buildStudioAgentResultKey({
			action: "create",
			agentId: "agent-1",
			messageId: "message-1",
			runtimeThreadId: "thread-1",
		}),
		"thread-1:message-1:agent-1:create",
	);
	assert.equal(
		buildStudioAgentResultKey({
			action: "create",
			agentId: "agent-1",
			messageId: "message-1",
			runtimeThreadId: "thread-1",
			source: "artifact-list",
		}),
		"thread-1:message-1:agent-1:create:artifact-list",
	);
});

test("buildStudioAgentResultSourceKey prefers the active thread and falls back to runtime", () => {
	assert.equal(
		buildStudioAgentResultSourceKey({
			activeThreadId: "active-thread",
			agentId: "agent-1",
			messageId: "message-1",
			runtimeThreadId: "runtime-thread",
		}),
		"studio-agent-result:active-thread:message-1:agent-1",
	);
	assert.equal(
		buildStudioAgentResultSourceKey({
			activeThreadId: null,
			agentId: "agent-1",
			messageId: "message-1",
			runtimeThreadId: "runtime-thread",
		}),
		"studio-agent-result:runtime-thread:message-1:agent-1",
	);
});

test("selectCompletedStudioAgentResult selects the latest unhandled completed generated result", () => {
	const handledAgentResultKeys = new Set();
	const selected = [];
	const unmarkedThreadIds = [];
	const olderResult = buildAgentResult({ agentId: "older-agent", name: "Older Agent" });
	const latestResult = buildAgentResult({ agentId: "latest-agent", name: "Latest Agent" });
	const messages = [
		buildMessage("older-message", [buildAgentResultPart(olderResult), buildTurnCompletePart()]),
		buildMessage("latest-message", [buildAgentResultPart(latestResult), buildTurnCompletePart()]),
	];

	const didSelect = selectCompletedStudioAgentResult({
		activeThreadId: "active-thread",
		handledAgentResultKeys,
		messages,
		onAgentResultSelect(agentResult, options) {
			selected.push({ agentId: agentResult.agentId, sourceMessageId: options?.sourceMessageId });
			return true;
		},
		runtimeThreadId: "runtime-thread",
		unmarkStudioAgentCreationThread(threadId) {
			unmarkedThreadIds.push(threadId);
		},
	});

	assert.equal(didSelect, true);
	assert.deepEqual(selected, [{ agentId: "latest-agent", sourceMessageId: "latest-message" }]);
	assert.deepEqual([...handledAgentResultKeys], ["runtime-thread:latest-message:latest-agent:create"]);
	assert.deepEqual(unmarkedThreadIds, ["runtime-thread", "active-thread"]);
});

test("selectCompletedStudioAgentResult skips handled and incomplete generated results", () => {
	const handledAgentResultKeys = new Set(["runtime-thread:latest-message:latest-agent:create"]);
	const selected = [];
	const olderResult = buildAgentResult({ agentId: "older-agent", name: "Older Agent" });
	const latestResult = buildAgentResult({ agentId: "latest-agent", name: "Latest Agent" });
	const messages = [
		buildMessage("older-message", [buildAgentResultPart(olderResult)]),
		buildMessage("latest-message", [buildAgentResultPart(latestResult), buildTurnCompletePart()]),
	];

	const didSelect = selectCompletedStudioAgentResult({
		activeThreadId: "active-thread",
		handledAgentResultKeys,
		messages,
		onAgentResultSelect(agentResult) {
			selected.push(agentResult.agentId);
			return true;
		},
		runtimeThreadId: "runtime-thread",
		unmarkStudioAgentCreationThread() {},
	});

	assert.equal(didSelect, false);
	assert.deepEqual(selected, []);
	assert.deepEqual([...handledAgentResultKeys], ["runtime-thread:latest-message:latest-agent:create"]);
});

test("registerStudioAutomationArtifactListAgents registers generated agents without selecting them", () => {
	const handledAgentResultKeys = new Set();
	const calls = [];
	const unmarkedThreadIds = [];
	const agentResult = buildAgentResult({ agentId: "automation-agent", name: "Automation Agent" });
	const messages = [
		buildMessage("artifact-message", [
			buildAutomationArtifactListPart(agentResult),
			buildTurnCompletePart(),
		]),
	];

	const didRegister = registerStudioAutomationArtifactListAgents({
		activeThreadId: "active-thread",
		handledAgentResultKeys,
		messages,
		runtimeThreadId: "runtime-thread",
		studioAgentRegistry: {
			registerCreatedAgentFromResult(registeredAgentResult, options) {
				calls.push({ agentId: registeredAgentResult.agentId, options });
				return { id: registeredAgentResult.agentId };
			},
		},
		unmarkStudioAgentCreationThread(threadId) {
			unmarkedThreadIds.push(threadId);
		},
	});

	assert.equal(didRegister, true);
	assert.deepEqual(calls, [{
		agentId: "automation-agent",
		options: {
			preserveCurrentThread: true,
			select: false,
			sourceKey: "studio-agent-result:active-thread:artifact-message:automation-agent",
		},
	}]);
	assert.deepEqual([...handledAgentResultKeys], ["runtime-thread:artifact-message:automation-agent:create:artifact-list"]);
	assert.deepEqual(unmarkedThreadIds, ["runtime-thread", "active-thread"]);
});
