const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");

const ROOT = join(__dirname, "..", "..");

function readProjectFile(...segments) {
	return readFileSync(join(ROOT, ...segments), "utf8");
}

const COMPONENT_SOURCE = readProjectFile("components/ui-custom/chain-of-thought.tsx");
const DEMO_SOURCE = readProjectFile("components/website/demos/ui-custom/chain-of-thought-demo.tsx");
const DETAILS_SOURCE = readDetailCategorySource("ui-custom");
const REGISTRY_SOURCE = readWebsiteRegistrySource();

test("ChainOfThoughtScenario composes the primitive chain-of-thought parts", () => {
	assert.match(COMPONENT_SOURCE, /export interface ChainOfThoughtScenarioStep/u);
	assert.match(COMPONENT_SOURCE, /export interface ChainOfThoughtScenarioProps/u);
	assert.match(COMPONENT_SOURCE, /export const ChainOfThoughtScenario = memo/u);
	assert.match(COMPONENT_SOURCE, /defaultOpen,\s*animateStepEntrance = false,\s*duration,/u);
	assert.match(COMPONENT_SOURCE, /<ChainOfThought[\s\S]*defaultOpen=\{defaultOpen \?\? state === "thinking"\}/u);
	assert.match(COMPONENT_SOURCE, /<ChainOfThoughtHeader[\s\S]*showChevron=\{state !== "preload" && steps\.length > 0\}[\s\S]*state=\{state\}/u);
	assert.match(COMPONENT_SOURCE, /<ChainOfThoughtContent[\s\S]*className=\{contentClassName\}/u);
	assert.match(COMPONENT_SOURCE, /<ChainOfThoughtStep[\s\S]*status=\{step\.status\}/u);
	assert.match(COMPONENT_SOURCE, /ChainOfThoughtScenario\.displayName = "ChainOfThoughtScenario"/u);
});

test("ChainOfThoughtScenario supports opt-in transform-only step entrance motion", () => {
	assert.match(COMPONENT_SOURCE, /animateStepEntrance\?: boolean;/u);
	assert.match(COMPONENT_SOURCE, /animateOnMount\?: boolean;/u);
	assert.match(COMPONENT_SOURCE, /initial=\{shouldAnimateEntrance \? \{ opacity: 0, y: -6 \} : false\}/u);
	assert.match(COMPONENT_SOURCE, /willChange: "opacity, transform"/u);
	assert.match(COMPONENT_SOURCE, /entranceDelay=\{animateStepEntrance \? Math\.min\(index \* 0\.045, 0\.18\) : 0\}/u);
});

test("Chain of Thought docs include Studio-quality AI usage recipes", () => {
	for (const demoSlug of [
		"chain-of-thought-demo-studio-agent-generation-flow",
		"chain-of-thought-demo-automation-trigger-flow",
		"chain-of-thought-demo-research-retrieval-flow",
		"chain-of-thought-demo-tool-call-details-flow",
		"chain-of-thought-demo-normal-tool-calling-replay",
		"chain-of-thought-demo-awaiting-user-response-replay",
	]) {
		assert.match(DETAILS_SOURCE, new RegExp(demoSlug, "u"));
		assert.match(REGISTRY_SOURCE, new RegExp(`"${demoSlug}"`, "u"));
	}

	assert.match(DETAILS_SOURCE, /ChainOfThoughtScenario/u);
	assert.match(DETAILS_SOURCE, /AI usage guidance:/u);
	assert.match(DETAILS_SOURCE, /Never use placeholder labels/u);
	assert.match(DEMO_SOURCE, /export function ChainOfThoughtDemoStudioAgentGenerationFlow/u);
	assert.match(DEMO_SOURCE, /export function ChainOfThoughtDemoAutomationTriggerFlow/u);
	assert.match(DEMO_SOURCE, /export function ChainOfThoughtDemoResearchRetrievalFlow/u);
	assert.match(DEMO_SOURCE, /export function ChainOfThoughtDemoToolCallDetailsFlow/u);
	assert.match(DEMO_SOURCE, /export function ChainOfThoughtDemoNormalToolCallingReplay/u);
	assert.match(DEMO_SOURCE, /export function ChainOfThoughtDemoAwaitingUserResponseReplay/u);
	assert.match(DEMO_SOURCE, /data-chain-of-thought-replay-demo="true"/u);
	assert.match(DEMO_SOURCE, /ask_user_questions/u);
	assert.match(DEMO_SOURCE, /Reset normal tool calling animation/u);
	assert.match(DEMO_SOURCE, /Reset awaiting user response animation/u);
	assert.match(DEMO_SOURCE, /Build a Rovo agent named OKR Generator/u);
	assert.match(DEMO_SOURCE, /STUDIO_REPLAY_TOOL_CALL_DELAY_MS = 2300/u);
	assert.match(DEMO_SOURCE, /STUDIO_REPLAY_NARRATION_ROW_DELAY_MS = 550/u);
	assert.match(DEMO_SOURCE, /Math\.round\(remainingRunMs \* 0\.7\)/u);
	assert.match(DEMO_SOURCE, /buildThinkingNarrationMap/u);
	assert.match(DEMO_SOURCE, /getThinkingToolCallSummaries/u);
	assert.match(DEMO_SOURCE, /phase === "completed" \|\| phase === "awaiting" \|\| hasAwaitingInput/u);
	assert.match(DEMO_SOURCE, /setIsOpen\(false\)/u);

	for (const studioLabel of [
		"Reading agent brief",
		"Preparing clarification questions",
		"Reviewing agent details",
		"Selecting agent tools",
		"Drafting agent instructions",
		"Naming agent profile",
		"Saving agent profile",
	]) {
		assert.match(DEMO_SOURCE, new RegExp(studioLabel, "u"));
	}

	for (const studioToolName of [
		"studio.read_brief",
		"ask_user_questions",
		"studio.review_answers",
		"studio.select_tools",
		"studio.draft_instructions",
		"studio.name_agent",
		"studio.save_profile",
	]) {
		assert.match(DEMO_SOURCE, new RegExp(studioToolName.replace(".", "\\."), "u"));
	}

	const replayToolCallIds = DEMO_SOURCE.match(/toolCallId: "studio-agent-replay-turn-[12]-[^"]+"/gu) ?? [];
	assert.equal(replayToolCallIds.length, 8);
});

test("Chain of Thought docs demos center their preview content", () => {
	assert.match(DEMO_SOURCE, /function ChainOfThoughtDemoFrame/u);
	assert.match(DEMO_SOURCE, /data-chain-of-thought-demo-frame="true"/u);
	assert.match(DEMO_SOURCE, /className="flex min-h-\[400px\] w-full items-center justify-center/u);

	const frameUsageCount = DEMO_SOURCE.match(/<ChainOfThoughtDemoFrame>/gu)?.length ?? 0;
	assert.equal(frameUsageCount, 12);
});

test("Chain of Thought tool icon table does not add a second outer preview border", () => {
	assert.match(DEMO_SOURCE, /<div className="w-full max-w-4xl overflow-hidden rounded-md bg-background">/u);
	assert.doesNotMatch(DEMO_SOURCE, /<div className="w-full max-w-4xl rounded-xl border border-border bg-background">/u);
});
