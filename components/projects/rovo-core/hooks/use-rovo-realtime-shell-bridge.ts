"use client";

import { useCallback, useMemo } from "react";

export type RovoRealtimeMessageRole = "user" | "assistant";

export type RovoRealtimeMessageMutationResult =
	| string
	| {
			id?: string | null;
	  }
	| void;

export interface RovoRealtimeShellBridgeAdapter {
	appendRealtimeMessage?: (
		role: RovoRealtimeMessageRole,
		content: string,
		options?: Record<string, unknown>,
	) => Promise<RovoRealtimeMessageMutationResult> | RovoRealtimeMessageMutationResult;
	isVoiceMode?: boolean;
	setRealtimeMessageContent?: (messageId: string, content: string) => Promise<void> | void;
	setVoiceMode?: (next: boolean) => void;
	toggleVoiceMode?: () => void;
	updateRealtimeMessage?: (messageId: string, contentDelta: string) => Promise<void> | void;
}

export type RovoRealtimeShellAdapter<TChat> = TChat & RovoRealtimeShellBridgeAdapter;

export interface RovoRealtimeShellBridgeChatRef<
	TChat extends RovoRealtimeShellBridgeAdapter = RovoRealtimeShellBridgeAdapter,
> {
	current: TChat | null;
}

export function resolveRovoRealtimeMutationId(result: RovoRealtimeMessageMutationResult): string | null {
	if (typeof result === "string" && result.trim()) {
		return result;
	}

	if (result && typeof result === "object" && typeof result.id === "string" && result.id.trim()) {
		return result.id;
	}

	return null;
}

export function setRovoRealtimeChatVoiceMode(
	realtimeChat: RovoRealtimeShellBridgeAdapter | null | undefined,
	next: boolean,
): void {
	if (!realtimeChat) {
		return;
	}

	if (typeof realtimeChat.setVoiceMode === "function") {
		realtimeChat.setVoiceMode(next);
		return;
	}

	if (realtimeChat.isVoiceMode !== next && typeof realtimeChat.toggleVoiceMode === "function") {
		realtimeChat.toggleVoiceMode();
	}
}

export async function appendRovoRealtimeMessage(
	realtimeChat: RovoRealtimeShellBridgeAdapter | null | undefined,
	role: RovoRealtimeMessageRole,
	content: string,
	options?: Record<string, unknown>,
): Promise<string | null> {
	if (typeof realtimeChat?.appendRealtimeMessage !== "function") {
		return null;
	}

	const result = await realtimeChat.appendRealtimeMessage(role, content, options);
	return resolveRovoRealtimeMutationId(result);
}

export async function updateRovoRealtimeMessage(
	realtimeChat: RovoRealtimeShellBridgeAdapter | null | undefined,
	messageId: string | null,
	content: string,
	options?: { replace?: boolean },
): Promise<void> {
	if (!messageId || !content || !realtimeChat) {
		return;
	}

	if (options?.replace && typeof realtimeChat.setRealtimeMessageContent === "function") {
		await realtimeChat.setRealtimeMessageContent(messageId, content);
		return;
	}

	if (typeof realtimeChat.updateRealtimeMessage === "function") {
		await realtimeChat.updateRealtimeMessage(messageId, content);
	}
}

export function useRovoRealtimeShellBridge<TChat extends RovoRealtimeShellBridgeAdapter>({
	chatRef,
}: {
	chatRef: RovoRealtimeShellBridgeChatRef<TChat>;
}) {
	const setChatVoiceMode = useCallback((next: boolean) => {
		setRovoRealtimeChatVoiceMode(chatRef.current, next);
	}, [chatRef]);

	const appendRealtimeMessage = useCallback(
		async (
			role: RovoRealtimeMessageRole,
			content: string,
			options?: Record<string, unknown>,
		): Promise<string | null> => appendRovoRealtimeMessage(chatRef.current, role, content, options),
		[chatRef],
	);

	const updateRealtimeMessage = useCallback(
		async (messageId: string | null, content: string, options?: { replace?: boolean }) => {
			await updateRovoRealtimeMessage(chatRef.current, messageId, content, options);
		},
		[chatRef],
	);

	return useMemo(
		() => ({
			appendRealtimeMessage,
			setChatVoiceMode,
			updateRealtimeMessage,
		}),
		[appendRealtimeMessage, setChatVoiceMode, updateRealtimeMessage],
	);
}
