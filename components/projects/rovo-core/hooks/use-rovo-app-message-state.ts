"use client";

import { useEffect, useMemo } from "react";
import { normalizeRovoMessagesForMerge } from "@/components/projects/rovo-core/lib/rovo-app-message-normalization";
import { mergeRovoAppMessages } from "@/components/projects/rovo-core/lib/rovo-app-realtime-message-state";
import {
	getLatestSourcedPlanWidget,
	type ParsedPlanWidgetPayload,
} from "@/components/projects/shared/lib/plan-widget";
import { getLatestRovoAppThinkingStatusLabel } from "@/components/projects/shared/lib/rovo-app-composer-submit-state";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

interface MutableRef<T> {
	current: T;
}

interface RovoAppSourcedPlanWidget {
	planWidget: ParsedPlanWidgetPayload;
	sourceMessageId: string;
}

interface ResolveRovoAppBackgroundThinkingStatusLabelOptions {
	backgroundDelegationMessageId: string | null;
	messages: ReadonlyArray<RovoUIMessage>;
}

export function resolveRovoAppBackgroundThinkingStatusLabel({
	backgroundDelegationMessageId,
	messages,
}: ResolveRovoAppBackgroundThinkingStatusLabelOptions): string | null {
	if (!backgroundDelegationMessageId) {
		return null;
	}

	const backgroundDelegationMessage = messages.find((message) => {
		return message.id === backgroundDelegationMessageId;
	});
	if (!backgroundDelegationMessage) {
		return null;
	}

	return getLatestRovoAppThinkingStatusLabel([backgroundDelegationMessage]);
}

interface UseRovoAppMessageStateOptions {
	backgroundDelegationMessageId: string | null;
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	rovoMessages: ReadonlyArray<RovoUIMessage>;
	rovoMessagesRef: MutableRef<ReadonlyArray<RovoUIMessage>>;
}

interface UseRovoAppMessageStateResult {
	latestSourcedPlanWidget: RovoAppSourcedPlanWidget | null;
	latestThinkingStatusLabel: string | null;
	messages: RovoUIMessage[];
	normalizedRovoMessages: RovoUIMessage[];
}

export function useRovoAppMessageState({
	backgroundDelegationMessageId,
	realtimeMessages,
	rovoMessages,
	rovoMessagesRef,
}: UseRovoAppMessageStateOptions): UseRovoAppMessageStateResult {
	const normalizedRovoMessages = useMemo(() => {
		return normalizeRovoMessagesForMerge(
			rovoMessages,
			rovoMessagesRef.current,
		).messages;
	}, [rovoMessages, rovoMessagesRef]);

	useEffect(() => {
		rovoMessagesRef.current = normalizedRovoMessages;
	}, [normalizedRovoMessages, rovoMessagesRef]);

	const latestSourcedPlanWidget = useMemo(() => {
		return getLatestSourcedPlanWidget(normalizedRovoMessages);
	}, [normalizedRovoMessages]);
	const messages = useMemo(() => {
		return mergeRovoAppMessages({
			realtimeMessages,
			rovoMessages: normalizedRovoMessages,
		});
	}, [normalizedRovoMessages, realtimeMessages]);
	const latestThinkingStatusLabel = useMemo(() => {
		return resolveRovoAppBackgroundThinkingStatusLabel({
			backgroundDelegationMessageId,
			messages,
		});
	}, [backgroundDelegationMessageId, messages]);

	return {
		latestSourcedPlanWidget,
		latestThinkingStatusLabel,
		messages,
		normalizedRovoMessages,
	};
}
