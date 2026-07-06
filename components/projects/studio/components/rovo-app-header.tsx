"use client";

import {
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@/components/ui/item";
import {
	RovoAppHeaderCore,
	type RovoAppHeaderCoreProps,
} from "@/components/projects/rovo-core/components/rovo-app-header";
import type { RovoAppSendMode } from "@/components/projects/rovo-core/lib/rovo-app-dispatch";

interface RovoAppHeaderProps extends Omit<RovoAppHeaderCoreProps, "moreMenuContentClassName" | "moreMenuFooter"> {
	sendMode?: RovoAppSendMode;
	onSendModeChange?: (sendMode: RovoAppSendMode) => void;
}

function StudioSendModeMenu({
	sendMode,
	onSendModeChange,
}: Readonly<{
	sendMode: RovoAppSendMode;
	onSendModeChange?: (sendMode: RovoAppSendMode) => void;
}>) {
	const handleSendModeChange = (value: string) => {
		if (value === "queue" || value === "immediate") {
			onSendModeChange?.(value);
		}
	};

	return (
		<>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuLabel>Send mode</DropdownMenuLabel>
				<DropdownMenuRadioGroup value={sendMode} onValueChange={handleSendModeChange}>
					<DropdownMenuRadioItem value="queue">
						<Item size="xs" className="p-0">
							<ItemContent>
								<ItemTitle>Queue</ItemTitle>
								<ItemDescription className="text-xs">
									Send after the current work finishes
								</ItemDescription>
							</ItemContent>
						</Item>
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="immediate">
						<Item size="xs" className="p-0">
							<ItemContent>
								<ItemTitle>Send immediately</ItemTitle>
								<ItemDescription className="text-xs">
									Interrupt active work and send now
								</ItemDescription>
							</ItemContent>
						</Item>
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuGroup>
		</>
	);
}

export function RovoAppHeader({
	sendMode = "queue",
	onSendModeChange,
	...coreProps
}: Readonly<RovoAppHeaderProps>) {
	return (
		<RovoAppHeaderCore
			{...coreProps}
			moreMenuContentClassName="w-64"
			moreMenuFooter={(
				<StudioSendModeMenu
					onSendModeChange={onSendModeChange}
					sendMode={sendMode}
				/>
			)}
		/>
	);
}
