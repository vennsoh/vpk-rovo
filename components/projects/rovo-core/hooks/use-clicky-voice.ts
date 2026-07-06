"use client";

import { useEffect, useRef } from "react";

export type ClickyVoiceContextType =
	| "initial_context"
	| "thread_context"
	| "artifact_complete"
	| "thread_message"
	| "artifact_annotations"
	| "artifact_context"
	| "delegation_error";

export interface ClickyVoiceContextData {
	type: ClickyVoiceContextType;
	content: string;
}

export interface UseClickyVoiceCoreOptions {
	/** Whether the Clicky cursor companion is active. */
	isClickyActive: boolean;
	/** Whether the Realtime WebSocket is connected. */
	isRealtimeConnected: boolean;
	/** Connect to the Realtime voice session. */
	connectRealtime: () => void;
	/** Inject context into the Realtime session. */
	injectContext: (data: ClickyVoiceContextData) => void;
	/** Build the initial prompt when the Realtime session is ready. */
	getInitialContextContent: () => string;
}

/**
 * Bridges Clicky activation with the Realtime voice session.
 *
 * Route wrappers own the actual prompt text and product knowledge. The shared
 * core only owns activation, connection, and one-time initial context injection.
 */
export function useClickyVoiceCore({
	isClickyActive,
	isRealtimeConnected,
	connectRealtime,
	injectContext,
	getInitialContextContent,
}: UseClickyVoiceCoreOptions) {
	const wasActiveRef = useRef(false);
	const hasInjectedPromptRef = useRef(false);
	const connectedForClickyRef = useRef(false);

	useEffect(() => {
		if (isClickyActive && !wasActiveRef.current) {
			wasActiveRef.current = true;
			hasInjectedPromptRef.current = false;
			if (!isRealtimeConnected) {
				connectedForClickyRef.current = true;
				connectRealtime();
			} else {
				connectedForClickyRef.current = false;
			}
		} else if (!isClickyActive && wasActiveRef.current) {
			wasActiveRef.current = false;
			hasInjectedPromptRef.current = false;
			connectedForClickyRef.current = false;
		}
	}, [isClickyActive, isRealtimeConnected, connectRealtime]);

	useEffect(() => {
		if (
			isClickyActive &&
			isRealtimeConnected &&
			!hasInjectedPromptRef.current
		) {
			injectContext({
				type: "initial_context",
				content: getInitialContextContent(),
			});
			hasInjectedPromptRef.current = true;
		}
	}, [isClickyActive, isRealtimeConnected, injectContext, getInitialContextContent]);
}
