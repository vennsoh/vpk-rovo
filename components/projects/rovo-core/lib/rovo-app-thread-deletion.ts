import type {
	RovoAppRunStatus,
	RovoAppThread,
} from "@/lib/rovo-app-types";

interface MutableRef<T> {
	current: T;
}

type SetRovoAppThreads = (
	threads: RovoAppThread[] | ((previousThreads: RovoAppThread[]) => RovoAppThread[]),
) => void;

interface RovoAppThreadDeletionLifecycleInput {
	clearPendingTitleGeneration: (threadId?: string) => void;
	clearQueuedActionsForThread: (threadId: string) => void;
	deletedThreadIdsRef: MutableRef<Set<string>>;
	openNewChat: () => Promise<void>;
	refreshThreads: () => Promise<unknown> | unknown;
	runSubscriptionAbortControllerRef: MutableRef<AbortController | null>;
	runSubscriptionThreadIdRef: MutableRef<string | null>;
	setAttachedRunStatus: (status: RovoAppRunStatus | null) => void;
	setInputError: (errorMessage: string | null) => void;
	setThreads: SetRovoAppThreads;
	toUserErrorMessage: (error: unknown) => string;
}

export interface DeleteRovoAppThreadWithLifecycleInput
	extends RovoAppThreadDeletionLifecycleInput {
	activeThreadIdRef: MutableRef<string | null>;
	deleteThread: (threadId: string) => Promise<unknown>;
	threadId: string;
}

export interface DeleteAllRovoAppThreadsWithLifecycleInput
	extends RovoAppThreadDeletionLifecycleInput {
	deleteAllThreads: () => Promise<unknown>;
	threadsRef: MutableRef<ReadonlyArray<RovoAppThread>>;
}

function resetRovoAppRunSubscription({
	runSubscriptionAbortControllerRef,
	runSubscriptionThreadIdRef,
	setAttachedRunStatus,
}: Pick<
	RovoAppThreadDeletionLifecycleInput,
	"runSubscriptionAbortControllerRef" | "runSubscriptionThreadIdRef" | "setAttachedRunStatus"
>): void {
	runSubscriptionAbortControllerRef.current?.abort();
	runSubscriptionAbortControllerRef.current = null;
	runSubscriptionThreadIdRef.current = null;
	setAttachedRunStatus(null);
}

export async function deleteRovoAppThreadWithLifecycle({
	activeThreadIdRef,
	clearPendingTitleGeneration,
	clearQueuedActionsForThread,
	deletedThreadIdsRef,
	deleteThread,
	openNewChat,
	refreshThreads,
	runSubscriptionAbortControllerRef,
	runSubscriptionThreadIdRef,
	setAttachedRunStatus,
	setInputError,
	setThreads,
	threadId,
	toUserErrorMessage,
}: DeleteRovoAppThreadWithLifecycleInput): Promise<void> {
	clearPendingTitleGeneration(threadId);
	deletedThreadIdsRef.current.add(threadId);
	clearQueuedActionsForThread(threadId);
	setThreads((previousThreads) =>
		previousThreads.filter((thread) => thread.id !== threadId),
	);

	try {
		await deleteThread(threadId);
		if (activeThreadIdRef.current === threadId) {
			resetRovoAppRunSubscription({
				runSubscriptionAbortControllerRef,
				runSubscriptionThreadIdRef,
				setAttachedRunStatus,
			});
			await openNewChat();
		}
	} catch (error) {
		deletedThreadIdsRef.current.delete(threadId);
		void refreshThreads();
		setInputError(toUserErrorMessage(error));
	}
}

export async function deleteAllRovoAppThreadsWithLifecycle({
	clearPendingTitleGeneration,
	clearQueuedActionsForThread,
	deletedThreadIdsRef,
	deleteAllThreads,
	openNewChat,
	refreshThreads,
	runSubscriptionAbortControllerRef,
	runSubscriptionThreadIdRef,
	setAttachedRunStatus,
	setInputError,
	setThreads,
	threadsRef,
	toUserErrorMessage,
}: DeleteAllRovoAppThreadsWithLifecycleInput): Promise<void> {
	clearPendingTitleGeneration();
	const previousThreadIds = threadsRef.current.map((thread) => thread.id);
	for (const threadId of previousThreadIds) {
		deletedThreadIdsRef.current.add(threadId);
		clearQueuedActionsForThread(threadId);
	}
	setThreads([]);

	try {
		await deleteAllThreads();
		resetRovoAppRunSubscription({
			runSubscriptionAbortControllerRef,
			runSubscriptionThreadIdRef,
			setAttachedRunStatus,
		});
		await openNewChat();
	} catch (error) {
		for (const threadId of previousThreadIds) {
			deletedThreadIdsRef.current.delete(threadId);
		}
		void refreshThreads();
		setInputError(toUserErrorMessage(error));
	}
}
