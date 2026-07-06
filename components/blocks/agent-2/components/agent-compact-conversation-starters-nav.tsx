"use client";

import AiChatIcon from "@atlaskit/icon/core/ai-chat";

import { AgentCompactNavMenuInitialHighlightReset, useCompactNavMenuNoInitialHighlight } from "@/components/blocks/agent-2/components/agent-compact-nav-menu";
import { AGENT_COMPACT_CONFIG_NAV_TRIGGER_CLASS, AgentCompactConfigNavButton, type AgentCompactConfigNavButtonItem } from "@/components/blocks/agent-2/components/agent-compact-config-nav-rows";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MenubarContent, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";

export const MAX_AGENT_CONVERSATION_STARTERS = 3;

// Conversation starters dropdown always exposes the 3 starter text fields for
// quick inline edits, with a "Manage conversation starters" footer that opens
// the full modal.
export function AgentCompactConversationStartersNavButton({
	item,
	starters,
	onStarterChange,
	onManage,
	screenAssistantTargetId,
}: Readonly<{
	item: AgentCompactConfigNavButtonItem;
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
				<DropdownMenuSeparator />
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
			</MenubarContent>
		</MenubarMenu>
	);
}
