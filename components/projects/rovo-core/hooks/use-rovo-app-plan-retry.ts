"use client";

import { useEffect } from "react";
import {
	runRovoAppPlanRetryLifecycle,
	type RunRovoAppPlanRetryLifecycleInput,
} from "@/components/projects/rovo-core/lib/rovo-app-plan-retry-lifecycle";

export type UseRovoAppPlanRetryOptions = RunRovoAppPlanRetryLifecycleInput;

export function useRovoAppPlanRetry({
	activeThreadIdRef,
	appendLocalUserMessage,
	isStreaming,
	lastUseChatBusyAtRef,
	messages,
	planningSession,
	releaseCompletedUseChatTurnIfNeeded,
	rovoMessagesRef,
	sendMessage,
	setPlanningSession,
	syncAgentModeForDispatch,
	threads,
	useChatStatusRef,
}: UseRovoAppPlanRetryOptions): void {
	useEffect(() => {
		void runRovoAppPlanRetryLifecycle({
			activeThreadIdRef,
			appendLocalUserMessage,
			isStreaming,
			lastUseChatBusyAtRef,
			messages,
			planningSession,
			releaseCompletedUseChatTurnIfNeeded,
			rovoMessagesRef,
			sendMessage,
			setPlanningSession,
			syncAgentModeForDispatch,
			threads,
			useChatStatusRef,
		});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		isStreaming,
		messages,
		planningSession,
		syncAgentModeForDispatch,
		threads,
	]);
}
