"use client";

import { useEffect } from "react";
import {
	runRovoAppSuggestedQuestionsLifecycle,
	type RunRovoAppSuggestedQuestionsLifecycleInput,
} from "@/components/projects/rovo-core/lib/rovo-app-suggestions-lifecycle";

export type UseRovoAppSuggestedQuestionsOptions = RunRovoAppSuggestedQuestionsLifecycleInput;

export function useRovoAppSuggestedQuestions({
	activeThreadIdRef,
	fetchSuggestedQuestions,
	isBackendUnavailableError,
	isStreaming,
	messages,
	requestedSuggestionMessageIdsRef,
	setRovoMessages,
	shouldSuppressLatestAssistantSuggestions,
	suggestionsAbortControllerRef,
}: UseRovoAppSuggestedQuestionsOptions): void {
	useEffect(() => {
		void runRovoAppSuggestedQuestionsLifecycle({
			activeThreadIdRef,
			fetchSuggestedQuestions,
			isBackendUnavailableError,
			isStreaming,
			messages,
			requestedSuggestionMessageIdsRef,
			setRovoMessages,
			shouldSuppressLatestAssistantSuggestions,
			suggestionsAbortControllerRef,
		});
	}, [
		activeThreadIdRef,
		fetchSuggestedQuestions,
		isBackendUnavailableError,
		isStreaming,
		messages,
		requestedSuggestionMessageIdsRef,
		setRovoMessages,
		shouldSuppressLatestAssistantSuggestions,
		suggestionsAbortControllerRef,
	]);
}
