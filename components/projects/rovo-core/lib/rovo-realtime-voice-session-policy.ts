export type RovoRealtimeVoiceSessionPolicyMode = "auto" | "manual-turn-taking";

export interface RovoRealtimeVoiceSessionPolicyInput {
	explicitResponseOnly?: boolean;
	mode: RovoRealtimeVoiceSessionPolicyMode;
	transcriptionOnly?: boolean;
}

export interface RovoRealtimeVoiceSessionPolicy {
	explicitResponseOnly: boolean;
	manualTurnTaking: boolean;
	sessionUpdateConfig: Record<string, unknown> | null;
	transcriptionOnly: boolean;
}

export interface RovoRealtimeVoiceFallbackPolicyInput {
	active?: boolean;
	explicitResponseOnly?: boolean;
	isAwaitingSpeechResponse?: boolean;
	manualTurnTaking?: boolean;
	transcriptionOnly?: boolean;
}

export interface RovoRealtimeVoiceBrowserTranscriptFallbackInput {
	hasReceivedServerDelta?: boolean;
	manualTurnTaking?: boolean;
	serverTranscriptionActive?: boolean;
	transcript?: string | null;
}

const SEMANTIC_VAD_AUTO_NO_RESPONSE = {
	turn_detection: {
		type: "semantic_vad",
		eagerness: "auto",
		create_response: false,
		interrupt_response: false,
	},
};

const STUDIO_MANUAL_TURN_TAKING_CONFIG = {
	turn_detection: {
		type: "semantic_vad",
		eagerness: "low",
		create_response: false,
		interrupt_response: true,
	},
};

export function resolveRovoRealtimeVoiceSessionPolicy({
	explicitResponseOnly = false,
	mode,
	transcriptionOnly = false,
}: RovoRealtimeVoiceSessionPolicyInput): RovoRealtimeVoiceSessionPolicy {
	if (mode === "manual-turn-taking") {
		return {
			explicitResponseOnly: false,
			manualTurnTaking: !transcriptionOnly,
			sessionUpdateConfig: transcriptionOnly
				? {
						transcription_only: true,
						...SEMANTIC_VAD_AUTO_NO_RESPONSE,
					}
				: STUDIO_MANUAL_TURN_TAKING_CONFIG,
			transcriptionOnly,
		};
	}

	if (!transcriptionOnly && !explicitResponseOnly) {
		return {
			explicitResponseOnly: false,
			manualTurnTaking: false,
			sessionUpdateConfig: null,
			transcriptionOnly: false,
		};
	}

	return {
		explicitResponseOnly,
		manualTurnTaking: false,
		sessionUpdateConfig: {
			...(transcriptionOnly ? { transcription_only: true } : {}),
			...(explicitResponseOnly ? { explicit_response_only: true } : {}),
			turn_detection: {
				type: "semantic_vad",
				eagerness: "auto",
				create_response: false,
				interrupt_response: explicitResponseOnly,
			},
		},
		transcriptionOnly,
	};
}

export function shouldCreateRovoRealtimeVoiceFallbackResponse({
	active = true,
	explicitResponseOnly = false,
	isAwaitingSpeechResponse = false,
	manualTurnTaking = false,
	transcriptionOnly = false,
}: RovoRealtimeVoiceFallbackPolicyInput): boolean {
	return Boolean(
		active
		&& isAwaitingSpeechResponse
		&& !manualTurnTaking
		&& !transcriptionOnly
		&& !explicitResponseOnly,
	);
}

export function shouldCompleteRovoRealtimeVoiceBrowserTranscriptFallback({
	hasReceivedServerDelta = false,
	manualTurnTaking = false,
	serverTranscriptionActive = false,
	transcript,
}: RovoRealtimeVoiceBrowserTranscriptFallbackInput): boolean {
	return Boolean(
		transcript
		&& !manualTurnTaking
		&& !serverTranscriptionActive
		&& !hasReceivedServerDelta,
	);
}
