"use client";

import {
	DEFAULT_CLICKY_SYSTEM_INSTRUCTIONS as CLICKY_SYSTEM_INSTRUCTIONS,
	getDefaultClickyInitialContextContent,
	useDefaultClickyVoice,
	type UseDefaultClickyVoiceOptions,
} from "@/components/projects/rovo-core/hooks/use-default-clicky-voice";

export { CLICKY_SYSTEM_INSTRUCTIONS };
export type UseClickyVoiceOptions = UseDefaultClickyVoiceOptions;

/**
 * Bridges the AI cursor activation state with the Realtime voice session.
 *
 * - On activation: connects to Realtime (if not already) and injects the
 *   tool-based system prompt once.
 * - The model grounds itself with get_screen_state and acts through app-owned
 *   tools; there is no screenshot capture.
 * - Cursor deactivation must not tear down a voice session the user started
 *   separately.
 */
export function useClickyVoice({
	isClickyActive,
	isRealtimeConnected,
	connectRealtime,
	injectContext,
}: UseClickyVoiceOptions) {
	useDefaultClickyVoice({
		isClickyActive,
		isRealtimeConnected,
		connectRealtime,
		injectContext,
	});
}

export { getDefaultClickyInitialContextContent as getRovoClickyInitialContextContent };
