import {
	getMessageText,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import { getPendingRovoAppTitleRequest } from "@/components/projects/rovo-core/lib/rovo-app-title-generation";

interface MutableRef<T> {
	current: T;
}

export interface RunRovoAppTitleGenerationLifecycleInput {
	clearPendingTitleGeneration: (threadId?: string) => void;
	fetchTitle: (message: string) => Promise<string | null>;
	messages: ReadonlyArray<RovoUIMessage>;
	pendingTitleMessageRef: MutableRef<string | null>;
	pendingTitleThreadId: string | null;
	pendingTitleThreadIdRef: MutableRef<string | null>;
	resolveChatTitle: (threadId: string, title: string) => void;
}

export function resolveRovoAppFallbackTitle({
	messages,
	pendingTitleThreadIdRef,
	resolveChatTitle,
}: {
	messages: ReadonlyArray<RovoUIMessage>;
	pendingTitleThreadIdRef: MutableRef<string | null>;
	resolveChatTitle: (threadId: string, title: string) => void;
}): boolean {
	const threadId = pendingTitleThreadIdRef.current;
	if (!threadId) {
		return false;
	}

	const assistantMessageWithText = messages.find(
		(message) => message.role === "assistant" && getMessageText(message).length > 0,
	);
	if (!assistantMessageWithText) {
		return false;
	}

	const assistantText = getMessageText(assistantMessageWithText);
	const firstLine = assistantText
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.find((line) => line.length > 0);
	const fallbackTitle = firstLine?.slice(0, 60);
	if (!fallbackTitle) {
		return false;
	}

	resolveChatTitle(threadId, fallbackTitle);
	return true;
}

export function runRovoAppTitleGenerationLifecycle({
	clearPendingTitleGeneration,
	fetchTitle,
	messages,
	pendingTitleMessageRef,
	pendingTitleThreadId,
	pendingTitleThreadIdRef,
	resolveChatTitle,
}: RunRovoAppTitleGenerationLifecycleInput): Promise<void> | null {
	const pendingTitleRequest = getPendingRovoAppTitleRequest({
		pendingTitleThreadId,
		pendingTitleThreadIdRef: pendingTitleThreadIdRef.current,
		pendingTitleMessage: pendingTitleMessageRef.current,
	});
	if (!pendingTitleRequest) {
		return null;
	}

	const { threadId, message } = pendingTitleRequest;
	pendingTitleMessageRef.current = null;

	return fetchTitle(message).then((aiTitle) => {
		if (aiTitle) {
			resolveChatTitle(threadId, aiTitle);
			return;
		}

		if (
			resolveRovoAppFallbackTitle({
				messages,
				pendingTitleThreadIdRef,
				resolveChatTitle,
			})
		) {
			return;
		}

		clearPendingTitleGeneration(threadId);
	});
}
