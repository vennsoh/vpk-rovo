const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("planExecutionActive is declared before both post-tool and strict tool-first routing branches", () => {
	const routingPath = path.join(
		__dirname,
		"chat",
		"rovo-post-stream-routing-orchestrator.js",
	);
	const source = fs.readFileSync(routingPath, "utf8");
	const declaration = "const planExecutionActive = isPlanExecutionPhase(threadId);";
	const declarationIndex = source.indexOf(declaration);
	const strictToolFirstBranchIndex = source.indexOf("isStrictToolFirstTurn &&");
	const postToolBranchIndex = source.lastIndexOf(
		"if (!isStrictToolFirstTurn) {",
		strictToolFirstBranchIndex,
	);

	assert.notEqual(declarationIndex, -1, "Expected planExecutionActive declaration in post-stream routing orchestrator");
	assert.notEqual(postToolBranchIndex, -1, "Expected post-tool routing branch in post-stream routing orchestrator");
	assert.notEqual(strictToolFirstBranchIndex, -1, "Expected strict tool-first branch in post-stream routing orchestrator");
	assert.ok(
		declarationIndex < postToolBranchIndex,
		"planExecutionActive must be declared before post-tool routing uses it",
	);
	assert.ok(
		declarationIndex < strictToolFirstBranchIndex,
		"planExecutionActive must be declared before strict tool-first routing uses it",
	);
});

test("post-turn completion runs after non-strict and strict Rovo routing", () => {
	const pipelinePath = path.join(
		__dirname,
		"chat",
		"rovo-post-stream-pipeline.js",
	);
	const routingPath = path.join(
		__dirname,
		"chat",
		"rovo-post-stream-routing-orchestrator.js",
	);
	const completionPath = path.join(
		__dirname,
		"chat",
		"rovo-post-turn-completion-orchestrator.js",
	);
	const pipelineSource = fs.readFileSync(pipelinePath, "utf8");
	const routingSource = fs.readFileSync(routingPath, "utf8");
	const completionSource = fs.readFileSync(completionPath, "utf8");
	const orchestratorIndex = pipelineSource.indexOf(
		"await runRovoPostStreamRouting({",
	);
	const completionIndex = pipelineSource.indexOf(
		"await runRovoPostTurnCompletion({",
	);
	const nonStrictRoutingIndex = routingSource.indexOf(
		"await runRovoNonStrictPostStreamRouting({",
	);
	const strictRoutingIndex = routingSource.indexOf(
		"await runStrictToolFirstPostStreamRouting({",
	);
	const orchestratorReturnIndex = routingSource.indexOf("return {");
	const completionDelegateIndex = completionSource.indexOf(
		"return completeRovoPostTurn({",
	);

	assert.notEqual(orchestratorIndex, -1, "Expected post-stream routing orchestrator call");
	assert.notEqual(completionIndex, -1, "Expected post-turn completion orchestrator call");
	assert.notEqual(nonStrictRoutingIndex, -1, "Expected non-strict Rovo routing helper call");
	assert.notEqual(strictRoutingIndex, -1, "Expected strict tool-first routing helper call");
	assert.notEqual(orchestratorReturnIndex, -1, "Expected post-stream routing orchestrator return");
	assert.notEqual(completionDelegateIndex, -1, "Expected post-turn completion helper delegation");
	assert.ok(
		orchestratorIndex < completionIndex,
		"post-turn completion must run after post-stream routing orchestration",
	);
	assert.ok(
		nonStrictRoutingIndex < orchestratorReturnIndex,
		"post-stream routing orchestration must include non-strict Rovo routing before it returns",
	);
	assert.ok(
		strictRoutingIndex < orchestratorReturnIndex,
		"post-stream routing orchestration must include strict tool-first routing before it returns",
	);
});
