"use client";

import { useEffect, type MutableRefObject } from "react";
import {
	fetchEnrichedPlanTitle,
	type SourcedPlanWidget,
} from "@/components/projects/shared/lib/plan-widget";
import { isGenericPlanTitle } from "@/components/projects/shared/lib/plan-identity";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

const ROVO_APP_PLAN_WIDGET_METADATA_ENRICH_DELAY_MS = 2_000;

interface RovoAppPlanWidgetMetadataEnrichmentInput {
	activeThreadId: string | null;
	attemptedPlanMetadataMessageIds: ReadonlySet<string>;
	isHydratingThread: boolean;
	isLoadingThread: boolean;
	isStreaming: boolean;
	latestSourcedPlanWidget: SourcedPlanWidget | null;
}

export interface RovoAppPlanWidgetMetadataEnrichmentRequest {
	planWidget: SourcedPlanWidget["planWidget"];
	sourceMessageId: string;
	threadId: string;
}

export interface RovoAppPersistPlanWidgetMetadataInput {
	messages: ReadonlyArray<RovoUIMessage>;
	shortDescription?: string;
	sourceMessageId?: string | null;
	threadId: string;
	title?: string;
}

interface UseRovoAppPlanWidgetMetadataEnrichmentOptions
	extends Omit<RovoAppPlanWidgetMetadataEnrichmentInput, "attemptedPlanMetadataMessageIds" | "isHydratingThread"> {
	attemptedPlanMetadataMessageIdsRef: MutableRefObject<Set<string>>;
	clearPendingPlanMetadataGeneration: (sourceMessageId: string) => void;
	hydrationVersion: number;
	isHydratingThreadRef: MutableRefObject<boolean>;
	persistPlanWidgetMetadata: (options: RovoAppPersistPlanWidgetMetadataInput) => void;
	rovoMessagesRef: MutableRefObject<ReadonlyArray<RovoUIMessage>>;
	setPlanMetadataPendingState: (sourceMessageId: string, pending: boolean) => void;
}

export function resolveRovoAppPlanWidgetMetadataEnrichmentRequest({
	activeThreadId,
	attemptedPlanMetadataMessageIds,
	isHydratingThread,
	isLoadingThread,
	isStreaming,
	latestSourcedPlanWidget,
}: RovoAppPlanWidgetMetadataEnrichmentInput): RovoAppPlanWidgetMetadataEnrichmentRequest | null {
	const sourceMessageId = latestSourcedPlanWidget?.sourceMessageId ?? null;
	const planWidget = latestSourcedPlanWidget?.planWidget ?? null;
	if (!activeThreadId || isLoadingThread || isStreaming || isHydratingThread) {
		return null;
	}
	if (!sourceMessageId || !planWidget) {
		return null;
	}
	if (planWidget.shortDescription?.trim() && !isGenericPlanTitle(planWidget.title)) {
		return null;
	}
	if (attemptedPlanMetadataMessageIds.has(sourceMessageId)) {
		return null;
	}

	return {
		planWidget,
		sourceMessageId,
		threadId: activeThreadId,
	};
}

export function useRovoAppPlanWidgetMetadataEnrichment({
	activeThreadId,
	attemptedPlanMetadataMessageIdsRef,
	clearPendingPlanMetadataGeneration,
	hydrationVersion,
	isHydratingThreadRef,
	isLoadingThread,
	isStreaming,
	latestSourcedPlanWidget,
	persistPlanWidgetMetadata,
	rovoMessagesRef,
	setPlanMetadataPendingState,
}: UseRovoAppPlanWidgetMetadataEnrichmentOptions): void {
	useEffect(() => {
		const enrichmentRequest = resolveRovoAppPlanWidgetMetadataEnrichmentRequest({
			activeThreadId,
			attemptedPlanMetadataMessageIds: attemptedPlanMetadataMessageIdsRef.current,
			isHydratingThread: isHydratingThreadRef.current,
			isLoadingThread,
			isStreaming,
			latestSourcedPlanWidget,
		});
		if (!enrichmentRequest) {
			return;
		}

		const { planWidget, sourceMessageId, threadId } = enrichmentRequest;
		const enrichDelay = window.setTimeout(() => {
			attemptedPlanMetadataMessageIdsRef.current.add(sourceMessageId);
			setPlanMetadataPendingState(sourceMessageId, true);
			void fetchEnrichedPlanTitle(planWidget).then((result) => {
				if (!result) {
					clearPendingPlanMetadataGeneration(sourceMessageId);
					return;
				}

				persistPlanWidgetMetadata({
					threadId,
					messages: rovoMessagesRef.current,
					sourceMessageId,
					title: result.title,
					shortDescription: result.shortDescription,
				});
			});
		}, ROVO_APP_PLAN_WIDGET_METADATA_ENRICH_DELAY_MS);

		return () => {
			window.clearTimeout(enrichDelay);
		};
	}, [
		activeThreadId,
		attemptedPlanMetadataMessageIdsRef,
		clearPendingPlanMetadataGeneration,
		hydrationVersion,
		isHydratingThreadRef,
		isLoadingThread,
		isStreaming,
		latestSourcedPlanWidget,
		persistPlanWidgetMetadata,
		rovoMessagesRef,
		setPlanMetadataPendingState,
	]);
}
