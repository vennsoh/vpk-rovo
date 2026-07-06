const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadDirectoryModule } = require(path.join(__dirname, "__tests__", "load-directory-module.js"));

/**
 * Binding integrity tests for `agent-templates.json` / `agent-templates.ts`.
 *
 * Every template carries REAL catalog ids (toolIds/skillIds/knowledgeIds/
 * subagentIds) plus a tokenized `instructionsBody`. These tests assert that each
 * bound id and each `@[category:id]` token resolves against the actual runtime
 * catalogs, and that the mode fields use the allowed value sets. The catalogs
 * and the typed loader pull in React/Atlaskit, so they're bundled through the
 * shared esbuild harness rather than `require()`d — same pattern as
 * `catalog.test.js` and `resolve-ids.test.js`.
 */

let modulePromise;
function loadFixture() {
	modulePromise ??= loadDirectoryModule(`
		export {
			AGENT_TEMPLATE_CONFIGS,
			AGENT_TEMPLATE_CATEGORY_IDS,
			DEMO_TOOLS,
			DEMO_SESSION_TOOLS,
			DEFAULT_SKILLS,
			DEFAULT_KNOWLEDGE_APPS,
			DIRECTORY_APPS,
			ROVO_AGENT_PROFILES,
		} from "@/app/data/directory";
		export { extractInstructionTokens } from "@/app/data/directory/resolve-ids";
	`);
	return modulePromise;
}

// Allowed mode value sets, mirrored from
// components/blocks/agent-2/components/agent-2.tsx (REASONING_MODE_SECTIONS,
// KNOWLEDGE_MODE_OPTIONS, MEMORY_MODE_OPTIONS).
const REASONING_MODES = new Set([
	"quick-auto",
	"deep-auto",
	"gemini-flash-3",
	"gpt-5.4",
	"sonnet-5",
	"opus-4.6",
]);
const KNOWLEDGE_MODES = new Set(["all", "custom", "none"]);
const MEMORY_MODES = new Set(["on", "off"]);

// category → which catalog id-set a token of that category must resolve against.
async function buildCatalogSets() {
	const fx = await loadFixture();
	// Body tokens now unify tool + knowledge facets into single-segment `@[app:id]`
	// (see scripts/generate-agent-template-bodies.js). The template `toolIds`/
	// `knowledgeIds` binding fields still store their own single-segment catalog
	// ids, so resolve those against the tool/knowledge catalogs while body tokens
	// resolve against the unified apps catalog. `knowledgeToken` (two-segment) is
	// kept so any legacy `@[knowledge:<app>:all]` token still validates.
	const knowledgeToken = new Set();
	for (const app of fx.DEFAULT_KNOWLEDGE_APPS) {
		knowledgeToken.add(`${app.id}:all`);
		for (const content of app.contents ?? []) knowledgeToken.add(`${app.id}:${content.id}`);
	}
	return {
		app: new Set(fx.DIRECTORY_APPS.map((a) => a.id)),
		tool: new Set([...fx.DEMO_TOOLS, ...fx.DEMO_SESSION_TOOLS].map((t) => t.id)),
		skill: new Set(fx.DEFAULT_SKILLS.map((s) => s.id)),
		knowledge: new Set(fx.DEFAULT_KNOWLEDGE_APPS.map((k) => k.id)),
		knowledgeToken,
		subagent: new Set(fx.ROVO_AGENT_PROFILES.map((a) => a.id)),
	};
}

test("every template has the binding fields with sane shapes", async () => {
	const { AGENT_TEMPLATE_CONFIGS } = await loadFixture();
	assert.ok(AGENT_TEMPLATE_CONFIGS.length > 0, "expected templates");

	for (const t of AGENT_TEMPLATE_CONFIGS) {
		for (const field of ["toolIds", "skillIds", "knowledgeIds", "subagentIds", "conversationStarters", "triggers"]) {
			assert.ok(Array.isArray(t[field]), `${t.id}.${field} must be an array`);
		}
		assert.equal(typeof t.instructionsBody, "string", `${t.id}.instructionsBody must be a string`);
		assert.ok(t.instructionsBody.length > 0, `${t.id}.instructionsBody must be non-empty`);
		// Curated list sizes per the task spec.
		assert.ok(
			t.conversationStarters.length >= 2 && t.conversationStarters.length <= 4,
			`${t.id}.conversationStarters must have 2-4 items`,
		);
		assert.ok(
			t.triggers.length >= 1 && t.triggers.length <= 3,
			`${t.id}.triggers must have 1-3 items`,
		);
		assert.equal(typeof t.bodyIntro, "string", `${t.id}.bodyIntro must be a string`);
		assert.ok(t.bodyIntro.trim().length > 0, `${t.id}.bodyIntro must be non-empty`);
		// Every template with triggers ships a shared automation prompt + name so the
		// trigger/automation dialog isn't a blank form for generated agents.
		if (t.triggers.length > 0) {
			assert.equal(typeof t.triggerPrompt, "string", `${t.id}.triggerPrompt must be a string`);
			assert.ok(t.triggerPrompt.trim().length > 0, `${t.id}.triggerPrompt must be non-empty`);
			assert.equal(typeof t.triggerAutomationName, "string", `${t.id}.triggerAutomationName must be a string`);
			assert.ok(t.triggerAutomationName.trim().length > 0, `${t.id}.triggerAutomationName must be non-empty`);
		}
		assert.ok(
			!t.subagentIds.includes(t.id),
			`${t.id}.subagentIds must not reference itself (self-delegation)`,
		);
		if (t.conversationStarterIcons !== undefined) {
			assert.equal(
				t.conversationStarterIcons.length,
				t.conversationStarters.length,
				`${t.id}.conversationStarterIcons must pair 1:1 with conversationStarters`,
			);
		}
	}
});

test("every bound tool/skill/knowledge/subagent id resolves against the real catalogs", async () => {
	const { AGENT_TEMPLATE_CONFIGS } = await loadFixture();
	const sets = await buildCatalogSets();
	const pairs = [
		["toolIds", sets.tool, "tool"],
		["skillIds", sets.skill, "skill"],
		["knowledgeIds", sets.knowledge, "knowledge"],
		["subagentIds", sets.subagent, "subagent"],
	];

	const failures = [];
	for (const t of AGENT_TEMPLATE_CONFIGS) {
		for (const [field, set, catName] of pairs) {
			for (const id of t[field]) {
				if (!set.has(id)) failures.push(`${t.id}.${field}: "${id}" not in ${catName} catalog`);
			}
			// ids unique within a list.
			assert.equal(new Set(t[field]).size, t[field].length, `${t.id}.${field} has duplicate ids`);
		}
	}
	assert.deepEqual(failures, [], `unresolved bound ids:\n${failures.join("\n")}`);
});

test("every instructionsBody token resolves against its catalog", async () => {
	const { AGENT_TEMPLATE_CONFIGS, extractInstructionTokens } = await loadFixture();
	const sets = await buildCatalogSets();
	// Knowledge body tokens are two-segment, so validate them against knowledgeToken.
	const setForCategory = (category) => (category === "knowledge" ? sets.knowledgeToken : sets[category]);

	const failures = [];
	for (const t of AGENT_TEMPLATE_CONFIGS) {
		const tokens = extractInstructionTokens(t.instructionsBody);
		assert.ok(tokens.length > 0, `${t.id}.instructionsBody should reference at least one token`);
		for (const { category, id } of tokens) {
			const set = setForCategory(category);
			if (!set || !set.has(id)) {
				failures.push(`${t.id}.instructionsBody: @[${category}:${id}] not in ${category} catalog`);
			}
		}
	}
	assert.deepEqual(failures, [], `unresolved instructionsBody tokens:\n${failures.join("\n")}`);
});

test("instructionsBody covers EVERY bound id (always renders a chip)", async () => {
	const { AGENT_TEMPLATE_CONFIGS, extractInstructionTokens } = await loadFixture();
	const failures = [];
	for (const t of AGENT_TEMPLATE_CONFIGS) {
		const have = new Set(extractInstructionTokens(t.instructionsBody).map((x) => `${x.category}:${x.id}`));
		// tool + knowledge facets unify into one `@[app:id]` chip, so every bound
		// toolId and knowledgeId must appear as `app:<id>` in the body.
		const want = [
			...t.toolIds.map((id) => `app:${id}`),
			...t.knowledgeIds.map((id) => `app:${id}`),
			...t.skillIds.map((id) => `skill:${id}`),
			...t.subagentIds.map((id) => `subagent:${id}`),
		];
		for (const token of want) {
			if (!have.has(token)) failures.push(`${t.id}: bound id missing from body → @[${token}]`);
		}
	}
	assert.deepEqual(failures, [], `bound ids not referenced as body chips:\n${failures.join("\n")}`);
});

test("subagentDefinitions are 1:1 with subagentIds and carry a smaller, resolvable config", async () => {
	const { AGENT_TEMPLATE_CONFIGS } = await loadFixture();
	const sets = await buildCatalogSets();
	const failures = [];

	for (const t of AGENT_TEMPLATE_CONFIGS) {
		const defs = t.subagentDefinitions;
		assert.ok(Array.isArray(defs), `${t.id}.subagentDefinitions must be an array`);
		// 1:1 with subagentIds (same ids, same order) — defs provide each bound
		// subagent's own config.
		assert.deepEqual(
			defs.map((d) => d.id),
			[...t.subagentIds],
			`${t.id}.subagentDefinitions must be 1:1 with subagentIds`,
		);

		const parentSkills = new Set(t.skillIds);
		const parentTools = new Set(t.toolIds);
		const parentKnowledge = new Set(t.knowledgeIds);

		for (const d of defs) {
			assert.ok(typeof d.name === "string" && d.name.trim().length > 0, `${t.id}/${d.id}.name`);
			assert.ok(typeof d.description === "string" && d.description.trim().length > 0, `${t.id}/${d.id}.description`);
			assert.ok(MEMORY_MODES.has(d.memoryMode), `${t.id}/${d.id}.memoryMode "${d.memoryMode}" not allowed`);
			assert.ok(REASONING_MODES.has(d.reasoningMode), `${t.id}/${d.id}.reasoningMode "${d.reasoningMode}" not allowed`);

			// Smaller subset: never larger than the parent, and a subset of its config.
			assert.ok(d.skillIds.length <= t.skillIds.length, `${t.id}/${d.id} skills not smaller`);
			for (const id of d.skillIds) {
				if (!parentSkills.has(id)) failures.push(`${t.id}/${d.id}.skillIds: "${id}" not in parent`);
				if (!sets.skill.has(id)) failures.push(`${t.id}/${d.id}.skillIds: "${id}" not in skill catalog`);
			}
			for (const id of d.toolIds) {
				if (!parentTools.has(id)) failures.push(`${t.id}/${d.id}.toolIds: "${id}" not in parent`);
				if (!sets.tool.has(id)) failures.push(`${t.id}/${d.id}.toolIds: "${id}" not in tool catalog`);
			}
			for (const id of d.knowledgeIds) {
				if (!parentKnowledge.has(id)) failures.push(`${t.id}/${d.id}.knowledgeIds: "${id}" not in parent`);
				if (!sets.knowledge.has(id)) failures.push(`${t.id}/${d.id}.knowledgeIds: "${id}" not in knowledge catalog`);
			}
		}
	}
	assert.deepEqual(failures, [], `subagentDefinitions config issues:\n${failures.join("\n")}`);
});

test("mode fields use the allowed value sets", async () => {
	const { AGENT_TEMPLATE_CONFIGS } = await loadFixture();
	for (const t of AGENT_TEMPLATE_CONFIGS) {
		assert.ok(REASONING_MODES.has(t.reasoningMode), `${t.id}.reasoningMode "${t.reasoningMode}" not allowed`);
		assert.ok(KNOWLEDGE_MODES.has(t.knowledgeMode), `${t.id}.knowledgeMode "${t.knowledgeMode}" not allowed`);
		assert.ok(MEMORY_MODES.has(t.memoryMode), `${t.id}.memoryMode "${t.memoryMode}" not allowed`);
	}
});

test("categoryId is one of the owned template categories", async () => {
	const { AGENT_TEMPLATE_CONFIGS, AGENT_TEMPLATE_CATEGORY_IDS } = await loadFixture();
	const allowed = new Set(AGENT_TEMPLATE_CATEGORY_IDS);
	for (const t of AGENT_TEMPLATE_CONFIGS) {
		assert.ok(allowed.has(t.categoryId), `${t.id}.categoryId "${t.categoryId}" not in AGENT_TEMPLATE_CATEGORY_IDS`);
	}
});

test("template ids are unique across the catalog", async () => {
	const { AGENT_TEMPLATE_CONFIGS } = await loadFixture();
	const ids = AGENT_TEMPLATE_CONFIGS.map((t) => t.id);
	assert.equal(new Set(ids).size, ids.length, "duplicate template ids found");
});
