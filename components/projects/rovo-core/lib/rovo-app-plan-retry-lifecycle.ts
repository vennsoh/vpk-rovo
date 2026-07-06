import type { ChatStatus, FileUIPart } from "ai";
import {
	buildRovoAppPlanRetryPayload,
	markRovoAppPlanningSessionRetrying,
	markRovoAppPlanningSessionStreamStarted,
	type RovoAppPlanningSession,
} from "@/components/projects/rovo-core/lib/rovo-app-hook-helpers";
import { shouldSuppressRovoAppPlanRetry } from "@/components/projects/rovo-core/lib/rovo-app-plan-retry-guard";
import {
	getLatestRovoAppAssistantMessageId,
	getRovoAppPlanningArtifactsSinceBaseline,
} from "@/components/projects/rovo-core/lib/rovo-app-planning-session";
import { waitForChatSendSettled } from "@/components/projects/rovo-core/lib/rovo-app-send-guard";
import type { RovoAppPromptMode } from "@/lib/rovo-app-types";
import type { RovoMessageMetadata, RovoUIMessage } from "@/lib/rovo-ui-messages";

interface MutableRef<T> {
	current: T;
}

type SetState<T> = (value: T | ((previousValue: T) => T)) => void;

interface RovoAppPlanRetryThread {
	id: string;
	sessionId: string | null;
	sessionMode: "persistent" | "ephemeral" | null;
}

export type RovoAppPlanRetryLifecycleResult =
	| "awaiting-clarification"
	| "awaiting-stream"
	| "cleared"
	| "idle"
	| "retry-failed"
	| "retried"
	| "streaming";

export interface RunRovoAppPlanRetryLifecycleInput {
	activeThreadIdRef: MutableRef<string | null>;
	appendLocalUserMessage: (input: {
		files: ReadonlyArray<FileUIPart>;
		metadata: RovoMessageMetadata;
		text: string;
	}) => {
		message: RovoUIMessage;
		messageId: string;
	};
	isStreaming: boolean;
	lastUseChatBusyAtRef: MutableRef<number>;
	messages: ReadonlyArray<RovoUIMessage>;
	planningSession: RovoAppPlanningSession | null;
	releaseCompletedUseChatTurnIfNeeded: () => Promise<void>;
	rovoMessagesRef: MutableRef<RovoUIMessage[]>;
	scheduleMicrotask?: (callback: () => void) => void;
	sendMessage: (
		message: {
			files: FileUIPart[];
			messageId: string;
			metadata?: RovoMessageMetadata;
			text: string;
		},
		options: {
			body: Record<string, unknown>;
		},
	) => Promise<void>;
	setPlanningSession: SetState<RovoAppPlanningSession | null>;
	syncAgentModeForDispatch: (mode: RovoAppPromptMode) => void | Promise<void>;
	threads: ReadonlyArray<RovoAppPlanRetryThread>;
	useChatStatusRef: MutableRef<ChatStatus>;
}

function scheduleRovoAppPlanRetryUpdate(
	scheduleMicrotask: (callback: () => void) => void,
	update: () => void,
): void {
	scheduleMicrotask(update);
}

export async function runRovoAppPlanRetryLifecycle({
	activeThreadIdRef,
	appendLocalUserMessage,
	isStreaming,
	lastUseChatBusyAtRef,
	messages,
	planningSession,
	releaseCompletedUseChatTurnIfNeeded,
	rovoMessagesRef,
	scheduleMicrotask = queueMicrotask,
	sendMessage,
	setPlanningSession,
	syncAgentModeForDispatch,
	threads,
	useChatStatusRef,
}: RunRovoAppPlanRetryLifecycleInput): Promise<RovoAppPlanRetryLifecycleResult> {
	if (!planningSession) {
		return "idle";
	}

	if (isStreaming) {
		if (!planningSession.hasStreamStarted) {
			scheduleRovoAppPlanRetryUpdate(scheduleMicrotask, () => {
				setPlanningSession((previousSession) =>
					markRovoAppPlanningSessionStreamStarted(previousSession),
				);
			});
		}
		return "streaming";
	}

	if (!planningSession.hasStreamStarted) {
		return "awaiting-stream";
	}

	const {
		hasGeneratedPlan,
		isAwaitingClarificationAnswers,
		latestAssistantMessage,
	} = getRovoAppPlanningArtifactsSinceBaseline(
		messages,
		planningSession.baselineAssistantMessageId,
	);

	if (hasGeneratedPlan) {
		scheduleRovoAppPlanRetryUpdate(scheduleMicrotask, () => {
			setPlanningSession(null);
		});
		return "cleared";
	}

	if (isAwaitingClarificationAnswers) {
		return "awaiting-clarification";
	}

	if (
		shouldSuppressRovoAppPlanRetry(latestAssistantMessage) ||
		planningSession.retryUsed
	) {
		scheduleRovoAppPlanRetryUpdate(scheduleMicrotask, () => {
			setPlanningSession(null);
		});
		return "cleared";
	}

	scheduleRovoAppPlanRetryUpdate(scheduleMicrotask, () => {
		setPlanningSession((previousSession) =>
			markRovoAppPlanningSessionRetrying(
				previousSession,
				getLatestRovoAppAssistantMessageId(rovoMessagesRef.current),
			),
		);
	});

	try {
		await releaseCompletedUseChatTurnIfNeeded();
		await waitForChatSendSettled({
			statusRef: useChatStatusRef,
			lastBusyAtRef: lastUseChatBusyAtRef,
		});

		const threadId = activeThreadIdRef.current;
		if (!threadId) {
			return "cleared";
		}

		const activeThread =
			threads.find((thread) => thread.id === threadId) ?? null;
		if (!activeThread?.sessionId) {
			scheduleRovoAppPlanRetryUpdate(scheduleMicrotask, () => {
				setPlanningSession(null);
			});
			return "cleared";
		}

		const retryPayload = buildRovoAppPlanRetryPayload({
			threadId,
			sessionId: activeThread.sessionId,
			sessionMode: activeThread.sessionMode,
		});
		const { message, messageId } = appendLocalUserMessage({
			files: [],
			metadata: retryPayload.metadata,
			text: retryPayload.text,
		});
		await syncAgentModeForDispatch("plan");
		await sendMessage(
			{
				text: retryPayload.text,
				files: [],
				messageId,
				metadata: message.metadata,
			},
			{
				body: retryPayload.body,
			},
		);
		return "retried";
	} catch {
		return "retry-failed";
	}
}
