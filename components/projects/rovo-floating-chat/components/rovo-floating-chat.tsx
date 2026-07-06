"use client";

import { motion } from "motion/react";
import { token } from "@/lib/tokens";
import { useRovoChat } from "@/app/contexts";
import type { SendPromptOptions } from "@/app/contexts";
import type { ChatContextBarDescriptor } from "@/components/projects/shared/lib/chat-context-bar";
import type { ChatSurfaceSwitchHandler } from "@/components/projects/shared/components/chat-surface-switcher";
import ChatPanel from "@/components/projects/sidebar-chat/page";
import type { ChatPanelCustomAgentTabs, ChatPanelGreetingProps, ChatSubmitInterceptOutcome } from "@/components/projects/sidebar-chat/page";
import { ChatHistoryDrawer } from "@/components/projects/sidebar-chat/components/chat-history-drawer";
import FloatingChatHeader from "./floating-chat-header";

interface RovoFloatingChatProps {
	onSurfaceSwitch?: ChatSurfaceSwitchHandler;
	chatContextBar?: ChatContextBarDescriptor | null;
	greeting?: ChatPanelGreetingProps;
	customAgentTabs?: ChatPanelCustomAgentTabs;
	hideComposerSourceAndModelControls?: boolean;
	sendPromptOptions?: SendPromptOptions;
	onInterceptSubmit?: (text: string) => ChatSubmitInterceptOutcome;
	onArtifactDialogOpen?: () => void;
	preserveFloatingSurfaceOnArtifactDialogOpen?: boolean;
	startRealtimeVoiceRequestKey?: number;
}

export default function RovoFloatingChat({
	onSurfaceSwitch,
	chatContextBar,
	greeting,
	customAgentTabs,
	hideComposerSourceAndModelControls = false,
	sendPromptOptions,
	onInterceptSubmit,
	onArtifactDialogOpen,
	preserveFloatingSurfaceOnArtifactDialogOpen = false,
	startRealtimeVoiceRequestKey = 0,
}: Readonly<RovoFloatingChatProps>) {
	const { closeChat, isHistoryOpen, resetChat, toggleHistory } = useRovoChat();

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 8 }}
			transition={{ duration: 0.2, ease: [0, 0.4, 0, 1] }}
			className="fixed right-6 bottom-6 z-[510] flex max-h-[min(720px,calc(100dvh-96px))] w-[400px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-2xl bg-surface-overlay"
			style={{
				boxShadow: token("elevation.shadow.overlay"),
				willChange: "transform, opacity",
			}}
		>
			<FloatingChatHeader
				isHistoryOpen={isHistoryOpen}
				onClose={closeChat}
				onHistoryToggle={toggleHistory}
				onNewChat={resetChat}
				onSurfaceSwitch={onSurfaceSwitch}
			/>
			<div className="min-h-0 min-w-0 overflow-hidden">
				<ChatPanel
					onClose={closeChat}
					hideHeader
					abortOnUnmount={false}
					containerClassName="min-h-0 min-w-0"
					containerStyle={{
						backgroundColor: "transparent",
						borderRadius: 0,
						borderWidth: 0,
						display: "flex",
						flexDirection: "column",
						height: "auto",
						maxHeight: "calc(min(720px, calc(100dvh - 96px)) - 56px)",
					}}
					greeting={greeting}
					customAgentTabs={customAgentTabs}
					hideComposerSourceAndModelControls={hideComposerSourceAndModelControls}
					sendPromptOptions={sendPromptOptions}
					onInterceptSubmit={onInterceptSubmit}
					onSurfaceSwitch={onSurfaceSwitch}
					chatContextBar={chatContextBar}
					onArtifactDialogOpen={onArtifactDialogOpen}
					preserveFloatingSurfaceOnArtifactDialogOpen={preserveFloatingSurfaceOnArtifactDialogOpen}
					startRealtimeVoiceRequestKey={startRealtimeVoiceRequestKey}
				/>
			</div>
			<ChatHistoryDrawer />
		</motion.div>
	);
}
