const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const chatSdkHandlerCompositionPath = path.join(
	__dirname,
	"chat",
	"chat-sdk-handler-composition.js",
);
const chatSdkHandlerCompositionSource = fs.readFileSync(chatSdkHandlerCompositionPath, "utf8");
const finalOutputStreamPath = path.join(
	__dirname,
	"chat",
	"ai-gateway-final-output-stream.js",
);
const chatSdkHandlerPath = path.join(
	__dirname,
	"chat",
	"chat-sdk-handler.js",
);
const gatewayStreamPath = path.join(
	__dirname,
	"chat",
	"gateway-stream.js",
);
const finalOutputStreamSource = fs.readFileSync(finalOutputStreamPath, "utf8");
const chatSdkHandlerSource = fs.readFileSync(chatSdkHandlerPath, "utf8");
const gatewayStreamSource = fs.readFileSync(gatewayStreamPath, "utf8");

function sourceBetween(source, startNeedle, endNeedle) {
	const start = source.indexOf(startNeedle);
	assert.notEqual(start, -1, `Expected source anchor: ${startNeedle}`);

	const end = source.indexOf(endNeedle, start);
	assert.notEqual(end, -1, `Expected source end anchor: ${endNeedle}`);

	return source.slice(start, end);
}

function assertOrdered(source, needles) {
	let cursor = 0;
	for (const needle of needles) {
		const index = source.indexOf(needle, cursor);
		assert.notEqual(index, -1, `Expected ordered source anchor: ${needle}`);
		cursor = index + needle.length;
	}
}

function getAIGatewayDeferredOutputBlock() {
	return sourceBetween(
		finalOutputStreamSource,
		"Post-process: prefer the model-agnostic deferred-tool",
		"return finalOutput;",
	);
}

function getAIGatewayStreamFinalOutputStreamCall() {
	return sourceBetween(
		gatewayStreamSource,
		"executeAIGatewayBufferedStream({",
		"onError: (error) => {",
	);
}

test("AI Gateway deferred output is resolved before legacy question-card fallback", () => {
	const block = getAIGatewayDeferredOutputBlock();

	assertOrdered(block, [
		"resolveAIGatewayFinalOutput({",
		"questionCardDefaults,",
		"} = finalOutput;",
		"if (questionCardPayload?.sessionId) {",
		"setQuestionMeta(",
		"if (planWidgetPayload && threadId) {",
		"recordPlanWidgetEmission(threadId, {",
		"if (visibleText && visibleText.length > 0) {",
	]);
	assertOrdered(getAIGatewayStreamFinalOutputStreamCall(), [
		"buildQuestionMeta: buildQuestionMetaFromQuestionCardPayload",
		"createDeferredToolCallId: createAIGatewayDeferredToolCallId",
		"createRouteDecisionPart",
		"setQuestionMeta",
		"recordPlanWidgetEmission",
		"shouldSurfaceMissingStudioAgentResultFailure",
		"writeAIGatewayFinalOutput: writeAIGatewayFinalOutputStream",
	]);
	assert.match(gatewayStreamSource, /executeAIGatewayBufferedStream/u);
	assert.match(
		chatSdkHandlerSource,
		/setQuestionMeta: \(sessionId, questionMeta\) => \{[\s\S]*_requestUserInputQuestionMetaStore\.set\(sessionId, questionMeta\);[\s\S]*\}/u,
	);
	assert.match(
		chatSdkHandlerCompositionSource,
		/writeAIGatewayFinalOutputStream,\n\} = require\("\.\/ai-gateway-final-output-stream"\);/u,
	);
	assert.match(
		finalOutputStreamSource,
		/resolveAIGatewayFinalOutput,\n\} = require\("\.\/ai-gateway-final-output"\);/u,
	);
	assert.match(
		finalOutputStreamSource,
		/writeAIGatewayPlanWidgetPart,\n\twriteAIGatewayQuestionCardPart,\n\} = require\("\.\/ai-gateway-deferred-parts"\);/u,
	);
	assert.match(
		block,
		/createDeferredToolCallId,/u,
	);
	assert.doesNotMatch(block, /extractQuestionCardJsonFromAssistantText/u);
	assert.doesNotMatch(block, /extractQuestionCardDefinitionFromAssistantText/u);
});

test("AI Gateway ask_user_questions deferred output delegates question-card emission with metadata", () => {
	const block = getAIGatewayDeferredOutputBlock();
	const questionEmitBranch = sourceBetween(
		block,
		"writeAIGatewayQuestionCardPart({",
		"if (agentResultPayload) {",
	);

	assertOrdered(block, [
		"writeAIGatewayQuestionCardPart({",
		"if (agentResultPayload) {",
		'type: "data-turn-complete"',
	]);
	assertOrdered(questionEmitBranch, [
		"buildQuestionMeta",
		"createDeferredToolCallId",
		"createRouteDecisionPart",
		"creationMode",
		"deferredToolCallId",
		"questionCardPayload",
		"requestOrigin",
		"setQuestionMeta",
		"writer",
	]);
});

test("AI Gateway exit_plan_mode deferred output delegates plan data before turn completion", () => {
	const block = getAIGatewayDeferredOutputBlock();
	const planEmitBranch = sourceBetween(
		block,
		"writeAIGatewayPlanWidgetPart({",
		'writer.write({\n\t\ttype: "data-turn-complete"',
	);

	assertOrdered(block, [
		"if (planWidgetPayload && threadId) {",
		"recordPlanWidgetEmission(threadId, {",
		"writeAIGatewayPlanWidgetPart({",
		'type: "data-turn-complete"',
	]);
	assertOrdered(planEmitBranch, [
		"createDeferredToolCallId",
		"deferredToolCallId",
		"planWidgetPayload",
		"writer",
	]);
});
