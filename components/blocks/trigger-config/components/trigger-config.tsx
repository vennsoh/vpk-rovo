"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- This block uses slot/render-node props for Base UI, shadcn, icon, and hover-reveal composition contracts.

import { useLazyRef } from "@/lib/use-lazy-ref";
import { token } from "@/lib/tokens";
import type { Tool } from "ai";
import { AnimatePresence, motion, useReducedMotion, type MotionProps } from "motion/react";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Fragment, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import AutomationIcon from "@atlaskit/icon/core/automation";
import DeleteIcon from "@atlaskit/icon/core/delete";
import AppsIcon from "@atlaskit/icon/core/apps";
import EditIcon from "@atlaskit/icon/core/edit";
import PageIcon from "@atlaskit/icon/core/page";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import AiComputeIcon from "@atlaskit/icon-lab/core/ai-compute";
import GenerativeIndicatorIcon from "@atlaskit/icon-lab/core/generative-indicator";
import AiModelIcon from "@atlaskit/icon-lab/core/ai-model";
import SkillIcon from "@atlaskit/icon-lab/core/skill";

import { AgentAccess } from "@/components/blocks/agent-access";
import { AgentEvaluation } from "@/components/blocks/agent-evaluation";
import { AgentInsights } from "@/components/blocks/agent-insights";
import { AgentSurfaces } from "@/components/blocks/agent-surfaces";
import { AgentUsers } from "@/components/blocks/agent-users";
import {
	DEFAULT_STARTER_ICON,
	getStarterIcon,
	type StarterIconKey,
} from "@/components/blocks/conversation-starters";
import { AgentAutomationFlowCover } from "@/components/blocks/triggers/components/agent-automation-flow-cover";
import {
	renderAgentTriggerProviderTileIcon,
	TriggerConditionsPanel,
	TriggerPicker,
	TriggerProviderSearchList,
	type AgentAutomationRule,
	type AgentTriggerProviderId,
	type AgentTriggerValue,
} from "@/components/blocks/triggers/page";
import { createAgentAutomationRule, createAgentTriggerValue, getAgentTriggerReadableLabel } from "@/components/blocks/triggers/data/trigger-catalog";
import { ManageTriggersDialog } from "@/components/blocks/triggers/components/manage-triggers-dialog";
import { UNTITLED_SUBAGENT_NAME } from "@/components/blocks/subagents/lib/subagent-prompts";
import { AgentTriggersDialog } from "@/components/ui-custom/agent-triggers-dialog";
import {
	hoverRevealRowClassName,
	HoverRevealActions,
	HoverRevealLabel,
} from "@/components/ui-custom/hover-reveal-row";
import {
	EDITOR_PALETTE_MENTION_SOURCES,
	getDirectoryMentionItemOrFallback,
	getToolIdFromMentionId,
} from "@/components/blocks/editor-palette/data/mention-sources";
import {
	EditorPaletteSearchPicker,
	type EditorPaletteSearchCategory,
} from "@/components/blocks/editor-palette/page";
import type { EditorToolbarViewMode } from "@/components/blocks/editor-toolbar";
import { Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AtlassianLogo, isAtlassianLogoSource, type AtlassianLogoName } from "@/components/ui/logo";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Menubar,
	MenubarContent,
	MenubarMenu,
	MenubarTrigger,
} from "@/components/ui/menubar";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { HoverCard, HoverCardTrigger } from "@/components/ui/hover-card";
import { InlineEdit } from "@/components/ui/inline-edit";
import { Input } from "@/components/ui/input";
import { Lozenge, LozengeDropdownTrigger } from "@/components/ui/lozenge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag, type TagColor } from "@/components/ui/tag";
import { PlusIcon } from "@/components/ui/vpk-icons";
import {
	type RichTextMentionItem,
	type RichTextMentionRemovalRequest,
	type RichTextMentionSources,
	type RichTextReferenceCategory,
	type RichTextSlashCategory,
	type RichTextSuggestionMenuItem,
	type RichTextSuggestionVariantConfig,
	RichTextMentionVisualMark,
	RichTextEditor,
	getRichTextMentionTagType,
	isRichTextReferenceCategory,
} from "@/components/ui-custom/rich-text-editor";
import {
	getRichTextReferencePreview,
	RichTextReferencePreviewContent,
} from "@/components/ui-custom/rich-text-editor/reference-preview";
import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import { useHasHorizontalOverflow } from "@/components/hooks/use-has-horizontal-overflow";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { buildHorizontalScrollMaskStyle } from "@/components/visual/scroll-mask/lib";
import type {
	WikiMemoryExplorerResponse,
} from "@/lib/rovo-runtime-types";
import { cn } from "@/lib/utils";

import { AGENT_AVATAR_SRC } from "@/components/blocks/trigger-config/components/agent-compact-header-nav";
import { CodeBlock } from "@/components/ui-custom/code-block";
import {
	type AgentConfigFormValue,
	type AgentConfigListFieldName,
	type AgentConfigReferenceListFieldName,
	type AgentConfigTextFieldName,
	type AgentDirectoryKind,
	type AgentHideableConfigField,
	createAutomationRuleFromEvent,
	getAgentAutomationItems,
	getAgentAutomationRules,
	getNonEmptyConfigItems,
	getNormalizedAgentReferenceValue,
	getNextAutomationRuleIndex,
	isAgentListItemDisabled,
	serializeAgentAutomationRuleLabels,
} from "@/components/blocks/agent-2/lib/agent-config-model";

export type {
	AgentConfigFormValue,
	AgentConfigListFieldName,
	AgentConfigReferenceListFieldName,
	AgentConfigTextFieldName,
	AgentDirectoryKind,
	AgentHideableConfigField,
} from "@/components/blocks/agent-2/lib/agent-config-model";
// react-doctor-disable-next-line react-doctor/only-export-components -- Studio config owners share this pure update helper with the block.
export { toggleAgentConfigDisabledItem } from "@/components/blocks/agent-2/lib/agent-config-model";
// react-doctor-disable-next-line react-doctor/only-export-components -- Consumers share the compact header nav API from this block module.
export {
	AGENT_COMPACT_HEADER_DEFAULT_NAV_ITEMS,
	AGENT_COMPACT_HEADER_DETAILS_NAV_ITEM,
	AgentCompactHeaderNav,
} from "@/components/blocks/trigger-config/components/agent-compact-header-nav";
export type {
	AgentCompactHeaderNavItem,
	AgentCompactHeaderSection,
} from "@/components/blocks/trigger-config/components/agent-compact-header-nav";

const MAX_AGENT_CONVERSATION_STARTERS = 3;
// App tag front slots follow the Tag front-slot rule (see /components/ui/tag#front-slot):
// Atlassian product marks render bare via AtlassianLogo + withUsageBorder.
const APP_ATLASSIAN_LOGO_NAMES: Record<string, AtlassianLogoName> = {
	Jira: "jira",
	Confluence: "confluence",
};
type AgentRunPromptMode = "run-agent" | "custom-prompt";
const AGENT_RUN_PROMPT_CONNECTOR_LEFT = "0px";
const AGENT_RUN_PROMPT_CONNECTOR_TOP = `calc(-1 * ${token("space.200")})`;
const AGENT_RUN_PROMPT_CONNECTOR_WIDTH = token("space.200");
const AGENT_RUN_PROMPT_CONNECTOR_HEIGHT = "33px";
const AGENT_RUN_PROMPT_ROW_PADDING_LEFT = token("space.300");
const AGENT_PROFILE_INLINE_EDIT_MOTION_PROPS = {
	initial: "rest",
	animate: "rest",
	whileHover: "active",
	whileFocus: "active",
	variants: {
		rest: { paddingLeft: 0, paddingRight: 0 },
		active: { paddingLeft: "0.375rem", paddingRight: "0.375rem" },
	},
	transition: { type: "spring", bounce: 0.08, visualDuration: 0.18 },
} satisfies Pick<MotionProps, "initial" | "animate" | "whileHover" | "whileFocus" | "variants" | "transition">;
const AGENT_PROFILE_INLINE_EDIT_BACKDROP_MOTION_PROPS = {
	variants: {
		rest: { opacity: 0, scaleX: 0.98 },
		active: { opacity: 1, scaleX: 1 },
	},
	transition: { type: "spring", bounce: 0.08, visualDuration: 0.18 },
} satisfies Pick<MotionProps, "variants" | "transition">;
// Direction-aware swap for the profile header (name + description, plus the
// inline back-arrow on subagents) when toggling between the base agent and a
// subagent. Forward (parent →
// subagent) slides the incoming content in from the right; back (subagent →
// parent) slides it in from the left. Spring-based so an interrupted swap (rapid
// jumps) settles naturally; `opacity` + `transform` are the only animated props.
const AGENT_PROFILE_SWAP_SLIDE_PX = 16;
const AGENT_PROFILE_SWAP_VARIANTS = {
	enter: (direction: number) => ({ opacity: 0, x: direction * AGENT_PROFILE_SWAP_SLIDE_PX }),
	center: { opacity: 1, x: 0 },
	exit: (direction: number) => ({ opacity: 0, x: direction * -AGENT_PROFILE_SWAP_SLIDE_PX }),
} as const;
const AGENT_PROFILE_SWAP_TRANSITION = { type: "spring", bounce: 0.12, visualDuration: 0.22 } as const;

// Source order IS the canonical display order, kept in lockstep with the
// AgentFilledConfigSummary rows array: Automations › Knowledge › Tools › Skills ›
// Subagents › Memory › Conversation starters. Reasoning renders separately and
// always sits last. Keep both lists in sync when reordering.
const AGENT_COMPACT_EMPTY_CONFIG_NAV_ITEMS = [
	{ agentFieldName: "trigger", label: "Automations", Icon: AutomationIcon },
	{ agentFieldName: "apps", label: "Apps", listFieldName: "apps", Icon: AppsIcon },
	{ agentFieldName: "skills", label: "Skills", listFieldName: "skills", Icon: SkillIcon },
	{ agentFieldName: "subagents", label: "Subagents", listFieldName: "subagents", Icon: AiAgentIcon },
	{ agentFieldName: "memory", label: "Memory", kind: "memory", Icon: AiModelIcon },
	{ agentFieldName: "conversationStarters", label: "Conversation starters", listFieldName: "conversationStarters", Icon: AiChatIcon },
	{ agentFieldName: "reasoning", label: "Reasoning", kind: "reasoning", Icon: AiComputeIcon },
] as const;

// Match the shared Menubar's default `gap-0.5` (2px) so the connected config
// strip spaces items identically to the base component.
const AGENT_COMPACT_CONFIG_NAV_GAP = 2;
const AGENT_COMPACT_CONFIG_NAV_SCROLL_EDGE_THRESHOLD = 4;
const AGENT_COMPACT_CONFIG_NAV_START_MASK_STYLE = buildHorizontalScrollMaskStyle({
	edge: "start",
	fadeSize: "var(--ds-space-300)",
});
const AGENT_COMPACT_CONFIG_NAV_END_MASK_STYLE = buildHorizontalScrollMaskStyle({
	edge: "end",
	fadeSize: "var(--ds-space-300)",
});
const AGENT_COMPACT_CONFIG_NAV_BOTH_MASK_STYLE = buildHorizontalScrollMaskStyle({
	edge: "both",
	fadeSize: "var(--ds-space-300)",
});
// Shared flat-trigger look for every item in the connected config menu bar.
// Kept subtle (no border/background) so the strip reads as one continuous
// surface rather than a row of separate buttons.
const AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS =
	"inline-flex h-6 shrink-0 items-center gap-1 rounded px-2 text-xs font-semibold leading-4 text-text-subtlest transition-colors outline-hidden hover:bg-bg-neutral-subtle-hovered hover:text-text aria-expanded:bg-bg-neutral-subtle-hovered aria-expanded:text-text focus-visible:ring-3 focus-visible:ring-ring/50";
const AGENT_EMPTY_ROW_ADD_LABELS: Record<AgentConfigListFieldName, string> = {
	conversationStarters: "Add prompts to help people start",
	knowledge: "Add knowledge to ground this agent",
	apps: "Add apps to connect tools and knowledge",
	skills: "Add skills to guide specialized tasks",
	subagents: "Add subagents to handle specific scenarios",
	tools: "Add tools to extend what this agent can do",
	triggers: "Add automations for when this agent runs",
};

function getAgentFilledSummaryAddLabel(field: AgentConfigListFieldName, isEmpty: boolean, showAddButtons: boolean): string | undefined {
	if (!showAddButtons) {
		return undefined;
	}

	return isEmpty ? AGENT_EMPTY_ROW_ADD_LABELS[field] : "Edit";
}

function openAgentDirectoryOrAppendListItem(
	directory: AgentDirectoryKind,
	field: AgentConfigListFieldName,
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void,
	onAppendListItem?: (field: AgentConfigListFieldName) => void,
): void {
	if (onOpenDirectory) {
		onOpenDirectory(directory);
		return;
	}

	onAppendListItem?.(field);
}

function getAgentCompactEmptyConfigNavItems(config?: AgentConfigFormValue) {
	return AGENT_COMPACT_EMPTY_CONFIG_NAV_ITEMS.map((item) => {
		let count = 0;
		if (config) {
			switch (item.agentFieldName) {
				case "trigger":
					count = getAgentAutomationItems(config).length;
					break;
				case "skills":
					count = getNonEmptyConfigItems(config.skills).length;
					break;
				case "apps":
					count = getNonEmptyConfigItems(config.apps).length;
					break;
				case "subagents":
					count = getNonEmptyConfigItems(config.subagents).length;
					break;
				case "memory":
					// Memory is an always-on knowledge source with no item count.
					count = 0;
					break;
				case "conversationStarters":
					count = getNonEmptyConfigItems(config.conversationStarters).length;
					break;
				case "reasoning":
					count = 0;
					break;
			}
		}
		return { ...item, count };
	});
}

const MENTION_SOURCE_LIMIT = 24;

// Studio instructions editor uses the shared nested-first suggestion behavior:
// bare "@" / "/" show parent categories, while top-level typing searches flat
// across that trigger's full set. Hoisted so the editor's extension memo stays
// referentially stable.
const AGENT_INSTRUCTIONS_SUGGESTION_VARIANT: RichTextSuggestionVariantConfig = "nested";

function toMentionId(category: RichTextMentionItem["category"], id: string): string {
	return `${category}:${id.trim().replace(/\s+/g, "-")}`;
}

const AGENT_CONFIG_FIELD_BY_REFERENCE_CATEGORY: Record<RichTextReferenceCategory, AgentConfigReferenceListFieldName> = {
	knowledge: "knowledge",
	skill: "skills",
	subagent: "subagents",
	tool: "tools",
	app: "apps",
};

const AGENT_REFERENCE_CATEGORY_BY_CONFIG_FIELD: Record<AgentConfigReferenceListFieldName, RichTextReferenceCategory> = {
	knowledge: "knowledge",
	skills: "skill",
	subagents: "subagent",
	tools: "tool",
	apps: "app",
};
type AgentInlineSearchField = Extract<AgentConfigReferenceListFieldName, "apps" | "knowledge" | "skills" | "tools">;

const AGENT_INLINE_SEARCH_CATEGORY_BY_FIELD: Record<AgentInlineSearchField, EditorPaletteSearchCategory> = {
	apps: "app",
	knowledge: "knowledge",
	skills: "skill",
	tools: "tool",
};

// Sentinel passed to onPickKnowledgeApp when the picker's leading "Upload
// files" row is chosen (vs. a real app id).
// Sentinel "app id" for the "Upload files" lead row in the Add knowledge
// flyout. The config panel opens the directory's file browser instead of an
// app content step when it receives this value.
export const AGENT_KNOWLEDGE_UPLOAD_TARGET = "__upload__";

function getAgentReferenceKey(
	field: AgentConfigReferenceListFieldName,
	value: string,
): string {
	return `${field}:${getNormalizedAgentReferenceValue(value)}`;
}

function hasAgentReferenceValue(
	config: AgentConfigFormValue,
	field: AgentConfigReferenceListFieldName,
	value: string,
): boolean {
	const normalizedValue = getNormalizedAgentReferenceValue(value);
	return getNonEmptyConfigItems(config[field]).some(
		(item) => getNormalizedAgentReferenceValue(item) === normalizedValue,
	);
}

function mapConfigValuesToMentionItems(
	category: RichTextReferenceCategory,
	values: readonly string[] | undefined,
): RichTextMentionItem[] {
	return getNonEmptyConfigItems(values).map((value) =>
		getDirectoryMentionItemOrFallback(category, value)
	);
}

function mapSubagentConfigValuesToMentionItems(
	values: readonly string[] | undefined,
): RichTextMentionItem[] {
	return getNonEmptyConfigItems(values).map((value) => ({
		category: "subagent",
		id: toMentionId("subagent", value),
		label: value,
	}));
}

function mapMemoryToKnowledgeItems(
	explorer: WikiMemoryExplorerResponse | null,
): RichTextMentionItem[] {
	return (explorer?.nodes ?? [])
		.slice(0, MENTION_SOURCE_LIMIT)
		.map((node) => ({
			category: "knowledge",
			id: toMentionId("knowledge", node.id),
			label: node.title || node.label || node.id,
			description: node.summary || node.kind,
		}));
}

function mergeMentionItems(
	...groups: ReadonlyArray<readonly RichTextMentionItem[] | undefined>
): RichTextMentionItem[] {
	const seen = new Set<string>();
	const items: RichTextMentionItem[] = [];

	for (const group of groups) {
		for (const item of group ?? []) {
			const key = `${item.category}:${item.id}:${getNormalizedAgentReferenceValue(item.label)}`;
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);
			items.push(item);
		}
	}

	return items;
}

// Maps a directory-backed "/" slash category to the config-panel directory it
// opens from a nested empty state's "Browse all". "format" has no directory and
// is intentionally absent (the renderer omits its button), so the map only
// covers the reference categories.
const AGENT_DIRECTORY_BY_SLASH_CATEGORY: Record<
	Exclude<RichTextSlashCategory, "format">,
	AgentDirectoryKind
> = {
	skill: "skills",
	tool: "tools",
	knowledge: "knowledge",
	app: "apps",
};

export type AgentProps = ComponentProps<"div">;

export const Agent = memo(({ className, ...props }: Readonly<AgentProps>) => (
	<div
		className={cn("not-prose w-full overflow-hidden bg-surface text-text", className)}
		{...props}
	/>
));

function suppressMenuDismissal(event: { preventDefault: () => void }) {
	event.preventDefault();
}

export type AgentCompactSurfacesPanelProps = ComponentProps<typeof AgentSurfaces>;

export type AgentCompactInsightsPanelProps = ComponentProps<typeof AgentInsights>;

export function AgentCompactInsightsPanel(props: Readonly<AgentCompactInsightsPanelProps>) {
	return <AgentInsights {...props} />;
}

export function AgentCompactSurfacesPanel(props: Readonly<AgentCompactSurfacesPanelProps>) {
	return <AgentSurfaces {...props} />;
}

export type AgentCompactEvaluationPanelProps = ComponentProps<typeof AgentEvaluation>;

export function AgentCompactEvaluationPanel(props: Readonly<AgentCompactEvaluationPanelProps>) {
	return <AgentEvaluation {...props} />;
}

export type AgentCompactUsersPanelProps = ComponentProps<typeof AgentUsers>;

export function AgentCompactUsersPanel(props: Readonly<AgentCompactUsersPanelProps>) {
	return <AgentUsers {...props} />;
}

export type AgentCompactAccessPanelProps = ComponentProps<typeof AgentAccess>;

export function AgentCompactAccessPanel(props: Readonly<AgentCompactAccessPanelProps>) {
	return <AgentAccess {...props} />;
}

export type AgentHeaderProps = ComponentProps<"div"> & {
	name: string;
	avatarSrc?: string;
	model?: string;
	leadingContent?: ReactNode;
	// Floats above the right edge of the leading (nav) area without taking
	// layout space — used for the transient save indicator, which veils the nav
	// behind a gradient scrim instead of pushing the surrounding controls.
	leadingOverlay?: ReactNode;
	primaryActionLabel?: string;
	publishLabel?: string;
	showActions?: boolean;
	actions?: ReactNode;
	badge?: ReactNode;
};

export type AgentMoreOptionsMenuProps = {
	deleteLabel?: string;
	triggerLabel?: string;
	onDelete?: () => void;
};

export function AgentMoreOptionsMenu({
	deleteLabel = "Delete agent",
	triggerLabel = "More options",
	onDelete,
}: Readonly<AgentMoreOptionsMenuProps>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={triggerLabel}
				render={(
					<Button
						type="button"
						size="icon"
						variant="outline"
					/>
				)}
			>
				<Icon render={<ShowMoreHorizontalIcon label="" color="currentColor" />} aria-hidden />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					<DropdownMenuItem
						variant="destructive"
						elemBefore={<Icon render={<DeleteIcon label="" size="small" />} aria-hidden />}
						onClick={onDelete}
					>
						{deleteLabel}
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export const AgentHeader = memo(
	({
		className,
		avatarSrc = AGENT_AVATAR_SRC,
		leadingContent,
		leadingOverlay,
		model,
		name,
		primaryActionLabel = "Test",
		publishLabel = "Publish",
		showActions = true,
		actions,
		badge,
		...props
	}: Readonly<AgentHeaderProps>) => (
		<div
			className={cn(
				"flex h-14 w-full items-center justify-between gap-4 border-b border-border bg-surface px-4",
				className
			)}
			{...props}
		>
			<div className="relative flex min-w-0 flex-1 items-center">
				{leadingContent ?? (
					<div className="flex min-w-0 items-center gap-2">
						<Avatar label="Agent" shape="hexagon" size="sm">
							{isAtlassianLogoSource(avatarSrc) ? (
								<AtlassianLogo name="atlassian" label={name} size="small" />
							) : (
								<AvatarImage alt="" src={avatarSrc} />
							)}
						</Avatar>
						<span className="truncate text-sm font-semibold leading-5 text-text">{name}</span>
						{model ? (
							<Lozenge>
								{model}
							</Lozenge>
						) : null}
						{badge}
					</div>
				)}
				{leadingOverlay ? (
					<div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center justify-end">
						{leadingOverlay}
					</div>
				) : null}
			</div>
			{showActions ? (
				<div className="flex shrink-0 items-center gap-2">
					{actions ?? (
						<>
							<AgentMoreOptionsMenu />
							<Button type="button" size="default" variant="outline">
								{primaryActionLabel}
							</Button>
							<Button type="button" size="default" variant="default">
								{publishLabel}
							</Button>
						</>
					)}
				</div>
			) : null}
		</div>
	)
);

export type AgentContentProps = ComponentProps<"div">;

export const AgentContent = memo(
	({ className, ...props }: Readonly<AgentContentProps>) => (
		<div className={cn("space-y-4 p-6", className)} {...props} />
	)
);

export type AgentInstructionsProps = ComponentProps<"div"> & {
	children: string;
};

export const AgentInstructions = memo(
	({ className, children, ...props }: Readonly<AgentInstructionsProps>) => (
		<div className={cn("space-y-2", className)} {...props}>
			<span className="font-medium text-text-subtle text-sm">
				Instructions
			</span>
			<div className="rounded-md bg-surface-sunken p-3 text-text-subtle text-sm">
				<p>{children}</p>
			</div>
		</div>
	)
);

export type AgentToolsProps = ComponentProps<typeof Accordion>;

export const AgentTools = memo(({ className, ...props }: Readonly<AgentToolsProps>) => (
	<div className={cn("space-y-2", className)}>
		<span className="font-medium text-text-subtle text-sm">Tools</span>
		<Accordion className="rounded-md border border-border" {...props} />
	</div>
));

export type AgentToolProps = ComponentProps<typeof AccordionItem> & {
	tool: Tool;
};

export const AgentTool = memo(
	({ className, tool, value, ...props }: Readonly<AgentToolProps>) => {
		const schema =
			"jsonSchema" in tool && tool.jsonSchema
				? tool.jsonSchema
				: tool.inputSchema;

		return (
			<AccordionItem
				className={cn("border-b border-border last:border-b-0", className)}
				value={value}
				{...props}
			>
				<AccordionTrigger className="px-3 py-2 text-sm text-text-subtle transition-colors hover:text-text hover:no-underline">
					{tool.description ?? "No description"}
				</AccordionTrigger>
				<AccordionContent className="px-3 pb-3">
					<div className="rounded-md bg-surface-sunken">
						<CodeBlock code={JSON.stringify(schema, null, 2)} language="json" />
					</div>
				</AccordionContent>
			</AccordionItem>
		);
	}
);

export type AgentOutputProps = ComponentProps<"div"> & {
	schema: string;
};

export const AgentOutput = memo(
	({ className, schema, ...props }: Readonly<AgentOutputProps>) => (
		<div className={cn("space-y-2", className)} {...props}>
			<span className="font-medium text-text-subtle text-sm">
				Output Schema
			</span>
			<div className="rounded-md bg-surface-sunken">
				<CodeBlock code={schema} language="typescript" />
			</div>
		</div>
	)
);

type AgentCompactConfigNavItem = ReturnType<typeof getAgentCompactEmptyConfigNavItems>[number];

function getAgentCompactConfigNavItemOnClick(
	item: AgentCompactConfigNavItem,
	onAppendListItem?: (field: AgentConfigListFieldName) => void,
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void,
	onEditTriggers?: (seed?: AgentAutomationRule) => void,
): (() => void) | undefined {
	if (item.agentFieldName === "trigger") {
		return () => onEditTriggers?.();
	}

	if (item.agentFieldName === "skills") {
		return () => openAgentDirectoryOrAppendListItem("skills", "skills", onOpenDirectory, onAppendListItem);
	}

	if (item.agentFieldName === "conversationStarters") {
		return () => openAgentDirectoryOrAppendListItem("conversationStarters", "conversationStarters", onOpenDirectory, onAppendListItem);
	}

	if ("listFieldName" in item) {
		return () => onAppendListItem?.(item.listFieldName);
	}
	return undefined;
}

function AgentCompactConfigNavButton({
	className,
	item,
	onClick,
	screenAssistantTargetId,
	...props
}: Readonly<{
	item: AgentCompactConfigNavItem;
	onClick?: () => void;
	screenAssistantTargetId?: string;
} & ComponentProps<"button">>) {
	return (
		<button
			type="button"
			data-agent-field={item.agentFieldName}
			data-screen-assistant-target={screenAssistantTargetId}
			className={cn(AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS, className)}
			onClick={onClick}
			{...props}
		>
			{item.label}
			{item.count > 0 ? <Badge>{item.count}</Badge> : null}
		</button>
	);
}

// Shared chrome for every collapsed-nav dropdown so Triggers, Knowledge/Tools/
// Skills, Subagents and Conversation starters all read identically to the
// Memory dropdown: items sit directly inside the popup's default `p-1` frame
// (4px all around), so list, separator, and footer share one even inset. The
// popup itself scrolls and caps height (`overflow-y-auto max-h-(--available-height)`),
// so no inner scroll region or sticky footer is needed.
function AgentCompactNavMenuList({ children }: Readonly<{ children: ReactNode }>) {
	return <>{children}</>;
}

function AgentCompactNavMenuFooter({ children }: Readonly<{ children: ReactNode }>) {
	// Inset separator (default `mx-1 my-1` = 4px) then the footer item, both
	// living in the popup's `p-1` frame — identical rhythm to the Memory menu.
	return (
		<>
			<DropdownMenuSeparator />
			{children}
		</>
	);
}

// Permanent footer pinned to the bottom of a flex-column popup. Used together
// with `AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS` on the `MenubarContent` and a
// `flex-1 min-h-0 overflow-y-auto` scroll region around the list: the list
// scrolls, this footer is a non-shrinking block that simply sits at the bottom
// (no `sticky`, which would add phantom height when the content fits). The
// popup's own `p-1` (4px) frame keeps the footer items inset evenly left/right/
// bottom to match the list. When `bordered` (a list sits above) it carries the
// same inset `DropdownMenuSeparator` (`mx-1 my-1` = 4px) as the non-sticky
// `AgentCompactNavMenuFooter`, so the divider gap matches the Knowledge/Tools/
// Skills/Subagents menus exactly.
const AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS = "flex max-h-(--available-height) flex-col";

function AgentCompactNavMenuPinnedFooter({
	bordered = true,
	children,
}: Readonly<{ bordered?: boolean; children: ReactNode }>) {
	return (
		<div className="shrink-0">
			{bordered ? <DropdownMenuSeparator /> : null}
			{children}
		</div>
	);
}

type AgentCompactNavMenuOpenChange = NonNullable<ComponentProps<typeof MenubarMenu>["onOpenChange"]>;

function shouldClearCompactNavInitialHighlight(eventDetails: Parameters<AgentCompactNavMenuOpenChange>[1]): boolean {
	if (
		eventDetails.reason === "trigger-focus" ||
		eventDetails.reason === "trigger-hover" ||
		eventDetails.reason === "sibling-open"
	) {
		return true;
	}

	if (eventDetails.reason !== "trigger-press") {
		return false;
	}

	const event = eventDetails.event;
	if (typeof PointerEvent !== "undefined" && event instanceof PointerEvent) {
		return true;
	}
	return !(event instanceof MouseEvent) || event.detail !== 0;
}

function clearCompactNavInitialHighlight(contentElement: HTMLElement): void {
	const activeElement = contentElement.ownerDocument.activeElement;

	for (const highlightedElement of contentElement.querySelectorAll<HTMLElement>("[data-highlighted]")) {
		highlightedElement.removeAttribute("data-highlighted");

		if (highlightedElement.getAttribute("tabindex") === "0") {
			highlightedElement.setAttribute("tabindex", "-1");
		}
	}

	if (
		activeElement instanceof HTMLElement &&
		contentElement.contains(activeElement) &&
		activeElement !== contentElement
	) {
		contentElement.focus({ preventScroll: true });
	}
}

function AgentCompactNavMenuInitialHighlightReset({
	enabled,
	resetToken,
}: Readonly<{
	enabled: boolean;
	resetToken: number;
}>) {
	const markerRef = useRef<HTMLSpanElement | null>(null);

	useLayoutEffect(() => {
		if (!enabled) {
			return;
		}

		const contentElement = markerRef.current?.closest<HTMLElement>(
			"[data-slot='menubar-content'], [data-slot='dropdown-menu-content']",
		);
		if (!contentElement) {
			return;
		}

		const clear = () => clearCompactNavInitialHighlight(contentElement);

		clear();

		queueMicrotask(() => {
			clear();
			requestAnimationFrame(clear);
			window.setTimeout(clear, 120);
		});
	}, [enabled, resetToken]);

	return (
		<span
			aria-hidden
			className="hidden"
			data-agent-compact-nav-initial-highlight-reset=""
			ref={markerRef}
		/>
	);
}

function useCompactNavMenuNoInitialHighlight(): {
	onOpenChange: AgentCompactNavMenuOpenChange;
	resetInitialHighlight: boolean;
	resetToken: number;
} {
	const shouldResetInitialHighlightRef = useRef(false);
	const [resetToken, setResetToken] = useState(0);
	const handleOpenChange = useCallback<AgentCompactNavMenuOpenChange>(
		(open, eventDetails) => {
			if (open && shouldClearCompactNavInitialHighlight(eventDetails)) {
				shouldResetInitialHighlightRef.current = true;
				setResetToken((currentResetToken) => currentResetToken + 1);
				return;
			}

			if (!open) {
				shouldResetInitialHighlightRef.current = false;
			}
		},
		[],
	);

	return {
		onOpenChange: handleOpenChange,
		resetInitialHighlight: shouldResetInitialHighlightRef.current,
		resetToken,
	};
}

// Memoize a trimmed Set of disabled labels for O(1) per-row lookups. The
// collapsed-nav dropdowns receive the field's disabled labels (derived from the
// persisted config) and match by label so the state survives reorder/removal.
function useDisabledLabelSet(disabledItems: readonly string[] | undefined): ReadonlySet<string> {
	return useMemo(() => new Set((disabledItems ?? []).map((entry) => entry.trim())), [disabledItems]);
}

function AgentCompactSubagentsNavButton({
	disabledItems,
	item,
	onCreateSubagent,
	onManageSubagents,
	onRemoveSubagent,
	onSelectSubagent,
	onToggleItem,
	renderTrigger,
	screenAssistantTargetId,
	selectedIndex,
	subagents,
	tagColor,
}: Readonly<{
	disabledItems?: readonly string[];
	item: AgentCompactConfigNavItem;
	onCreateSubagent?: () => void;
	onManageSubagents?: () => void;
	onRemoveSubagent?: (index: number) => void;
	onSelectSubagent?: (index: number) => void;
	onToggleItem?: (index: number, enabled: boolean) => void;
	// Overrides the default collapsed-nav trigger so the expanded Subagents row
	// can open this same dropdown from its inline "Add" button.
	renderTrigger?: ReactElement;
	screenAssistantTargetId?: string;
	selectedIndex?: number;
	subagents: readonly string[];
	tagColor?: TagColor;
}>) {
	const isEmpty = item.count === 0;
	const disabledSet = useDisabledLabelSet(disabledItems);
	const compactNavMenu = useCompactNavMenuNoInitialHighlight();

	return (
		<MenubarMenu onOpenChange={compactNavMenu.onOpenChange}>
			{renderTrigger ? (
				<MenubarTrigger render={renderTrigger} />
			) : (
				<MenubarTrigger
					className={AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS}
					render={(
						<AgentCompactConfigNavButton
							aria-label="Subagents"
							item={item}
							screenAssistantTargetId={screenAssistantTargetId}
						/>
					)}
				/>
			)}
			<MenubarContent
				align="start"
				className={cn("w-64", AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS)}
			>
				<AgentCompactNavMenuInitialHighlightReset
					enabled={compactNavMenu.resetInitialHighlight}
					resetToken={compactNavMenu.resetToken}
				/>
				{isEmpty ? null : (
					<div className="min-h-0 flex-1 overflow-y-auto">
						<AgentCompactNavMenuList>
							<DropdownMenuGroup className="p-0">
								{subagents.map((subagent, index) => (
									<AgentCompactReferenceRow
										key={`${subagent}-${index}`}
										category="subagent"
										enabled={!disabledSet.has(subagent.trim())}
										label={subagent}
										onClick={() => onSelectSubagent?.(index)}
										onRemove={onRemoveSubagent ? () => onRemoveSubagent(index) : undefined}
										onToggle={onToggleItem ? (enabled) => onToggleItem(index, enabled) : undefined}
										selected={selectedIndex === index}
										tagColor={tagColor}
									/>
								))}
							</DropdownMenuGroup>
						</AgentCompactNavMenuList>
					</div>
				)}
				<AgentCompactNavMenuPinnedFooter bordered={!isEmpty}>
					<DropdownMenuItem
						elemBefore={
							<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
								<PlusIcon />
							</span>
						}
						onClick={onCreateSubagent}
					>
						Add subagent
					</DropdownMenuItem>
					<DropdownMenuItem
						elemBefore={
							<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
								<AiAgentIcon label="" />
							</span>
						}
						onClick={onManageSubagents ?? onCreateSubagent}
					>
						Manage subagents
					</DropdownMenuItem>
				</AgentCompactNavMenuPinnedFooter>
			</MenubarContent>
		</MenubarMenu>
	);
}

// A single automation row inside the collapsed Automations dropdown. Mirrors the
// subagent switcher (SubagentsSwitcherButton) hover model: a Switch parks at the
// far right and stays visible while off, an edit button slides in on hover, and a
// disabled (off) trigger reads as muted. Unlike a DropdownMenuItem this is a plain
// row so toggling/editing never closes the menu.
function AgentCompactTriggerRow({
	icon,
	label,
	enabled,
	onToggle,
	onEdit,
}: Readonly<{
	icon?: ReactNode;
	label: string;
	enabled: boolean;
	onToggle: (enabled: boolean) => void;
	onEdit?: () => void;
}>) {
	// The row is a Base UI Menu.Item with `closeOnClick={false}` so item activation
	// doesn't close the menu. The switch additionally calls `preventDefault()` on
	// pointerdown: Base UI's dismissal treats a prevented press that starts inside
	// the popup as intentional and suppresses the follow-up outside-click, so
	// toggling never dismisses the menu even when the re-render detaches the
	// pressed node. preventDefault is safe here because the Switch toggles via
	// `onCheckedChange`, not the native default.
	return (
		<DropdownMenuItem
			closeOnClick={false}
			className={cn(
				hoverRevealRowClassName,
				"cursor-default",
				// A disabled row reads as muted until re-enabled — keep it muted on
				// hover too (the item's `data-[highlighted]:text-text` would otherwise
				// re-darken the label).
				enabled ? undefined : "text-text-disabled data-[highlighted]:text-text-disabled",
			)}
			elemBefore={
				icon ? (
					<span
						className={cn(
							"inline-flex size-6 shrink-0 items-center justify-center",
							enabled ? "text-icon-subtle" : "text-icon-disabled",
						)}
					>
						{icon}
					</span>
				) : undefined
			}
		>
			<HoverRevealLabel
				reserveOnReveal={onEdit ? 2 : 1}
				// A disabled row parks its switch visibly, so keep its single-control
				// width reserved even at rest; an enabled row gets the full width.
				reserveAtRest={enabled ? 0 : 1}
			>
				{label}
			</HoverRevealLabel>
			<HoverRevealActions
				toggleParked={!enabled}
				toggle={
					<Switch
						size="sm"
						checked={enabled}
						onCheckedChange={onToggle}
						onPointerDown={suppressMenuDismissal}
						onMouseDown={suppressMenuDismissal}
						aria-label={`${enabled ? "Disable" : "Enable"} ${label}`}
					/>
				}
				action={
					onEdit ? (
						<button
							type="button"
							aria-label={`Edit ${label}`}
							className="flex size-6 items-center justify-center rounded-md text-text-subtlest transition-colors duration-normal ease-out hover:bg-bg-neutral-subtle-hovered hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-selected [&_svg]:size-4"
							onClick={onEdit}
						>
							<EditIcon label="" size="small" />
						</button>
					) : undefined
				}
			/>
		</DropdownMenuItem>
	);
}

// Resolves a configured reference row's leading "front slot" visual from its
// directory category — the same avatar/logo/icon the inline AgentReferenceChip
// shows. Rendered natively at `menu-compact` (a 24px `small` tile) to fill the
// 24px front slot, matching the trigger rows and footer icons in these
// dropdowns. Drawing natively (rather than scaling a 32px `menu` mark down to
// 75%) keeps the glyph on ADS's `small` Tile inset (14px) instead of freezing
// the `medium` inset and shrinking the glyph to 12px. Values not present in the
// directory fall back to a category-appropriate `small` icon tile, mirroring
// AgentReferenceChip's fallback. Subagents are prompt references owned by the
// parent agent, so they deliberately skip directory avatar resolution and always
// use the AI-agent tile. Glyph icons inherit the menu's subtle front-slot
// treatment; avatars/logos/images keep their color, exactly like the sibling
// Triggers rows.
function renderAgentReferenceRowVisual(
	category: RichTextReferenceCategory,
	label: string,
	tagColor?: TagColor,
): ReactNode {
	if (category === "subagent") {
		return (
			<span className="inline-flex size-6 shrink-0 items-center justify-center">
				<IconTile
					aria-hidden
					className={cn(
						"border border-border bg-surface",
						tagColor ? tagColorToMenuIconClassName[tagColor] : "text-icon-subtlest",
					)}
					icon={<AiAgentIcon label="" size="small" />}
					label=""
					size="small"
				/>
			</span>
		);
	}

	const visual = getDirectoryMentionItemOrFallback(category, label).visual;
	return (
		<span className="inline-flex size-6 shrink-0 items-center justify-center">
			{visual ? (
				<RichTextMentionVisualMark category={category} label={label} size="menu-compact" visual={visual} />
			) : (
				<IconTile
					aria-hidden
					className={cn(
						"border border-border bg-surface",
						tagColor ? tagColorToMenuIconClassName[tagColor] : "text-icon-subtlest",
					)}
					icon={<PageIcon label="" size="small" />}
					label=""
					size="small"
				/>
			)}
		</span>
	);
}

// A configured reference row (knowledge / tools / skills / subagents) inside a
// collapsed config dropdown. Mirrors AgentCompactTriggerRow's hover-reveal model:
// the label truncates clear of trailing controls that reveal on hover/focus —
// an enable/disable Switch (parked visible while off) plus a "Remove" button.
// The row's primary press keeps its normal behavior (open the directory on this
// item); both trailing controls stop propagation so they never also trigger the
// row press or dismiss the menu.
function AgentCompactReferenceRow({
	category,
	elemBefore,
	enabled = true,
	label,
	onClick,
	onRemove,
	onToggle,
	selected,
	tagColor,
}: Readonly<{
	// Directory category for the row. When set (and no explicit `elemBefore` is
	// passed), the row resolves its leading "front slot" visual from the directory
	// so every configured item shows the same avatar/logo/icon as its inline chip.
	category?: RichTextReferenceCategory;
	elemBefore?: ReactNode;
	enabled?: boolean;
	label: string;
	onClick?: () => void;
	onRemove?: () => void;
	onToggle?: (enabled: boolean) => void;
	selected?: boolean;
	tagColor?: TagColor;
}>) {
	// See AgentCompactTriggerRow: preventDefault on the switch's pointer/mouse
	// down stops Base UI from dismissing the menu when toggling.
	// Prefer an explicit elemBefore; otherwise derive the front slot from the row's
	// directory category so skills/tools/apps/subagents each lead with their icon.
	const frontSlot = elemBefore ?? (category ? renderAgentReferenceRowVisual(category, label, tagColor) : undefined);
	const hasToggle = onToggle !== undefined;
	// Reserve trailing width for whichever controls exist: switch + remove = 2,
	// either alone = 1, neither = none.
	const reserveCount = (hasToggle ? 1 : 0) + (onRemove ? 1 : 0);
	const resolvedElemBefore = frontSlot
		? hasToggle && !enabled
			? <span className="inline-flex size-6 items-center justify-center opacity-(--opacity-disabled)">{frontSlot}</span>
			: frontSlot
		: undefined;
	return (
		<DropdownMenuItem
			closeOnClick={!hasToggle}
			className={cn(
				hoverRevealRowClassName,
				// A disabled row reads as muted until re-enabled — keep it muted on
				// hover too (the item's `data-[highlighted]:text-text` would otherwise
				// re-darken the label).
				hasToggle && !enabled ? "text-text-disabled data-[highlighted]:text-text-disabled" : undefined,
			)}
			elemBefore={resolvedElemBefore}
			onClick={onClick}
			selected={selected}
		>
			<HoverRevealLabel
				reserveOnReveal={reserveCount > 0 ? (reserveCount as 1 | 2) : undefined}
				// A disabled row parks its switch visibly, so keep one control's width
				// reserved even at rest; otherwise reveal the full label at rest.
				reserveAtRest={hasToggle && !enabled ? 1 : 0}
			>
				{label}
			</HoverRevealLabel>
			{reserveCount > 0 ? (
				<HoverRevealActions
					toggleParked={hasToggle && !enabled}
					toggle={
						hasToggle ? (
							<Switch
								size="sm"
								checked={enabled}
								onCheckedChange={onToggle}
								onPointerDown={suppressMenuDismissal}
								onMouseDown={suppressMenuDismissal}
								aria-label={`${enabled ? "Disable" : "Enable"} ${label}`}
							/>
						) : undefined
					}
					action={
						onRemove ? (
							<button
								type="button"
								aria-label={`Remove ${label}`}
								className="flex size-6 items-center justify-center rounded-md text-text-subtlest transition-colors duration-normal ease-out hover:bg-bg-neutral-subtle-hovered hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-selected [&_svg]:size-4"
								onClick={(event) => {
									// Don't let the press bubble to the row's onClick (which would
									// open the directory) or close the menu via item activation.
									event.preventDefault();
									event.stopPropagation();
									onRemove();
								}}
							>
								<DeleteIcon label="" size="small" />
							</button>
						) : undefined
					}
				/>
			) : null}
		</DropdownMenuItem>
	);
}

// Automations dropdown: the automation list (when any) scrolls in the popup body,
// and the "Add automation ›" flyout + "Manage automations" live in a permanent
// sticky footer pinned to the bottom — so adding automations grows the list at the top
// while the footer stays anchored. The flyout reuses the full TriggerPicker
// provider/event content so behavior matches the expanded summary row exactly.
function AgentCompactTriggersNavButton({
	automationRules,
	item,
	triggers,
	onSelectEvent,
	onEditTriggers,
	onManageTriggers,
	onAutomationRulesChange,
	renderTrigger,
	screenAssistantTargetId,
}: Readonly<{
	automationRules?: readonly AgentAutomationRule[];
	item: AgentCompactConfigNavItem;
	triggers: readonly string[];
	onSelectEvent: (providerId: Parameters<typeof createAgentTriggerValue>[0], eventId: string) => void;
	onEditTriggers?: (seed?: AgentAutomationRule) => void;
	onAutomationRulesChange?: (automationRules: readonly AgentAutomationRule[]) => void;
	// Opens the list-management dialog (reorder / toggle / delete / add), mirroring
	// "Manage subagents". Falls back to the rule-builder (`onEditTriggers`) when
	// not provided.
	onManageTriggers?: () => void;
	// Overrides the default collapsed-nav trigger button. The expanded Triggers
	// summary row passes its inline chips / "Edit" button here so they open this
	// same dropdown.
	renderTrigger?: ReactElement;
	screenAssistantTargetId?: string;
}>) {
	const isEmpty = triggers.length === 0;
	// Local enable/disable state keyed by row, mirroring the subagent switcher.
	// Disabled rows read as muted but stay listed until removed via "Manage".
	const [disabledTriggers, setDisabledTriggers] = useState<ReadonlySet<number>>(() => new Set());
	const setTriggerEnabled = useCallback((index: number, enabled: boolean) => {
		if (automationRules && onAutomationRulesChange) {
			onAutomationRulesChange(
				automationRules.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, enabled } : rule)),
			);
			return;
		}
		setDisabledTriggers((prev) => {
			const next = new Set(prev);
			if (enabled) {
				next.delete(index);
			} else {
				next.add(index);
			}
			return next;
		});
	}, [automationRules, onAutomationRulesChange]);
	// Controlled open for the "Add trigger ›" flyout so typing in its search input
	// (which blurs the submenu trigger) doesn't collapse the flyout: Base UI
	// reports that as a `focus-out` close, which we ignore. All explicit closes
	// (item press, escape, pointer leave, trigger toggle) still pass through.
	const [addTriggerOpen, setAddTriggerOpen] = useState(false);
	const handleAddTriggerOpenChange = useCallback(
		(nextOpen: boolean, eventDetails: { reason?: string }) => {
			if (!nextOpen && eventDetails.reason === "focus-out") {
				return;
			}
			setAddTriggerOpen(nextOpen);
		},
		[],
	);
	const compactNavMenu = useCompactNavMenuNoInitialHighlight();
	// "Add automation ›" reuses the picker's full searchable provider list (the
	// editor-palette "search" variant), so the flyout shows the same sticky search
	// input over the provider→event submenus as the expanded summary row's picker.
	const addTriggerFlyout = (
		<DropdownMenuSub open={addTriggerOpen} onOpenChange={handleAddTriggerOpenChange}>
			<DropdownMenuSubTrigger>
				<span className="flex items-center gap-3">
					<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
						<PlusIcon />
					</span>
					Add automation
				</span>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="w-80 p-0">
				<TriggerProviderSearchList autoFocus onSelectEvent={onSelectEvent} />
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);

	return (
		<MenubarMenu onOpenChange={compactNavMenu.onOpenChange}>
			{renderTrigger ? (
				<MenubarTrigger render={renderTrigger} />
			) : (
				<MenubarTrigger
					className={AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS}
					render={(
						<AgentCompactConfigNavButton
							aria-label="Automations"
							item={item}
							screenAssistantTargetId={screenAssistantTargetId}
						/>
					)}
				/>
			)}
			<MenubarContent
				align="start"
				className={cn("w-64", AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS)}
			>
				<AgentCompactNavMenuInitialHighlightReset
					enabled={compactNavMenu.resetInitialHighlight}
					resetToken={compactNavMenu.resetToken}
				/>
				{isEmpty ? null : (
					<div className="min-h-0 flex-1 overflow-y-auto">
						<AgentCompactNavMenuList>
							<DropdownMenuGroup className="p-0">
								{triggers.map((trigger, index) => {
									const rule = automationRules?.[index];
									const firstTrigger = rule?.triggers[0];
									const providerIcon = firstTrigger ? renderAgentTriggerProviderTileIcon(firstTrigger) : undefined;
									return (
										<AgentCompactTriggerRow
											key={`trigger-${trigger}-${index}`}
											icon={providerIcon ?? undefined}
											label={trigger}
											enabled={(rule?.enabled !== false) && !disabledTriggers.has(index)}
											onToggle={(enabled) => setTriggerEnabled(index, enabled)}
											onEdit={onEditTriggers ? () => onEditTriggers(rule) : undefined}
										/>
									);
								})}
							</DropdownMenuGroup>
						</AgentCompactNavMenuList>
					</div>
				)}
				<AgentCompactNavMenuPinnedFooter bordered={!isEmpty}>
					{addTriggerFlyout}
					<DropdownMenuItem
						elemBefore={
							<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
								<AutomationIcon label="" />
							</span>
						}
						onClick={() => (onManageTriggers ?? onEditTriggers)?.()}
					>
						Manage automations
					</DropdownMenuItem>
				</AgentCompactNavMenuPinnedFooter>
			</MenubarContent>
		</MenubarMenu>
	);
}

// Tools/Skills share one shape: configured items scroll in the body, while
// "Add {label} ›" and "Browse {label}" stay pinned in a permanent footer.
// Knowledge layers its mode options above the list (handled by
// AgentKnowledgeSelector instead).
function AgentCompactDirectoryNavButton({
	item,
	directory,
	items,
	browseLabel,
	onBrowse,
	disabledItems,
	onAddSearchItem,
	onPickTool,
	onRemoveItem,
	onSelectItem,
	onToggleItem,
	renderTrigger,
	screenAssistantTargetId,
}: Readonly<{
	item: AgentCompactConfigNavItem;
	directory: AgentInlineSearchField;
	items: readonly string[];
	browseLabel: string;
	onBrowse: () => void;
	disabledItems?: readonly string[];
	// Skills: picking a result adds it immediately. Tools: handled by
	// `onPickTool` instead (opens the tools directory on that tool's detail).
	onAddSearchItem?: (item: RichTextSuggestionMenuItem) => void;
	onPickTool?: (toolId: string) => void;
	onRemoveItem?: (index: number) => void;
	onSelectItem?: (item: string) => void;
	onToggleItem?: (index: number, enabled: boolean) => void;
	// Overrides the default collapsed-nav trigger button. The expanded summary
	// rows pass their inline "Add" button here so it opens this same dropdown.
	renderTrigger?: ReactElement;
	screenAssistantTargetId?: string;
}>) {
	const isEmpty = items.length === 0;
	const disabledSet = useDisabledLabelSet(disabledItems);
	const addLabel = `Add ${item.label.toLowerCase()}`;
	const compactNavMenu = useCompactNavMenuNoInitialHighlight();
	const browseItem = (
		<DropdownMenuItem
			elemBefore={
				<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
					<item.Icon label="" />
				</span>
			}
			onClick={onBrowse}
		>
			{browseLabel}
		</DropdownMenuItem>
	);
	// Tools open the directory dialog on the chosen tool's detail; skills add
	// the picked result immediately.
	const handlePickerSelect = directory === "tools"
		? (onPickTool ? (picked: RichTextSuggestionMenuItem) => onPickTool(getToolIdFromMentionId(picked.id)) : undefined)
		: onAddSearchItem;
	const addSearchFlyout = (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				<span className="flex items-center gap-3">
					<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
						<PlusIcon />
					</span>
					{addLabel}
				</span>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="w-auto min-w-0 overflow-visible border-0 bg-transparent p-0 shadow-none">
				<EditorPaletteSearchPicker
					autoFocus
					category={AGENT_INLINE_SEARCH_CATEGORY_BY_FIELD[directory]}
					className="rich-text-command-menu-borderless"
					excludeLabels={items}
					onBrowseAll={onBrowse}
					onSelectItem={handlePickerSelect}
				/>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);

	return (
		<MenubarMenu onOpenChange={compactNavMenu.onOpenChange}>
			{renderTrigger ? (
				<MenubarTrigger render={renderTrigger} />
			) : (
				<MenubarTrigger
					className={AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS}
					render={(
						<AgentCompactConfigNavButton
							aria-label={item.label}
							item={item}
							screenAssistantTargetId={screenAssistantTargetId}
						/>
					)}
				/>
			)}
			<MenubarContent
				align="start"
				className={cn("w-64", AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS)}
			>
				<AgentCompactNavMenuInitialHighlightReset
					enabled={compactNavMenu.resetInitialHighlight}
					resetToken={compactNavMenu.resetToken}
				/>
				{isEmpty ? null : (
					<div className="min-h-0 flex-1 overflow-y-auto">
						<AgentCompactNavMenuList>
							<DropdownMenuGroup className="p-0">
								{items.map((value, index) => (
									<AgentCompactReferenceRow
										key={`${directory}-${value}-${index}`}
										category={AGENT_REFERENCE_CATEGORY_BY_CONFIG_FIELD[directory]}
										enabled={!disabledSet.has(value.trim())}
										label={value}
										onClick={onSelectItem ? () => onSelectItem(value) : undefined}
										onRemove={onRemoveItem ? () => onRemoveItem(index) : undefined}
										onToggle={onToggleItem ? (enabled) => onToggleItem(index, enabled) : undefined}
									/>
								))}
							</DropdownMenuGroup>
						</AgentCompactNavMenuList>
					</div>
				)}
				<AgentCompactNavMenuPinnedFooter bordered={!isEmpty}>
					{addSearchFlyout}
					{browseItem}
				</AgentCompactNavMenuPinnedFooter>
			</MenubarContent>
		</MenubarMenu>
	);
}

// Apps mirror the Skills/Tools directory dropdown shell exactly: configured
// rows scroll above a pinned footer that holds an inline "Add app ›" search
// flyout and a "Browse apps" item. Picking a flyout result adds the app by
// label (via `onAddSearchItem`); "Browse apps" opens the full directory for
// connection/detail. Clicking the collapsed-nav trigger opens this menu.
function AgentCompactAppsNavButton({
	item,
	apps,
	disabledItems,
	onAddSearchItem,
	onBrowse,
	onRemoveItem,
	onSelectItem,
	onToggleItem,
	renderTrigger,
	screenAssistantTargetId,
}: Readonly<{
	item: AgentCompactConfigNavItem;
	apps: readonly string[];
	disabledItems?: readonly string[];
	// Picking a flyout result adds it immediately (mirrors Skills).
	onAddSearchItem?: (item: RichTextSuggestionMenuItem) => void;
	onBrowse: () => void;
	onRemoveItem?: (index: number) => void;
	onSelectItem?: (item: string) => void;
	onToggleItem?: (index: number, enabled: boolean) => void;
	// Overrides the default collapsed-nav trigger button so other surfaces can
	// open this same dropdown from their own inline control.
	renderTrigger?: ReactElement;
	screenAssistantTargetId?: string;
}>) {
	const isEmpty = apps.length === 0;
	const disabledSet = useDisabledLabelSet(disabledItems);
	const addLabel = `Add ${item.label.toLowerCase()}`;
	const compactNavMenu = useCompactNavMenuNoInitialHighlight();
	const addSearchFlyout = (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				<span className="flex items-center gap-3">
					<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
						<PlusIcon />
					</span>
					{addLabel}
				</span>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent className="w-auto min-w-0 overflow-visible border-0 bg-transparent p-0 shadow-none">
				<EditorPaletteSearchPicker
					autoFocus
					category={AGENT_INLINE_SEARCH_CATEGORY_BY_FIELD.apps}
					className="rich-text-command-menu-borderless"
					excludeLabels={apps}
					onBrowseAll={onBrowse}
					onSelectItem={onAddSearchItem}
				/>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);

	return (
		<MenubarMenu onOpenChange={compactNavMenu.onOpenChange}>
			{renderTrigger ? (
				<MenubarTrigger render={renderTrigger} />
			) : (
				<MenubarTrigger
					className={AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS}
					render={(
						<AgentCompactConfigNavButton
							aria-label={item.label}
							item={item}
							screenAssistantTargetId={screenAssistantTargetId}
						/>
					)}
				/>
			)}
			<MenubarContent
				align="start"
				className={cn("w-64", AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS)}
			>
				<AgentCompactNavMenuInitialHighlightReset
					enabled={compactNavMenu.resetInitialHighlight}
					resetToken={compactNavMenu.resetToken}
				/>
				{isEmpty ? null : (
					<div className="min-h-0 flex-1 overflow-y-auto">
						<AgentCompactNavMenuList>
							<DropdownMenuGroup className="p-0">
								{apps.map((value, index) => (
									<AgentCompactReferenceRow
										key={`apps-${value}-${index}`}
										category="app"
										enabled={!disabledSet.has(value.trim())}
										label={value}
										onClick={onSelectItem ? () => onSelectItem(value) : undefined}
										onRemove={onRemoveItem ? () => onRemoveItem(index) : undefined}
										onToggle={onToggleItem ? (enabled) => onToggleItem(index, enabled) : undefined}
									/>
								))}
							</DropdownMenuGroup>
						</AgentCompactNavMenuList>
					</div>
				)}
				<AgentCompactNavMenuPinnedFooter bordered={!isEmpty}>
					{addSearchFlyout}
					<DropdownMenuItem
						elemBefore={
							<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
								<item.Icon label="" />
							</span>
						}
						onClick={onBrowse}
					>
						Browse {item.label.toLowerCase()}
					</DropdownMenuItem>
				</AgentCompactNavMenuPinnedFooter>
			</MenubarContent>
		</MenubarMenu>
	);
}

// Conversation starters dropdown always exposes the 3 starter text fields for
// quick inline edits, with a "Manage conversation starters" footer that opens
// the full modal.
function AgentCompactConversationStartersNavButton({
	item,
	starters,
	onStarterChange,
	onManage,
	screenAssistantTargetId,
}: Readonly<{
	item: AgentCompactConfigNavItem;
	starters: ReadonlyArray<{ label: string }>;
	onStarterChange?: (index: number, value: string) => void;
	onManage: () => void;
	screenAssistantTargetId?: string;
}>) {
	// Always render MAX fields so the menu offers the full set of quick-edit
	// slots even before any starter exists.
	const fields = Array.from({ length: MAX_AGENT_CONVERSATION_STARTERS }, (_, index) => ({
		label: starters[index]?.label ?? "",
	}));
	const compactNavMenu = useCompactNavMenuNoInitialHighlight();

	return (
		<MenubarMenu onOpenChange={compactNavMenu.onOpenChange}>
			<MenubarTrigger
				className={AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS}
				render={(
					<AgentCompactConfigNavButton
						aria-label="Conversation starters"
						item={item}
						screenAssistantTargetId={screenAssistantTargetId}
					/>
				)}
			/>
			<MenubarContent align="start" className="w-70">
				<AgentCompactNavMenuInitialHighlightReset
					enabled={compactNavMenu.resetInitialHighlight}
					resetToken={compactNavMenu.resetToken}
				/>
				{/* 8px (`p-2`) of padding around the starter input fields. */}
				<div className="flex flex-col gap-1.5 p-2">
					{fields.map((field, index) => (
						<Input
							key={`starter-${index}`}
							onChange={(event) => onStarterChange?.(index, event.target.value)}
							onKeyDown={(event) => event.stopPropagation()}
							placeholder={`Starter ${index + 1}`}
							value={field.label}
						/>
					))}
				</div>
				<AgentCompactNavMenuFooter>
					<DropdownMenuItem
						elemBefore={
							<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
								<AiChatIcon label="" />
							</span>
						}
						onClick={onManage}
					>
						Manage conversation starters
					</DropdownMenuItem>
				</AgentCompactNavMenuFooter>
			</MenubarContent>
		</MenubarMenu>
	);
}

function AgentCompactEmptyConfigNav({
	avatarSrc,
	config,
	hiddenConfigFields,
	onManageSubagents,
	onAddListValues,
	onAppendListItem,
	onEditTriggers,
	onManageTriggers,
	onAutomationRulesChange,
	onListItemChange,
	onOpenDirectory,
	onRemoveListItem,
	onSelectListItem,
	onToggleListItem,
	reasoningValue,
	onReasoningValueChange,
	memoryMode,
	onMemoryModeChange,
	screenAssistantTargetPrefix,
	selectedListItemIndexByField,
}: Readonly<{
	avatarSrc?: string;
	config?: AgentConfigFormValue;
	hiddenConfigFields?: ReadonlySet<AgentHideableConfigField>;
	onManageSubagents?: () => void;
	onAddListValues?: (field: AgentConfigReferenceListFieldName, values: readonly string[]) => void;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onEditTriggers?: (seed?: AgentAutomationRule) => void;
	onManageTriggers?: () => void;
	onAutomationRulesChange?: (automationRules: readonly AgentAutomationRule[]) => void;
	onListItemChange?: (field: AgentConfigListFieldName, index: number, value: string) => void;
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void;
	onRemoveListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onSelectListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onToggleListItem?: (field: AgentConfigListFieldName, index: number, enabled: boolean) => void;
	reasoningValue: ReasoningModeValue;
	onReasoningValueChange: (next: ReasoningModeValue) => void;
	knowledgeMode: KnowledgeModeValue;
	onKnowledgeModeChange: (next: KnowledgeModeValue) => void;
	memoryMode: MemoryModeValue;
	onMemoryModeChange: (next: MemoryModeValue) => void;
	screenAssistantTargetPrefix?: string;
	selectedListItemIndexByField?: Partial<Record<AgentConfigListFieldName, number>>;
}>) {
	// `agentFieldName` doubles as a hideable-field key for trigger/subagents/
	// conversationStarters; other field names never appear in the hidden set.
	const items = getAgentCompactEmptyConfigNavItems(config).filter(
		(item) =>
			item.agentFieldName === "apps" &&
			!hiddenConfigFields?.has(item.agentFieldName as AgentHideableConfigField),
	);
	const navOverflow = useHasHorizontalOverflow<HTMLDivElement>({
		edgeThreshold: AGENT_COMPACT_CONFIG_NAV_SCROLL_EDGE_THRESHOLD,
	});
	const scrollMaskStyle = navOverflow.canScrollLeft && navOverflow.canScrollRight
		? AGENT_COMPACT_CONFIG_NAV_BOTH_MASK_STYLE
		: navOverflow.canScrollLeft
			? AGENT_COMPACT_CONFIG_NAV_START_MASK_STYLE
			: navOverflow.canScrollRight
				? AGENT_COMPACT_CONFIG_NAV_END_MASK_STYLE
				: {};
	const subagentTagColor = getTagColorForAgentAvatar(avatarSrc);

	if (items.length === 0) {
		return null;
	}

	return (
		<div className="relative flex min-h-8 min-w-0 items-center">
			<Menubar
				// Override the shared Menubar's bordered/elevated chrome so the strip
				// reads as one flat, connected surface (matching the prior loose-button
				// look) while still giving us roving focus + arrow-key nav across items.
				// When the container is too tight, the row scrolls horizontally and the
				// shared scroll-mask fades whichever edge has more content.
				className="relative -my-1 flex h-auto min-w-0 flex-1 items-center overflow-x-auto overflow-y-visible overscroll-x-contain rounded-none border-0 bg-transparent p-0 py-1 pl-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
				ref={navOverflow.ref}
				style={{
					gap: AGENT_COMPACT_CONFIG_NAV_GAP,
					...scrollMaskStyle,
				}}
			>
				{items.map((item) => {
					if (item.agentFieldName === "reasoning") {
						return (
							<AgentReasoningSelector
								key={item.agentFieldName}
								render="nav-button"
								value={reasoningValue}
								onValueChange={onReasoningValueChange}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:reasoning` : undefined}
							/>
						);
					}
					if (item.agentFieldName === "memory") {
						return (
							<AgentMemorySelector
								key={item.agentFieldName}
								render="nav-button"
								value={memoryMode}
								onValueChange={onMemoryModeChange}
								onManage={() => onOpenDirectory?.("memory")}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:memory` : undefined}
							/>
						);
					}
					if (item.agentFieldName === "subagents") {
						return (
							<AgentCompactSubagentsNavButton
								item={item}
								key={item.agentFieldName}
								onCreateSubagent={() => onAppendListItem?.("subagents")}
								onManageSubagents={onManageSubagents}
								disabledItems={config?.disabledItems?.subagents}
								onRemoveSubagent={onRemoveListItem ? (index) => onRemoveListItem("subagents", index) : undefined}
								onSelectSubagent={(index) => onSelectListItem?.("subagents", index)}
								onToggleItem={onToggleListItem ? (index, enabled) => onToggleListItem("subagents", index, enabled) : undefined}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:subagents` : undefined}
								selectedIndex={selectedListItemIndexByField?.subagents}
								subagents={getNonEmptyConfigItems(config?.subagents)}
								tagColor={subagentTagColor}
							/>
						);
					}
					if (item.agentFieldName === "trigger") {
						const automationRules = config ? getAgentAutomationRules(config) : [];
						return (
							<AgentCompactTriggersNavButton
								automationRules={automationRules}
								item={item}
								key={item.agentFieldName}
								onAutomationRulesChange={onAutomationRulesChange}
								onEditTriggers={onEditTriggers}
								onManageTriggers={onManageTriggers}
								onSelectEvent={(providerId, eventId) => {
									const next = createAutomationRuleFromEvent(providerId, eventId, automationRules);
									onEditTriggers?.(next ?? undefined);
								}}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:trigger` : undefined}
								triggers={serializeAgentAutomationRuleLabels(automationRules)}
							/>
						);
					}
					if (item.agentFieldName === "apps") {
						return (
							<AgentCompactAppsNavButton
								apps={getNonEmptyConfigItems(config?.apps)}
								disabledItems={config?.disabledItems?.apps}
								item={item}
								key={item.agentFieldName}
								onAddSearchItem={(searchItem) => {
									if (searchItem.disabled) {
										return;
									}
									onAddListValues?.("apps", [searchItem.label]);
								}}
								onBrowse={() => openAgentDirectoryOrAppendListItem("apps", "apps", onOpenDirectory, onAppendListItem)}
								onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("apps", index) : undefined}
								onSelectItem={onOpenDirectory ? (value) => onOpenDirectory("apps", value) : undefined}
								onToggleItem={onToggleListItem ? (index, enabled) => onToggleListItem("apps", index, enabled) : undefined}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:apps` : undefined}
							/>
						);
					}
					if (item.agentFieldName === "skills") {
						const directory = "skills" as const;
						return (
							<AgentCompactDirectoryNavButton
								browseLabel={`Browse ${item.label.toLowerCase()}`}
								directory={directory}
								item={item}
								items={getNonEmptyConfigItems(config?.skills)}
								key={item.agentFieldName}
								onAddSearchItem={(searchItem) => {
									if (searchItem.disabled) {
										return;
									}
									onAddListValues?.(directory, [searchItem.label]);
								}}
								disabledItems={config?.disabledItems?.[directory]}
								onPickTool={undefined}
								onBrowse={() => openAgentDirectoryOrAppendListItem(directory, directory, onOpenDirectory, onAppendListItem)}
								onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem(directory, index) : undefined}
								onToggleItem={onToggleListItem ? (index, enabled) => onToggleListItem(directory, index, enabled) : undefined}
								onSelectItem={onOpenDirectory ? (value) => onOpenDirectory(directory, value) : undefined}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:${item.agentFieldName}` : undefined}
							/>
						);
					}
					if (item.agentFieldName === "conversationStarters") {
						return (
							<AgentCompactConversationStartersNavButton
								item={item}
								key={item.agentFieldName}
								onManage={() => openAgentDirectoryOrAppendListItem("conversationStarters", "conversationStarters", onOpenDirectory, onAppendListItem)}
								onStarterChange={onListItemChange ? (index, value) => onListItemChange("conversationStarters", index, value) : undefined}
								screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:conversation-starters` : undefined}
								starters={config ? getConversationStarterSummaryItems(config) : []}
							/>
						);
					}
					// Every nav field is handled above; this guards future additions to
					// AGENT_COMPACT_EMPTY_CONFIG_NAV_ITEMS by falling back to a plain
					// click button rather than silently rendering nothing.
					const fallbackItem = item as AgentCompactConfigNavItem;
					return (
						<AgentCompactConfigNavButton
							item={fallbackItem}
							key={fallbackItem.agentFieldName}
							onClick={getAgentCompactConfigNavItemOnClick(fallbackItem, onAppendListItem, onOpenDirectory, onEditTriggers)}
							screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:${fallbackItem.agentFieldName}` : undefined}
						/>
					);
				})}
			</Menubar>
		</div>
	);
}

function AgentSectionLabel({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<div className="flex min-h-5 items-center text-xs font-semibold leading-4 text-text-subtlest">
			{children}
		</div>
	);
}

function getConversationStarterSummaryItems(config: AgentConfigFormValue): ReadonlyArray<{
	icon: StarterIconKey;
	label: string;
}> {
	const icons = config.conversationStarterIcons ?? [];

	return (config.conversationStarters ?? [])
		.map((item, index) => ({
			icon: (icons[index] as StarterIconKey | undefined) ?? DEFAULT_STARTER_ICON,
			label: item.trim(),
		}))
		.filter((item) => item.label.length > 0);
}

const iconColorToTagColor: Readonly<Record<string, TagColor>> = {
	"text-icon-brand": "blue",
	"text-icon-information": "blue",
	"text-icon-success": "green",
	"text-icon-discovery": "discovery",
	"text-icon-warning": "yellow",
	"text-icon-danger": "red",
	"text-icon-accent-red": "red",
	"text-icon-accent-orange": "orange",
	"text-icon-accent-yellow": "yellow",
	"text-icon-accent-lime": "lime",
	"text-icon-accent-green": "green",
	"text-icon-accent-teal": "teal",
	"text-icon-accent-blue": "blue",
	"text-icon-accent-purple": "purple",
	"text-icon-accent-magenta": "magenta",
	"text-icon-accent-gray": "gray",
	"text-yellow-400": "yellow",
};

function getTagColorForMentionVisual(visual: RichTextMentionItem["visual"]): TagColor | undefined {
	return visual?.kind === "icon" && visual.iconColor
		? iconColorToTagColor[visual.iconColor]
		: undefined;
}

// Maps each agent avatar family (the `<group>` segment in `/avatar-agent/<group>/…`)
// to the Tag color that matches its brand accent (see AGENT_AVATAR_GROUP_ACCENTS).
// Used so a subagent chip is tinted with its base agent's custom color rather than
// the generic fallback — e.g. a lime (dev-agents) agent shows lime subagent chips.
const agentAvatarGroupToTagColor: Readonly<Record<string, TagColor>> = {
	"dev-agents": "lime",
	"product-agents": "purple",
	"service-agents": "yellow",
	"strategy-agents": "orange",
	"teamwork-agents": "blue",
};

const tagColorToMenuIconClassName: Partial<Record<TagColor, string>> = {
	blue: "text-blue-500 [&_svg]:text-blue-500!",
	blueLight: "text-blue-500 [&_svg]:text-blue-500!",
	discovery: "text-icon-discovery [&_svg]:text-icon-discovery!",
	green: "text-green-400 [&_svg]:text-green-400!",
	greenLight: "text-green-400 [&_svg]:text-green-400!",
	gray: "text-neutral-500 [&_svg]:text-neutral-500!",
	grayLight: "text-neutral-500 [&_svg]:text-neutral-500!",
	grey: "text-neutral-500 [&_svg]:text-neutral-500!",
	greyLight: "text-neutral-500 [&_svg]:text-neutral-500!",
	lime: "text-lime-400 [&_svg]:text-lime-400!",
	limeLight: "text-lime-400 [&_svg]:text-lime-400!",
	magenta: "text-pink-500 [&_svg]:text-pink-500!",
	magentaLight: "text-pink-500 [&_svg]:text-pink-500!",
	orange: "text-orange-400 [&_svg]:text-orange-400!",
	orangeLight: "text-orange-400 [&_svg]:text-orange-400!",
	purple: "text-purple-500 [&_svg]:text-purple-500!",
	purpleLight: "text-purple-500 [&_svg]:text-purple-500!",
	red: "text-red-600 [&_svg]:text-red-600!",
	redLight: "text-red-600 [&_svg]:text-red-600!",
	standard: "text-neutral-500 [&_svg]:text-neutral-500!",
	teal: "text-teal-400 [&_svg]:text-teal-400!",
	tealLight: "text-teal-400 [&_svg]:text-teal-400!",
	yellow: "text-yellow-400 [&_svg]:text-yellow-400!",
	yellowLight: "text-yellow-400 [&_svg]:text-yellow-400!",
};

function getTagColorForAgentAvatar(avatarSrc: string | undefined): TagColor | undefined {
	const group = avatarSrc?.match(/\/avatar-agent\/([^/]+)\//u)?.[1];
	return group ? agentAvatarGroupToTagColor[group] : undefined;
}

function AgentReferenceChip({
	category,
	disabled = false,
	elemBefore,
	label,
	onClick,
	onRemove,
	tagColor,
	// Extra props (and ref) are injected when this chip is used as a menu/menubar
	// `render` target — Base UI merges its trigger handlers, aria state, id, and
	// ref onto whatever element it renders. Those MUST reach the underlying `Tag`
	// or the trigger is inert (e.g. clicking a trigger chip wouldn't open the
	// Triggers dropdown). We forward them onto the interactive `Tag` element.
	...rest
}: Readonly<
	Omit<ComponentProps<typeof Tag>, "color" | "children"> & {
		category?: RichTextReferenceCategory;
		disabled?: boolean;
		elemBefore?: ReactNode;
		label: string;
		onRemove?: () => void;
		tagColor?: TagColor;
	}
>) {
	const item = category && category !== "subagent" ? getDirectoryMentionItemOrFallback(category, label) : undefined;
	const visual = item?.visual;
	const resolvedTagColor = tagColor ?? getTagColorForMentionVisual(visual) ?? "blue";
	const preview = getRichTextReferencePreview(category, label);
	// When no directory visual resolves (e.g. a freshly created, still-unnamed
	// subagent that isn't in the demo agent directory), fall back to a
	// category-appropriate icon — subagents use the same agent icon as the
	// Subagents config row/header rather than the generic page icon.
	const FallbackIcon = category === "subagent" ? AiAgentIcon : PageIcon;
	const resolvedElemBefore = elemBefore ?? (
		visual ? (
			<RichTextMentionVisualMark
				category={category}
				label={label}
				visual={visual}
			/>
		) : (
			// Latest Tag standard: a bare leading icon is wrapped in the
			// `IconTile` xxsmall/transparent treatment (see `TagDemoFrontSlot`) so
			// the glyph is normalized to 16px and centered in the chip's leading
			// slot. Rendering the raw `@atlaskit/icon` instead left-aligns the 12px
			// glyph, which reads as a misaligned icon with an oversized gap.
			<IconTile
				aria-hidden
				// `text-inherit` lets the glyph pick up the Tag's color (the leading
				// slot wrapper applies the resolved Tag color, e.g. `text-lime-400`)
				// instead of the transparent variant's neutral `text-icon`. So a
				// lime subagent chip shows a lime icon, etc.
				className="text-inherit"
				icon={<Icon aria-hidden render={<FallbackIcon label="" size="small" />} />}
				label=""
				size="xxsmall"
				variant="transparent"
			/>
		)
	);

	// A disabled chip reads as muted but stays removable, so we deliberately do
	// NOT use Tag's `disabled` prop (which sets pointer-events:none and would also
	// kill the remove control). Instead we dim it via opacity and suppress only
	// the row's primary click (opening the directory), leaving the overlay remove
	// button fully interactive.
	//
	// Forward ONLY the behavioral props a `render`-target receives (event
	// handlers, aria state, id, ref) — NOT the injected `className`/`style`. When
	// this chip is a menu/menubar trigger, the parent injects its own trigger
	// styling (padding/rounding/hover background); applying that would visually
	// reshape the Tag into a button. The chip must always look like a Tag.
	const { className: injectedClassName, style: injectedStyle, ...behaviorProps } = rest;
	void injectedClassName;
	void injectedStyle;
	const tag = (
		<Tag
			{...behaviorProps}
			aria-disabled={disabled || undefined}
			className={cn(disabled && "opacity-(--opacity-disabled)")}
			color={resolvedTagColor}
			elemBefore={resolvedElemBefore}
			onClick={disabled ? undefined : onClick}
			onRemove={onRemove}
			removeButtonLabel={`Remove ${label}`}
			removeVariant="overlay"
			type={elemBefore ? "default" : getRichTextMentionTagType(visual)}
		>
			{label}
		</Tag>
	);

	return preview ? (
		<HoverCard>
			<HoverCardTrigger closeDelay={80} delay={120} render={<span className="inline-flex max-w-full" />}>
				{tag}
			</HoverCardTrigger>
			<RichTextReferencePreviewContent preview={preview} />
		</HoverCard>
	) : tag;
}

function AgentAddValueButton({
	className,
	// `icon` is retained in the prop contract so existing call sites keep
	// compiling, but every affordance now uses the edit glyph and this shared text
	// link chrome. `label` carries either "Edit" for filled rows or the descriptive
	// empty-row placeholder copy.
	icon,
	label,
	onClick,
	...props
}: Readonly<{ icon?: "add" | "edit"; label: string } & ComponentProps<"button">>) {
	void icon;
	return (
		// Shared visual chrome for Triggers and every other summary-row edit CTA.
		// The hover-reveal opacity (opacity-0 → group-hover/agent-row) is supplied
		// via `className` only for filled rows, so empty placeholders stay visible.
		<button
			type="button"
			className={cn(
				className,
				"inline-flex min-h-5 max-w-full shrink-0 items-center gap-1 rounded-xs p-0 text-left text-xs font-medium leading-4 text-text-subtlest transition-opacity hover:bg-transparent active:bg-transparent focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-transparent aria-expanded:opacity-100",
			)}
			onClick={onClick}
			{...props}
		>
			<EditIcon label="" size="small" />
			<span className="min-w-0 whitespace-normal group-hover/agent-row:underline">{label}</span>
		</button>
	);
}

interface AgentFilledSummaryRowProps {
	label: string;
	items: readonly string[];
	referenceCategory?: RichTextReferenceCategory;
	agentFieldName?: string;
	screenAssistantTargetId?: string;
	addIcon?: "add" | "edit";
	addLabel?: string;
	hideWhenEmpty?: boolean;
	itemElemBefore?: (item: string, index: number) => ReactNode;
	isItemDisabled?: (item: string, index: number) => boolean;
	inlinePicker?: ReactNode;
	onAdd?: () => void;
	// When provided, the row's inline "Add" affordance is rendered by this
	// callback instead of a plain click button — used to back "Add" with the same
	// dropdown the collapsed nav opens (list + add flyout + browse). It receives
	// the resolved label/icon plus the placement className (the hover-reveal
	// classes for the chip-paired spot, none for the empty-row spot) so the
	// trigger keeps the row's existing reveal behavior.
	renderAddControl?: (opts: { icon?: "add" | "edit"; label: string; className?: string }) => ReactNode;
	onItemClick?: (item: string, index: number) => void;
	onRemoveItem?: (index: number) => void;
	tagColor?: TagColor;
}

function AgentFilledSummaryRow({
	addIcon,
	addLabel,
	agentFieldName,
	hideWhenEmpty = false,
	inlinePicker,
	itemElemBefore,
	isItemDisabled,
	items,
	label,
	onAdd,
	renderAddControl,
	onItemClick,
	onRemoveItem,
	referenceCategory,
	screenAssistantTargetId,
	tagColor,
}: Readonly<AgentFilledSummaryRowProps>) {
	const isEmpty = items.length === 0;

	// Resolve the "Add" affordance once: a dropdown-backed control (renderAddControl)
	// when supplied, otherwise the default click button. `className` carries the
	// placement-specific reveal classes so both spots stay visually identical.
	const renderAddButton = (className?: string): ReactNode =>
		addLabel === undefined
			? null
			: renderAddControl
				? renderAddControl({ icon: addIcon, label: addLabel, className })
				: (
					<AgentAddValueButton
						className={className}
						icon={addIcon}
						label={addLabel}
						onClick={onAdd}
					/>
				);

	// Empty rows render their inline "Add" affordance by default — in the default
	// layout that's the only way to populate an empty field. In the compact layout
	// empty fields are surfaced as single-line nav buttons instead, so
	// `hideWhenEmpty` drops the redundant empty row to avoid double-representation.
	if (isEmpty && (hideWhenEmpty || !addLabel)) {
		return null;
	}

	return (
		<div
			className="group/agent-row -mx-2 rounded-md px-2 py-1 transition-colors hover:bg-bg-neutral-subtle-hovered"
			data-agent-field={agentFieldName}
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<div className="flex flex-col gap-y-1 sm:flex-row sm:items-center sm:gap-x-5">
				<div className="sm:w-32 sm:shrink-0">
					<AgentSectionLabel>{label}</AgentSectionLabel>
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-2">
					<div className="flex min-h-5 min-w-0 flex-1 flex-wrap items-center gap-1.5">
						{items.map((item, index) => {
							// Pair the final chip with the inline "Add" affordance inside a single
							// non-wrapping group so they reflow to the next line together. Without
							// this, a row-filling set of chips pushes "Add" onto its own line and
							// leaves an awkward gap beside the last chip.
							const isLastItem = index === items.length - 1;
							const chip = (
								<AgentReferenceChip
									category={referenceCategory}
									disabled={isItemDisabled?.(item, index)}
									elemBefore={itemElemBefore?.(item, index)}
									key={`${label}-${item}-${index}`}
									label={item}
									onClick={onItemClick ? () => onItemClick(item, index) : undefined}
									onRemove={onRemoveItem ? () => onRemoveItem(index) : undefined}
									tagColor={tagColor}
								/>
							);

							if (isLastItem && addLabel) {
								return (
									<div
										key={`${label}-${item}-${index}-group`}
										className="inline-flex max-w-full items-center gap-1.5"
									>
										{chip}
										{renderAddButton(
											"shrink-0 opacity-0 transition-opacity group-hover/agent-row:opacity-100 group-focus-within/agent-row:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100",
										)}
									</div>
								);
							}

							return chip;
						})}
						{isEmpty && addLabel ? renderAddButton() : null}
					</div>
					{inlinePicker ? (
						<div className="w-full max-w-80">
							{inlinePicker}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}

interface AgentTriggerSummaryRowProps {
	items: readonly string[];
	addLabel?: string;
	hideWhenEmpty?: boolean;
	screenAssistantTargetId?: string;
	onEditTriggers?: (seed?: AgentAutomationRule) => void;
	/**
	 * The structured automation rules backing `items`. Required for inline
	 * removal and for opening each rule in the editor because `items` is only
	 * the label projection.
	 */
	automationRules?: readonly AgentAutomationRule[];
	onAutomationRulesChange?: (automationRules: readonly AgentAutomationRule[]) => void;
	/**
	 * The collapsed-nav catalog entry for Triggers. When present, the filled-row
	 * "Edit" control opens the SAME flyout as the collapsed strip (list of
	 * triggers + "Add trigger ›" + "Manage triggers") via
	 * `AgentCompactTriggersNavButton`, keeping the two layouts consistent. Mirrors
	 * how `appsNavItem` / `skillsNavItem` / `subagentsNavItem` back the other
	 * summary rows' inline controls.
	 */
	triggerNavItem?: AgentCompactConfigNavItem;
	onManageTriggers?: () => void;
	/**
	 * Collection-derived Tag color (from the base agent's avatar family, via
	 * `getTagColorForAgentAvatar`). Drives the automation chips' Tag color and the
	 * leading automation icon so a lime (dev-agents) agent shows lime automation
	 * chips — mirroring the subagent chip treatment.
	 */
	tagColor?: TagColor;
}

/**
 * Automations row. Unlike the generic `AgentFilledSummaryRow`, the automation entry
 * launches the automation modal instead of inline editing:
 * - empty → the add affordance opens the modal with no triggers;
 * - non-empty → each chip opens the full automation modal and (when removal is wired)
 *   carries an overlay remove control, matching the other summary rows so a
 *   trigger can be removed inline without opening the modal. The trailing "Edit"
 *   control opens the same collapsed-nav management flyout as the compact strip
 *   (via `AgentCompactTriggersNavButton`) when `triggerNavItem` is supplied.
 */
function AgentTriggerSummaryRow({
	items,
	addLabel,
	hideWhenEmpty = false,
	screenAssistantTargetId,
	onEditTriggers,
	automationRules,
	onAutomationRulesChange,
	triggerNavItem,
	onManageTriggers,
	tagColor,
}: Readonly<AgentTriggerSummaryRowProps>) {
	const isEmpty = items.length === 0;

	const rulesAlignItems =
		automationRules !== undefined && automationRules.length === items.length;
	const canRemoveInline = rulesAlignItems && Boolean(onAutomationRulesChange);
	const handleRemoveAutomation = (index: number) => {
		if (!automationRules) {
			return;
		}
		onAutomationRulesChange?.(automationRules.filter((_, i) => i !== index));
	};

	// Picking a provider event starts a brand-new automation rule seeded only
	// with that event, so previous automations never appear in the new draft.
	const handleSelectEvent = (
		providerId: Parameters<typeof createAgentTriggerValue>[0],
		eventId: string,
	) => {
		const next = createAutomationRuleFromEvent(providerId, eventId, automationRules);
		onEditTriggers?.(next ?? undefined);
	};

	if (isEmpty && (hideWhenEmpty || !addLabel)) {
		return null;
	}

	return (
		<div
			className="group/agent-row -mx-2 flex flex-col gap-y-1 rounded-md px-2 py-1 transition-colors hover:bg-bg-neutral-subtle-hovered sm:flex-row sm:items-center sm:gap-x-5"
			data-agent-field="trigger"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<div className="sm:w-32 sm:shrink-0">
				<AgentSectionLabel>Automations</AgentSectionLabel>
			</div>
			<div className="flex min-h-5 min-w-0 flex-1 flex-wrap items-center gap-1.5">
				{isEmpty ? (
					<AgentAddValueButton
						icon="add"
						label={addLabel ?? "Add"}
						onClick={() => onEditTriggers?.()}
					/>
				) : (
					<div className="group/trigger-edit flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
						{items.map((item, index) => {
							const rule = rulesAlignItems ? automationRules?.[index] : undefined;
							// Every automation chip leads with the same automation glyph,
							// tinted by the agent's collection color — NOT the first
							// trigger's provider mark. An automation can now own multiple
							// triggers, so a single provider icon would misrepresent it;
							// the collection-colored automation icon mirrors the subagent
							// chip treatment (`AiAgentIcon` + `tagColor`). `text-inherit`
							// lets the 12px glyph pick up the Tag's resolved color from the
							// leading slot (e.g. lime), and the `IconTile`
							// xxsmall/transparent wrap centers it like the latest Tag
							// standard's other leading icons.
							const automationIcon = (
								<IconTile
									aria-hidden
									className="text-inherit"
									icon={<Icon aria-hidden render={<AutomationIcon label="" size="small" />} />}
									label=""
									size="xxsmall"
									variant="transparent"
								/>
							);
							// Clicking any configured automation chip opens that rule's editor;
							// event triggers remain nested inside the automation.
							return (
								<AgentReferenceChip
									key={`trigger-${item}-${index}`}
									elemBefore={automationIcon}
									label={item}
									onClick={
										onEditTriggers
											? () => onEditTriggers(rule)
											: undefined
									}
									onRemove={canRemoveInline ? () => handleRemoveAutomation(index) : undefined}
									tagColor={tagColor}
								/>
							);
						})}
						{onEditTriggers ? (
							// The trailing "Edit" control opens the SAME management flyout
							// as the collapsed nav strip (automation list + "Add automation ›"
							// + "Manage automations") by reusing `AgentCompactTriggersNavButton`
							// with the edit-styled button as its trigger — mirroring how the
							// Apps/Skills/Subagents rows back their inline controls with the
							// collapsed-nav dropdown so both layouts share one experience.
							triggerNavItem ? (
								<AgentCompactTriggersNavButton
									automationRules={automationRules}
									item={triggerNavItem}
									onEditTriggers={onEditTriggers}
									onManageTriggers={onManageTriggers}
									onSelectEvent={handleSelectEvent}
									renderTrigger={
										<AgentAddValueButton
											className="opacity-0 group-hover/agent-row:opacity-100"
											icon="edit"
											label={addLabel ?? "Edit"}
										/>
									}
									triggers={items}
								/>
							) : (
								<TriggerPicker
									label={addLabel ?? "Edit"}
									onSelectEvent={handleSelectEvent}
									trigger={
										<AgentAddValueButton
											className="opacity-0 group-hover/agent-row:opacity-100"
											icon="edit"
											label={addLabel ?? "Edit"}
										/>
									}
								/>
							)
						) : null}
					</div>
				)}
			</div>
		</div>
	);
}

interface AgentFilledConfigSummaryProps {
	config: AgentConfigFormValue;
	// Drives the subagent chips' Tag color so they match the base agent's custom
	// brand color (derived from the avatar family). When omitted the chips fall
	// back to their category default.
	avatarSrc?: string;
	hiddenConfigFields?: ReadonlySet<AgentHideableConfigField>;
	hideEmptyRows?: boolean;
	knowledgeMode?: KnowledgeModeValue;
	memoryMode: MemoryModeValue;
	onAddListValues?: (field: AgentConfigReferenceListFieldName, values: readonly string[]) => void;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onConnectTrigger?: (trigger: AgentTriggerValue) => void;
	onEditTriggers?: (seed?: AgentAutomationRule) => void;
	onKnowledgeModeChange?: (next: KnowledgeModeValue) => void;
	onListItemChange?: (field: AgentConfigListFieldName, index: number, value: string) => void;
	onManageSubagents?: () => void;
	onManageTriggers?: () => void;
	onMemoryModeChange: (next: MemoryModeValue) => void;
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void;
	onReasoningModeChange: (next: ReasoningModeValue) => void;
	onRemoveListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onSelectListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	onToggleListItem?: (field: AgentConfigListFieldName, index: number, enabled: boolean) => void;
	onAutomationRulesChange?: (automationRules: readonly AgentAutomationRule[]) => void;
	reasoningMode: ReasoningModeValue;
	screenAssistantTargetPrefix?: string;
	selectedListItemIndexByField?: Partial<Record<AgentConfigListFieldName, number>>;
	showAddButtons?: boolean;
}

function AgentFilledConfigSummary({
	config,
	avatarSrc,
	hiddenConfigFields,
	hideEmptyRows = false,
	memoryMode,
	onAppendListItem,
	onAddListValues,
	onEditTriggers,
	onManageSubagents,
	onManageTriggers,
	onMemoryModeChange,
	onOpenDirectory,
	onReasoningModeChange,
	onRemoveListItem,
	onSelectListItem,
	onToggleListItem,
	onAutomationRulesChange,
	reasoningMode,
	screenAssistantTargetPrefix,
	selectedListItemIndexByField,
	showAddButtons = true,
}: Readonly<AgentFilledConfigSummaryProps>) {
	const automationRules = getAgentAutomationRules(config);
	const triggerItems = serializeAgentAutomationRuleLabels(automationRules);
	const skillItems = getNonEmptyConfigItems(config.skills);
	const appItems = getNonEmptyConfigItems(config.apps);
	const subagentItems = getNonEmptyConfigItems(config.subagents);
	// Subagent chips inherit the base agent's custom brand color (from its avatar
	// family) so a lime agent shows lime subagent chips, etc.
	const subagentTagColor = getTagColorForAgentAvatar(avatarSrc);
	const starterSummaryItems = getConversationStarterSummaryItems(config).slice(0, MAX_AGENT_CONVERSATION_STARTERS);
	const starterItems = starterSummaryItems.map((item) => item.label);

	// Each summary row's inline "Add" opens the SAME dropdown as the collapsed
	// nav (list + "Add ›" search flyout + "Browse"), so the two layouts share one
	// experience. We reuse the collapsed nav components directly, passing the
	// inline "Add" button as their trigger. Look the catalog items up by field so
	// the dropdowns inherit the same label/icon the collapsed strip uses.
	const navItems = getAgentCompactEmptyConfigNavItems(config);
	const appsNavItem = navItems.find((entry) => entry.agentFieldName === "apps");
	const skillsNavItem = navItems.find((entry) => entry.agentFieldName === "skills");
	const subagentsNavItem = navItems.find((entry) => entry.agentFieldName === "subagents");
	const triggerNavItem = navItems.find((entry) => entry.agentFieldName === "trigger");
	const renderDirectoryAddControl = (
		field: Extract<AgentInlineSearchField, "skills" | "tools">,
		navItem: AgentCompactConfigNavItem | undefined,
		items: readonly string[],
	) =>
		navItem
			? ({ icon, label, className }: { icon?: "add" | "edit"; label: string; className?: string }) => (
					<AgentCompactDirectoryNavButton
						browseLabel={`Browse ${navItem.label.toLowerCase()}`}
						directory={field}
						item={navItem}
						items={items}
						onAddSearchItem={(searchItem) => {
							if (searchItem.disabled) {
								return;
							}
							onAddListValues?.(field, [searchItem.label]);
						}}
						disabledItems={config.disabledItems?.[field]}
						onPickTool={field === "tools" && onOpenDirectory ? (toolId) => onOpenDirectory("tools", toolId) : undefined}
						onBrowse={() => openAgentDirectoryOrAppendListItem(field, field, onOpenDirectory, onAppendListItem)}
						onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem(field, index) : undefined}
						onToggleItem={onToggleListItem ? (index, enabled) => onToggleListItem(field, index, enabled) : undefined}
						onSelectItem={onOpenDirectory ? (value) => onOpenDirectory(field, value) : undefined}
						renderTrigger={<AgentAddValueButton className={className} icon={icon} label={label} />}
					/>
				)
			: undefined;
	// Rows declare their canonical order, whether they currently hold any user
	// content, and whether they are pinned to the absolute bottom. Memory and
	// Reasoning are `alwaysLast` so they sink below every other row (filled or
	// empty), keeping the two always-on system rows grouped at the very bottom.
	// Among the remaining rows, empty ones sort below filled ones (preserving the
	// canonical order within each group) so configured fields stay grouped at the
	// top. Source order IS the canonical display order: Triggers › Knowledge ›
	// Tools › Skills › Subagents › Conversation starters › Memory › Reasoning.
	// `orderedRows` below applies this in the sort, so the array order is the
	// single source of truth. Reorder here, not in the sort.
	const rows: ReadonlyArray<{ key: string; isEmpty: boolean; alwaysLast?: boolean; node: ReactNode }> = [
		{
			key: "trigger",
			isEmpty: triggerItems.length === 0,
			node: (
				<AgentTriggerSummaryRow
					addLabel={getAgentFilledSummaryAddLabel("triggers", triggerItems.length === 0, showAddButtons)}
					hideWhenEmpty={hideEmptyRows}
					items={triggerItems}
					onEditTriggers={onEditTriggers}
					onManageTriggers={onManageTriggers}
					onAutomationRulesChange={onAutomationRulesChange}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:trigger` : undefined}
					automationRules={automationRules}
					triggerNavItem={triggerNavItem}
					tagColor={subagentTagColor}
				/>
			),
		},
		{
			key: "apps",
			isEmpty: appItems.length === 0,
			node: (
				<AgentFilledSummaryRow
					addLabel={getAgentFilledSummaryAddLabel("apps", appItems.length === 0, showAddButtons)}
					hideWhenEmpty={hideEmptyRows}
					agentFieldName="apps"
					isItemDisabled={(item) => isAgentListItemDisabled(config, "apps", item)}
					items={appItems}
					label="Apps"
					// The inline "Add apps" opens the SAME dropdown (list + "Add apps ›"
					// search flyout + "Browse apps") as the collapsed nav, matching how
					// Skills/Tools back their inline "Add" with the shared dropdown.
					renderAddControl={appsNavItem ? ({ icon, label, className }) => (
						<AgentCompactAppsNavButton
							apps={appItems}
							disabledItems={config.disabledItems?.apps}
							item={appsNavItem}
							onAddSearchItem={(searchItem) => {
								if (searchItem.disabled) {
									return;
								}
								onAddListValues?.("apps", [searchItem.label]);
							}}
							onBrowse={() => openAgentDirectoryOrAppendListItem("apps", "apps", onOpenDirectory, onAppendListItem)}
							onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("apps", index) : undefined}
							onSelectItem={onOpenDirectory ? (value) => onOpenDirectory("apps", value) : undefined}
							onToggleItem={onToggleListItem ? (index, enabled) => onToggleListItem("apps", index, enabled) : undefined}
							renderTrigger={<AgentAddValueButton className={className} icon={icon} label={label} />}
						/>
					) : undefined}
					// Clicking an app chip opens the apps directory focused on that app.
					onItemClick={onOpenDirectory ? (item) => onOpenDirectory("apps", item) : undefined}
					onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("apps", index) : undefined}
					// App tags lead with the canonical Tag front-slot logo: Atlassian
					// product marks render bare (AtlassianLogo + withUsageBorder); other
					// apps fall back to the directory mention visual.
					itemElemBefore={(item) => {
						const logoName = APP_ATLASSIAN_LOGO_NAMES[item];
						return logoName ? <AtlassianLogo name={logoName} label={item} size="xxsmall" withUsageBorder /> : undefined;
					}}
					referenceCategory="app"
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:apps` : undefined}
				/>
			),
		},
		{
			key: "skills",
			isEmpty: skillItems.length === 0,
			node: (
				<AgentFilledSummaryRow
					addLabel={getAgentFilledSummaryAddLabel("skills", skillItems.length === 0, showAddButtons)}
					hideWhenEmpty={hideEmptyRows}
					isItemDisabled={(item) => isAgentListItemDisabled(config, "skills", item)}
					items={skillItems}
					label="Skills"
					renderAddControl={renderDirectoryAddControl("skills", skillsNavItem, skillItems)}
					onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("skills", index) : undefined}
					referenceCategory="skill"
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:skills` : undefined}
				/>
			),
		},
		{
			key: "subagents",
			isEmpty: subagentItems.length === 0,
			node: (
				<AgentFilledSummaryRow
					addLabel={getAgentFilledSummaryAddLabel("subagents", subagentItems.length === 0, showAddButtons)}
					hideWhenEmpty={hideEmptyRows}
					isItemDisabled={(item) => isAgentListItemDisabled(config, "subagents", item)}
					items={subagentItems}
					label="Subagents"
					renderAddControl={subagentsNavItem ? ({ label, className }) => (
						<AgentCompactSubagentsNavButton
							item={subagentsNavItem}
							onCreateSubagent={() => onAppendListItem?.("subagents")}
							onManageSubagents={onManageSubagents}
							disabledItems={config.disabledItems?.subagents}
							onRemoveSubagent={onRemoveListItem ? (index) => onRemoveListItem("subagents", index) : undefined}
							onSelectSubagent={onSelectListItem ? (index) => onSelectListItem("subagents", index) : undefined}
							onToggleItem={onToggleListItem ? (index, enabled) => onToggleListItem("subagents", index, enabled) : undefined}
							selectedIndex={selectedListItemIndexByField?.subagents}
							subagents={subagentItems}
							tagColor={subagentTagColor}
							renderTrigger={<AgentAddValueButton className={className} icon="add" label={label} />}
						/>
					) : undefined}
					onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("subagents", index) : undefined}
					referenceCategory="subagent"
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:subagents` : undefined}
					tagColor={subagentTagColor}
				/>
			),
		},
		{
			key: "conversationStarters",
			isEmpty: starterItems.length === 0,
			node: (
				<AgentFilledSummaryRow
					addLabel={getAgentFilledSummaryAddLabel("conversationStarters", starterItems.length === 0, showAddButtons)}
					addIcon={starterItems.length > 0 ? "edit" : undefined}
					hideWhenEmpty={hideEmptyRows}
					agentFieldName="conversationStarters"
					itemElemBefore={(_, index) => {
						const StarterIcon = getStarterIcon(starterSummaryItems[index]?.icon ?? DEFAULT_STARTER_ICON);
						// Match the latest Tag standard: normalize the leading glyph to a
						// centered 16px slot via the `IconTile` xxsmall/transparent
						// treatment instead of dropping a raw left-aligned icon in.
						return (
							<IconTile
								aria-hidden
								icon={<Icon aria-hidden render={<StarterIcon label="" size="small" color="currentColor" />} className="text-icon-subtle" />}
								label=""
								size="xxsmall"
								variant="transparent"
							/>
						);
					}}
					items={starterItems}
					label="Conversation starters"
					onAdd={() => openAgentDirectoryOrAppendListItem("conversationStarters", "conversationStarters", onOpenDirectory, onAppendListItem)}
					onRemoveItem={onRemoveListItem ? (index) => onRemoveListItem("conversationStarters", index) : undefined}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:conversation-starters` : undefined}
					tagColor="standard"
				/>
			),
		},
		{
			key: "memory",
			// Memory is a default, always-on knowledge source, so this row is never
			// empty. It is `alwaysLast` so it pins to the bottom (above Reasoning)
			// regardless of how many other rows are empty.
			isEmpty: false,
			alwaysLast: true,
			node: (
				<AgentMemoryRow
					onManage={() => onOpenDirectory?.("memory")}
					onValueChange={onMemoryModeChange}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:memory` : undefined}
					value={memoryMode}
				/>
			),
		},
		{
			key: "reasoning",
			// Reasoning is always a single selected mode, so this row is never empty.
			// It is `alwaysLast` and declared last, so it sits at the very bottom of
			// the list regardless of how many other rows are empty.
			isEmpty: false,
			alwaysLast: true,
			node: (
				<AgentReasoningRow
					onValueChange={onReasoningModeChange}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:reasoning` : undefined}
					value={reasoningMode}
				/>
			),
		},
	];
	// Map then sort by index to keep the sort stable across runtimes (Array#sort
	// only became stable in V8 in 2018, but other engines may differ). Row keys
	// (`trigger`, `subagents`, `conversationStarters`) double as hideable-field
	// keys, so suppressed rows are dropped before ordering.
	const orderedRows = rows
		.filter((row) => row.key === "apps" && !hiddenConfigFields?.has(row.key as AgentHideableConfigField))
		.map((row, index) => ({ ...row, index }))
		.sort((a, b) => {
			// `alwaysLast` rows (Memory, Reasoning) sink below every other row,
			// filled or empty, so they stay pinned to the very bottom of the list.
			if (a.alwaysLast !== b.alwaysLast) return a.alwaysLast ? 1 : -1;
			if (a.isEmpty !== b.isEmpty) return a.isEmpty ? 1 : -1;
			return a.index - b.index;
		});

	return (
		<div className="flex flex-col gap-1">
			{orderedRows.map((row) => (
				<Fragment key={row.key}>{row.node}</Fragment>
			))}
		</div>
	);
}

// Retain the legacy compact/filled summary variants while the newer profile
// layout owns rendering; these dormant variants share helper components used by
// the active config surface and should not trigger unused-symbol warnings.
void AgentCompactEmptyConfigNav;
void AgentFilledConfigSummary;

function hasFilledAgentConfig(config: AgentConfigFormValue): boolean {
	return (
		getAgentAutomationItems(config).length > 0 ||
		getNonEmptyConfigItems(config.skills).length > 0 ||
		getNonEmptyConfigItems(config.tools).length > 0 ||
		getNonEmptyConfigItems(config.subagents).length > 0 ||
		getNonEmptyConfigItems(config.knowledge).length > 0 ||
		getNonEmptyConfigItems(config.conversationStarters).length > 0
	);
}

function AgentProfileCover({ config }: Readonly<{ config: AgentConfigFormValue }>) {
	const primaryRule = getAgentAutomationRules(config)[0];

	return <AgentAutomationFlowCover triggers={primaryRule?.triggers ?? []} />;
}

// The Knowledge panel now lives in its own reusable component; agent.tsx
// renders it directly via <Knowledge /> from "@/components/ui-custom/knowledge".

const REASONING_MODE_SECTIONS = [
	{
		title: "Quick answer",
		options: [{ value: "quick-auto", label: "Searching and simple Q&A" }],
	},
	{
		title: "Think deeper",
		options: [
			{ value: "deep-auto", label: "Recommended" },
			{ value: "gemini-flash-3", label: "Gemini Flash 3" },
			{ value: "gpt-5.4", label: "GPT 5.4" },
			{ value: "sonnet-5", label: "Sonnet 5" },
			{ value: "opus-4.6", label: "Opus 4.6" },
		],
	},
] as const;

type ReasoningModeValue =
	(typeof REASONING_MODE_SECTIONS)[number]["options"][number]["value"];

const REASONING_MODE_FLAT_OPTIONS = REASONING_MODE_SECTIONS.flatMap((section) =>
	section.options.map((option, index) => ({
		...option,
		section: section.title,
		// The default (first) option of a section represents the whole section.
		isSectionDefault: index === 0,
	})),
);

function findReasoningModeOption(value: ReasoningModeValue) {
	return REASONING_MODE_FLAT_OPTIONS.find((option) => option.value === value);
}

// Lozenge value: a section's default option reads as the section title
// ("Quick answer" / "Think deeper"); a specific model reads as its own label.
function getReasoningModeLozengeLabel(value: ReasoningModeValue): string | undefined {
	const option = findReasoningModeOption(value);
	if (!option) {
		return undefined;
	}
	return option.isSectionDefault ? option.section : option.label;
}

function AgentReasoningSelectorMenu({
	value,
	onValueChange,
}: Readonly<{
	value: ReasoningModeValue;
	onValueChange: (next: ReasoningModeValue) => void;
}>) {
	return (
		<DropdownMenuContent align="start" className="min-w-[280px]">
			{REASONING_MODE_SECTIONS.map((section, sectionIndex) => (
				<DropdownMenuGroup className={sectionIndex > 0 ? "mt-1" : undefined} key={section.title}>
					<DropdownMenuLabel>{section.title}</DropdownMenuLabel>
					{section.options.map((option) => (
						<DropdownMenuItem
							key={option.value}
							onClick={() => onValueChange(option.value as ReasoningModeValue)}
							selected={value === option.value}
						>
							{option.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
			))}
		</DropdownMenuContent>
	);
}

function getReasoningSectionTitle(value: ReasoningModeValue): string {
	return findReasoningModeOption(value)?.section ?? REASONING_MODE_SECTIONS[0].title;
}

// "Quick answer | Think deeper" tabs pinned to the bottom of the nav-button
// popup, mirroring the Knowledge menu's "All | Custom | None" tabs
// (`AgentKnowledgeModeTabs`). Unlike Knowledge — where a tab IS the mode — a
// reasoning section holds several options. Switching tabs only changes which
// section's options are *browsed*; it never commits a model. A new model is
// selected only when the user clicks an option row.
function AgentReasoningModeTabs({
	browsedSection,
	onBrowseSection,
}: Readonly<{
	browsedSection: string;
	onBrowseSection: (next: string) => void;
}>) {
	return (
		<Tabs
			// Base UI Tabs `value` must match a Tab `value`; the tab IS the section
			// title here. Picking a tab only previews that section's options.
			value={browsedSection}
			onValueChange={(next) => {
				if (REASONING_MODE_SECTIONS.some((entry) => entry.title === next)) {
					onBrowseSection(next);
				}
			}}
		>
			<TabsList className="w-full">
				{REASONING_MODE_SECTIONS.map((section) => (
					<TabsTrigger key={section.title} value={section.title}>
						{section.title}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}

// Nav-button reasoning popup: a flex column matching the Knowledge nav menu.
// The browsed section's options scroll in the body, a separator sits between
// the list and the tabs, and the "Quick answer | Think deeper" tab control (the
// section) is pinned at the bottom. The browsed section is local state so the
// user can flip tabs to browse without changing their committed model; it
// re-syncs to the committed value's section whenever that value changes.
function AgentReasoningNavMenuContent({
	value,
	onValueChange,
}: Readonly<{
	value: ReasoningModeValue;
	onValueChange: (next: ReasoningModeValue) => void;
}>) {
	const committedSection = getReasoningSectionTitle(value);
	const [browsedSection, setBrowsedSection] = useState(committedSection);
	// Re-anchor browsing to the committed value's section when it changes (e.g.
	// the menu reopens after a selection or an external update).
	const [lastCommittedSection, setLastCommittedSection] = useState(committedSection);
	if (committedSection !== lastCommittedSection) {
		setLastCommittedSection(committedSection);
		setBrowsedSection(committedSection);
	}
	const activeSection =
		REASONING_MODE_SECTIONS.find((section) => section.title === browsedSection) ??
		REASONING_MODE_SECTIONS[0];
	return (
		<MenubarContent align="start" className={cn("w-64", AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS)}>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<AgentCompactNavMenuList>
					<DropdownMenuGroup className="p-0">
						{activeSection.options.map((option) => (
							<DropdownMenuItem
								key={option.value}
								onClick={() => onValueChange(option.value as ReasoningModeValue)}
								selected={value === option.value}
							>
								{option.label}
							</DropdownMenuItem>
						))}
					</DropdownMenuGroup>
				</AgentCompactNavMenuList>
			</div>
			<div className="shrink-0">
				<DropdownMenuSeparator />
				<div className="pt-1">
					<AgentReasoningModeTabs browsedSection={browsedSection} onBrowseSection={setBrowsedSection} />
				</div>
			</div>
		</MenubarContent>
	);
}

interface AgentReasoningSelectorProps {
	value: ReasoningModeValue;
	onValueChange: (next: ReasoningModeValue) => void;
	render: "nav-button" | "row";
	screenAssistantTargetId?: string;
}

function AgentReasoningSelector({
	value,
	onValueChange,
	render,
	screenAssistantTargetId,
}: Readonly<AgentReasoningSelectorProps>) {
	const current = findReasoningModeOption(value);
	const sectionLabel = current?.section ?? "Reasoning";
	const isThinkDeeper = current?.section === "Think deeper";
	const lozengeLabel = getReasoningModeLozengeLabel(value);

	if (render === "nav-button") {
		return (
			<MenubarMenu>
				<MenubarTrigger
					className={AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS}
					data-agent-field="reasoning"
					data-screen-assistant-target={screenAssistantTargetId}
				>
					Reasoning
					{/* Surface the chosen mode inline so it reads without opening the menu. */}
					{lozengeLabel ? <Badge>{lozengeLabel}</Badge> : null}
				</MenubarTrigger>
				<AgentReasoningNavMenuContent value={value} onValueChange={onValueChange} />
			</MenubarMenu>
		);
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={<LozengeDropdownTrigger aria-label="Reasoning mode" icon={<Icon aria-hidden render={<AiComputeIcon label="" size="small" />} className="text-icon-subtle" />} />}
				>
					{sectionLabel}
				</DropdownMenuTrigger>
				<AgentReasoningSelectorMenu value={value} onValueChange={onValueChange} />
			</DropdownMenu>
			{isThinkDeeper ? (
				<>
					<div aria-hidden className="h-4 w-px shrink-0 bg-border" />
					<Tag>{current?.label ?? "Recommended"}</Tag>
				</>
			) : null}
		</>
	);
}

interface AgentReasoningRowProps {
	value: ReasoningModeValue;
	onValueChange: (next: ReasoningModeValue) => void;
	screenAssistantTargetId?: string;
}

function AgentReasoningRow({
	value,
	onValueChange,
	screenAssistantTargetId,
}: Readonly<AgentReasoningRowProps>) {
	return (
		<div
			className="group/agent-row -mx-2 flex flex-col gap-y-1 rounded-md px-2 py-1 transition-colors hover:bg-bg-neutral-subtle-hovered sm:flex-row sm:items-center sm:gap-x-5"
			data-agent-field="reasoning"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<div className="sm:w-32 sm:shrink-0">
				<AgentSectionLabel>Reasoning</AgentSectionLabel>
			</div>
			<div className="flex min-h-5 min-w-0 flex-1 flex-wrap items-center gap-1.5">
				<AgentReasoningSelector
					render="row"
					value={value}
					onValueChange={onValueChange}
				/>
			</div>
		</div>
	);
}

type KnowledgeModeValue = "all" | "custom" | "none";

const MEMORY_MODE_OPTIONS = [
	{ value: "on", label: "On" },
	{ value: "off", label: "Off" },
] as const;

type MemoryModeValue = (typeof MEMORY_MODE_OPTIONS)[number]["value"];

// "On | Off" tabs pinned to the bottom of the popup, mirroring the Knowledge
// menu's "All | Custom | None" tabs (`AgentKnowledgeModeTabs`). The tabs ARE the
// memory mode: picking a tab calls `onValueChange` directly.
function AgentMemoryModeTabs({
	value,
	onValueChange,
}: Readonly<{
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
}>) {
	return (
		<Tabs
			// Base UI Tabs `value` must match a Tab `value`; map mode → tab 1:1.
			value={value}
			onValueChange={(next) => onValueChange(next as MemoryModeValue)}
		>
			<TabsList className="w-full">
				{MEMORY_MODE_OPTIONS.map((option) => (
					<TabsTrigger key={option.value} value={option.value}>
						{option.label}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}

// Nav-button memory popup: a flex column matching the Knowledge nav menu —
// "Manage memory" on top, then a separator, then the "On | Off" tab control
// (the mode) pinned at the bottom.
function AgentMemoryNavMenuContent({
	value,
	onValueChange,
	onManage,
}: Readonly<{
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
	onManage?: () => void;
}>) {
	return (
		<MenubarContent align="start" className={cn("w-64", AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS)}>
			<div className="min-h-0 flex-1 overflow-y-auto">
				<DropdownMenuItem
					elemBefore={
						<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
							<AiModelIcon label="" />
						</span>
					}
					onClick={onManage}
				>
					Manage memory
				</DropdownMenuItem>
			</div>
			<div className="shrink-0">
				<DropdownMenuSeparator />
				<div className="pt-1">
					<AgentMemoryModeTabs value={value} onValueChange={onValueChange} />
				</div>
			</div>
		</MenubarContent>
	);
}

function AgentMemorySelectorMenu({
	value,
	onValueChange,
	onManage,
}: Readonly<{
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
	onManage?: () => void;
}>) {
	return (
		<DropdownMenuContent align="start">
			<DropdownMenuGroup>
				{MEMORY_MODE_OPTIONS.map((option) => (
					<DropdownMenuItem
						key={option.value}
						onClick={() => onValueChange(option.value)}
						selected={value === option.value}
					>
						{option.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuItem
					elemBefore={
						<span className="inline-flex size-6 shrink-0 items-center justify-center [&_svg]:size-4">
							<AiModelIcon label="" />
						</span>
					}
					onClick={onManage}
				>
					Manage memory
				</DropdownMenuItem>
			</DropdownMenuGroup>
		</DropdownMenuContent>
	);
}

interface AgentMemorySelectorProps {
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
	onManage?: () => void;
	render: "nav-button" | "row";
	screenAssistantTargetId?: string;
}

function AgentMemorySelector({
	value,
	onValueChange,
	onManage,
	render,
	screenAssistantTargetId,
}: Readonly<AgentMemorySelectorProps>) {
	const selectedOption = MEMORY_MODE_OPTIONS.find((option) => option.value === value) ?? MEMORY_MODE_OPTIONS[0];

	if (render === "nav-button") {
		return (
			<MenubarMenu>
				<MenubarTrigger
					className={AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS}
					data-agent-field="memory"
					data-screen-assistant-target={screenAssistantTargetId}
				>
					Memory
					{/* Surface the on/off state inline so it reads without opening the menu. */}
					<Badge>{selectedOption.label}</Badge>
				</MenubarTrigger>
				<AgentMemoryNavMenuContent value={value} onValueChange={onValueChange} onManage={onManage} />
			</MenubarMenu>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={(
					<LozengeDropdownTrigger
						aria-label="Memory mode"
						icon={<Icon aria-hidden render={<AiModelIcon label="" size="small" />} className="text-icon-subtle" />}
					/>
				)}
			>
				{`Memory ${selectedOption.label.toLowerCase()}`}
			</DropdownMenuTrigger>
			<AgentMemorySelectorMenu value={value} onValueChange={onValueChange} onManage={onManage} />
		</DropdownMenu>
	);
}

interface AgentMemoryRowProps {
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
	onManage?: () => void;
	screenAssistantTargetId?: string;
}

function AgentMemoryRow({
	value,
	onValueChange,
	onManage,
	screenAssistantTargetId,
}: Readonly<AgentMemoryRowProps>) {
	return (
		<div
			className="group/agent-row -mx-2 flex flex-col gap-y-1 rounded-md px-2 py-1 transition-colors hover:bg-bg-neutral-subtle-hovered sm:flex-row sm:items-center sm:gap-x-5"
			data-agent-field="memory"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<div className="sm:w-32 sm:shrink-0">
				<AgentSectionLabel>Memory</AgentSectionLabel>
			</div>
			<div className="flex min-h-5 min-w-0 flex-1 flex-wrap items-center gap-1.5">
				<AgentMemorySelector render="row" value={value} onValueChange={onValueChange} onManage={onManage} />
			</div>
		</div>
	);
}

// Add-trigger block rendered above the instructions editor.
// - No triggers: a single rounded card with just the "Add Trigger" picker
//   (kept intentionally minimal — no "No triggers configured." empty state).
// - One or more triggers: the shared `TriggerConditionsPanel`
//   (components/blocks/triggers/page.tsx) so the rows, param dropdowns
//   ("Comment added in [Any project] by [Anyone]"), and the "+ Add Trigger"
//   footer match the trigger component exactly.
//
// Triggers live on the config's FIRST automation rule. Add/remove/param edits
// rewrite that rule's `triggers` and emit the full rules array via
// `onAutomationRulesChange`, mirroring the proven logic in
// `TriggerAutomationDialog`. The first rule is created on demand when the user
// adds the first trigger to an empty config.
function TriggerConfigAddBlock({
	className,
	config,
	onAutomationRulesChange,
	onConnectTrigger,
}: Readonly<{
	className?: string;
	config: AgentConfigFormValue;
	onAutomationRulesChange?: (automationRules: readonly AgentAutomationRule[]) => void;
	onConnectTrigger?: (trigger: AgentTriggerValue) => void;
}>): ReactElement {
	const automationRules = getAgentAutomationRules(config);
	const primaryRule = automationRules[0];
	const triggers = useMemo<readonly AgentTriggerValue[]>(
		() => primaryRule?.triggers ?? [],
		[primaryRule],
	);

	// Rewrite the first rule's triggers (creating the rule if absent) and emit the
	// updated rules list. A `null` next value removes the (now-empty) rule.
	const updatePrimaryTriggers = useCallback(
		(nextTriggers: readonly AgentTriggerValue[]) => {
			if (!onAutomationRulesChange) {
				return;
			}
			if (primaryRule) {
				onAutomationRulesChange(
					automationRules.map((rule, index) =>
						index === 0 ? { ...rule, triggers: nextTriggers } : rule,
					),
				);
				return;
			}
			onAutomationRulesChange([
				createAgentAutomationRule({
					id: "automation-1",
					name: "",
					prompt: config.instructions ?? "",
					triggers: nextTriggers,
				}),
				...automationRules,
			]);
		},
		[automationRules, config.instructions, onAutomationRulesChange, primaryRule],
	);

	const handleAddTrigger = useCallback(
		(providerId: AgentTriggerProviderId, eventId: string) => {
			const nextTrigger = createAgentTriggerValue(providerId, eventId, triggers.length + 1);
			if (nextTrigger) {
				updatePrimaryTriggers([...triggers, nextTrigger]);
			}
		},
		[triggers, updatePrimaryTriggers],
	);

	const handleParamChange = useCallback(
		(triggerId: string, paramId: string, value: string) => {
			updatePrimaryTriggers(
				triggers.map((trigger) => {
					if (trigger.id !== triggerId) {
						return trigger;
					}
					const nextTrigger = {
						...trigger,
						params: { ...(trigger.params ?? {}), [paramId]: value },
					};
					return { ...nextTrigger, label: getAgentTriggerReadableLabel(nextTrigger) };
				}),
			);
		},
		[triggers, updatePrimaryTriggers],
	);

	const handleRemoveTrigger = useCallback(
		(triggerId: string) => {
			updatePrimaryTriggers(triggers.filter((trigger) => trigger.id !== triggerId));
		},
		[triggers, updatePrimaryTriggers],
	);

	if (triggers.length === 0) {
		return (
			<div className={cn("rounded-xl border border-border bg-bg-input p-2", className)}>
				<TriggerPicker label="Add Trigger" onSelectEvent={handleAddTrigger} />
			</div>
		);
	}
	return (
		<div className={className}>
			<TriggerConditionsPanel
				onAddTrigger={handleAddTrigger}
				onConnectTrigger={onConnectTrigger}
				onParamChange={handleParamChange}
				onRemoveTrigger={handleRemoveTrigger}
				triggers={triggers}
			/>
		</div>
	);
}

function AgentInstructionsComposer({
	className,
	config,
	contentClassName,
	editorClassName,
	instructions,
	mentionRemovalRequest,
	onAddListValues,
	onAutomationRulesChange,
	onConnectTrigger,
	onMentionRemovalRequestHandled,
	onInstructionsChange,
	onOpenDirectory,
	onRemoveReferenceValue,
	onViewModeChange,
	screenAssistantTargetId,
	showSectionLabel = true,
}: Readonly<{
	className?: string;
	config: AgentConfigFormValue;
	contentClassName?: string;
	editorClassName?: string;
	instructions?: string;
	mentionRemovalRequest?: RichTextMentionRemovalRequest | null;
	onAddListValues?: (field: AgentConfigReferenceListFieldName, values: readonly string[]) => void;
	onAutomationRulesChange?: (automationRules: readonly AgentAutomationRule[]) => void;
	onConnectTrigger?: (trigger: AgentTriggerValue) => void;
	onMentionRemovalRequestHandled?: (key: string) => void;
	onInstructionsChange?: (value: string) => void;
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void;
	onRemoveReferenceValue?: (field: AgentConfigReferenceListFieldName, value: string) => void;
	onViewModeChange?: (mode: EditorToolbarViewMode) => void;
	screenAssistantTargetId?: string;
	showSectionLabel?: boolean;
}>) {
	const [knowledge, setKnowledge] = useState<RichTextMentionItem[]>([]);
	const [runPromptMode, setRunPromptMode] = useState<AgentRunPromptMode>(() =>
		instructions?.trim() ? "custom-prompt" : "run-agent",
	);
	const inlineManagedReferenceKeysRef = useLazyRef(() => new Set<string>());
	const mentionInventoryCountsRef = useLazyRef(() => new Map<string, {
		count: number;
		field: AgentConfigReferenceListFieldName;
		label: string;
	}>());
	const inlineManagedReferenceKeys = inlineManagedReferenceKeysRef.current;
	const mentionInventoryCounts = mentionInventoryCountsRef.current;
	const mentionSources = useMemo<RichTextMentionSources>(() => ({
		// Subagents are NESTED agents owned by THIS agent — not globally
		// at-mentionable top-level agents. So the `@subagent` list comes ONLY from
		// this agent's own subagents (empty/0 until it generates some); the global
		// parent-agent palette is intentionally NOT merged in here.
		// Prompt references deliberately carry no directory visual/avatar: subagents
		// are prompt copies under the parent agent, not nested parent-agent profiles.
		subagent: mapSubagentConfigValuesToMentionItems(config.subagents),
		skill: mergeMentionItems(
			mapConfigValuesToMentionItems("skill", config.skills),
			EDITOR_PALETTE_MENTION_SOURCES.skill,
		),
		tool: mergeMentionItems(
			mapConfigValuesToMentionItems("tool", config.tools),
			EDITOR_PALETTE_MENTION_SOURCES.tool,
		),
		knowledge: mergeMentionItems(
			mapConfigValuesToMentionItems("knowledge", config.knowledge),
			EDITOR_PALETTE_MENTION_SOURCES.knowledge,
			knowledge,
		),
	}), [config.knowledge, config.skills, config.subagents, config.tools, knowledge]);
	const handleInsertReferenceOption = useCallback((category: RichTextReferenceCategory, label: string): false => {
		const field = AGENT_CONFIG_FIELD_BY_REFERENCE_CATEGORY[category];
		const key = getAgentReferenceKey(field, label);

		inlineManagedReferenceKeys.add(key);
		if (!hasAgentReferenceValue(config, field, label)) {
			onAddListValues?.(field, [label]);
		}

		return false;
	}, [config, inlineManagedReferenceKeys, onAddListValues]);
	// "Browse all" in a nested "/" category's empty state opens that category's
	// directory. Map the slash category to the config-panel directory kind; the
	// renderer only fires this for directory-backed categories (not "format").
	const handleOpenDirectory = useCallback((category: RichTextSlashCategory): void => {
		if (category === "format") {
			return;
		}
		onOpenDirectory?.(AGENT_DIRECTORY_BY_SLASH_CATEGORY[category]);
	}, [onOpenDirectory]);
	const handleMentionInventoryChange = useCallback((mentions: readonly RichTextMentionItem[]): void => {
		const nextCounts = new Map<string, {
			count: number;
			field: AgentConfigReferenceListFieldName;
			label: string;
		}>();

		for (const mention of mentions) {
			if (!isRichTextReferenceCategory(mention.category)) {
				continue;
			}

			const field = AGENT_CONFIG_FIELD_BY_REFERENCE_CATEGORY[mention.category];
			const key = getAgentReferenceKey(field, mention.label);
			const current = nextCounts.get(key);
			nextCounts.set(key, {
				count: (current?.count ?? 0) + 1,
				field,
				label: mention.label,
			});
		}

		for (const [key, next] of nextCounts) {
			const previousCount = mentionInventoryCounts.get(key)?.count ?? 0;
			if (next.count <= previousCount) {
				continue;
			}

			inlineManagedReferenceKeys.add(key);
			if (!hasAgentReferenceValue(config, next.field, next.label)) {
				onAddListValues?.(next.field, [next.label]);
			}
		}

		for (const [key, previous] of mentionInventoryCounts) {
			if (nextCounts.has(key) || !inlineManagedReferenceKeys.has(key)) {
				continue;
			}

			inlineManagedReferenceKeys.delete(key);
			onRemoveReferenceValue?.(previous.field, previous.label);
		}

		mentionInventoryCounts.clear();
		for (const [key, next] of nextCounts) {
			mentionInventoryCounts.set(key, next);
		}
	}, [config, inlineManagedReferenceKeys, mentionInventoryCounts, onAddListValues, onRemoveReferenceValue]);
	// Stash for the typed custom prompt while the user is parked on "Run agent".
	// Leaving for run-agent still clears the persisted instructions (so a Save in
	// that mode carries no prompt), but we remember what was there so flipping
	// back to "Pass a custom prompt" restores it verbatim instead of showing a
	// blank editor.
	const stashedCustomPromptRef = useRef("");
	const handleRunPromptModeChange = useCallback((value: AgentRunPromptMode): void => {
		setRunPromptMode(value);
		if (value === "run-agent") {
			stashedCustomPromptRef.current = instructions ?? "";
			handleMentionInventoryChange([]);
			onInstructionsChange?.("");
		} else if (stashedCustomPromptRef.current.trim()) {
			onInstructionsChange?.(stashedCustomPromptRef.current);
		}
	}, [handleMentionInventoryChange, instructions, onInstructionsChange]);
	const showCustomPromptEditor = runPromptMode === "custom-prompt";

	useEffect(() => {
		const abortController = new AbortController();

		async function loadMentionSources(): Promise<void> {
			try {
				const knowledgeResponse = await fetch("/api/wiki/memory-explorer", { signal: abortController.signal });
				if (knowledgeResponse.ok) {
					const payload = await knowledgeResponse.json() as WikiMemoryExplorerResponse;
					setKnowledge(mapMemoryToKnowledgeItems(payload));
				}
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}
			}
		}

		void loadMentionSources();

		return () => abortController.abort();
	}, []);

	useEffect(() => {
		if (instructions?.trim()) {
			setRunPromptMode("custom-prompt");
		}
	}, [instructions]);

	return (
		<section
			className={cn("space-y-0", className)}
			data-agent-field="instructions"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			{showSectionLabel ? (
				<AgentSectionLabel>Instructions</AgentSectionLabel>
			) : null}
			{/* Add-trigger block — reuses the shared `TriggerConditionsPanel`
			    (components/blocks/triggers/page.tsx). Variations (no trigger /
			    single trigger / multiple triggers) are driven by the config's
			    triggers; add/remove/param edits flow through onAutomationRulesChange. */}
			<div className="relative mb-3">
				<TriggerConfigAddBlock
					className="mb-6"
					config={config}
					onAutomationRulesChange={onAutomationRulesChange}
					onConnectTrigger={onConnectTrigger}
				/>
				<div className="relative" style={{ paddingLeft: AGENT_RUN_PROMPT_ROW_PADDING_LEFT }}>
					<span
						aria-hidden="true"
						className="pointer-events-none absolute border-b border-l border-border"
						style={{
							borderBottomLeftRadius: token("radius.large"),
							height: AGENT_RUN_PROMPT_CONNECTOR_HEIGHT,
							left: AGENT_RUN_PROMPT_CONNECTOR_LEFT,
							top: AGENT_RUN_PROMPT_CONNECTOR_TOP,
							width: AGENT_RUN_PROMPT_CONNECTOR_WIDTH,
						}}
					/>
					<div
						aria-label="Agent run prompt mode"
						className="relative inline-flex h-8 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-text-subtle"
						role="radiogroup"
					>
						<button
							aria-checked={runPromptMode === "run-agent"}
							className={cn(
								"relative inline-flex h-[25px] items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-3 py-0.5 text-sm font-medium transition-all hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
								runPromptMode === "run-agent" && "bg-surface text-text shadow-sm",
							)}
							onClick={() => handleRunPromptModeChange("run-agent")}
							role="radio"
							type="button"
						>
							<GenerativeIndicatorIcon label="" size="small" />
							Run agent
						</button>
						<button
							aria-checked={runPromptMode === "custom-prompt"}
							className={cn(
								"relative inline-flex h-[25px] items-center justify-center whitespace-nowrap rounded-md border border-transparent px-3 py-0.5 text-sm font-medium transition-all hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
								runPromptMode === "custom-prompt" && "bg-surface text-text shadow-sm",
							)}
							onClick={() => handleRunPromptModeChange("custom-prompt")}
							role="radio"
							type="button"
						>
							Pass a custom prompt
						</button>
					</div>
				</div>
			</div>
			{showCustomPromptEditor ? (
				<RichTextEditor
					aria-label="Agent instructions"
					className="space-y-2"
					contentClassName={cn("pt-2", contentClassName)}
					editorClassName={cn("agent-instructions-tiptap-editor text-text", editorClassName)}
					enableDirectoryAutocomplete
					placeholder="Press / to help me create the automation"
					placeholderSlot={(
						<p className="tiptap-editor text-sm leading-[1.55] text-text-subtlest">
							Press <code>/</code> to help me create the automation
						</p>
					)}
					onInsertReferenceOption={handleInsertReferenceOption}
					onOpenDirectory={handleOpenDirectory}
					onViewModeChange={onViewModeChange}
					suggestionVariant={AGENT_INSTRUCTIONS_SUGGESTION_VARIANT}
					toolbarReveal="hover"
					value={instructions}
					mentionSources={mentionSources}
					mentionRemovalRequest={mentionRemovalRequest}
					onMarkdownChange={onInstructionsChange}
					onMentionInventoryChange={handleMentionInventoryChange}
					onMentionRemovalRequestHandled={onMentionRemovalRequestHandled}
				/>
			) : null}
		</section>
	);
}

interface AgentConfigProfileProps {
	config: AgentConfigFormValue;
	avatarSrc?: string;
	onTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	screenAssistantTargetPrefix?: string;
	// Subagent editing context. When `isSubagent` is true the profile header
	// shows a back-arrow icon button inline before the name (a quick way back to
	// the base agent, wired to `onSelectBaseAgent`), and the big editable title
	// becomes the subagent's name (placeholder "Untitled subagent") wired to
	// `onSubagentNameChange` instead of the base config name.
	isSubagent?: boolean;
	baseAgentName?: string;
	subagentName?: string;
	onSelectBaseAgent?: () => void;
	onSubagentNameChange?: (value: string) => void;
	// While editing a subagent the description slot becomes the trigger
	// condition ("Describe the situation that should trigger this subagent"),
	// bound to the subagent's condition rather than the base agent description.
	subagentCondition?: string;
	onSubagentConditionChange?: (value: string) => void;
}

function AgentConfigProfile({
	config,
	onTextChange,
	screenAssistantTargetPrefix,
	isSubagent = false,
	subagentName,
	onSelectBaseAgent,
	onSubagentNameChange,
	subagentCondition,
	onSubagentConditionChange,
}: Readonly<AgentConfigProfileProps>) {
	const shouldReduceMotion = useReducedMotion();
	// Swap direction for the header content: +1 when entering a subagent (slide in
	// from the right), -1 when returning to the parent (slide in from the left).
	// Reduced motion collapses the slide to a pure crossfade.
	const direction = shouldReduceMotion ? 0 : isSubagent ? 1 : -1;
	return (
		<section
			className="flex flex-col gap-2"
			data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:profile` : undefined}
		>
			<AgentProfileCover config={config} />
			<div className="flex flex-col gap-1" data-agent-field="name">
				{/* The cover/avatar and the description below stay put; only the name
				    row (title + inline back-arrow on subagents) crossfades and slides
				    when swapping between the base agent and a subagent. `popLayout`
				    lets the exiting copy leave the layout flow so the entering copy
				    doesn't jump. */}
				<AnimatePresence custom={direction} initial={false} mode="popLayout">
					<motion.div
						key={isSubagent ? "subagent" : "base"}
						custom={direction}
						variants={AGENT_PROFILE_SWAP_VARIANTS}
						initial="enter"
						animate="center"
						exit="exit"
						transition={AGENT_PROFILE_SWAP_TRANSITION}
						className="flex items-center gap-1"
						style={{ willChange: "transform, opacity" }}
						data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:name` : undefined}
					>
						{isSubagent ? (
							// Match the name field's read-view height (h-auto + py-1 +
							// leading-7 + border-2 ≈ 40px) so the icon button aligns with
							// the title row. `[&_svg]:size-4` forces the arrow to 16px
							// without the ADS size prop.
							<Button
								type="button"
								aria-label="Back to parent agent"
								data-agent-field="back-to-parent"
								className="size-10 shrink-0 rounded-md text-icon-subtle hover:text-icon [&_svg]:size-4"
								onClick={onSelectBaseAgent}
								size="icon"
								variant="ghost"
							>
								<ArrowLeftIcon label="" />
							</Button>
						) : null}
						<InlineEdit
							className="min-w-0 flex-1"
							value={isSubagent ? subagentName ?? "" : config.name ?? ""}
							placeholder={isSubagent ? UNTITLED_SUBAGENT_NAME : "Untitled automation"}
							editButtonLabel={isSubagent ? "Edit subagent name" : "Edit automation name"}
							readViewClassName="relative h-auto overflow-visible border-2 bg-transparent px-0 py-1 text-2xl leading-7 font-semibold hover:bg-transparent active:bg-transparent focus:border-border-focused focus-visible:border-border-focused focus-visible:bg-transparent"
							readViewMotionProps={AGENT_PROFILE_INLINE_EDIT_MOTION_PROPS}
							readViewBackdropClassName="-inset-0.5 bg-bg-neutral-subtle-hovered"
							readViewBackdropMotionProps={AGENT_PROFILE_INLINE_EDIT_BACKDROP_MOTION_PROPS}
							inputProps={{ className: "h-auto border-2 px-1.5 py-1 text-2xl leading-7 font-semibold focus:border-ring md:text-2xl" }}
							onConfirm={(value) => (isSubagent ? onSubagentNameChange?.(value) : onTextChange?.("name", value))}
						/>
					</motion.div>
				</AnimatePresence>
				{/* Description / trigger condition is intentionally NOT animated — it
				    stays put and just swaps its bound value as the view changes. */}
				<div
					data-agent-field={isSubagent ? "condition" : "description"}
					data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:${isSubagent ? "condition" : "description"}` : undefined}
				>
					<InlineEdit
						value={isSubagent ? subagentCondition ?? "" : config.description ?? config.summary ?? ""}
						placeholder={isSubagent ? "Describe the situation that should trigger this subagent" : "Add a description"}
						editButtonLabel={isSubagent ? "Edit subagent trigger condition" : "Edit automation description"}
						multiline
						readViewClassName="relative overflow-visible border-2 bg-transparent px-0 hover:bg-transparent active:bg-transparent focus-visible:bg-transparent"
						readViewMotionProps={AGENT_PROFILE_INLINE_EDIT_MOTION_PROPS}
						readViewBackdropClassName="-inset-0.5 bg-bg-neutral-subtle-hovered"
						readViewBackdropMotionProps={AGENT_PROFILE_INLINE_EDIT_BACKDROP_MOTION_PROPS}
						textareaProps={{ rows: 1, className: "min-h-10 border-2 bg-bg-neutral-subtle px-1.5 focus:border-ring focus-visible:border-ring focus-visible:ring-0 focus-visible:ring-offset-0 data-[variant=default]:border-transparent data-[variant=default]:focus:border-ring data-[variant=default]:focus-visible:border-ring" }}
						onConfirm={(value) => (isSubagent ? onSubagentConditionChange?.(value) : onTextChange?.("description", value))}
					/>
				</div>
			</div>
		</section>
	);
}

export interface AgentConfigFieldsProps extends ComponentProps<"div"> {
	config: AgentConfigFormValue;
	avatarSrc?: string;
	compactScrollAreaClassName?: string;
	/** Overrides the instructions editor's contentClassName — use to scope scroll to the editor only. */
	compactInstructionsContentClassName?: string;
	compactFooterBefore?: ReactNode;
	// Config rows callers can suppress — e.g. while editing a subagent, where
	// triggers, subagents, and conversation starters can't be configured.
	hiddenConfigFields?: ReadonlySet<AgentHideableConfigField>;
	idPrefix: string;
	onInstructionsViewModeChange?: (mode: EditorToolbarViewMode) => void;
	onManageSubagents?: () => void;
	onProfileTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	onTextChange?: (field: AgentConfigTextFieldName, value: string) => void;
	onListItemChange?: (field: AgentConfigListFieldName, index: number, value: string) => void;
	onRemoveListItem?: (field: AgentConfigListFieldName, index: number) => void;
	onSelectListItem?: (field: AgentConfigListFieldName, index: number) => void;
	// Toggle a configured list item's enabled state. Owners that persist the
	// config (e.g. the studio draft in localStorage) should apply
	// `toggleAgentConfigDisabledItem` to their stored value so the disabled state
	// survives a refresh. Omitting this prop hides the enable/disable switches.
	onToggleListItem?: (field: AgentConfigListFieldName, index: number, enabled: boolean) => void;
	onAddListValues?: (field: AgentConfigReferenceListFieldName, values: readonly string[]) => void;
	onAppendListItem?: (field: AgentConfigListFieldName) => void;
	onConnectTrigger?: (trigger: AgentTriggerValue) => void;
	onManageTriggers?: () => void;
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void;
	onAutomationRulesChange?: (automationRules: readonly AgentAutomationRule[]) => void;
	profileAvatarSrc?: string;
	profileConfig?: AgentConfigFormValue;
	screenAssistantTargetPrefix?: string;
	selectedListItemIndexByField?: Partial<Record<AgentConfigListFieldName, number>>;
	// Subagent editing context, forwarded to the profile header so it can render
	// the base-agent → subagent breadcrumb, edit the subagent's name, and treat
	// the description slot as the subagent's trigger condition.
	isSubagent?: boolean;
	baseAgentName?: string;
	subagentName?: string;
	onSelectBaseAgent?: () => void;
	onSubagentNameChange?: (value: string) => void;
	subagentCondition?: string;
	onSubagentConditionChange?: (value: string) => void;
}

export const AgentConfigFields = memo(
	({
		className,
		config,
		avatarSrc,
		compactScrollAreaClassName,
		compactInstructionsContentClassName,
		idPrefix,
		onAddListValues,
		onConnectTrigger,
		onInstructionsViewModeChange,
		onOpenDirectory,
		onProfileTextChange,
		onRemoveListItem,
		onTextChange,
		onAutomationRulesChange,
		profileAvatarSrc,
		profileConfig,
		screenAssistantTargetPrefix,
		isSubagent,
		baseAgentName,
		subagentName,
		onSelectBaseAgent,
		onSubagentNameChange,
		subagentCondition,
		onSubagentConditionChange,
		// Destructured purely to keep them out of `...props` (which is spread onto
		// the root <div>) so React doesn't warn about unknown DOM handlers. These
		// props remain part of the shared AgentConfigFieldsProps contract for other
		// consumers, but the trigger-config panel no longer renders the bottom
		// toolbar that used them.
		/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
		compactFooterBefore: _compactFooterBefore,
		/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
		hiddenConfigFields: _hiddenConfigFields,
		/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
		onListItemChange: _onListItemChange,
		/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
		onAppendListItem: _onAppendListItem,
		/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
		onManageTriggers: _onManageTriggers,
		/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
		onManageSubagents: _onManageSubagents,
		/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
		onSelectListItem: _onSelectListItem,
		/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
		onToggleListItem: _onToggleListItem,
		/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
		selectedListItemIndexByField: _selectedListItemIndexByField,
		...props
	}: Readonly<AgentConfigFieldsProps>) => {
		const isFilledConfig = hasFilledAgentConfig(config);
		const compactScrollOverflow = useHasVerticalOverflow<HTMLDivElement>();
		const [mentionRemovalRequest, setMentionRemovalRequest] = useState<RichTextMentionRemovalRequest | null>(null);
		const handleTextChange = useCallback((field: AgentConfigTextFieldName, value: string) => {
			onTextChange?.(field, value);
		}, [onTextChange]);
		const handleProfileTextChange = useCallback((field: AgentConfigTextFieldName, value: string) => {
			(onProfileTextChange ?? onTextChange)?.(field, value);
		}, [onProfileTextChange, onTextChange]);
		const handleAddListValues = useCallback((field: AgentConfigReferenceListFieldName, values: readonly string[]) => {
			onAddListValues?.(field, values);
		}, [onAddListValues]);
		const handleRemoveReferenceValue = useCallback((field: AgentConfigReferenceListFieldName, value: string) => {
			const normalizedValue = getNormalizedAgentReferenceValue(value);
			const index = (config[field] ?? []).findIndex(
				(item) => getNormalizedAgentReferenceValue(item) === normalizedValue,
			);

			if (index < 0) {
				return;
			}

			onRemoveListItem?.(field, index);
		}, [config, onRemoveListItem]);
		const handleMentionRemovalRequestHandled = useCallback((key: string) => {
			setMentionRemovalRequest((current) => current?.key === key ? null : current);
		}, []);
		const handleOpenDirectory = useCallback((directory: AgentDirectoryKind, selectedItem?: string) => {
			onOpenDirectory?.(directory, selectedItem);
		}, [onOpenDirectory]);
		const currentAutomationRules = useMemo(
			() => getAgentAutomationRules(config),
			[config],
		);
		// Automation authoring routes through the rule-builder modal hosted here so a
		// single dialog instance serves every entry point (summary row, collapsed
		// nav, missing-config tile). `seed` carries the automation rule the modal
		// opens with — an existing rule when editing, or a freshly-picked event.
		const [triggersEditor, setTriggersEditor] = useState<{ open: boolean; fromManage: boolean; seed: AgentAutomationRule; title: string }>({
			open: false,
			fromManage: false,
			title: "New automation",
			seed: createAgentAutomationRule({
					id: "automation-1",
				name: "",
				prompt: "",
				triggers: [],
			}),
		});
		const handleEditTriggers = useCallback((seed?: AgentAutomationRule, fromManage = false, isNew = false) => {
			setTriggersEditor({
				open: true,
				fromManage,
				title: !seed || isNew ? "Add automation" : "Edit automation",
				seed: seed ?? createAgentAutomationRule({
					id: `automation-${getNextAutomationRuleIndex(currentAutomationRules)}`,
					name: "",
					prompt: "",
					triggers: [],
				}),
			});
		}, [currentAutomationRules]);
		const handleTriggersEditorOpenChange = useCallback((open: boolean) => {
			setTriggersEditor((prev) => ({ ...prev, open }));
		}, []);
		const handleTriggersSave = useCallback((automationRule: AgentAutomationRule) => {
			const current = currentAutomationRules;
			const existingIndex = current.findIndex((rule) => rule.id === automationRule.id);
			onAutomationRulesChange?.(
				existingIndex >= 0
					? current.map((rule, index) => (index === existingIndex ? automationRule : rule))
					: [...current, automationRule],
			);
		}, [currentAutomationRules, onAutomationRulesChange]);

		const [manageTriggersOpen, setManageTriggersOpen] = useState(false);
		const handleAddAutomationFromManage = useCallback(
			(providerId: Parameters<typeof createAgentTriggerValue>[0], eventId: string) => {
				const next = createAutomationRuleFromEvent(providerId, eventId, currentAutomationRules);
				if (!next) {
					return;
				}
				setManageTriggersOpen(false);
				handleEditTriggers(next, false, true);
			},
			[currentAutomationRules, handleEditTriggers],
		);
		const handleReorderAutomations = useCallback(
			(activeId: string, overId: string) => {
				const current = currentAutomationRules;
				const from = current.findIndex((rule) => rule.id === activeId);
				const to = current.findIndex((rule) => rule.id === overId);
				if (from === -1 || to === -1) {
					return;
				}
				const next = current.slice();
				const [moved] = next.splice(from, 1);
				next.splice(to, 0, moved);
				onAutomationRulesChange?.(next);
			},
			[currentAutomationRules, onAutomationRulesChange],
		);
		const handleToggleAutomation = useCallback(
			(id: string, enabled: boolean) => {
				const current = currentAutomationRules;
				onAutomationRulesChange?.(
					current.map((rule) => (rule.id === id ? { ...rule, enabled } : rule)),
				);
			},
			[currentAutomationRules, onAutomationRulesChange],
		);
		const handleDeleteAutomation = useCallback(
			(id: string) => {
				const current = currentAutomationRules;
				onAutomationRulesChange?.(current.filter((rule) => rule.id !== id));
			},
			[currentAutomationRules, onAutomationRulesChange],
		);
		const handleEditAutomationFromManage = useCallback(
			(automationRule: AgentAutomationRule) => {
				setManageTriggersOpen(false);
				handleEditTriggers(automationRule, true);
			},
			[handleEditTriggers],
		);

		return (
			<div
				className={cn("flex min-h-0 flex-1 flex-col gap-6", className)}
				data-agent-config-id={idPrefix}
				data-screen-assistant-target={screenAssistantTargetPrefix}
				{...props}
			>
				<div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
					{/* Scrollable region: profile + instructions grow to fill, the
					    sibling footer below stays anchored to the panel bottom. The
					    bottom scroll mask fades content into the footer while there's
					    more below, and clears once the region is scrolled to the end. */}
					<div
						ref={compactScrollOverflow.ref}
						// `overflow-y-auto` forces `overflow-x` to compute to `auto`,
						// which clips the left/right edges of descendant focus-visible
						// rings. `px-1.5` insets the content 6px so full-width controls
						// (the title/description inputs, whose focus backdrop bleeds
						// `-inset-0.5` past their box) clear the scroll-clip edge. We do
						// NOT cancel this with a negative margin on the profile block,
						// because that would pull those full-width inputs back to the
						// clip edge and re-clip their rings.
						className={cn(
							"flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto",
							compactScrollOverflow.showBottomScrollMask && "scroll-mask-bottom",
							compactScrollAreaClassName,
						)}
					>
						<div className="flex flex-col gap-4">
							<AgentConfigProfile
								config={profileConfig ?? config}
								avatarSrc={profileAvatarSrc ?? avatarSrc}
								onTextChange={handleProfileTextChange}
								screenAssistantTargetPrefix={screenAssistantTargetPrefix}
								isSubagent={isSubagent}
								baseAgentName={baseAgentName}
								subagentName={subagentName}
								onSelectBaseAgent={onSelectBaseAgent}
								onSubagentNameChange={onSubagentNameChange}
								subagentCondition={subagentCondition}
								onSubagentConditionChange={onSubagentConditionChange}
							/>
						</div>
						<AgentInstructionsComposer
							className="relative flex min-h-0 flex-1 flex-col"
							config={config}
							contentClassName={cn("pt-0", compactInstructionsContentClassName ?? (isFilledConfig ? "min-h-[240px]" : "min-h-[2rem]"))}
							editorClassName={isFilledConfig ? undefined : "agent-instructions-tiptap-editor-compact-empty"}
							instructions={config.instructions}
							mentionRemovalRequest={mentionRemovalRequest}
							onAddListValues={handleAddListValues}
							onAutomationRulesChange={onAutomationRulesChange}
							onConnectTrigger={onConnectTrigger}
							onInstructionsChange={(value) => handleTextChange("instructions", value)}
							onMentionRemovalRequestHandled={handleMentionRemovalRequestHandled}
							onOpenDirectory={handleOpenDirectory}
							onRemoveReferenceValue={handleRemoveReferenceValue}
							onViewModeChange={onInstructionsViewModeChange}
							screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:instructions` : undefined}
							showSectionLabel={false}
						/>
					</div>
				</div>
				<AgentTriggersDialog
				showBack={triggersEditor.fromManage}
					open={triggersEditor.open}
					onOpenChange={handleTriggersEditorOpenChange}
					automationRule={triggersEditor.seed}
					onSave={handleTriggersSave}
				title={triggersEditor.title}
				/>
				<ManageTriggersDialog
					open={manageTriggersOpen}
					onOpenChange={setManageTriggersOpen}
					automationRules={currentAutomationRules}
					onAddAutomation={handleAddAutomationFromManage}
					onReorderAutomations={handleReorderAutomations}
					onToggleAutomation={handleToggleAutomation}
					onDeleteAutomation={handleDeleteAutomation}
					onEditAutomation={handleEditAutomationFromManage}
				/>
			</div>
		);
	}
);

Agent.displayName = "Agent";
AgentHeader.displayName = "AgentHeader";
AgentContent.displayName = "AgentContent";
AgentInstructions.displayName = "AgentInstructions";
AgentTools.displayName = "AgentTools";
AgentTool.displayName = "AgentTool";
AgentOutput.displayName = "AgentOutput";
AgentConfigFields.displayName = "AgentConfigFields";
