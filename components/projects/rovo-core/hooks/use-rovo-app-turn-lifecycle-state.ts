"use client";

import {
	useCallback,
	useRef,
	useState,
	type MutableRefObject,
} from "react";

interface UseRovoAppTurnLifecycleStateResult {
	beginThreadHydration: () => void;
	completeThreadHydration: () => void;
	hasObservedTurnComplete: boolean;
	hasObservedTurnCompleteRef: MutableRefObject<boolean>;
	isHydratingThreadRef: MutableRefObject<boolean>;
	markObservedTurnComplete: () => void;
	resetObservedTurnComplete: () => void;
	threadHydrationVersion: number;
}

export function useRovoAppTurnLifecycleState(): UseRovoAppTurnLifecycleStateResult {
	const [hasObservedTurnComplete, setHasObservedTurnComplete] = useState(false);
	const [threadHydrationVersion, setThreadHydrationVersion] = useState(0);
	const hasObservedTurnCompleteRef = useRef(false);
	const isHydratingThreadRef = useRef(false);

	const resetObservedTurnComplete = useCallback(() => {
		hasObservedTurnCompleteRef.current = false;
		setHasObservedTurnComplete(false);
	}, []);

	const markObservedTurnComplete = useCallback(() => {
		hasObservedTurnCompleteRef.current = true;
		setHasObservedTurnComplete(true);
	}, []);

	const beginThreadHydration = useCallback(() => {
		isHydratingThreadRef.current = true;
	}, []);

	const completeThreadHydration = useCallback(() => {
		isHydratingThreadRef.current = false;
		setThreadHydrationVersion((currentVersion) => currentVersion + 1);
	}, []);

	return {
		beginThreadHydration,
		completeThreadHydration,
		hasObservedTurnComplete,
		hasObservedTurnCompleteRef,
		isHydratingThreadRef,
		markObservedTurnComplete,
		resetObservedTurnComplete,
		threadHydrationVersion,
	};
}
