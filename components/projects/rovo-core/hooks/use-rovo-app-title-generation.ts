"use client";

import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type MutableRefObject,
} from "react";
import {
	isRovoAppThreadNotFoundError,
	shouldPersistResolvedRovoAppTitle,
} from "@/components/projects/rovo-core/lib/rovo-app-thread-persistence";
import { updateRovoAppThreadTitleRecord } from "@/components/projects/rovo-core/lib/rovo-app-thread-state";
import { runRovoAppTitleGenerationLifecycle } from "@/components/projects/rovo-core/lib/rovo-app-title-lifecycle";
import type { RovoAppThread } from "@/lib/rovo-app-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import { trimTitleText } from "@/lib/utils";

type SetThreads = (value: RovoAppThread[] | ((previousThreads: RovoAppThread[]) => RovoAppThread[])) => void;

export interface UseRovoAppTitleGenerationOptions {
	deletedThreadIdsRef: MutableRefObject<Set<string>>;
	fetchTitle: (message: string) => Promise<string | null>;
	messages: ReadonlyArray<RovoUIMessage>;
	setThreads: SetThreads;
	threadsRef: MutableRefObject<ReadonlyArray<RovoAppThread>>;
	updateThread: (threadId: string, input: { title: string }) => Promise<unknown>;
}

export interface UseRovoAppTitleGenerationResult {
	clearPendingTitleGeneration: (threadId?: string | null) => void;
	isGeneratingTitle: boolean;
	pendingTitleMessageRef: MutableRefObject<string | null>;
	pendingTitleThreadId: string | null;
	pendingTitleThreadIdRef: MutableRefObject<string | null>;
	setIsGeneratingTitle: (isGenerating: boolean) => void;
	setPendingTitleThreadId: (threadId: string | null) => void;
}

export function useRovoAppTitleGeneration({
	deletedThreadIdsRef,
	fetchTitle,
	messages,
	setThreads,
	threadsRef,
	updateThread,
}: UseRovoAppTitleGenerationOptions): UseRovoAppTitleGenerationResult {
	const [isGeneratingTitle, setIsGeneratingTitleState] = useState(false);
	const [pendingTitleThreadId, setPendingTitleThreadIdState] = useState<string | null>(null);
	const pendingTitleThreadIdRef = useRef<string | null>(null);
	const pendingTitleMessageRef = useRef<string | null>(null);
	const setIsGeneratingTitle = useCallback((isGenerating: boolean) => {
		setIsGeneratingTitleState(isGenerating);
	}, []);
	const setPendingTitleThreadId = useCallback((threadId: string | null) => {
		setPendingTitleThreadIdState(threadId);
	}, []);
	const clearPendingTitleGeneration = useCallback((threadId?: string | null) => {
		if (
			threadId
			&& pendingTitleThreadIdRef.current !== null
			&& pendingTitleThreadIdRef.current !== threadId
		) {
			return;
		}

		pendingTitleThreadIdRef.current = null;
		pendingTitleMessageRef.current = null;
		setPendingTitleThreadIdState(null);
		setIsGeneratingTitleState(false);
	}, []);
	const resolveChatTitle = useCallback(
		(threadId: string, title: string) => {
			const normalizedTitle = trimTitleText(title);
			if (!normalizedTitle) {
				clearPendingTitleGeneration(threadId);
				return;
			}

			if (!shouldPersistResolvedRovoAppTitle({
				deletedThreadIds: deletedThreadIdsRef.current,
				threadId,
				threads: threadsRef.current,
			})) {
				clearPendingTitleGeneration(threadId);
				return;
			}

			const updatedAt = new Date().toISOString();
			setThreads((previousThreads) =>
				updateRovoAppThreadTitleRecord(
					previousThreads,
					{
						threadId,
						title: normalizedTitle,
						updatedAt,
					},
					{ deletedThreadIds: deletedThreadIdsRef.current },
				).threads,
			);

			void updateThread(threadId, { title: normalizedTitle }).catch((error) => {
				if (isRovoAppThreadNotFoundError(error)) {
					deletedThreadIdsRef.current.add(threadId);
					setThreads((previousThreads) =>
						previousThreads.filter((thread) => thread.id !== threadId),
					);
					return;
				}

				console.warn("[RovoApp] Failed to persist generated chat title:", error);
			});
			clearPendingTitleGeneration(threadId);
		},
		[
			clearPendingTitleGeneration,
			deletedThreadIdsRef,
			setThreads,
			threadsRef,
			updateThread,
		],
	);

	useEffect(() => {
		void runRovoAppTitleGenerationLifecycle({
			clearPendingTitleGeneration,
			fetchTitle,
			messages,
			pendingTitleMessageRef,
			pendingTitleThreadId,
			pendingTitleThreadIdRef,
			resolveChatTitle,
		});
	}, [
		clearPendingTitleGeneration,
		fetchTitle,
		messages,
		pendingTitleThreadId,
		resolveChatTitle,
	]);

	return {
		clearPendingTitleGeneration,
		isGeneratingTitle,
		pendingTitleMessageRef,
		pendingTitleThreadId,
		pendingTitleThreadIdRef,
		setIsGeneratingTitle,
		setPendingTitleThreadId,
	};
}
