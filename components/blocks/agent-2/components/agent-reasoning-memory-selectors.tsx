"use client";

import AiComputeIcon from "@atlaskit/icon-lab/core/ai-compute";
import AiModelIcon from "@atlaskit/icon-lab/core/ai-model";
import type { ReactNode } from "react";
import { useState } from "react";

import {
	AGENT_COMPACT_NAV_MENU_FLEX_CONTENT_CLASS,
	AgentCompactNavMenuList,
} from "@/components/blocks/agent-2/components/agent-compact-nav-menu";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { LozengeDropdownTrigger } from "@/components/ui/lozenge";
import {
	MenubarContent,
	MenubarMenu,
	MenubarTrigger,
} from "@/components/ui/menubar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

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

export type ReasoningModeValue =
	(typeof REASONING_MODE_SECTIONS)[number]["options"][number]["value"];

const REASONING_MODE_FLAT_OPTIONS = REASONING_MODE_SECTIONS.flatMap((section) =>
	section.options.map((option, index) => ({
		...option,
		section: section.title,
		isSectionDefault: index === 0,
	})),
);

function findReasoningModeOption(value: ReasoningModeValue) {
	return REASONING_MODE_FLAT_OPTIONS.find((option) => option.value === value);
}

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

function AgentReasoningModeTabs({
	browsedSection,
	onBrowseSection,
}: Readonly<{
	browsedSection: string;
	onBrowseSection: (next: string) => void;
}>) {
	return (
		<Tabs
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

function AgentReasoningNavMenuContent({
	value,
	onValueChange,
}: Readonly<{
	value: ReasoningModeValue;
	onValueChange: (next: ReasoningModeValue) => void;
}>) {
	const committedSection = getReasoningSectionTitle(value);
	const [browsedSection, setBrowsedSection] = useState(committedSection);
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
			<div className="shrink-0">
				<div className="pb-1">
					<AgentReasoningModeTabs browsedSection={browsedSection} onBrowseSection={setBrowsedSection} />
				</div>
				<DropdownMenuSeparator />
			</div>
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
		</MenubarContent>
	);
}

export interface AgentReasoningSelectorProps {
	value: ReasoningModeValue;
	onValueChange: (next: ReasoningModeValue) => void;
	render: "nav-button" | "row";
	screenAssistantTargetId?: string;
	triggerClassName?: string;
}

export function AgentReasoningSelector({
	value,
	onValueChange,
	render,
	screenAssistantTargetId,
	triggerClassName,
}: Readonly<AgentReasoningSelectorProps>) {
	const current = findReasoningModeOption(value);
	const sectionLabel = current?.section ?? "Reasoning";
	const isThinkDeeper = current?.section === "Think deeper";
	const lozengeLabel = getReasoningModeLozengeLabel(value);

	if (render === "nav-button") {
		return (
			<MenubarMenu>
				<MenubarTrigger
					className={triggerClassName}
					data-agent-field="reasoning"
					data-screen-assistant-target={screenAssistantTargetId}
				>
					Reasoning
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

export interface AgentReasoningRowProps {
	value: ReasoningModeValue;
	onValueChange: (next: ReasoningModeValue) => void;
	screenAssistantTargetId?: string;
	sectionLabel: ReactNode;
}

export function AgentReasoningRow({
	value,
	onValueChange,
	screenAssistantTargetId,
	sectionLabel,
}: Readonly<AgentReasoningRowProps>) {
	return (
		<div
			className="group/agent-row -mx-2 flex flex-col gap-y-1 rounded-md px-2 py-1 transition-colors hover:bg-bg-neutral-subtle-hovered sm:flex-row sm:items-center sm:gap-x-6"
			data-agent-field="reasoning"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<div className="sm:w-20 sm:shrink-0">{sectionLabel}</div>
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

export type KnowledgeModeValue = "all" | "custom" | "none";

const MEMORY_MODE_OPTIONS = [
	{ value: "on", label: "On" },
	{ value: "off", label: "Off" },
] as const;

export type MemoryModeValue = (typeof MEMORY_MODE_OPTIONS)[number]["value"];

function AgentMemoryModeTabs({
	value,
	onValueChange,
}: Readonly<{
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
}>) {
	return (
		<Tabs
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
			<div className="shrink-0">
				<div className="pb-1">
					<AgentMemoryModeTabs value={value} onValueChange={onValueChange} />
				</div>
				<DropdownMenuSeparator />
			</div>
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

export interface AgentMemorySelectorProps {
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
	onManage?: () => void;
	render: "nav-button" | "row";
	screenAssistantTargetId?: string;
	triggerClassName?: string;
}

export function AgentMemorySelector({
	value,
	onValueChange,
	onManage,
	render,
	screenAssistantTargetId,
	triggerClassName,
}: Readonly<AgentMemorySelectorProps>) {
	const selectedOption = MEMORY_MODE_OPTIONS.find((option) => option.value === value) ?? MEMORY_MODE_OPTIONS[0];

	if (render === "nav-button") {
		return (
			<MenubarMenu>
				<MenubarTrigger
					className={triggerClassName}
					data-agent-field="memory"
					data-screen-assistant-target={screenAssistantTargetId}
				>
					Memory
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

export interface AgentMemoryRowProps {
	value: MemoryModeValue;
	onValueChange: (next: MemoryModeValue) => void;
	onManage?: () => void;
	screenAssistantTargetId?: string;
	sectionLabel: ReactNode;
}

export function AgentMemoryRow({
	value,
	onValueChange,
	onManage,
	screenAssistantTargetId,
	sectionLabel,
}: Readonly<AgentMemoryRowProps>) {
	return (
		<div
			className="group/agent-row -mx-2 flex flex-col gap-y-1 rounded-md px-2 py-1 transition-colors hover:bg-bg-neutral-subtle-hovered sm:flex-row sm:items-center sm:gap-x-6"
			data-agent-field="memory"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			<div className="sm:w-20 sm:shrink-0">{sectionLabel}</div>
			<div className="flex min-h-5 min-w-0 flex-1 flex-wrap items-center gap-1.5">
				<AgentMemorySelector render="row" value={value} onValueChange={onValueChange} onManage={onManage} />
			</div>
		</div>
	);
}
