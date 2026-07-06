import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import {
	appendSuggestedQuestionsToAssistantMessage,
	buildNextSuggestedQuestionsRequest,
	type RovoAppSuggestionsRequest,
} from "@/components/projects/rovo-core/lib/rovo-app-suggestions";

interface MutableRef<T> {
	current: T;
}

type SetState<T> = (value: T | ((previousValue: T) => T)) => void;

export interface RunRovoAppSuggestedQuestionsLifecycleInput {
	activeThreadIdRef: MutableRef<string | null>;
	fetchSuggestedQuestions: (
		request: RovoAppSuggestionsRequest & { signal: AbortSignal },
	) => Promise<string[]>;
	isBackendUnavailableError: (error: unknown) => boolean;
	isStreaming: boolean;
	messages: ReadonlyArray<RovoUIMessage>;
	requestedSuggestionMessageIdsRef: MutableRef<Set<string>>;
	setRovoMessages: SetState<RovoUIMessage[]>;
	shouldSuppressLatestAssistantSuggestions: boolean;
	suggestionsAbortControllerRef: MutableRef<AbortController | null>;
	warn?: (message: string, error: unknown) => void;
}

export function abortRovoAppSuggestedQuestions(
	suggestionsAbortControllerRef: MutableRef<AbortController | null>,
): void {
	suggestionsAbortControllerRef.current?.abort();
	suggestionsAbortControllerRef.current = null;
}

export function runRovoAppSuggestedQuestionsLifecycle({
	activeThreadIdRef,
	fetchSuggestedQuestions,
	isBackendUnavailableError,
	isStreaming,
	messages,
	requestedSuggestionMessageIdsRef,
	setRovoMessages,
	shouldSuppressLatestAssistantSuggestions,
	suggestionsAbortControllerRef,
	warn = console.warn,
}: RunRovoAppSuggestedQuestionsLifecycleInput): Promise<void> | null {
	if (isStreaming || shouldSuppressLatestAssistantSuggestions) {
		abortRovoAppSuggestedQuestions(suggestionsAbortControllerRef);
		return null;
	}

	const suggestionRequest = buildNextSuggestedQuestionsRequest(
		messages,
		requestedSuggestionMessageIdsRef.current,
	);
	if (!suggestionRequest) {
		return null;
	}

	abortRovoAppSuggestedQuestions(suggestionsAbortControllerRef);
	const abortController = new AbortController();
	suggestionsAbortControllerRef.current = abortController;

	requestedSuggestionMessageIdsRef.current.add(suggestionRequest.assistantMessageId);
	const threadIdAtRequest = activeThreadIdRef.current;

	return fetchSuggestedQuestions({
		...suggestionRequest,
		signal: abortController.signal,
	})
		.then((questions) => {
			if (questions.length === 0) {
				return;
			}

			if (activeThreadIdRef.current !== threadIdAtRequest) {
				return;
			}

			setRovoMessages((currentMessages) =>
				appendSuggestedQuestionsToAssistantMessage(
					currentMessages,
					suggestionRequest.assistantMessageId,
					questions,
				),
			);
		})
		.catch((error) => {
			requestedSuggestionMessageIdsRef.current.delete(
				suggestionRequest.assistantMessageId,
			);
			if (abortController.signal.aborted) {
				return;
			}
			if (isBackendUnavailableError(error)) {
				return;
			}

			warn(
				"[RovoApp] Failed to fetch suggested questions:",
				error,
			);
		});
}
