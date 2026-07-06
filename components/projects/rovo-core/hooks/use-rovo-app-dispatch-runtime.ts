"use client";

import {
	useCallback,
	useMemo,
	useRef,
	type MutableRefObject,
} from "react";
import {
	createRovoAppImmediateDispatchLifecycle,
	type RovoAppImmediateDispatchLifecycle,
} from "@/components/projects/rovo-core/lib/rovo-app-dispatch-lifecycle";
import type { RovoMessageInterruptionSource } from "@/lib/rovo-ui-messages";

interface UseRovoAppDispatchRuntimeResult {
	immediateDispatchInProgressRef: MutableRefObject<boolean>;
	immediateDispatchLifecycle: RovoAppImmediateDispatchLifecycle;
	interruptActiveTurnRef: MutableRefObject<(options?: {
		source: RovoMessageInterruptionSource;
	}) => Promise<void>>;
	kickQueue: () => void;
	processQueueRef: MutableRefObject<() => Promise<void>>;
	queueProcessorRunningRef: MutableRefObject<boolean>;
}

export function useRovoAppDispatchRuntime(): UseRovoAppDispatchRuntimeResult {
	const queueProcessorRunningRef = useRef(false);
	const immediateDispatchInProgressRef = useRef(false);
	const processQueueRef = useRef<() => Promise<void>>(async () => {});
	const interruptActiveTurnRef = useRef<(options?: {
		source: RovoMessageInterruptionSource;
	}) => Promise<void>>(async () => {});
	const immediateDispatchLifecycle = useMemo(
		() =>
			createRovoAppImmediateDispatchLifecycle({
				immediateDispatchInProgressRef,
				interruptActiveTurnRef,
				queueProcessorRunningRef,
			}),
		[],
	);
	const kickQueue = useCallback(() => {
		void processQueueRef.current();
	}, []);

	return {
		immediateDispatchInProgressRef,
		immediateDispatchLifecycle,
		interruptActiveTurnRef,
		kickQueue,
		processQueueRef,
		queueProcessorRunningRef,
	};
}
