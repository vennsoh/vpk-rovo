const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const AGENT_2_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-2.tsx");
const SKILL_CONFIG_SOURCE = readProjectFile("components/blocks/skill-config/components/skill-config.tsx");
const TRIGGER_CONFIG_SOURCE = readProjectFile("components/blocks/trigger-config/components/trigger-config.tsx");
const FRAME_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-frame.tsx");
const COMPACT_CONVERSATION_STARTERS_NAV_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-compact-conversation-starters-nav.tsx");
const COMPACT_CONFIG_PANEL_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-compact-config-panel.tsx");
const COMPACT_CONFIG_NAV_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-compact-config-nav.tsx");
const COMPACT_CONFIG_NAV_ROWS_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-compact-config-nav-rows.tsx");
const COMPACT_HEADER_NAV_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-compact-header-nav.tsx");
const COMPACT_NAV_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-compact-nav-menu.tsx");
const AUTOMATION_DIALOGS_HOOK_SOURCE = readProjectFile("components/blocks/agent-2/hooks/use-agent-automation-dialogs.ts");
const CONFIG_PROFILE_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-config-profile.tsx");
const CONFIG_VISUALS_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-config-visuals.tsx");
const FILLED_CONFIG_SUMMARY_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-filled-config-summary.tsx");
const INSTRUCTIONS_COMPOSER_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-instructions-composer.tsx");
const PROFILE_COVER_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-profile-cover.tsx");
const REASONING_MEMORY_SELECTORS_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-reasoning-memory-selectors.tsx");
const SUMMARY_ROW_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-summary-row.tsx");
const CONFIG_MODEL_SOURCE = readProjectFile("components/blocks/agent-2/lib/agent-config-model.ts");
const REFERENCE_MAPPING_SOURCE = readProjectFile("components/blocks/agent-2/lib/agent-reference-mapping.ts");

test("Agent 2 delegates compact nav menu focus and keep-open behavior", () => {
	assert.doesNotMatch(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-compact-nav-menu";/u);
	assert.match(COMPACT_CONFIG_NAV_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-compact-nav-menu";/u);
	assert.match(COMPACT_CONVERSATION_STARTERS_NAV_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-compact-nav-menu";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function shouldClearCompactNavInitialHighlight/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function clearCompactNavInitialHighlight/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function useCompactNavMenuKeepOpen/u);
	assert.match(COMPACT_NAV_SOURCE, /export function shouldClearCompactNavInitialHighlight/u);
	assert.match(COMPACT_NAV_SOURCE, /eventDetails\.reason === "trigger-hover"/u);
	assert.match(COMPACT_NAV_SOURCE, /event instanceof PointerEvent/u);
	assert.match(COMPACT_NAV_SOURCE, /export function clearCompactNavInitialHighlight/u);
	assert.match(COMPACT_NAV_SOURCE, /querySelectorAll<HTMLElement>\("\[data-highlighted\]"\)/u);
	assert.match(COMPACT_NAV_SOURCE, /contentElement\.focus\(\{ preventScroll: true \}\)/u);
	assert.match(COMPACT_NAV_SOURCE, /"\[data-slot='menubar-content'\], \[data-slot='dropdown-menu-content'\]"/u);
	assert.match(COMPACT_NAV_SOURCE, /contentElement\.addEventListener\("focusin", redirectInitialAutoFocus\)/u);
	assert.match(COMPACT_NAV_SOURCE, /queueMicrotask/u);
	assert.match(COMPACT_NAV_SOURCE, /requestAnimationFrame\(clear\)/u);
	assert.match(COMPACT_NAV_SOURCE, /window\.setTimeout\(clear, 120\)/u);
	assert.match(COMPACT_NAV_SOURCE, /export function useCompactNavMenuKeepOpen/u);
	assert.match(COMPACT_NAV_SOURCE, /keepOpenRef\.current = true/u);
	assert.match(COMPACT_NAV_SOURCE, /window\.setTimeout\(\(\) => \{[\s\S]*keepOpenRef\.current = false;[\s\S]*\}, 150\)/u);
});

test("Agent 2 delegates compact config navigation to a local component owner", () => {
	assert.doesNotMatch(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-compact-config-nav";/u);
	assert.match(COMPACT_CONFIG_PANEL_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-compact-config-nav";/u);
	assert.match(COMPACT_CONFIG_NAV_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-compact-conversation-starters-nav";/u);
	assert.match(COMPACT_CONFIG_NAV_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-compact-config-nav-rows";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentCompactEmptyConfigNav/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentCompactTriggersNavButton/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentCompactDirectoryNavButton/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentCompactAppsNavButton/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentCompactSubagentsNavButton/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /const AGENT_COMPACT_EMPTY_CONFIG_NAV_ITEMS/u);
	assert.doesNotMatch(COMPACT_CONFIG_NAV_SOURCE, /function AgentCompactConfigNavButton/u);
	assert.doesNotMatch(COMPACT_CONFIG_NAV_SOURCE, /function AgentCompactReferenceRow/u);
	assert.doesNotMatch(COMPACT_CONFIG_NAV_SOURCE, /function AgentCompactTriggerRow/u);
	assert.doesNotMatch(COMPACT_CONFIG_NAV_SOURCE, /function AgentCompactConversationStartersNavButton/u);
	assert.match(COMPACT_CONFIG_NAV_SOURCE, /export function AgentCompactEmptyConfigNav/u);
	assert.match(COMPACT_CONFIG_NAV_SOURCE, /export function AgentCompactTriggersNavButton/u);
	assert.match(COMPACT_CONFIG_NAV_SOURCE, /export function AgentCompactDirectoryNavButton/u);
	assert.match(COMPACT_CONFIG_NAV_SOURCE, /export function AgentCompactAppsNavButton/u);
	assert.match(COMPACT_CONFIG_NAV_SOURCE, /export function AgentCompactSubagentsNavButton/u);
	assert.match(COMPACT_CONFIG_NAV_SOURCE, /export function getAgentCompactEmptyConfigNavItems/u);
	assert.match(COMPACT_CONFIG_NAV_SOURCE, /export function getAgentFilledSummaryAddLabel/u);
	assert.match(COMPACT_CONFIG_NAV_SOURCE, /export \{ MAX_AGENT_CONVERSATION_STARTERS \} from "@\/components\/blocks\/agent-2\/components\/agent-compact-conversation-starters-nav";/u);
	assert.match(COMPACT_CONFIG_NAV_ROWS_SOURCE, /export function AgentCompactConfigNavButton/u);
	assert.match(COMPACT_CONFIG_NAV_ROWS_SOURCE, /export function AgentCompactReferenceRow/u);
	assert.match(COMPACT_CONFIG_NAV_ROWS_SOURCE, /export function AgentCompactTriggerRow/u);
	assert.match(COMPACT_CONFIG_NAV_ROWS_SOURCE, /export function useDisabledLabelSet/u);
	assert.match(COMPACT_CONVERSATION_STARTERS_NAV_SOURCE, /export const MAX_AGENT_CONVERSATION_STARTERS/u);
	assert.match(COMPACT_CONVERSATION_STARTERS_NAV_SOURCE, /export function AgentCompactConversationStartersNavButton/u);
});

test("Agent 2 delegates compact config panel rendering to a local component owner", () => {
	assert.match(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-compact-config-panel";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentCompactConfigPanel/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /MutationObserver/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /promotedFields/u);
	assert.match(COMPACT_CONFIG_PANEL_SOURCE, /export function AgentCompactConfigPanel/u);
	assert.match(COMPACT_CONFIG_PANEL_SOURCE, /MutationObserver/u);
	assert.match(COMPACT_CONFIG_PANEL_SOURCE, /promotedFields/u);
	assert.match(COMPACT_CONFIG_PANEL_SOURCE, /AgentCompactEmptyConfigNav/u);
	assert.match(COMPACT_CONFIG_PANEL_SOURCE, /AgentFilledConfigSummary/u);
});

test("Agent 2 delegates automation dialog lifecycle to a local hook owner", () => {
	assert.match(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/hooks\/use-agent-automation-dialogs";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /setTriggersEditor/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /handleOpenAutomationFlowConfig/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /registerAutomationDialogOpener\(handleOpenAutomationFlowConfig\)/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /createAgentAutomationRule/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /createAutomationRuleFromEvent/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /getNextAutomationRuleIndex/u);
	assert.match(AUTOMATION_DIALOGS_HOOK_SOURCE, /export function useAgentAutomationDialogs/u);
	assert.match(AUTOMATION_DIALOGS_HOOK_SOURCE, /const currentAutomationRules = useMemo\(/u);
	assert.match(AUTOMATION_DIALOGS_HOOK_SOURCE, /setTriggersEditor/u);
	assert.match(AUTOMATION_DIALOGS_HOOK_SOURCE, /handleOpenAutomationFlowConfig/u);
	assert.match(AUTOMATION_DIALOGS_HOOK_SOURCE, /registerAutomationDialogOpener\(handleOpenAutomationFlowConfig\)/u);
	assert.match(AUTOMATION_DIALOGS_HOOK_SOURCE, /createAutomationRuleFromEvent/u);
	assert.match(AUTOMATION_DIALOGS_HOOK_SOURCE, /getNextAutomationRuleIndex/u);
	assert.match(AUTOMATION_DIALOGS_HOOK_SOURCE, /setManageTriggersOpen\(false\)/u);
});

test("Agent 2 delegates frame, header, and schema primitives to a local component owner", () => {
	assert.match(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-frame";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /export const AgentHeader = memo/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /export function AgentMoreOptionsMenu/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /export const AgentTools = memo/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /export const AgentOutput = memo/u);
	assert.match(FRAME_SOURCE, /export const AgentHeader = memo/u);
	assert.match(FRAME_SOURCE, /export function AgentMoreOptionsMenu/u);
	assert.match(FRAME_SOURCE, /export const AgentTools = memo/u);
	assert.match(FRAME_SOURCE, /export const AgentOutput = memo/u);
	assert.match(FRAME_SOURCE, /AgentHeader\.displayName = "AgentHeader"/u);
});

test("Agent 2 delegates compact header navigation to a local component owner", () => {
	assert.match(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-compact-header-nav";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /const AGENT_COMPACT_HEADER_NAV_ITEMS/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentCompactHeaderNavButton/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /export function AgentCompactHeaderNav/u);
	assert.match(COMPACT_HEADER_NAV_SOURCE, /const AGENT_COMPACT_HEADER_NAV_ITEMS = \[[\s\S]*<LayoutDashboardIcon size="small" \/>[\s\S]*label: "Details"[\s\S]*label: "Insights"/u);
	assert.match(COMPACT_HEADER_NAV_SOURCE, /export type AgentCompactHeaderSection/u);
	assert.match(COMPACT_HEADER_NAV_SOURCE, /export const AGENT_COMPACT_HEADER_DEFAULT_NAV_ITEMS/u);
	assert.match(COMPACT_HEADER_NAV_SOURCE, /export const AGENT_COMPACT_HEADER_DETAILS_NAV_ITEM/u);
	assert.match(COMPACT_HEADER_NAV_SOURCE, /function AgentCompactHeaderNavButton/u);
	assert.match(COMPACT_HEADER_NAV_SOURCE, /export function AgentCompactHeaderNav/u);
	assert.match(COMPACT_HEADER_NAV_SOURCE, /computeContextBarOverflow/u);
	assert.match(COMPACT_HEADER_NAV_SOURCE, /aria-label="More agent sections"/u);
});

test("Agent 2 consumes config model helpers from a local lib owner", () => {
	assert.match(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/lib\/agent-config-model";/u);
	assert.match(AGENT_2_SOURCE, /export \{ toggleAgentConfigDisabledItem \} from "@\/components\/blocks\/agent-2\/lib\/agent-config-model";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /export function toggleAgentConfigDisabledItem/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function isAgentListItemDisabled/u);
	assert.match(CONFIG_MODEL_SOURCE, /export interface AgentConfigFormValue/u);
	assert.match(CONFIG_MODEL_SOURCE, /automationRules\?: readonly AgentAutomationRule\[\];/u);
	assert.match(CONFIG_MODEL_SOURCE, /export function getSkillConfigLabel\(value: string\): string/u);
	assert.match(CONFIG_MODEL_SOURCE, /return slugifySkillName\(value\);/u);
	assert.match(CONFIG_MODEL_SOURCE, /export function getSkillConfigItems\(items: readonly string\[\] \| undefined\): readonly string\[\]/u);
	assert.match(CONFIG_MODEL_SOURCE, /\.map\(getSkillConfigLabel\)/u);
	assert.match(CONFIG_MODEL_SOURCE, /export function toggleAgentConfigDisabledItem/u);
	assert.match(CONFIG_MODEL_SOURCE, /const nextDisabledItems: Partial<Record<AgentConfigListFieldName, readonly string\[\]>>/u);
});

test("Agent config surfaces share automation model helpers", () => {
	for (const source of [AGENT_2_SOURCE, SKILL_CONFIG_SOURCE, TRIGGER_CONFIG_SOURCE]) {
		assert.match(source, /from "@\/components\/blocks\/agent-2\/lib\/agent-config-model";/u);
		assert.doesNotMatch(source, /function getAgentAutomationRules/u);
		assert.doesNotMatch(source, /function getAgentAutomationItems/u);
		assert.doesNotMatch(source, /function serializeAgentAutomationRuleLabels/u);
		assert.doesNotMatch(source, /function getNextAutomationRuleIndex/u);
		assert.doesNotMatch(source, /function createAutomationRuleFromEvent/u);
	}
	assert.match(CONFIG_MODEL_SOURCE, /export function getAgentAutomationRules/u);
	assert.match(CONFIG_MODEL_SOURCE, /export function getAgentAutomationItems/u);
	assert.match(CONFIG_MODEL_SOURCE, /export function serializeAgentAutomationRuleLabels/u);
	assert.match(CONFIG_MODEL_SOURCE, /export function getNextAutomationRuleIndex/u);
	assert.match(CONFIG_MODEL_SOURCE, /export function createAutomationRuleFromEvent/u);
	assert.match(CONFIG_MODEL_SOURCE, /from "@\/components\/blocks\/triggers\/data\/trigger-catalog";/u);
	assert.doesNotMatch(CONFIG_MODEL_SOURCE, /from "@\/components\/blocks\/triggers\/page";/u);
});

test("Agent 2 consumes reference mention mapping from a local lib owner", () => {
	assert.match(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/lib\/agent-reference-mapping";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function mapConfigValuesToMentionItems/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function mergeMentionItems/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /export const AGENT_CONFIG_FIELD_BY_REFERENCE_CATEGORY/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /export const AGENT_REFERENCE_CATEGORY_BY_CONFIG_FIELD/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /export function mapConfigValuesToMentionItems/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /getDirectoryMentionItemOrFallback\(category, value\)/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /export function mapSubagentConfigValuesToMentionItems/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /export function mapMemoryToKnowledgeItems/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /export function mergeMentionItems/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /const key = `\$\{item\.category\}:\$\{item\.id\}:\$\{getNormalizedAgentReferenceValue\(item\.label\)\}`;/u);
});

test("Agent 2 delegates profile cover and avatar picker rendering to a local component owner", () => {
	assert.match(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-profile-cover";/u);
	assert.match(CONFIG_PROFILE_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-profile-cover";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentProfileCover/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentAvatarPickerMenu/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentProfileAvatarGraphic/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /AGENT_AVATAR_HEXAGON_PATH/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /AGENT_AVATAR_OPTION_GROUPS/u);
	assert.match(PROFILE_COVER_SOURCE, /export const AGENT_AVATAR_SRC/u);
	assert.match(PROFILE_COVER_SOURCE, /export function AgentProfileCover/u);
	assert.match(PROFILE_COVER_SOURCE, /function AgentAvatarPickerMenu/u);
	assert.match(PROFILE_COVER_SOURCE, /function getAgentAvatarOptionTargetId/u);
	assert.match(PROFILE_COVER_SOURCE, /function getUnmaskedAvatarSrc/u);
	assert.match(PROFILE_COVER_SOURCE, /AGENT_AVATAR_OPTION_GROUPS/u);
});

test("Agent 2 delegates profile rendering to a local component owner", () => {
	assert.match(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-config-profile";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentConfigProfile/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /AGENT_PROFILE_INLINE_EDIT_MOTION_PROPS/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /AGENT_PROFILE_SWAP_VARIANTS/u);
	assert.match(CONFIG_PROFILE_SOURCE, /export function AgentConfigProfile/u);
	assert.match(CONFIG_PROFILE_SOURCE, /const AGENT_PROFILE_INLINE_EDIT_MOTION_PROPS/u);
	assert.match(CONFIG_PROFILE_SOURCE, /const AGENT_PROFILE_SWAP_VARIANTS/u);
	assert.match(CONFIG_PROFILE_SOURCE, /getDeterministicAgentBannerSrc/u);
	assert.match(CONFIG_PROFILE_SOURCE, /UNTITLED_SUBAGENT_NAME/u);
});

test("Agent 2 delegates reasoning and memory selector rendering to a local component owner", () => {
	assert.doesNotMatch(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-reasoning-memory-selectors";/u);
	assert.match(FILLED_CONFIG_SUMMARY_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-reasoning-memory-selectors";/u);
	assert.match(COMPACT_CONFIG_PANEL_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-reasoning-memory-selectors";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /const REASONING_MODE_SECTIONS/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentReasoningSelectorMenu/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentReasoningNavMenuContent/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentMemorySelectorMenu/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentMemoryNavMenuContent/u);
	assert.match(REASONING_MEMORY_SELECTORS_SOURCE, /const REASONING_MODE_SECTIONS = \[/u);
	assert.match(REASONING_MEMORY_SELECTORS_SOURCE, /export type ReasoningModeValue/u);
	assert.match(REASONING_MEMORY_SELECTORS_SOURCE, /export type KnowledgeModeValue/u);
	assert.match(REASONING_MEMORY_SELECTORS_SOURCE, /export type MemoryModeValue/u);
	assert.match(REASONING_MEMORY_SELECTORS_SOURCE, /export function AgentReasoningSelector/u);
	assert.match(REASONING_MEMORY_SELECTORS_SOURCE, /export function AgentReasoningRow/u);
	assert.match(REASONING_MEMORY_SELECTORS_SOURCE, /export function AgentMemorySelector/u);
	assert.match(REASONING_MEMORY_SELECTORS_SOURCE, /export function AgentMemoryRow/u);
	assert.match(REASONING_MEMORY_SELECTORS_SOURCE, /AgentCompactNavMenuList/u);
	assert.match(REASONING_MEMORY_SELECTORS_SOURCE, /LozengeDropdownTrigger aria-label="Reasoning mode"/u);
	assert.match(REASONING_MEMORY_SELECTORS_SOURCE, /LozengeDropdownTrigger[\s\S]*aria-label="Memory mode"/u);
});

test("Agent 2 delegates generic summary row primitives to a local component owner", () => {
	assert.doesNotMatch(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-summary-row";/u);
	assert.match(FILLED_CONFIG_SUMMARY_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-summary-row";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentReferenceChip/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentAddValueButton/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentFilledSummaryRow/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentSectionLabel/u);
	assert.match(SUMMARY_ROW_SOURCE, /export function AgentReferenceChip/u);
	assert.match(SUMMARY_ROW_SOURCE, /export function AgentAddValueButton/u);
	assert.match(SUMMARY_ROW_SOURCE, /export function AgentFilledSummaryRow/u);
	assert.match(SUMMARY_ROW_SOURCE, /export function AgentSectionLabel/u);
});

test("Agent 2 delegates filled config summary rendering to a local component owner", () => {
	assert.match(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-filled-config-summary";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentTriggerSummaryRow/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentFilledConfigSummary/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function hasFilledAgentConfig/u);
	assert.match(FILLED_CONFIG_SUMMARY_SOURCE, /function AgentTriggerSummaryRow/u);
	assert.match(FILLED_CONFIG_SUMMARY_SOURCE, /export function AgentFilledConfigSummary/u);
	assert.match(FILLED_CONFIG_SUMMARY_SOURCE, /export function hasFilledAgentConfig/u);
	assert.match(FILLED_CONFIG_SUMMARY_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-summary-row";/u);
	assert.match(FILLED_CONFIG_SUMMARY_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-compact-config-nav";/u);
	assert.match(FILLED_CONFIG_SUMMARY_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-reasoning-memory-selectors";/u);
});

test("Agent 2 delegates config visual helpers to a local component owner", () => {
	assert.doesNotMatch(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-config-visuals";/u);
	assert.match(FILLED_CONFIG_SUMMARY_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-config-visuals";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /const agentAvatarGroupToTagColor/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function getAgentCollectionIconClassName/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function getSkillTagPropsForLabel/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function getTagColorForAgentAvatar/u);
	assert.match(CONFIG_VISUALS_SOURCE, /const agentAvatarGroupToTagColor/u);
	assert.match(CONFIG_VISUALS_SOURCE, /export function getAgentCollectionIconClassName/u);
	assert.match(CONFIG_VISUALS_SOURCE, /export function getSkillTagPropsForLabel/u);
	assert.match(CONFIG_VISUALS_SOURCE, /export function getTagColorForAgentAvatar/u);
});

test("Agent 2 delegates instructions composer rendering to a local component owner", () => {
	assert.match(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-instructions-composer";/u);
	assert.match(AGENT_2_SOURCE, /export \{ AGENT_KNOWLEDGE_UPLOAD_TARGET \} from "@\/components\/blocks\/agent-2\/components\/agent-instructions-composer";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function AgentInstructionsComposer/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /const AGENT_INSTRUCTIONS_SUGGESTION_VARIANT/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /const AGENT_DIRECTORY_BY_SLASH_CATEGORY/u);
	assert.match(INSTRUCTIONS_COMPOSER_SOURCE, /export function AgentInstructionsComposer/u);
	assert.match(INSTRUCTIONS_COMPOSER_SOURCE, /const AGENT_INSTRUCTIONS_SUGGESTION_VARIANT/u);
	assert.match(INSTRUCTIONS_COMPOSER_SOURCE, /const AGENT_DIRECTORY_BY_SLASH_CATEGORY/u);
	assert.match(INSTRUCTIONS_COMPOSER_SOURCE, /export const AGENT_KNOWLEDGE_UPLOAD_TARGET/u);
});
