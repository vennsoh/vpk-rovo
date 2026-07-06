export const ROVO_APP_PASSIVE_THREAD_REFRESH_INTERVAL_MS = 15_000;

interface PassiveThreadRefreshWindow {
	addEventListener: (type: "focus", listener: () => void) => void;
	clearInterval: (intervalId: ReturnType<typeof window.setInterval>) => void;
	removeEventListener: (type: "focus", listener: () => void) => void;
	setInterval: (listener: () => void, delayMs: number) => ReturnType<typeof window.setInterval>;
}

interface PassiveThreadRefreshDocument {
	addEventListener: (type: "visibilitychange", listener: () => void) => void;
	removeEventListener: (type: "visibilitychange", listener: () => void) => void;
	visibilityState: Document["visibilityState"];
}

export function startRovoAppPassiveThreadRefresh({
	documentRef,
	intervalMs = ROVO_APP_PASSIVE_THREAD_REFRESH_INTERVAL_MS,
	refreshThreads,
	windowRef,
}: {
	documentRef: PassiveThreadRefreshDocument;
	intervalMs?: number;
	refreshThreads: (options: { reportBackendUnavailable: false }) => void | Promise<void>;
	windowRef: PassiveThreadRefreshWindow;
}): () => void {
	const refresh = () => {
		void refreshThreads({ reportBackendUnavailable: false });
	};
	const refreshWhenVisible = () => {
		if (documentRef.visibilityState === "visible") {
			refresh();
		}
	};
	const intervalId = windowRef.setInterval(refreshWhenVisible, intervalMs);

	windowRef.addEventListener("focus", refresh);
	documentRef.addEventListener("visibilitychange", refreshWhenVisible);

	return () => {
		windowRef.clearInterval(intervalId);
		windowRef.removeEventListener("focus", refresh);
		documentRef.removeEventListener("visibilitychange", refreshWhenVisible);
	};
}
