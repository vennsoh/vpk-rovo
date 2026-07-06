"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RovoAppThread } from "@/lib/rovo-app-types";
import {
	deleteRovoAppThread,
	listRovoAppThreads,
} from "@/components/projects/rovo-core/lib/api";

function serializeRovoAppThreads(threads: ReadonlyArray<RovoAppThread>): string {
	return JSON.stringify(threads);
}

export interface UseRovoAppThreadListOptions {
	dedupeRefreshResults?: boolean;
	passiveRefreshIntervalMs?: number | null;
}

export interface UseRovoAppThreadListResult {
	deleteThread: (threadId: string) => Promise<void>;
	refreshThreads: () => Promise<void>;
	threads: RovoAppThread[];
	threadsLoaded: boolean;
}

export function useRovoAppThreadListCore(
	options: UseRovoAppThreadListOptions = {},
): UseRovoAppThreadListResult {
	const { dedupeRefreshResults = false, passiveRefreshIntervalMs = null } = options;
	const [threads, setThreads] = useState<RovoAppThread[]>([]);
	const [threadsLoaded, setThreadsLoaded] = useState(false);
	const mountedRef = useRef(true);
	const lastSerializedRef = useRef<string>("");

	const refreshThreads = useCallback(async () => {
		try {
			const result = await listRovoAppThreads();
			if (mountedRef.current) {
				if (dedupeRefreshResults) {
					const nextSerialized = serializeRovoAppThreads(result);
					if (nextSerialized !== lastSerializedRef.current) {
						lastSerializedRef.current = nextSerialized;
						setThreads(result);
					}
				} else {
					setThreads(result);
				}
				setThreadsLoaded(true);
			}
		} catch {
			if (mountedRef.current) {
				setThreadsLoaded(true);
			}
		}
	}, [dedupeRefreshResults]);

	useEffect(() => {
		mountedRef.current = true;
		const initialRefreshId = window.setTimeout(() => {
			void refreshThreads();
		}, 0);

		const handleFocus = () => {
			void refreshThreads();
		};
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				void refreshThreads();
			}
		};
		const intervalId =
			passiveRefreshIntervalMs !== null
				? window.setInterval(() => {
						if (document.visibilityState === "visible") {
							void refreshThreads();
						}
					}, passiveRefreshIntervalMs)
				: null;

		window.addEventListener("focus", handleFocus);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			mountedRef.current = false;
			window.clearTimeout(initialRefreshId);
			if (intervalId !== null) {
				window.clearInterval(intervalId);
			}
			window.removeEventListener("focus", handleFocus);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [passiveRefreshIntervalMs, refreshThreads]);

	const deleteThread = useCallback(async (threadId: string) => {
		setThreads((prev) => {
			const nextThreads = prev.filter((thread) => thread.id !== threadId);
			if (dedupeRefreshResults) {
				lastSerializedRef.current = serializeRovoAppThreads(nextThreads);
			}
			return nextThreads;
		});
		try {
			await deleteRovoAppThread(threadId);
		} catch {
			// Optimistic removal — don't restore on failure
		}
	}, [dedupeRefreshResults]);

	return { deleteThread, refreshThreads, threads, threadsLoaded };
}
