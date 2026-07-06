import type { ChatStatus, FileUIPart } from "ai";
import {
	ROVO_APP_PLAN_MODE_POST_CLARIFICATION_CONTEXT,
	createRovoAppPlanningSession,
	type RovoAppPlanningSession,
} from "@/components/projects/rovo-core/lib/rovo-app-hook-helpers";
import { getLatestRovoAppAssistantMessageId } from "@/components/projects/rovo-core/lib/rovo-app-planning-session";
import { waitForChatSendSettled } from "@/components/projects/rovo-core/lib/rovo-app-send-guard";
import {
	buildPlanApprovalPrompt,
	createPlanApprovalSubmission,
	getPlanApprovalKeyFromPlanWidget,
	type PlanApprovalSelection,
	type PlanApprovalSubmission,
} from "@/components/projects/shared/lib/plan-approval";
import {
	buildExitPlanModeDeferredToolResponse,
	type ParsedPlanWidgetPayload,
} from "@/components/projects/shared/lib/plan-widget";
import type { RovoAppPromptMode } from "@/lib/rovo-app-types";
import type { RovoMessageMetadata, RovoUIMessage } from "@/lib/rovo-ui-messages";

interface MutableRef<T> {
	current: T;
}

type SetState<T> = (value: T | ((previousValue: T) => T)) => void;

export interface RovoAppPlanReviewResultPayload {
	approval?: PlanApprovalSubmission;
	isPlanMode: boolean;
	messageMetadata?: RovoMessageMetadata;
	planWidget: ParsedPlanWidgetPayload;
	result: string;
	userMessageText: string;
}

export interface SendRovoAppPlanReviewResultInput extends RovoAppPlanReviewResultPayload {
	appendLocalUserMessage: (input: {
		files: ReadonlyArray<FileUIPart>;
		metadata?: RovoMessageMetadata;
		text: string;
	}) => {
		message: RovoUIMessage;
		messageId: string;
	};
	ensureThread: (title: string) => Promise<string>;
	lastUseChatBusyAtRef: MutableRef<number>;
	markLocalThreadRunPending: (threadId: string) => void;
	planModeSyncRequestIdRef: MutableRef<number>;
	releaseCompletedUseChatTurnIfNeeded: () => Promise<void>;
	resetPendingArtifactAssociation: () => void;
	rovoMessagesRef: MutableRef<RovoUIMessage[]>;
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
	clearPlanExecutionTrackerDismissalsForThread: (threadId: string) => void;
	setPlanningSession: SetState<RovoAppPlanningSession | null>;
	syncAgentModeForDispatch: (mode: RovoAppPromptMode) => void | Promise<void>;
	useChatStatusRef: MutableRef<ChatStatus>;
}

export interface AcceptRovoAppPlanReviewInput {
	planWidget: ParsedPlanWidgetPayload;
	sendPlanReviewResult: (payload: RovoAppPlanReviewResultPayload) => Promise<void>;
}

export interface SubmitRovoAppPlanApprovalInput extends AcceptRovoAppPlanReviewInput {
	acceptPlanReview: (planWidget: ParsedPlanWidgetPayload) => Promise<void>;
	selection: PlanApprovalSelection;
}

export async function sendRovoAppPlanReviewResult({
	appendLocalUserMessage,
	approval,
	ensureThread,
	isPlanMode,
	lastUseChatBusyAtRef,
	markLocalThreadRunPending,
	messageMetadata,
	planModeSyncRequestIdRef,
	planWidget,
	releaseCompletedUseChatTurnIfNeeded,
	resetPendingArtifactAssociation,
	result,
	rovoMessagesRef,
	sendMessage,
	clearPlanExecutionTrackerDismissalsForThread,
	setPlanningSession,
	syncAgentModeForDispatch,
	userMessageText,
	useChatStatusRef,
}: SendRovoAppPlanReviewResultInput): Promise<void> {
	const deferredToolResponse = approval
		? null
		: buildExitPlanModeDeferredToolResponse(planWidget, result);
	if (!deferredToolResponse && !approval) {
		throw new Error("The pending plan review is missing a deferred tool call.");
	}

	await releaseCompletedUseChatTurnIfNeeded();
	await waitForChatSendSettled({
		statusRef: useChatStatusRef,
		lastBusyAtRef: lastUseChatBusyAtRef,
	});

	const threadId = await ensureThread(userMessageText || "Plan review");
	await syncAgentModeForDispatch(isPlanMode ? "plan" : "default");
	const { message, messageId } = appendLocalUserMessage({
		files: [],
		metadata: messageMetadata,
		text: userMessageText,
	});
	clearPlanExecutionTrackerDismissalsForThread(threadId);
	resetPendingArtifactAssociation();
	if (isPlanMode) {
		planModeSyncRequestIdRef.current += 1;
		setPlanningSession(createRovoAppPlanningSession({
			requestId: planModeSyncRequestIdRef.current,
			baselineAssistantMessageId:
				getLatestRovoAppAssistantMessageId(rovoMessagesRef.current),
		}));
	} else {
		setPlanningSession(null);
	}

	markLocalThreadRunPending(threadId);
	await sendMessage(
		{
			text: userMessageText,
			files: [],
			messageId,
			metadata: message.metadata,
		},
		{
			body: {
				id: threadId,
				isPlanMode,
				contextDescription: isPlanMode
					? ROVO_APP_PLAN_MODE_POST_CLARIFICATION_CONTEXT
					: undefined,
				...(deferredToolResponse ? { deferredToolResponse } : {}),
				...(approval ? { approval } : {}),
			},
		},
	);
}

export async function acceptRovoAppPlanReview({
	planWidget,
	sendPlanReviewResult,
}: AcceptRovoAppPlanReviewInput): Promise<void> {
	const planApprovalPlanKey =
		getPlanApprovalKeyFromPlanWidget(planWidget) ?? undefined;
	await sendPlanReviewResult({
		isPlanMode: false,
		messageMetadata: {
			source: "plan-approval-submit",
			planApprovalDecision: "auto-accept",
			planApprovalPlanKey,
		},
		planWidget,
		result: "Accept.",
		userMessageText: "Accepted the plan.",
	});
}

export async function submitRovoAppPlanApproval({
	acceptPlanReview,
	planWidget,
	selection,
	sendPlanReviewResult,
}: SubmitRovoAppPlanApprovalInput): Promise<void> {
	if (selection.decision === "auto-accept") {
		await acceptPlanReview(planWidget);
		return;
	}

	const approvalSubmission = createPlanApprovalSubmission(selection, planWidget);
	const planApprovalPlanKey =
		getPlanApprovalKeyFromPlanWidget(planWidget) ?? undefined;
	const userMessageText = buildPlanApprovalPrompt(approvalSubmission);
	const result =
		selection.decision === "custom" && selection.customInstruction?.trim()
			? selection.customInstruction.trim()
			: "Continue planning. Please revise the plan.";

	await sendPlanReviewResult({
		isPlanMode: true,
		messageMetadata: {
			source: "plan-approval-submit",
			planApprovalDecision: selection.decision,
			planApprovalPlanKey,
		},
		planWidget,
		result,
		userMessageText,
		approval: approvalSubmission,
	});
}
