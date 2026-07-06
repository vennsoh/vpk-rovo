import type { ChatStatus } from "ai";
import type {
	ClarificationAnswers,
	ParsedQuestionCardPayload,
} from "@/components/projects/shared/lib/question-card-widget";
import {
	buildClarificationDismissPrompt,
	buildClarificationSummaryPrompt,
} from "@/components/projects/shared/lib/question-card-widget";
import {
	type RovoAppClarificationPayload,
	type RovoAppClarificationSubmitOptions,
	buildRovoAppClarificationAnswerPayload,
	buildRovoAppClarificationDismissPayload,
	buildRovoAppDeferredClarificationDismissPayload,
	resolveRovoAppClarificationContextDescription,
	resolveRovoAppClarificationPlanMode,
} from "@/components/projects/rovo-core/lib/rovo-app-hook-helpers";
import {
	appendTurnCompleteToLastAssistantMessage,
	markClarificationToolResolved,
} from "@/components/projects/rovo-core/lib/rovo-app-streaming-assistant";
import { waitForChatSendSettled } from "@/components/projects/rovo-core/lib/rovo-app-send-guard";
import type {
	RovoMessageMetadata,
	RovoUIMessage,
} from "@/lib/rovo-ui-messages";

type RovoAppClarificationLifecycleRef<T> = {
	current: T;
};

type RovoAppClarificationContinuationKind =
	| "answer"
	| "dismiss"
	| "deferred-dismiss";

type RovoAppClarificationSendMessage = (
	message: {
		files: [];
		messageId: string;
		metadata: RovoMessageMetadata;
		text: string;
	},
	options: { body: Record<string, unknown> },
) => Promise<void>;

interface SubmitRovoAppClarificationContinuationInput {
	answers?: ClarificationAnswers;
	appendLocalUserMessage: (input: {
		files: [];
		metadata: RovoMessageMetadata;
		text: string;
	}) => {
		messageId: string;
	};
	ensureThread: (fallbackTitle: string) => Promise<string>;
	includeDeferredToolPlanMode?: boolean;
	isPlanModeActive: boolean;
	kind: RovoAppClarificationContinuationKind;
	lastBusyAtRef?: RovoAppClarificationLifecycleRef<number>;
	markLocalThreadRunPending: (threadId: string) => void;
	markObservedTurnComplete?: () => void;
	onPlanModeActive?: () => Promise<void> | void;
	onSendError?: (input: {
		error: unknown;
		messageId: string;
		threadId: string;
	}) => Promise<void> | void;
	options?: RovoAppClarificationSubmitOptions;
	questionCard: ParsedQuestionCardPayload;
	releaseCompletedUseChatTurnIfNeeded: () => Promise<void>;
	resetPendingArtifactAssociation: () => void;
	sendMessage: RovoAppClarificationSendMessage;
	setRovoMessages?: (
		updater: (previousMessages: RovoUIMessage[]) => RovoUIMessage[],
	) => void;
	statusRef: RovoAppClarificationLifecycleRef<ChatStatus>;
}

function buildRovoAppClarificationLifecyclePayload({
	answers,
	contextDescription,
	creationMode,
	kind,
	questionCard,
	threadId,
	wasPlanModeActive,
}: Readonly<{
	answers?: ClarificationAnswers;
	contextDescription?: string;
	creationMode?: RovoAppClarificationSubmitOptions["creationMode"];
	kind: RovoAppClarificationContinuationKind;
	questionCard: ParsedQuestionCardPayload;
	threadId: string;
	wasPlanModeActive: boolean;
}>): RovoAppClarificationPayload {
	if (kind === "answer") {
		if (!answers) {
			throw new Error("Clarification answers are required for answer continuations.");
		}

		return buildRovoAppClarificationAnswerPayload({
			answers,
			contextDescription,
			creationMode,
			questionCard,
			threadId,
			wasPlanModeActive,
		});
	}

	if (kind === "deferred-dismiss") {
		return buildRovoAppDeferredClarificationDismissPayload({
			contextDescription,
			creationMode,
			questionCard,
			threadId,
			wasPlanModeActive,
		});
	}

	return buildRovoAppClarificationDismissPayload({
		contextDescription,
		creationMode,
		questionCard,
		threadId,
		wasPlanModeActive,
	});
}

function getRovoAppClarificationFallbackTitle({
	answers,
	kind,
	questionCard,
}: Readonly<{
	answers?: ClarificationAnswers;
	kind: RovoAppClarificationContinuationKind;
	questionCard: ParsedQuestionCardPayload;
}>): string {
	if (kind === "answer") {
		return answers
			? buildClarificationSummaryPrompt(questionCard, answers) || "Clarification"
			: "Clarification";
	}

	return buildClarificationDismissPrompt(questionCard) || "Dismissed clarification";
}

function resolveClarificationToolIfNeeded({
	kind,
	markObservedTurnComplete,
	setRovoMessages,
}: Readonly<{
	kind: RovoAppClarificationContinuationKind;
	markObservedTurnComplete?: () => void;
	setRovoMessages?: (
		updater: (previousMessages: RovoUIMessage[]) => RovoUIMessage[],
	) => void;
}>): void {
	if (kind === "dismiss") {
		return;
	}

	markObservedTurnComplete?.();
	setRovoMessages?.((previousMessages) => {
		const resolved = markClarificationToolResolved(
			previousMessages,
			kind === "deferred-dismiss" ? "Clarification dismissed." : undefined,
		);
		return appendTurnCompleteToLastAssistantMessage(resolved).messages;
	});
}

export async function submitRovoAppClarificationContinuation({
	answers,
	appendLocalUserMessage,
	ensureThread,
	includeDeferredToolPlanMode = false,
	isPlanModeActive,
	kind,
	lastBusyAtRef,
	markLocalThreadRunPending,
	markObservedTurnComplete,
	onPlanModeActive,
	onSendError,
	options,
	questionCard,
	releaseCompletedUseChatTurnIfNeeded,
	resetPendingArtifactAssociation,
	sendMessage,
	setRovoMessages,
	statusRef,
}: SubmitRovoAppClarificationContinuationInput): Promise<void> {
	const creationMode = options?.creationMode;
	const wasPlanModeActive = resolveRovoAppClarificationPlanMode({
		creationMode,
		hasDeferredToolCall: Boolean(questionCard.deferredToolCallId),
		includeDeferredToolPlanMode,
		isPlanModeActive,
	});
	const contextDescription = resolveRovoAppClarificationContextDescription({
		contextDescription: options?.contextDescription,
		creationMode,
		wasPlanModeActive,
	});

	resolveClarificationToolIfNeeded({
		kind,
		markObservedTurnComplete,
		setRovoMessages,
	});
	await releaseCompletedUseChatTurnIfNeeded();
	await waitForChatSendSettled({
		statusRef,
		...(lastBusyAtRef ? { lastBusyAtRef } : {}),
	});

	const threadId = await ensureThread(
		getRovoAppClarificationFallbackTitle({ answers, kind, questionCard }),
	);
	const clarificationPayload = buildRovoAppClarificationLifecyclePayload({
		answers,
		contextDescription,
		creationMode,
		kind,
		questionCard,
		threadId,
		wasPlanModeActive,
	});
	const { messageId } = appendLocalUserMessage({
		files: [],
		metadata: clarificationPayload.metadata,
		text: clarificationPayload.text,
	});
	resetPendingArtifactAssociation();
	markLocalThreadRunPending(threadId);
	if (kind === "answer") {
		options?.onSubmitted?.();
	}

	if (wasPlanModeActive) {
		await onPlanModeActive?.();
	}

	try {
		await sendMessage(
			{
				text: clarificationPayload.text,
				files: [],
				messageId,
				metadata: clarificationPayload.metadata,
			},
			{ body: clarificationPayload.body },
		);
	} catch (error) {
		await onSendError?.({ error, messageId, threadId });
		throw error;
	}
}
