import {
	resolveRovoAppMessageArtifactDisplay,
	type RovoAppMessageArtifactDisplay,
	type RovoAppOrphanArtifactDisplay,
	type RovoAppPendingArtifactResult,
} from "@/components/projects/rovo-core/lib/rovo-app-message-artifacts";
import { getRovoAppAssistantSuggestionQuestions } from "@/components/projects/rovo-core/lib/rovo-app-message-display";
import type { RovoAppStreamingArtifact } from "@/components/projects/rovo-core/lib/rovo-app-streaming-artifact";
import type { RovoAppDocument } from "@/lib/rovo-app-types";
import {
	getLatestDataPart,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import {
	hasMatchingClarificationResponse,
	parseQuestionCardPayload,
} from "@/components/projects/shared/lib/question-card-widget";
import {
	parsePlanWidgetPayload,
	type ParsedPlanWidgetPayload,
	type PendingPlanWidget,
} from "@/components/projects/shared/lib/plan-widget";

export interface RovoAppPlanBuildRenderState {
	isActivePendingPlan: boolean;
	planBuildDisabled?: boolean;
	planBuildDisabledReason?: string;
}

export interface RovoAppAssistantMessageRenderModel {
	artifactDisplay: RovoAppMessageArtifactDisplay | null;
	isActivePendingPlan: boolean;
	isQuestionCardResolved: boolean;
	planBuildDisabled?: boolean;
	planBuildDisabledReason?: string;
	planWidget: ParsedPlanWidgetPayload | null;
	suggestions: string[];
}

export function getRovoAppMessagePlanWidget(
	message: RovoUIMessage,
): ParsedPlanWidgetPayload | null {
	const widget = getLatestDataPart(message, "data-widget-data");
	if (widget?.data.type !== "plan") {
		return null;
	}

	return parsePlanWidgetPayload(widget.data.payload);
}

export function resolveRovoAppPlanBuildRenderState({
	messageId,
	pendingPlanReview,
	planWidget,
}: Readonly<{
	messageId: string;
	pendingPlanReview: PendingPlanWidget | null;
	planWidget: ParsedPlanWidgetPayload | null;
}>): RovoAppPlanBuildRenderState {
	const isActivePendingPlan =
		Boolean(planWidget?.deferredToolCallId) &&
		pendingPlanReview?.sourceMessageId === messageId;
	const planBuildDisabled = planWidget ? !isActivePendingPlan : undefined;
	const planBuildDisabledReason = planWidget
		? isActivePendingPlan
			? undefined
			: pendingPlanReview
				? "A newer reply superseded this plan."
				: "This plan is no longer awaiting review."
		: undefined;

	return {
		isActivePendingPlan,
		planBuildDisabled,
		planBuildDisabledReason,
	};
}

export function isRovoAppQuestionCardResolved({
	message,
	messages,
}: Readonly<{
	message: RovoUIMessage;
	messages: ReadonlyArray<RovoUIMessage>;
}>): boolean {
	const widget = getLatestDataPart(message, "data-widget-data");
	if (widget?.data.type !== "question-card") {
		return false;
	}

	const questionCard = parseQuestionCardPayload(widget.data.payload);
	if (!questionCard) {
		return false;
	}

	return hasMatchingClarificationResponse(messages, {
		...questionCard,
		sourceMessageId: message.id,
	});
}

export function resolveRovoAppAssistantMessageRenderModel({
	documents,
	fallbackPreviewSummary,
	fallbackTitle,
	lastAssistantMessageId,
	message,
	messages,
	orphanArtifactDisplay,
	pendingArtifactResult,
	pendingPlanReview,
	shouldSuppressLatestAssistantSuggestions,
	streamingArtifact,
	streamingArtifactMessageId,
}: Readonly<{
	documents: ReadonlyArray<RovoAppDocument>;
	fallbackPreviewSummary?: string | null;
	fallbackTitle?: string | null;
	lastAssistantMessageId: string | null;
	message: RovoUIMessage;
	messages: ReadonlyArray<RovoUIMessage>;
	orphanArtifactDisplay: RovoAppOrphanArtifactDisplay | null;
	pendingArtifactResult: RovoAppPendingArtifactResult | null;
	pendingPlanReview: PendingPlanWidget | null;
	shouldSuppressLatestAssistantSuggestions: boolean;
	streamingArtifact: RovoAppStreamingArtifact | null;
	streamingArtifactMessageId: string | null;
}>): RovoAppAssistantMessageRenderModel {
	const artifactDisplay = resolveRovoAppMessageArtifactDisplay({
		documents,
		fallbackPreviewSummary,
		fallbackTitle,
		message,
		pendingArtifactResult,
		streamingArtifact,
		streamingArtifactMessageId,
	});
	const fallbackArtifactDisplay =
		orphanArtifactDisplay?.anchorMessageId === message.id
			? orphanArtifactDisplay
			: null;
	const planWidget = getRovoAppMessagePlanWidget(message);
	const planBuildState = resolveRovoAppPlanBuildRenderState({
		messageId: message.id,
		pendingPlanReview,
		planWidget,
	});

	return {
		artifactDisplay: artifactDisplay ?? fallbackArtifactDisplay,
		isQuestionCardResolved: isRovoAppQuestionCardResolved({ message, messages }),
		planWidget,
		suggestions: getRovoAppAssistantSuggestionQuestions({
			lastAssistantMessageId,
			message,
			shouldSuppressLatestAssistantSuggestions,
		}),
		...planBuildState,
	};
}
