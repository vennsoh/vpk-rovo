"use client";

import {
	useCallback,
	type Dispatch,
	type MutableRefObject,
	type SetStateAction,
} from "react";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

interface RovoAppRealtimeStateActionOptions {
	incrementVersion?: boolean;
}

type RovoAppRealtimeMessagesUpdater = (currentMessages: RovoUIMessage[]) => RovoUIMessage[];

interface UseRovoAppRealtimeStateActionsOptions {
	realtimeMessagesRef: MutableRefObject<RovoUIMessage[]>;
	realtimeMessagesVersionRef: MutableRefObject<number>;
	setRealtimeMessages: Dispatch<SetStateAction<RovoUIMessage[]>>;
}

interface UseRovoAppRealtimeStateActionsResult {
	mutateRealtimeMessagesState: (
		updater: RovoAppRealtimeMessagesUpdater,
		options?: RovoAppRealtimeStateActionOptions,
	) => RovoUIMessage[];
	replaceRealtimeMessagesState: (
		nextMessages: RovoUIMessage[],
		options?: RovoAppRealtimeStateActionOptions,
	) => RovoUIMessage[];
}

export function useRovoAppRealtimeStateActions({
	realtimeMessagesRef,
	realtimeMessagesVersionRef,
	setRealtimeMessages,
}: UseRovoAppRealtimeStateActionsOptions): UseRovoAppRealtimeStateActionsResult {
	const replaceRealtimeMessagesState = useCallback(
		(
			nextMessages: RovoUIMessage[],
			{
				incrementVersion = true,
			}: RovoAppRealtimeStateActionOptions = {},
		): RovoUIMessage[] => {
			realtimeMessagesRef.current = nextMessages;
			if (incrementVersion) {
				realtimeMessagesVersionRef.current += 1;
			}
			setRealtimeMessages(nextMessages);
			return nextMessages;
		},
		[realtimeMessagesRef, realtimeMessagesVersionRef, setRealtimeMessages],
	);

	const mutateRealtimeMessagesState = useCallback(
		(
			updater: RovoAppRealtimeMessagesUpdater,
			{
				incrementVersion = true,
			}: RovoAppRealtimeStateActionOptions = {},
		): RovoUIMessage[] => {
			return replaceRealtimeMessagesState(
				updater(realtimeMessagesRef.current),
				{ incrementVersion },
			);
		},
		[realtimeMessagesRef, replaceRealtimeMessagesState],
	);

	return {
		mutateRealtimeMessagesState,
		replaceRealtimeMessagesState,
	};
}
