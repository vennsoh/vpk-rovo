"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";

import ChartTrendUpIcon from "@atlaskit/icon/core/chart-trend-up";
import PersonIcon from "@atlaskit/icon/core/person";
import ScorecardIcon from "@atlaskit/icon/core/scorecard";
import LockLockedIcon from "@atlaskit/icon/core/lock-locked";
import ViewsIcon from "@atlaskit/icon-lab/core/views";

import { AGENT_AVATAR_SRC } from "@/components/blocks/agent-2/components/agent-profile-cover";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { AtlassianLogo, isAtlassianLogoSource } from "@/components/ui/logo";
import { LayoutDashboardIcon, MoreHorizontalIcon } from "@/components/ui/vpk-icons";
import { computeContextBarOverflow } from "@/components/ui-custom/context-bar/overflow";
import { cn } from "@/lib/utils";

const AGENT_COMPACT_HEADER_NAV_ITEMS = [
	{ icon: <LayoutDashboardIcon size="small" />, label: "Details", value: "details" },
	{ icon: <ChartTrendUpIcon label="" size="small" color="currentColor" />, label: "Insights", value: "insights" },
	{ icon: <ViewsIcon label="" size="small" color="currentColor" />, label: "Surfaces", value: "surfaces" },
	{ icon: <ScorecardIcon label="" size="small" color="currentColor" />, label: "Evaluation", value: "evaluation" },
	{ icon: <PersonIcon label="" size="small" color="currentColor" />, label: "Users", value: "users" },
	{ icon: <LockLockedIcon label="" size="small" color="currentColor" />, label: "Access", value: "access" },
] as const;

export type AgentCompactHeaderSection = (typeof AGENT_COMPACT_HEADER_NAV_ITEMS)[number]["value"];
export type AgentCompactHeaderNavItem = (typeof AGENT_COMPACT_HEADER_NAV_ITEMS)[number];

// react-doctor-disable-next-line react-doctor/only-export-components -- This component module intentionally exports colocated non-component API used by consumers.
export const AGENT_COMPACT_HEADER_DEFAULT_NAV_ITEMS = AGENT_COMPACT_HEADER_NAV_ITEMS.filter((item) => item.value !== "details");
export const AGENT_COMPACT_HEADER_DETAILS_NAV_ITEM = AGENT_COMPACT_HEADER_NAV_ITEMS[0];

// Secondary sections that start folded into the "..." overflow menu regardless of
// available width. Primary sections (Insights, Evaluation) stay inline and still
// width-overflow on top of these. Kept as a value Set rather than a per-item flag
// so the `as const` literal union behind AgentCompactHeaderSection is preserved.
const AGENT_COMPACT_HEADER_DEFAULT_COLLAPSED_SECTIONS: ReadonlySet<AgentCompactHeaderSection> = new Set([
	"surfaces",
	"users",
	"access",
]);

const AGENT_COMPACT_HEADER_NAV_GAP = 4;
const AGENT_COMPACT_HEADER_AVATAR_NAV_GAP = 8;
const AGENT_COMPACT_HEADER_NAV_OVERFLOW_WIDTH = 24;

function AgentCompactHeaderNavButton({
	activeSection,
	item,
	onSectionChange,
}: Readonly<{
	activeSection?: AgentCompactHeaderSection | null;
	item: AgentCompactHeaderNavItem;
	onSectionChange?: (section: AgentCompactHeaderSection) => void;
}>) {
	const isSelected = activeSection === item.value;

	return (
		<Button
			type="button"
			aria-pressed={isSelected ? true : undefined}
			onClick={() => onSectionChange?.(item.value)}
			size="compact"
			variant={isSelected ? "outline" : "ghost"}
			className={cn(
				"h-6 gap-1.5 rounded px-2 text-sm font-medium leading-5",
				isSelected
					? "border-border-selected bg-bg-selected text-text-selected [&_svg]:text-icon-selected"
					: "text-text-subtle [&_svg]:text-icon-subtle"
			)}
		>
			<Icon render={item.icon} aria-hidden />
			{item.label}
		</Button>
	);
}

export function AgentCompactHeaderNav({
	activeSection = null,
	avatarSrc = AGENT_AVATAR_SRC,
	items = AGENT_COMPACT_HEADER_DEFAULT_NAV_ITEMS,
	onSectionChange,
}: Readonly<{
	activeSection?: AgentCompactHeaderSection | null;
	avatarSrc?: string;
	items?: readonly AgentCompactHeaderNavItem[];
	onSectionChange?: (section: AgentCompactHeaderSection) => void;
}>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const measureRef = useRef<HTMLDivElement>(null);
	// Sections that start folded into the "..." menu by default never render inline,
	// so only the primary items participate in the width-fitting math below.
	const primaryItems = useMemo(
		() => items.filter((item) => !AGENT_COMPACT_HEADER_DEFAULT_COLLAPSED_SECTIONS.has(item.value)),
		[items],
	);
	const defaultCollapsedItems = useMemo(
		() => items.filter((item) => AGENT_COMPACT_HEADER_DEFAULT_COLLAPSED_SECTIONS.has(item.value)),
		[items],
	);
	const [visibleCount, setVisibleCount] = useState<number>(primaryItems.length);
	const visibleItems = primaryItems.slice(0, visibleCount);
	// Width-overflowed primaries come first, then the always-collapsed sections.
	const hiddenItems = [...primaryItems.slice(visibleCount), ...defaultCollapsedItems];

	useLayoutEffect(() => {
		const container = containerRef.current;
		const measure = measureRef.current;
		if (!container || !measure) {
			return;
		}

		function recompute(): void {
			const widths = Array.from(measure!.children).map((node) => (node as HTMLElement).offsetWidth);
			// When sections are collapsed by default the "..." trigger is always
			// present, so always reserve its width (computed once inside the
			// helper) rather than only when the primaries overflow on their own.
			setVisibleCount(
				computeContextBarOverflow(
					widths,
					container!.clientWidth,
					AGENT_COMPACT_HEADER_NAV_OVERFLOW_WIDTH,
					AGENT_COMPACT_HEADER_NAV_GAP,
					defaultCollapsedItems.length > 0,
				),
			);
		}

		recompute();
		const observer = new ResizeObserver(recompute);
		observer.observe(container);
		return () => observer.disconnect();
	}, [primaryItems, defaultCollapsedItems]);

	return (
		<div className="flex min-w-0 flex-1 items-center" style={{ gap: AGENT_COMPACT_HEADER_AVATAR_NAV_GAP }}>
			<Avatar label="Agent" shape="hexagon" size="sm">
				{isAtlassianLogoSource(avatarSrc) ? (
					<AtlassianLogo name="atlassian" label="Agent" size="small" />
				) : (
					<AvatarImage alt="" src={avatarSrc} />
				)}
			</Avatar>
			<div
				// `overflow-x-clip` hides horizontally-overflowing items (the "..."
				// menu absorbs them). The first item ("Insights") would otherwise sit
				// flush at the clip box's left edge, so its 3px focus ring gets
				// shorn flat on the left even with a clip margin. `pl-1` insets the
				// content 4px inside the clip box so the ring clears the edge; `py-1
				// -my-1` adds matching vertical room, and the clip margin covers the
				// trailing "..." item on the right.
				className="relative -my-1 flex min-w-0 flex-1 items-center overflow-x-clip overflow-y-visible py-1 pl-1 [overflow-clip-margin:6px]"
				ref={containerRef}
				style={{ gap: AGENT_COMPACT_HEADER_NAV_GAP }}
			>
				<div aria-hidden className="pointer-events-none absolute top-0 left-0 h-0 w-0 overflow-clip">
					<div className="invisible flex items-center" ref={measureRef} style={{ gap: AGENT_COMPACT_HEADER_NAV_GAP }}>
						{primaryItems.map((item) => (
							<AgentCompactHeaderNavButton
								activeSection={activeSection}
								item={item}
								key={`measure-${item.label}`}
								onSectionChange={onSectionChange}
							/>
						))}
					</div>
				</div>
				{visibleItems.map((item) => (
					<AgentCompactHeaderNavButton
						activeSection={activeSection}
						item={item}
						key={item.label}
						onSectionChange={onSectionChange}
					/>
				))}
				{hiddenItems.length > 0 ? (
					<DropdownMenu>
						<DropdownMenuTrigger
							aria-label="More agent sections"
							render={<Button className="size-6 rounded px-0" size="icon-compact" type="button" variant="ghost" />}
						>
							<MoreHorizontalIcon size="small" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuGroup>
								{hiddenItems.map((item) => (
									<DropdownMenuItem
										elemBefore={item.icon}
										key={item.label}
										onSelect={() => onSectionChange?.(item.value)}
									>
										{item.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
			</div>
		</div>
	);
}
