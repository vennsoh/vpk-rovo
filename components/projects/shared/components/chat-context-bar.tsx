"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- These components intentionally use slot/render-node props for icons, triggers, and adornments.

import BoardIcon from "@atlaskit/icon/core/board";
import EditIcon from "@atlaskit/icon/core/edit";
import LocationIcon from "@atlaskit/icon/core/location";
import PageIcon from "@atlaskit/icon/core/page";
import PersonIcon from "@atlaskit/icon/core/person";
import WorkItemIcon from "@atlaskit/icon/core/work-item";
import { token } from "@/lib/tokens";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	CollapsibleContextBar,
	ContextBar,
	ContextBarLead,
	ContextBarTag,
} from "@/components/ui-custom/context-bar";
import type {
	ChatContextBarDescriptor,
	ChatContextBarIconName,
} from "../lib/chat-context-bar";

interface ChatContextBarProps {
	context: ChatContextBarDescriptor | null | undefined;
	onDismiss?: () => void;
	onOpenChange?: (open: boolean) => void;
}

const ICON_MAP: Record<ChatContextBarIconName, typeof BoardIcon> = {
	agent: PersonIcon,
	artifact: PageIcon,
	board: BoardIcon,
	"work-item": WorkItemIcon,
};

export default function ChatContextBar({
	context,
	onDismiss,
	onOpenChange,
}: Readonly<ChatContextBarProps>): React.ReactElement | null {
	if (!context) {
		return null;
	}

	const ContextIcon = ICON_MAP[context.iconName];
	const isEditContext = context.variant === "edit";
	const LeadIcon = isEditContext ? EditIcon : LocationIcon;
	const leadLabel = isEditContext ? "Edit:" : "Context:";
	const dismissLabel = isEditContext ? "Close edit context" : "Close context";

	// Agents render as an avatar chip (hexagon avatar + `type="agent"`, matching the
	// Tag agent-avatar design); everything else falls back to its category icon on a
	// default tag.
	const isAgentTag = Boolean(context.avatarSrc);
	const tagElemBefore = isAgentTag ? (
		<Avatar size="xs" shape="hexagon">
			<AvatarImage src={context.avatarSrc} alt="" />
			<AvatarFallback>{context.label.slice(0, 2)}</AvatarFallback>
		</Avatar>
	) : (
		<ContextIcon color={token("color.icon.brand")} label="" size="small" />
	);

	const tag = (
		<ContextBarTag elemBefore={tagElemBefore} title={context.label} type={isAgentTag ? "agent" : undefined}>
			{context.label}
		</ContextBarTag>
	);

	if (context.collapsible) {
		const collapsedLabel = context.collapsedLabel ?? "Edit";
		return (
			<CollapsibleContextBar
				collapsedIcon={<EditIcon color={token("color.icon.subtle")} label="" size="small" />}
				collapsedLabel={collapsedLabel}
				dismissLabel={dismissLabel}
				lead={<LeadIcon color={token("color.icon.subtle")} label="" size="small" />}
				leadLabel={leadLabel}
				onOpenChange={onOpenChange}
				triggerAriaLabel={`${collapsedLabel}: ${context.label}`}
			>
				{tag}
			</CollapsibleContextBar>
		);
	}

	return (
		<ContextBar data-chat-context-bar dismissLabel={dismissLabel} onDismiss={onDismiss}>
			<ContextBarLead icon={<LeadIcon color={token("color.icon.subtle")} label="" size="small" />}>
				{leadLabel}
			</ContextBarLead>
			{tag}
		</ContextBar>
	);
}
