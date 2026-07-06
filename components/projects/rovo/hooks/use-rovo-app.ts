"use client";

import { useCallback } from "react";
import { useRovoAppQueue } from "@/app/rovo/rovo-queue-provider";
import { rovoAppAdapter } from "@/components/projects/rovo/rovo-app-adapter";
import {
	useRovoAppCore,
	type RovoAppHookOptions,
	type RovoAppHookResult,
} from "@/components/projects/rovo-core/hooks/use-rovo-app-core";
import type { RovoAppSendModeSetter } from "@/components/projects/rovo-core/lib/rovo-app-hook-helpers";

export type { RovoAppHookOptions, RovoAppHookResult };

const ROVO_CLARIFICATION_BEHAVIOR = {
	dismissUsesPlanMode: false,
	includeDeferredToolPlanMode: true,
	rollbackFailedSend: false,
} as const;

export function useRovoApp(options: Readonly<RovoAppHookOptions>): RovoAppHookResult {
	const queue = useRovoAppQueue();
	const setSendMode = useCallback<RovoAppSendModeSetter>(() => {}, []);

	return useRovoAppCore({
		...options,
		clarificationBehavior: ROVO_CLARIFICATION_BEHAVIOR,
		queue,
		routeAdapter: rovoAppAdapter,
		sendMode: "queue",
		setSendMode,
	});
}
