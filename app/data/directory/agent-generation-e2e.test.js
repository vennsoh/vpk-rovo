const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadDirectoryModule } = require(path.join(__dirname, "__tests__", "load-directory-module.js"));

/**
 * End-to-end integration over the agent-generation data pipeline (no browser):
 *   1. A realistic LLM-generated agent-result — with hallucinated ids, two-segment
 *      knowledge, mode values, body @[category:id] lozenges (some in code), and
 *      an over-cap tool list — flows through the ingest chokepoint
 *      (repairGeneratedAgentCatalog) and lands in the exact shape the config page
 *      consumes: names in the arrays, ids preserved in the body, modes validated.
 *   2. A real template flows through buildCreationTemplateContextFromAgent and
 *      deriveTemplateCategoryIds, proving template-driven population + scope
 *      derivation are wired end to end.
 */
let modPromise;
function loadPipeline() {
	modPromise ??= loadDirectoryModule(`
		export { repairGeneratedAgentCatalog } from "@/app/data/directory/repair-agent-result";
		export { AGENT_TEMPLATE_CONFIGS } from "@/app/data/directory/agent-templates";
		export { buildCreationTemplateContextFromAgent } from "@/components/projects/rovo-core/lib/agent-records/agent-creation-context";
		export { deriveTemplateCategoryIds } from "@/components/projects/studio/lib/agent-creation-domain-scope";
	`);
	return modPromise;
}

test("free-text generation: a messy generated result lands as a clean, consumable config", async () => {
	const { repairGeneratedAgentCatalog } = await loadPipeline();

	const generated = {
		// Mixed exact + near-miss ids the LLM might emit.
		tools: ["jira", "jira-cloud", "totally-made-up-tool"],
		skills: ["review-pull-request"],
		knowledge: ["confluence:all"],
		subagents: ["rovo-dev"],
		memoryMode: "off",
		reasoningMode: "not-a-real-mode", // invalid → cleared
		knowledgeMode: "custom",
		instructions: [
			"## Instructions",
			"Triage with @[tool:opsgenie] and ground answers in @[knowledge:confluence:all].",
			"Repair this near-miss: @[skill:reviewPullRequest].",
			"```",
			"// example only — must NOT be added as a capability",
			"@[tool:github]",
			"```",
		].join("\n"),
	};

	const out = repairGeneratedAgentCatalog(generated);

	// Arrays are display NAMES, fuzzy-repaired, de-duped, no-match dropped, and the
	// body-referenced tool (opsgenie) + skill are unioned in by name.
	assert.ok(out.tools.includes("Jira"), "jira/jira-cloud → Jira");
	assert.ok(!out.tools.includes("totally-made-up-tool"), "no-match dropped");
	assert.ok(out.tools.includes("Opsgenie"), "body @[tool:opsgenie] unioned as a name");
	assert.ok(!out.tools.includes("GitHub"), "token inside a code fence is NOT added");
	assert.deepEqual(out.knowledge, ["Confluence - all content"]);
	assert.ok(out.skills.includes("Review pull request"));
	assert.deepEqual(out.subagents, ["Rovo Dev"]);

	// Body tokens stay id-based (so the editor renders lozenges); the near-miss is repaired.
	assert.match(out.instructions, /@\[tool:opsgenie\]/u);
	assert.match(out.instructions, /@\[knowledge:confluence:all\]/u);
	assert.match(out.instructions, /@\[skill:review-pull-request\]/u);
	// The fenced example is preserved verbatim, not rewritten.
	assert.match(out.instructions, /@\[tool:github\]/u);

	// Modes: valid kept, invalid cleared so the editor falls back to its default.
	assert.equal(out.memoryMode, "off");
	assert.equal(out.knowledgeMode, "custom");
	assert.ok("reasoningMode" in out && out.reasoningMode === undefined);
});

test("template generation: a real template wires bound ids + tokenized body + derived scope", async () => {
	const {
		AGENT_TEMPLATE_CONFIGS,
		buildCreationTemplateContextFromAgent,
		deriveTemplateCategoryIds,
	} = await loadPipeline();

	// Pick a template that actually binds tools or skills (so scope is derivable).
	const config = AGENT_TEMPLATE_CONFIGS.find(
		(candidate) =>
			(candidate.toolIds && candidate.toolIds.length > 0) ||
			(candidate.skillIds && candidate.skillIds.length > 0),
	);
	assert.ok(config, "expected at least one template with bound tool/skill ids");

	// The shell passes the display agent (which preserves the config id 1:1).
	const context = buildCreationTemplateContextFromAgent({
		id: config.id,
		name: config.name,
		categoryId: config.categoryId,
	});

	// Bound ids + tokenized body flow onto the creation context (the dead-feature fix).
	assert.deepEqual(context.toolIds ?? [], config.toolIds ?? []);
	assert.deepEqual(context.skillIds ?? [], config.skillIds ?? []);
	assert.deepEqual(context.knowledgeIds ?? [], config.knowledgeIds ?? []);
	assert.deepEqual(context.subagentIds ?? [], config.subagentIds ?? []);
	assert.equal(context.tokenizedBody, config.instructionsBody);

	// Scope auto-derives from the template's bound ids (templates skip the domain question).
	const scope = deriveTemplateCategoryIds(context);
	assert.ok(Array.isArray(scope) && scope.length > 0, "template scope derived from bound ids");
});
