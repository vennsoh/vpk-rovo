"use client";

import type { ChatStatus } from "ai";
import {
	useCallback,
	useRef,
	useState,
	type Dispatch,
	type MutableRefObject,
	type SetStateAction,
} from "react";
import { useLatestRef } from "@/lib/use-latest-ref";
import {
	type RovoAppDirectDelegationPhase,
} from "@/components/projects/shared/lib/rovo-app-composer-submit-state";
import {
	type RovoAppPlanningSession,
} from "@/components/projects/rovo-core/lib/rovo-app-hook-helpers";

interface UseRovoAppModeStateActionsResult {
	backgroundDelegationMessageId: string | null;
	clearDirectDelegationState: () => void;
	delegationTurnStatus: ChatStatus;
	directDelegationPhase: RovoAppDirectDelegationPhase;
	isPlanMode: boolean;
	isPlanModeRef: MutableRefObject<boolean>;
	isVoiceMode: boolean;
	isVoiceModeRef: MutableRefObject<boolean>;
	planModeSyncRequestIdRef: MutableRefObject<number>;
	planningSession: RovoAppPlanningSession | null;
	resetPlanMode: () => void;
	setBackgroundDelegationMessageId: Dispatch<SetStateAction<string | null>>;
	setDelegationTurnStatus: Dispatch<SetStateAction<ChatStatus>>;
	setDirectDelegationPhase: Dispatch<SetStateAction<RovoAppDirectDelegationPhase>>;
	setPlanningSession: Dispatch<SetStateAction<RovoAppPlanningSession | null>>;
	setVoiceMode: (next: boolean) => void;
	togglePlanMode: () => void;
	toggleVoiceMode: () => void;
}

export function useRovoAppModeStateActions(): UseRovoAppModeStateActionsResult {
	const [isVoiceMode, setIsVoiceMode] = useState(false);
	const [delegationTurnStatus, setDelegationTurnStatus] =
		useState<ChatStatus>("ready");
	const [directDelegationPhase, setDirectDelegationPhase] =
		useState<RovoAppDirectDelegationPhase>("idle");
	const [backgroundDelegationMessageId, setBackgroundDelegationMessageId] =
		useState<string | null>(null);
	const [isPlanMode, setIsPlanMode] = useState(false);
	const [planningSession, setPlanningSession] = useState<RovoAppPlanningSession | null>(null);
	const planModeSyncRequestIdRef = useRef(0);
	const isVoiceModeRef = useLatestRef(isVoiceMode);
	const isPlanModeRef = useLatestRef(isPlanMode);

	const clearDirectDelegationState = useCallback(() => {
		setBackgroundDelegationMessageId(null);
		setDelegationTurnStatus("ready");
		setDirectDelegationPhase("idle");
	}, []);

	const toggleVoiceMode = useCallback(() => setIsVoiceMode((prev) => !prev), []);
	const setVoiceMode = useCallback((next: boolean) => setIsVoiceMode(next), []);
	const togglePlanMode = useCallback(() => {
		setIsPlanMode((previousMode) => !previousMode);
	}, []);
	const resetPlanMode = useCallback(() => {
		setIsPlanMode(false);
	}, []);

	return {
		backgroundDelegationMessageId,
		clearDirectDelegationState,
		delegationTurnStatus,
		directDelegationPhase,
		isPlanMode,
		isPlanModeRef,
		isVoiceMode,
		isVoiceModeRef,
		planModeSyncRequestIdRef,
		planningSession,
		resetPlanMode,
		setBackgroundDelegationMessageId,
		setDelegationTurnStatus,
		setDirectDelegationPhase,
		setPlanningSession,
		setVoiceMode,
		togglePlanMode,
		toggleVoiceMode,
	};
}
