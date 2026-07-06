"use client";

import { useCallback, useState } from "react";
import type { StudioSessionAgentEntry } from "@/app/contexts";
import { ROVO_APP_ROOT_PATH } from "@/components/projects/studio/lib/rovo-app-thread-route-sync";
import {
	toPersistedRecord,
	writeSessionAgentRecords,
} from "@/components/projects/rovo-core/lib/agent-records/session-agent-storage";

const STUDIO_RFP_DEMO_RESET_ENDPOINT = "/api/agents/rfp-demo/reset";

interface StudioDemoThreadStore {
	deleteAllThreads: () => Promise<void>;
}

interface StudioDemoAgentRegistry {
	deleteAllThreads: () => Promise<void>;
	resetAgentToRovo: (options?: { preserveCurrentThread?: boolean }) => void;
}

interface UseStudioDemoResetOptions {
	chat: StudioDemoThreadStore;
	embedded: boolean;
	onResetLocalState: () => void;
	resetSessionAgentsToStudioRfpDemoAgent: () => StudioSessionAgentEntry | null;
	studioAgentRegistry: StudioDemoAgentRegistry;
}

async function resetStudioRfpDemoBackendState(): Promise<void> {
	const response = await fetch(STUDIO_RFP_DEMO_RESET_ENDPOINT, {
		body: "{}",
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});

	if (response.ok) {
		return;
	}

	let message = `Request failed with status ${response.status}`;
	try {
		const payload = await response.json() as { details?: unknown; error?: unknown };
		if (typeof payload.error === "string" && payload.error.trim()) {
			message = payload.error.trim();
		} else if (typeof payload.details === "string" && payload.details.trim()) {
			message = payload.details.trim();
		}
	} catch {
		const text = await response.text().catch(() => "");
		if (text.trim()) {
			message = text.trim();
		}
	}

	throw new Error(message);
}

export function useStudioDemoReset({
	chat,
	embedded,
	onResetLocalState,
	resetSessionAgentsToStudioRfpDemoAgent,
	studioAgentRegistry,
}: UseStudioDemoResetOptions): {
	isResettingStudioDemo: boolean;
	resetStudioDemo: () => void;
} {
	const [isResettingStudioDemo, setIsResettingStudioDemo] = useState(false);

	const resetStudioDemo = useCallback(() => {
		if (isResettingStudioDemo) {
			return;
		}

		setIsResettingStudioDemo(true);
		void (async () => {
			try {
				await resetStudioRfpDemoBackendState();
				await chat.deleteAllThreads();
				await studioAgentRegistry.deleteAllThreads();
				onResetLocalState();
				studioAgentRegistry.resetAgentToRovo({ preserveCurrentThread: true });
				const seededEntry = resetSessionAgentsToStudioRfpDemoAgent();
				if (seededEntry) {
					writeSessionAgentRecords([toPersistedRecord(seededEntry)]);
				}
				if (!embedded && typeof window !== "undefined") {
					window.history.pushState(null, "", ROVO_APP_ROOT_PATH);
				}
			} catch (error) {
				console.error("[Studio] Failed to reset demo state:", error);
			} finally {
				setIsResettingStudioDemo(false);
			}
		})();
	}, [
		chat,
		embedded,
		isResettingStudioDemo,
		onResetLocalState,
		resetSessionAgentsToStudioRfpDemoAgent,
		studioAgentRegistry,
	]);

	return { isResettingStudioDemo, resetStudioDemo };
}
