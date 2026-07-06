import type { ChatStatus } from "ai";
import type {
	RovoAppQueuedAction,
	RovoAppRunStatus,
} from "@/lib/rovo-app-types";
import {
	canDispatchRovoAppQueuedAction,
	isRovoAppThreadBusy,
} from "@/components/projects/rovo-core/lib/rovo-app-queue-gate";
import { isRovoAppSendSettledTimeoutError } from "@/components/projects/rovo-core/lib/rovo-app-send-guard";

export type RovoAppQueuedActionsByThreadId = Record<
	string,
	RovoAppQueuedAction[]
>;

type RovoAppQueueProcessorRef<T> = {
	current: T;
};

export interface ProcessRovoAppQueuedActionsOptions {
	activeThreadIdRef: RovoAppQueueProcessorRef<string | null>;
	attachedRunStatusRef: RovoAppQueueProcessorRef<RovoAppRunStatus | null>;
	dispatchQueuedActionNow: (action: RovoAppQueuedAction) => Promise<void>;
	getHasPendingClarification: () => boolean;
	getHasPendingPlanApproval: () => boolean;
	logError?: (message: string, error: unknown) => void;
	peekNextQueuedActionForThread: (
		threadId: string,
	) => RovoAppQueuedAction | null;
	prependQueuedAction: (action: RovoAppQueuedAction) => void;
	processQueueRef: RovoAppQueueProcessorRef<() => Promise<void>>;
	queueProcessorRunningRef: RovoAppQueueProcessorRef<boolean>;
	retryDelayMs?: number;
	scheduleRetry?: (callback: () => void, delayMs: number) => void;
	setHasActiveDispatch: (hasActiveDispatch: boolean) => void;
	setInputError: (message: string | null) => void;
	shiftNextQueuedActionForThread: (
		threadId: string,
	) => RovoAppQueuedAction | null;
	shouldPauseProcessing?: () => boolean;
	statusRef: RovoAppQueueProcessorRef<ChatStatus>;
	toUserErrorMessage: (error: unknown) => string;
	waitForRovoApp: (ms: number) => Promise<void>;
}

function scheduleRovoAppQueueRetry(callback: () => void, delayMs: number): void {
	globalThis.setTimeout(callback, delayMs);
}

export async function processRovoAppQueuedActions({
	activeThreadIdRef,
	attachedRunStatusRef,
	dispatchQueuedActionNow,
	getHasPendingClarification,
	getHasPendingPlanApproval,
	logError = console.error,
	peekNextQueuedActionForThread,
	prependQueuedAction,
	processQueueRef,
	queueProcessorRunningRef,
	retryDelayMs = 250,
	scheduleRetry = scheduleRovoAppQueueRetry,
	setHasActiveDispatch,
	setInputError,
	shiftNextQueuedActionForThread,
	shouldPauseProcessing,
	statusRef,
	toUserErrorMessage,
	waitForRovoApp,
}: ProcessRovoAppQueuedActionsOptions): Promise<void> {
	if (queueProcessorRunningRef.current) {
		return;
	}

	queueProcessorRunningRef.current = true;
	let dispatched = false;

	try {
		while (queueProcessorRunningRef.current) {
			while (
				queueProcessorRunningRef.current &&
				isRovoAppThreadBusy({
					activeRunStatus: null,
					attachedRunStatus: attachedRunStatusRef.current,
					status: statusRef.current,
				})
			) {
				await waitForRovoApp(50);
			}

			if (!queueProcessorRunningRef.current) {
				break;
			}

			if (shouldPauseProcessing?.()) {
				break;
			}

			const threadId = activeThreadIdRef.current;
			if (!threadId) {
				break;
			}

			const nextQueuedAction = peekNextQueuedActionForThread(threadId);
			if (!nextQueuedAction) {
				break;
			}

			if (
				!canDispatchRovoAppQueuedAction({
					action: nextQueuedAction,
					hasPendingClarification: getHasPendingClarification(),
					hasPendingPlanApproval: getHasPendingPlanApproval(),
				})
			) {
				break;
			}

			const nextAction = shiftNextQueuedActionForThread(threadId);
			if (!nextAction) {
				break;
			}

			if (!queueProcessorRunningRef.current) {
				prependQueuedAction(nextAction);
				break;
			}

			if (!dispatched) {
				dispatched = true;
				setHasActiveDispatch(true);
			}

			try {
				await dispatchQueuedActionNow(nextAction);
			} catch (error) {
				prependQueuedAction(nextAction);
				if (isRovoAppSendSettledTimeoutError(error)) {
					scheduleRetry(() => {
						void processQueueRef.current();
					}, retryDelayMs);
				} else {
					logError("[RovoApp] Failed to dispatch queued action:", error);
					setInputError(toUserErrorMessage(error));
				}
				break;
			}
		}
	} finally {
		queueProcessorRunningRef.current = false;
		if (dispatched) {
			setHasActiveDispatch(false);
		}
	}
}

export function appendRovoAppQueuedActions(
	state: Readonly<RovoAppQueuedActionsByThreadId>,
	threadId: string,
	nextActions: ReadonlyArray<RovoAppQueuedAction>,
): RovoAppQueuedActionsByThreadId {
	if (!threadId || nextActions.length === 0) {
		return { ...state };
	}

	return {
		...state,
		[threadId]: [...(state[threadId] ?? []), ...nextActions],
	};
}

export function prependRovoAppQueuedAction(
	state: Readonly<RovoAppQueuedActionsByThreadId>,
	threadId: string,
	action: RovoAppQueuedAction,
): RovoAppQueuedActionsByThreadId {
	if (!threadId) {
		return { ...state };
	}

	return {
		...state,
		[threadId]: [action, ...(state[threadId] ?? [])],
	};
}

export function removeRovoAppQueuedAction(
	state: Readonly<RovoAppQueuedActionsByThreadId>,
	threadId: string,
	actionId: string,
): RovoAppQueuedActionsByThreadId {
	if (!threadId || !actionId) {
		return { ...state };
	}

	const existingActions = state[threadId] ?? [];
	const nextActions = existingActions.filter((action) => action.id !== actionId);
	if (nextActions.length === existingActions.length) {
		return { ...state };
	}

	if (nextActions.length === 0) {
		const nextState = { ...state };
		delete nextState[threadId];
		return nextState;
	}

	return {
		...state,
		[threadId]: nextActions,
	};
}

export function clearRovoAppQueuedActions(
	state: Readonly<RovoAppQueuedActionsByThreadId>,
	threadId: string,
): RovoAppQueuedActionsByThreadId {
	if (!threadId || !(threadId in state)) {
		return { ...state };
	}

	const nextState = { ...state };
	delete nextState[threadId];
	return nextState;
}

export function peekRovoAppQueuedAction(
	state: Readonly<RovoAppQueuedActionsByThreadId>,
	threadId: string,
): RovoAppQueuedAction | null {
	return state[threadId]?.[0] ?? null;
}

export function shiftRovoAppQueuedAction(
	state: Readonly<RovoAppQueuedActionsByThreadId>,
	threadId: string,
): {
	action: RovoAppQueuedAction | null;
	state: RovoAppQueuedActionsByThreadId;
} {
	const existingActions = state[threadId] ?? [];
	const nextAction = existingActions[0] ?? null;
	if (!nextAction) {
		return {
			action: null,
			state: { ...state },
		};
	}

	if (existingActions.length === 1) {
		const nextState = { ...state };
		delete nextState[threadId];
		return {
			action: nextAction,
			state: nextState,
		};
	}

	return {
		action: nextAction,
		state: {
			...state,
			[threadId]: existingActions.slice(1),
		},
	};
}
