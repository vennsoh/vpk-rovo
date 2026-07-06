"use client";

import {
	useCallback,
	type Dispatch,
	type MutableRefObject,
	type SetStateAction,
} from "react";
import {
	deleteAllRovoAppThreads,
	deleteRovoAppThread,
	setRovoAppVote,
} from "@/components/projects/rovo-core/lib/api";
import {
	deleteAllRovoAppThreadsWithLifecycle,
	deleteRovoAppThreadWithLifecycle,
} from "@/components/projects/rovo-core/lib/rovo-app-thread-deletion";
import {
	applyRovoAppVoteToMap,
} from "@/components/projects/rovo-core/lib/rovo-app-hook-helpers";
import type {
	RovoAppRunStatus,
	RovoAppThread,
	VoteValue,
} from "@/lib/rovo-app-types";

interface UseRovoAppThreadMutationActionsOptions {
	activeThreadId: string | null;
	activeThreadIdRef: MutableRefObject<string | null>;
	clearPendingTitleGeneration: (threadId?: string) => void;
	clearQueuedActionsForThread: (threadId: string) => void;
	deletedThreadIdsRef: MutableRefObject<Set<string>>;
	openNewChat: () => Promise<void>;
	refreshThreads: () => Promise<unknown>;
	runSubscriptionAbortControllerRef: MutableRefObject<AbortController | null>;
	runSubscriptionThreadIdRef: MutableRefObject<string | null>;
	setAttachedRunStatus: (status: RovoAppRunStatus | null) => void;
	setInputError: Dispatch<SetStateAction<string | null>>;
	setThreads: Dispatch<SetStateAction<RovoAppThread[]>>;
	setVotes: Dispatch<SetStateAction<Record<string, VoteValue>>>;
	threadsRef: MutableRefObject<RovoAppThread[]>;
	toUserErrorMessage: (error: unknown) => string;
}

interface UseRovoAppThreadMutationActionsResult {
	deleteAllThreads: () => Promise<void>;
	deleteThread: (threadId: string) => Promise<void>;
	voteOnMessage: (messageId: string, value: VoteValue | null) => Promise<void>;
}

export function useRovoAppThreadMutationActions({
	activeThreadId,
	activeThreadIdRef,
	clearPendingTitleGeneration,
	clearQueuedActionsForThread,
	deletedThreadIdsRef,
	openNewChat,
	refreshThreads,
	runSubscriptionAbortControllerRef,
	runSubscriptionThreadIdRef,
	setAttachedRunStatus,
	setInputError,
	setThreads,
	setVotes,
	threadsRef,
	toUserErrorMessage,
}: UseRovoAppThreadMutationActionsOptions): UseRovoAppThreadMutationActionsResult {
	const deleteThread = useCallback(
		async (threadId: string) => {
			await deleteRovoAppThreadWithLifecycle({
				activeThreadIdRef,
				clearPendingTitleGeneration,
				clearQueuedActionsForThread,
				deletedThreadIdsRef,
				deleteThread: deleteRovoAppThread,
				openNewChat,
				refreshThreads,
				runSubscriptionAbortControllerRef,
				runSubscriptionThreadIdRef,
				setAttachedRunStatus,
				setInputError,
				setThreads,
				threadId,
				toUserErrorMessage,
			});
		},
		[
			activeThreadIdRef,
			clearPendingTitleGeneration,
			clearQueuedActionsForThread,
			deletedThreadIdsRef,
			openNewChat,
			refreshThreads,
			runSubscriptionAbortControllerRef,
			runSubscriptionThreadIdRef,
			setAttachedRunStatus,
			setInputError,
			setThreads,
			toUserErrorMessage,
		],
	);

	const deleteAllThreads = useCallback(async () => {
		await deleteAllRovoAppThreadsWithLifecycle({
			clearPendingTitleGeneration,
			clearQueuedActionsForThread,
			deletedThreadIdsRef,
			deleteAllThreads: deleteAllRovoAppThreads,
			openNewChat,
			refreshThreads,
			runSubscriptionAbortControllerRef,
			runSubscriptionThreadIdRef,
			setAttachedRunStatus,
			setInputError,
			setThreads,
			threadsRef,
			toUserErrorMessage,
		});
	}, [
		clearPendingTitleGeneration,
		clearQueuedActionsForThread,
		deletedThreadIdsRef,
		openNewChat,
		refreshThreads,
		runSubscriptionAbortControllerRef,
		runSubscriptionThreadIdRef,
		setAttachedRunStatus,
		setInputError,
		setThreads,
		threadsRef,
		toUserErrorMessage,
	]);

	const voteOnMessage = useCallback(
		async (messageId: string, value: VoteValue | null) => {
			if (!activeThreadId) {
				return;
			}

			try {
				const vote = await setRovoAppVote({
					threadId: activeThreadId,
					messageId,
					value,
				});
				setVotes((previousVotes) => applyRovoAppVoteToMap(previousVotes, vote));
			} catch (error) {
				setInputError(toUserErrorMessage(error));
			}
		},
		[
			activeThreadId,
			setInputError,
			setVotes,
			toUserErrorMessage,
		],
	);

	return {
		deleteAllThreads,
		deleteThread,
		voteOnMessage,
	};
}
