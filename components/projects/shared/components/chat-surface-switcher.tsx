"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- Dropdown menu item slot APIs intentionally accept React nodes for icons and adornments.

import { useRouter } from "next/navigation";
import FullscreenEnterIcon from "@atlaskit/icon/core/fullscreen-enter";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";
import SmartLinkEmbedIcon from "@atlaskit/icon/core/smart-link-embed";

import {
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useRovoChat } from "@/app/contexts";
import { buildRovoAppThreadPath } from "@/components/projects/rovo-core/lib/rovo-app-thread-route-sync";
import { cn } from "@/lib/utils";

export type CurrentSurface = "sidebar" | "floating";
export type ChatSurfaceSwitchHandler = (surface: CurrentSurface) => void;

const ROVO_APP_ROOT_PATH = "/rovo";

interface ChatSurfaceSwitcherItemsProps {
	currentSurface: CurrentSurface;
	onSurfaceSwitch?: ChatSurfaceSwitchHandler;
}

const currentItemClass =
	"bg-bg-selected data-[highlighted]:bg-bg-selected-hovered [&>span>span]:font-medium [&>span]:text-text-selected [&_svg]:text-icon-selected";

export function ChatSurfaceSwitcherItems({
	currentSurface,
	onSurfaceSwitch,
}: Readonly<ChatSurfaceSwitcherItemsProps>) {
	const router = useRouter();
	const { activeThreadId, switchSurface, closeChat } = useRovoChat();

	const handleSelectSurface = (surface: CurrentSurface) => {
		onSurfaceSwitch?.(surface);
		switchSurface(surface);
	};

	const handleSelectFullscreen = () => {
		closeChat();
		router.push(activeThreadId ? buildRovoAppThreadPath(ROVO_APP_ROOT_PATH, activeThreadId) : ROVO_APP_ROOT_PATH);
	};

	return (
		<DropdownMenuGroup>
			<DropdownMenuLabel>Switch to</DropdownMenuLabel>
			<DropdownMenuItem
				elemBefore={<PanelRightIcon label="" />}
				className={cn(currentSurface === "sidebar" && currentItemClass)}
				onSelect={() => handleSelectSurface("sidebar")}
			>
				Side panel
			</DropdownMenuItem>
			<DropdownMenuItem
				elemBefore={<SmartLinkEmbedIcon label="" />}
				className={cn(currentSurface === "floating" && currentItemClass)}
				onSelect={() => handleSelectSurface("floating")}
			>
				Floating
			</DropdownMenuItem>
			<DropdownMenuItem
				elemBefore={<FullscreenEnterIcon label="" />}
				elemAfter={
					<span className="inline-flex h-5 items-center opacity-0 group-data-[highlighted]/dropdown-menu-item:opacity-100">
						<LinkExternalIcon label="" size="small" />
					</span>
				}
				onSelect={handleSelectFullscreen}
			>
				Full screen
			</DropdownMenuItem>
		</DropdownMenuGroup>
	);
}
