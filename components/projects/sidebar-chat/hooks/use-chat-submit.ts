"use client";

import { useCallback, useRef, useState } from "react";
import { useRovoChat } from "@/app/contexts";
import type { QueuedPromptItem } from "@/app/contexts";
import type { SendPromptOptions } from "@/app/contexts";
import { createRovoAppUserMessage } from "@/components/projects/rovo-core/lib/rovo-app-user-message";
import { createId } from "@/lib/utils";
import type { RovoMessageMetadata, RovoUIMessage } from "@/lib/rovo-ui-messages";
import type { FileUIPart } from "ai";

interface ChatSubmitInterceptStage {
	delayMs: number;
	getAssistantParts: (context: { startedAt: Date }) => RovoUIMessage["parts"];
	onApply?: () => Promise<void> | void;
	startsNewAssistantMessage?: boolean;
}

export interface ChatSubmitInterceptOutcome {
	handled: boolean;
	assistantReply?: string;
	assistantParts?: RovoUIMessage["parts"];
	getAssistantParts?: (context: { startedAt: Date }) => RovoUIMessage["parts"];
	assistantPartStages?: readonly ChatSubmitInterceptStage[];
	delayMs?: number;
	onApply?: () => Promise<void> | void;
	pendingAssistantParts?: RovoUIMessage["parts"];
	getPendingAssistantParts?: (context: { startedAt: Date }) => RovoUIMessage["parts"];
}

interface UseChatSubmitReturn {
	prompt: string;
	setPrompt: (prompt: string) => void;
	handleSubmit: (message: { text: string; files: FileUIPart[] }) => Promise<void>;
	submitPrompt: (prompt: string, files?: ReadonlyArray<FileUIPart>) => Promise<void>;
	recordLocalAssistantTurn: (params: {
		assistantParts: RovoUIMessage["parts"];
		files?: ReadonlyArray<FileUIPart>;
		promptText: string;
	}) => Promise<void>;
	/**
	 * Runs the deterministic submit interceptor against `text`. When the prompt
	 * is a handled build intent, this aborts any in-flight turn, injects the user
	 * message + scripted reply locally, and returns `true` so the caller can skip
	 * the model. Returns `false` when no interceptor is configured or the prompt
	 * was not handled — the caller should fall back to its normal send path.
	 */
	interceptSubmit: (
		text: string,
		files?: ReadonlyArray<FileUIPart>,
		options?: { userMetadata?: RovoMessageMetadata },
	) => Promise<boolean>;
	abort: () => void;
	uiMessages: RovoUIMessage[];
	isStreaming: boolean;
	hasInFlightTurn: boolean;
	isSubmitPending: boolean;
	activeRequestStartedAt: number | null;
	localThinkingAssistantMessageId: string | null;
	queuedPrompts: ReadonlyArray<QueuedPromptItem>;
	removeQueuedPrompt: (id: string) => void;
}

interface UseChatSubmitOptions {
	defaultPromptOptions?: SendPromptOptions;
	/**
	 * When true, submissions that are not handled by `onInterceptSubmit` are
	 * still kept local to this chat surface instead of falling through to the
	 * normal Rovo send path. Used while an edit context bar is open so typed
	 * agent-edit prompts cannot accidentally enter clarification / plan review.
	 */
	requireIntercept?: boolean;
	requiredInterceptReply?: string;
	/**
	 * Deterministic submit interceptor. When it reports the prompt as handled,
	 * the model call is skipped and the user message + returned `assistantReply`
	 * are injected locally. Used by the studio agent-edit chat to apply scripted
	 * agent edits without hitting the backend.
	 */
	onInterceptSubmit?: (text: string) => ChatSubmitInterceptOutcome;
}

function waitForInterceptDelay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

const DEFAULT_REQUIRED_INTERCEPT_REPLY =
	"I can only update the open agent from this edit context. Try asking me to add a trigger, update the instructions, or add an app or skill. Close the Edit context to chat normally.";

export function useChatSubmit({
	defaultPromptOptions,
	onInterceptSubmit,
	requireIntercept = false,
	requiredInterceptReply = DEFAULT_REQUIRED_INTERCEPT_REPLY,
}: Readonly<UseChatSubmitOptions> = {}): UseChatSubmitReturn {
	const [prompt, setPrompt] = useState("");
	const [localThinkingAssistantMessageId, setLocalThinkingAssistantMessageId] = useState<string | null>(null);
	const isSubmittingRef = useRef(false);
	const {
		uiMessages,
		sendPrompt,
		replaceMessages,
		stopStreaming,
		isStreaming,
		hasInFlightTurn,
		isSubmitPending,
		pendingSubmitStartedAt,
		activePrompt,
		queuedPrompts,
		removeQueuedPrompt,
		ensureThreadForLocalTurn,
	} = useRovoChat();

	// `uiMessages` mutates on every streamed token. Keep it in a ref so the
	// interception closure can read the latest list without pulling it into the
	// `useCallback` deps below — otherwise `submitPrompt`/`handleSubmit` would get
	// a new identity per token for every (app-wide) ChatPanel consumer.
	const uiMessagesRef = useRef(uiMessages);
	uiMessagesRef.current = uiMessages;
	const isStreamingRef = useRef(isStreaming);
	isStreamingRef.current = isStreaming;
	const hasInFlightTurnRef = useRef(hasInFlightTurn);
	hasInFlightTurnRef.current = hasInFlightTurn;

	const injectLocalAssistantTurn = useCallback(
		async ({
			assistantParts,
			assistantPartStages,
			files,
			getAssistantParts,
			getPendingAssistantParts,
			onApply,
			pendingAssistantParts,
			promptText,
			delayMs,
			userMetadata,
		}: {
			assistantParts: RovoUIMessage["parts"];
			assistantPartStages?: readonly ChatSubmitInterceptStage[];
			files: ReadonlyArray<FileUIPart>;
			getAssistantParts?: (context: { startedAt: Date }) => RovoUIMessage["parts"];
			getPendingAssistantParts?: (context: { startedAt: Date }) => RovoUIMessage["parts"];
			onApply?: () => Promise<void> | void;
			pendingAssistantParts?: RovoUIMessage["parts"];
			promptText: string;
			delayMs?: number;
			userMetadata?: RovoMessageMetadata;
		}) => {
			setPrompt("");
			// Abort any live turn before mutating the transcript — otherwise the
			// stream keeps writing tokens over our injection and corrupts it.
			if (isStreamingRef.current || hasInFlightTurnRef.current) {
				await stopStreaming();
			}
			await ensureThreadForLocalTurn(promptText || files[0]?.filename || "New chat");

			const baseMessages = uiMessagesRef.current;
			const createdAt = new Date().toISOString();
			const startedAt = new Date();
			const userMessage = createRovoAppUserMessage({
				id: createId("rovo-chat-user"),
				createdAt,
				files,
				text: promptText,
				metadata: userMetadata,
			});
			const firstAssistantMessageId = createId("rovo-chat-assistant");
			const createAssistantMessage = (id: string, parts: RovoUIMessage["parts"]): RovoUIMessage => ({
				id,
				role: "assistant",
				metadata: { origin: "rovo", createdAt, updatedAt: new Date().toISOString() },
				parts,
			});
			const firstAssistantParts = getPendingAssistantParts?.({ startedAt }) ?? pendingAssistantParts ?? assistantParts;
			let activeAssistantMessageId = firstAssistantMessageId;
			let assistantMessages = [createAssistantMessage(firstAssistantMessageId, firstAssistantParts)];
			replaceMessages([...baseMessages, userMessage, ...assistantMessages]);

			try {
				if (assistantPartStages && assistantPartStages.length > 0) {
					setLocalThinkingAssistantMessageId(activeAssistantMessageId);
					for (const stage of assistantPartStages) {
						if (stage.delayMs > 0) {
							await waitForInterceptDelay(stage.delayMs);
						}
						await stage.onApply?.();
						const stagedAssistantParts = stage.getAssistantParts({ startedAt });
						if (stage.startsNewAssistantMessage) {
							activeAssistantMessageId = createId("rovo-chat-assistant");
							setLocalThinkingAssistantMessageId(activeAssistantMessageId);
							assistantMessages = [
								...assistantMessages,
								createAssistantMessage(activeAssistantMessageId, stagedAssistantParts),
							];
						} else {
							assistantMessages = [
								...assistantMessages.slice(0, -1),
								createAssistantMessage(activeAssistantMessageId, stagedAssistantParts),
							];
						}
						replaceMessages([...baseMessages, userMessage, ...assistantMessages]);
					}
				} else if ((pendingAssistantParts || getPendingAssistantParts) && typeof delayMs === "number" && delayMs > 0) {
					setLocalThinkingAssistantMessageId(activeAssistantMessageId);
					await waitForInterceptDelay(delayMs);
				}
				await onApply?.();

				const latestStagedAssistantParts = assistantPartStages && assistantPartStages.length > 0
					? assistantMessages.at(-1)?.parts
					: null;
				const finalAssistantParts = getAssistantParts?.({ startedAt }) ?? latestStagedAssistantParts ?? assistantParts;
				if (assistantMessages.at(-1)?.parts !== finalAssistantParts) {
					assistantMessages = [
						...assistantMessages.slice(0, -1),
						createAssistantMessage(activeAssistantMessageId, finalAssistantParts),
					];
					replaceMessages([...baseMessages, userMessage, ...assistantMessages]);
				}
			} finally {
				setLocalThinkingAssistantMessageId(null);
			}
		},
		[ensureThreadForLocalTurn, replaceMessages, stopStreaming],
	);

	// Deterministic interception: when the prompt is a handled build intent, skip
	// the model and inject the user message + scripted reply locally so the
	// agent-edit conversation reads naturally. Returns true when handled.
	const interceptSubmit = useCallback(
		async (
			text: string,
			files: ReadonlyArray<FileUIPart> = [],
			options?: { userMetadata?: RovoMessageMetadata },
		): Promise<boolean> => {
			const promptText = text.trim();
			if (!onInterceptSubmit || !promptText) {
				return false;
			}
			const outcome = onInterceptSubmit(promptText);
			if (!outcome.handled) {
				return false;
			}

			const finalAssistantParts = outcome.assistantParts
				?? (outcome.assistantReply
					? [{ type: "text" as const, text: outcome.assistantReply, state: "done" as const }]
					: []);
			await injectLocalAssistantTurn({
				assistantParts: finalAssistantParts,
				assistantPartStages: outcome.assistantPartStages,
				delayMs: outcome.delayMs,
				files,
				getAssistantParts: outcome.getAssistantParts,
				getPendingAssistantParts: outcome.getPendingAssistantParts,
				onApply: outcome.onApply,
				pendingAssistantParts: outcome.pendingAssistantParts,
				promptText,
				userMetadata: options?.userMetadata,
			});
			return true;
		},
		[injectLocalAssistantTurn, onInterceptSubmit]
	);

	const recordLocalAssistantTurn = useCallback(
		async ({
			assistantParts,
			files = [],
			promptText,
		}: {
			assistantParts: RovoUIMessage["parts"];
			files?: ReadonlyArray<FileUIPart>;
			promptText: string;
		}) => {
			const trimmedPrompt = promptText.trim();
			if (!trimmedPrompt && files.length === 0) {
				return;
			}

			await injectLocalAssistantTurn({
				assistantParts,
				files,
				promptText: trimmedPrompt,
			});
		},
		[injectLocalAssistantTurn],
	);

	const submitPrompt = useCallback(
		async (nextPrompt: string, files: ReadonlyArray<FileUIPart> = []) => {
			const promptText = nextPrompt.trim();
			if ((!promptText && files.length === 0) || isSubmittingRef.current) {
				return;
			}

			if (await interceptSubmit(nextPrompt, files)) {
				return;
			}

			if (requireIntercept) {
				await injectLocalAssistantTurn({
					assistantParts: [{ type: "text" as const, text: requiredInterceptReply, state: "done" as const }],
					files,
					promptText,
				});
				return;
			}

			isSubmittingRef.current = true;
			setPrompt("");

			try {
				await sendPrompt(promptText, defaultPromptOptions, files);
			} finally {
				isSubmittingRef.current = false;
			}
		},
		[defaultPromptOptions, injectLocalAssistantTurn, interceptSubmit, requireIntercept, requiredInterceptReply, sendPrompt]
	);

	const handleSubmit = useCallback(async ({ files, text }: { text: string; files: FileUIPart[] }) => {
		await submitPrompt(text || prompt, files);
	}, [prompt, submitPrompt]);

	const abort = useCallback(() => {
		stopStreaming();
	}, [stopStreaming]);

	return {
		prompt,
		setPrompt,
		handleSubmit,
		submitPrompt,
		recordLocalAssistantTurn,
		interceptSubmit,
		abort,
		uiMessages,
		isStreaming,
		hasInFlightTurn,
		isSubmitPending,
		activeRequestStartedAt: activePrompt?.createdAt ?? pendingSubmitStartedAt,
		localThinkingAssistantMessageId,
		queuedPrompts,
		removeQueuedPrompt,
	};
}
