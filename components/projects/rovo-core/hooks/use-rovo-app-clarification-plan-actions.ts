"use client";

import type { ChatStatus, FileUIPart } from "ai";
import {
	useCallback,
	type Dispatch,
	type MutableRefObject,
	type SetStateAction,
} from "react";
import {
	acceptRovoAppPlanReview,
	sendRovoAppPlanReviewResult,
	submitRovoAppPlanApproval,
	type RovoAppPlanReviewResultPayload,
} from "@/components/projects/rovo-core/lib/rovo-app-plan-review-lifecycle";
import { submitRovoAppClarificationContinuation } from "@/components/projects/rovo-core/lib/rovo-app-clarification-lifecycle";
import { isRovoAppSendSettledTimeoutError } from "@/components/projects/rovo-core/lib/rovo-app-send-guard";
import { getLatestRovoAppAssistantMessageId } from "@/components/projects/rovo-core/lib/rovo-app-planning-session";
import {
	restartRovoAppPlanningSession,
	type RovoAppClarificationSubmitOptions,
	type RovoAppPlanningSession,
} from "@/components/projects/rovo-core/lib/rovo-app-hook-helpers";
import type {
	ClarificationAnswers,
	ParsedQuestionCardPayload,
} from "@/components/projects/shared/lib/question-card-widget";
import type { ParsedPlanWidgetPayload } from "@/components/projects/shared/lib/plan-widget";
import type { PlanApprovalSelection } from "@/components/projects/shared/lib/plan-approval";
import type {
	RovoAppActiveRun,
	RovoAppPromptMode,
} from "@/lib/rovo-app-types";
import type {
	RovoMessageMetadata,
	RovoUIMessage,
} from "@/lib/rovo-ui-messages";

interface UseRovoAppClarificationPlanActionsOptions {
	appendLocalUserMessage: (input: {
		files: ReadonlyArray<FileUIPart>;
		metadata?: RovoMessageMetadata;
		text: string;
	}) => {
		message: RovoUIMessage;
		messageId: string;
	};
	clearPlanExecutionTrackerDismissalsForThread: (threadId: string) => void;
	ensureThread: (seedText: string) => Promise<string>;
	hasObservedTurnCompleteRef: MutableRefObject<boolean>;
	includeDeferredToolPlanMode: boolean;
	isPlanModeRef: MutableRefObject<boolean>;
	lastUseChatBusyAtRef: MutableRefObject<number>;
	markLocalThreadRunPending: (threadId: string) => void;
	planModeSyncRequestIdRef: MutableRefObject<number>;
	releaseCompletedUseChatTurnIfNeeded: () => Promise<void>;
	resetPendingArtifactAssociation: () => void;
	rovoMessagesRef: MutableRefObject<RovoUIMessage[]>;
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
	setAttachedRunStatus: (status: null) => void;
	setInputError: Dispatch<SetStateAction<string | null>>;
	setLocalThreadActiveRun: (threadId: string, activeRun: RovoAppActiveRun | null) => void;
	setPlanningSession: Dispatch<SetStateAction<RovoAppPlanningSession | null>>;
	setRovoMessages: Dispatch<SetStateAction<RovoUIMessage[]>>;
	shouldRollbackFailedClarificationSend: boolean;
	shouldUsePlanModeForClarificationDismiss: boolean;
	syncAgentModeForDispatch: (mode: RovoAppPromptMode) => void | Promise<void>;
	toUserErrorMessage: (error: unknown) => string;
	useChatStatusRef: MutableRefObject<ChatStatus>;
}

interface UseRovoAppClarificationPlanActionsResult {
	acceptPlanReview: (planWidget: ParsedPlanWidgetPayload) => Promise<void>;
	cancelClarificationQuestionSet: (
		questionCard: ParsedQuestionCardPayload,
		options?: RovoAppClarificationSubmitOptions,
	) => Promise<boolean>;
	submitClarification: (
		questionCard: ParsedQuestionCardPayload,
		answers: ClarificationAnswers,
		options?: RovoAppClarificationSubmitOptions,
	) => Promise<void>;
	submitClarificationDismiss: (
		questionCard: ParsedQuestionCardPayload,
		options?: RovoAppClarificationSubmitOptions,
	) => Promise<void>;
	submitPlanApproval: (
		planWidget: ParsedPlanWidgetPayload,
		selection: PlanApprovalSelection,
	) => Promise<void>;
}

export function useRovoAppClarificationPlanActions({
	appendLocalUserMessage,
	clearPlanExecutionTrackerDismissalsForThread,
	ensureThread,
	hasObservedTurnCompleteRef,
	includeDeferredToolPlanMode,
	isPlanModeRef,
	lastUseChatBusyAtRef,
	markLocalThreadRunPending,
	planModeSyncRequestIdRef,
	releaseCompletedUseChatTurnIfNeeded,
	resetPendingArtifactAssociation,
	rovoMessagesRef,
	sendMessage,
	setAttachedRunStatus,
	setInputError,
	setLocalThreadActiveRun,
	setPlanningSession,
	setRovoMessages,
	shouldRollbackFailedClarificationSend,
	shouldUsePlanModeForClarificationDismiss,
	syncAgentModeForDispatch,
	toUserErrorMessage,
	useChatStatusRef,
}: UseRovoAppClarificationPlanActionsOptions): UseRovoAppClarificationPlanActionsResult {
	const sendPlanReviewResult = useCallback(
		async (payload: RovoAppPlanReviewResultPayload) => {
			await sendRovoAppPlanReviewResult({
				...payload,
				appendLocalUserMessage,
				ensureThread,
				lastUseChatBusyAtRef,
				markLocalThreadRunPending,
				planModeSyncRequestIdRef,
				releaseCompletedUseChatTurnIfNeeded,
				resetPendingArtifactAssociation,
				rovoMessagesRef,
				sendMessage,
				clearPlanExecutionTrackerDismissalsForThread,
				setPlanningSession,
				syncAgentModeForDispatch,
				useChatStatusRef,
			});
		},
		[
			appendLocalUserMessage,
			clearPlanExecutionTrackerDismissalsForThread,
			ensureThread,
			lastUseChatBusyAtRef,
			markLocalThreadRunPending,
			planModeSyncRequestIdRef,
			releaseCompletedUseChatTurnIfNeeded,
			resetPendingArtifactAssociation,
			rovoMessagesRef,
			sendMessage,
			setPlanningSession,
			syncAgentModeForDispatch,
			useChatStatusRef,
		],
	);

	const restartPlanModeAfterClarification = useCallback(async () => {
		await syncAgentModeForDispatch("plan");
		setPlanningSession((prev) =>
			restartRovoAppPlanningSession(prev, {
				requestId: planModeSyncRequestIdRef.current,
				baselineAssistantMessageId:
					getLatestRovoAppAssistantMessageId(rovoMessagesRef.current),
			}),
		);
	}, [
		planModeSyncRequestIdRef,
		rovoMessagesRef,
		setPlanningSession,
		syncAgentModeForDispatch,
	]);

	const handleFailedClarificationSend = useCallback(
		({
			error,
			messageId,
			threadId,
		}: {
			error: unknown;
			messageId: string;
			threadId: string;
		}) => {
			setRovoMessages((prev) => prev.filter((m) => m.id !== messageId));
			setLocalThreadActiveRun(threadId, null);
			setAttachedRunStatus(null);
			if (!isRovoAppSendSettledTimeoutError(error)) {
				setInputError(toUserErrorMessage(error));
			}
		},
		[
			setAttachedRunStatus,
			setInputError,
			setLocalThreadActiveRun,
			setRovoMessages,
			toUserErrorMessage,
		],
	);

	const submitClarification = useCallback(
		async (
			questionCard: ParsedQuestionCardPayload,
			answers: ClarificationAnswers,
			options?: RovoAppClarificationSubmitOptions,
		) => {
			await submitRovoAppClarificationContinuation({
				answers,
				appendLocalUserMessage,
				ensureThread,
				includeDeferredToolPlanMode,
				isPlanModeActive: isPlanModeRef.current,
				kind: "answer",
				lastBusyAtRef: lastUseChatBusyAtRef,
				markLocalThreadRunPending,
				markObservedTurnComplete: () => {
					hasObservedTurnCompleteRef.current = true;
				},
				onPlanModeActive: restartPlanModeAfterClarification,
				onSendError: shouldRollbackFailedClarificationSend
					? handleFailedClarificationSend
					: undefined,
				options,
				questionCard,
				releaseCompletedUseChatTurnIfNeeded,
				resetPendingArtifactAssociation,
				sendMessage,
				setRovoMessages,
				statusRef: useChatStatusRef,
			});
		},
		[
			appendLocalUserMessage,
			ensureThread,
			handleFailedClarificationSend,
			hasObservedTurnCompleteRef,
			includeDeferredToolPlanMode,
			isPlanModeRef,
			lastUseChatBusyAtRef,
			markLocalThreadRunPending,
			releaseCompletedUseChatTurnIfNeeded,
			resetPendingArtifactAssociation,
			restartPlanModeAfterClarification,
			sendMessage,
			setRovoMessages,
			shouldRollbackFailedClarificationSend,
			useChatStatusRef,
		],
	);

	const submitClarificationDismiss = useCallback(
		async (
			questionCard: ParsedQuestionCardPayload,
			options?: RovoAppClarificationSubmitOptions,
		) => {
			await submitRovoAppClarificationContinuation({
				appendLocalUserMessage,
				ensureThread,
				isPlanModeActive: shouldUsePlanModeForClarificationDismiss
					? isPlanModeRef.current
					: false,
				kind: "dismiss",
				lastBusyAtRef: lastUseChatBusyAtRef,
				markLocalThreadRunPending,
				onPlanModeActive: shouldUsePlanModeForClarificationDismiss
					? restartPlanModeAfterClarification
					: undefined,
				onSendError: shouldRollbackFailedClarificationSend
					? handleFailedClarificationSend
					: undefined,
				options,
				questionCard,
				releaseCompletedUseChatTurnIfNeeded,
				resetPendingArtifactAssociation,
				sendMessage,
				statusRef: useChatStatusRef,
			});
		},
		[
			appendLocalUserMessage,
			ensureThread,
			handleFailedClarificationSend,
			isPlanModeRef,
			lastUseChatBusyAtRef,
			markLocalThreadRunPending,
			releaseCompletedUseChatTurnIfNeeded,
			resetPendingArtifactAssociation,
			restartPlanModeAfterClarification,
			sendMessage,
			shouldRollbackFailedClarificationSend,
			shouldUsePlanModeForClarificationDismiss,
			useChatStatusRef,
		],
	);

	/**
	 * Dismiss a deferred-tool-backed clarification by resuming the paused tool
	 * call with an explicit dismissal result instead of cancelling the session.
	 * This mirrors submitClarification but with empty answers and dismissal
	 * semantics so the paused tool receives a concrete "wait for the user's next
	 * instructions" response.
	 */
	const submitDeferredClarificationDismiss = useCallback(
		async (
			questionCard: ParsedQuestionCardPayload,
			options?: RovoAppClarificationSubmitOptions,
		) => {
			await submitRovoAppClarificationContinuation({
				appendLocalUserMessage,
				ensureThread,
				includeDeferredToolPlanMode,
				isPlanModeActive: isPlanModeRef.current,
				kind: "deferred-dismiss",
				lastBusyAtRef: lastUseChatBusyAtRef,
				markLocalThreadRunPending,
				markObservedTurnComplete: () => {
					hasObservedTurnCompleteRef.current = true;
				},
				onPlanModeActive: restartPlanModeAfterClarification,
				onSendError: shouldRollbackFailedClarificationSend
					? handleFailedClarificationSend
					: undefined,
				options,
				questionCard,
				releaseCompletedUseChatTurnIfNeeded,
				resetPendingArtifactAssociation,
				sendMessage,
				setRovoMessages,
				statusRef: useChatStatusRef,
			});
		},
		[
			appendLocalUserMessage,
			ensureThread,
			handleFailedClarificationSend,
			hasObservedTurnCompleteRef,
			includeDeferredToolPlanMode,
			isPlanModeRef,
			lastUseChatBusyAtRef,
			markLocalThreadRunPending,
			releaseCompletedUseChatTurnIfNeeded,
			resetPendingArtifactAssociation,
			restartPlanModeAfterClarification,
			sendMessage,
			setRovoMessages,
			shouldRollbackFailedClarificationSend,
			useChatStatusRef,
		],
	);

	const cancelClarificationQuestionSet = useCallback(
		async (
			questionCard: ParsedQuestionCardPayload,
			options?: RovoAppClarificationSubmitOptions,
		) => {
			const toolCallId =
				questionCard.deferredToolCallId ?? questionCard.toolCallId ?? null;
			if (!toolCallId) {
				await submitClarificationDismiss(questionCard, options);
				return true;
			}

			await submitDeferredClarificationDismiss(questionCard, options);
			return true;
		},
		[submitClarificationDismiss, submitDeferredClarificationDismiss],
	);

	const acceptPlanReview = useCallback(
		async (planWidget: ParsedPlanWidgetPayload) => {
			await acceptRovoAppPlanReview({
				planWidget,
				sendPlanReviewResult,
			});
		},
		[sendPlanReviewResult],
	);

	const submitPlanApproval = useCallback(
		async (
			planWidget: ParsedPlanWidgetPayload,
			selection: PlanApprovalSelection,
		) => {
			await submitRovoAppPlanApproval({
				acceptPlanReview,
				planWidget,
				selection,
				sendPlanReviewResult,
			});
		},
		[acceptPlanReview, sendPlanReviewResult],
	);

	return {
		acceptPlanReview,
		cancelClarificationQuestionSet,
		submitClarification,
		submitClarificationDismiss,
		submitPlanApproval,
	};
}
