import type { ChatStatus } from "ai";
import type { RovoAppThread } from "@/lib/rovo-app-types";
import { filterDeletedRovoAppThreads } from "@/components/projects/rovo-core/lib/rovo-app-thread-state";

export interface RovoAppBackgroundStreamSummary {
	threadId: string;
}

export interface RunRovoAppBackgroundRefreshPollInput {
	getActiveThreadId: () => string | null;
	getDeletedThreadIds: () => ReadonlySet<string>;
	getStatus: () => ChatStatus;
	hydrateThreadById: (threadId: string) => Promise<unknown>;
	isCancelled?: () => boolean;
	listBackgroundStreams: () => Promise<ReadonlyArray<RovoAppBackgroundStreamSummary>>;
	listThreads: () => Promise<ReadonlyArray<RovoAppThread>>;
	reconcileThread: (thread: RovoAppThread) => RovoAppThread;
	setThreads: (updater: (previousThreads: RovoAppThread[]) => RovoAppThread[]) => void;
	trackedThreadIds: ReadonlyArray<string>;
}

export function getRovoAppBackgroundRefreshThreadIds({
	activeThreadId,
	threads,
}: Readonly<{
	activeThreadId: string | null;
	threads: ReadonlyArray<Pick<RovoAppThread, "activeRun" | "id">>;
}>): string[] {
	return threads
		.filter((thread) => thread.activeRun != null && thread.id !== activeThreadId)
		.map((thread) => thread.id)
		.sort();
}

export function shouldHydrateCompletedActiveBackgroundThread({
	activeStreamThreadIds,
	activeThreadId,
	status,
	threadId,
}: Readonly<{
	activeStreamThreadIds: ReadonlySet<string>;
	activeThreadId: string | null;
	status: ChatStatus;
	threadId: string;
}>): boolean {
	if (threadId !== activeThreadId) {
		return false;
	}

	if (activeStreamThreadIds.has(threadId)) {
		return false;
	}

	return status !== "submitted" && status !== "streaming";
}

export function resolveRovoAppBackgroundRefreshThreads(
	previousThreads: RovoAppThread[],
	nextThreads: RovoAppThread[],
): RovoAppThread[] {
	if (
		previousThreads.length === nextThreads.length
		&& previousThreads.every(
			(thread, index) =>
				thread.id === nextThreads[index].id
				&& thread.updatedAt === nextThreads[index].updatedAt,
		)
	) {
		return previousThreads;
	}

	return nextThreads;
}

export async function runRovoAppBackgroundRefreshPoll({
	getActiveThreadId,
	getDeletedThreadIds,
	getStatus,
	hydrateThreadById,
	isCancelled = () => false,
	listBackgroundStreams,
	listThreads,
	reconcileThread,
	setThreads,
	trackedThreadIds,
}: RunRovoAppBackgroundRefreshPollInput): Promise<void> {
	if (isCancelled()) {
		return;
	}

	try {
		const streams = await listBackgroundStreams();
		if (isCancelled()) {
			return;
		}

		const activeStreamThreadIds = new Set(
			streams.map((stream) => stream.threadId),
		);
		const nextThreads = filterDeletedRovoAppThreads(
			(await listThreads()).map((thread) => reconcileThread(thread)),
			getDeletedThreadIds(),
		);
		if (isCancelled()) {
			return;
		}

		setThreads((previousThreads) =>
			resolveRovoAppBackgroundRefreshThreads(previousThreads, nextThreads),
		);

		for (const threadId of trackedThreadIds) {
			if (shouldHydrateCompletedActiveBackgroundThread({
				activeStreamThreadIds,
				activeThreadId: getActiveThreadId(),
				status: getStatus(),
				threadId,
			})) {
				await hydrateThreadById(threadId);
			}
		}
	} catch {
		// Polling failure is non-critical.
	}
}
