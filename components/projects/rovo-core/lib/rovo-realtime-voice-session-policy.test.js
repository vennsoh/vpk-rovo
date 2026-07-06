const test = require("node:test");
const assert = require("node:assert/strict");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	resolveRovoRealtimeVoiceSessionPolicy,
	shouldCompleteRovoRealtimeVoiceBrowserTranscriptFallback,
	shouldCreateRovoRealtimeVoiceFallbackResponse,
} = loadRovoCoreModule("lib/rovo-realtime-voice-session-policy.ts");

test("auto realtime policy leaves default sessions unchanged", () => {
	assert.deepEqual(
		resolveRovoRealtimeVoiceSessionPolicy({ mode: "auto" }),
		{
			explicitResponseOnly: false,
			manualTurnTaking: false,
			sessionUpdateConfig: null,
			transcriptionOnly: false,
		},
	);
});

test("auto realtime policy preserves transcription and explicit-response modes", () => {
	assert.deepEqual(
		resolveRovoRealtimeVoiceSessionPolicy({
			explicitResponseOnly: true,
			mode: "auto",
			transcriptionOnly: true,
		}),
		{
			explicitResponseOnly: true,
			manualTurnTaking: false,
			sessionUpdateConfig: {
				explicit_response_only: true,
				transcription_only: true,
				turn_detection: {
					type: "semantic_vad",
					eagerness: "auto",
					create_response: false,
					interrupt_response: true,
				},
			},
			transcriptionOnly: true,
		},
	);

	assert.equal(
		resolveRovoRealtimeVoiceSessionPolicy({
			mode: "auto",
			transcriptionOnly: true,
		}).sessionUpdateConfig.turn_detection.interrupt_response,
		false,
	);
});

test("auto realtime policy supports standalone explicit-response mode", () => {
	assert.deepEqual(
		resolveRovoRealtimeVoiceSessionPolicy({
			explicitResponseOnly: true,
			mode: "auto",
		}),
		{
			explicitResponseOnly: true,
			manualTurnTaking: false,
			sessionUpdateConfig: {
				explicit_response_only: true,
				turn_detection: {
					type: "semantic_vad",
					eagerness: "auto",
					create_response: false,
					interrupt_response: true,
				},
			},
			transcriptionOnly: false,
		},
	);
});

test("auto realtime policy supports standalone transcription-only mode", () => {
	assert.deepEqual(
		resolveRovoRealtimeVoiceSessionPolicy({
			mode: "auto",
			transcriptionOnly: true,
		}),
		{
			explicitResponseOnly: false,
			manualTurnTaking: false,
			sessionUpdateConfig: {
				transcription_only: true,
				turn_detection: {
					type: "semantic_vad",
					eagerness: "auto",
					create_response: false,
					interrupt_response: false,
				},
			},
			transcriptionOnly: true,
		},
	);
});

test("manual realtime policy defaults to manual turn-taking", () => {
	assert.deepEqual(
		resolveRovoRealtimeVoiceSessionPolicy({ mode: "manual-turn-taking" }),
		{
			explicitResponseOnly: false,
			manualTurnTaking: true,
			sessionUpdateConfig: {
				turn_detection: {
					type: "semantic_vad",
					eagerness: "low",
					create_response: false,
					interrupt_response: true,
				},
			},
			transcriptionOnly: false,
		},
	);
});

test("manual realtime policy ignores explicit-response mode", () => {
	assert.deepEqual(
		resolveRovoRealtimeVoiceSessionPolicy({
			explicitResponseOnly: true,
			mode: "manual-turn-taking",
		}),
		{
			explicitResponseOnly: false,
			manualTurnTaking: true,
			sessionUpdateConfig: {
				turn_detection: {
					type: "semantic_vad",
					eagerness: "low",
					create_response: false,
					interrupt_response: true,
				},
			},
			transcriptionOnly: false,
		},
	);
});

test("manual realtime policy ignores explicit-response mode during transcription-only capture", () => {
	assert.deepEqual(
		resolveRovoRealtimeVoiceSessionPolicy({
			explicitResponseOnly: true,
			mode: "manual-turn-taking",
			transcriptionOnly: true,
		}),
		{
			explicitResponseOnly: false,
			manualTurnTaking: false,
			sessionUpdateConfig: {
				transcription_only: true,
				turn_detection: {
					type: "semantic_vad",
					eagerness: "auto",
					create_response: false,
					interrupt_response: false,
				},
			},
			transcriptionOnly: true,
		},
	);
});

test("manual realtime policy preserves transcription-only mode without manual responses", () => {
	assert.deepEqual(
		resolveRovoRealtimeVoiceSessionPolicy({
			mode: "manual-turn-taking",
			transcriptionOnly: true,
		}),
		{
			explicitResponseOnly: false,
			manualTurnTaking: false,
			sessionUpdateConfig: {
				transcription_only: true,
				turn_detection: {
					type: "semantic_vad",
					eagerness: "auto",
					create_response: false,
					interrupt_response: false,
				},
			},
			transcriptionOnly: true,
		},
	);
});

test("response fallback is suppressed by route voice policy modes", () => {
	assert.equal(
		shouldCreateRovoRealtimeVoiceFallbackResponse({
			isAwaitingSpeechResponse: true,
		}),
		true,
	);
	assert.equal(
		shouldCreateRovoRealtimeVoiceFallbackResponse({
			isAwaitingSpeechResponse: true,
			transcriptionOnly: true,
		}),
		false,
	);
	assert.equal(
		shouldCreateRovoRealtimeVoiceFallbackResponse({
			explicitResponseOnly: true,
			isAwaitingSpeechResponse: true,
		}),
		false,
	);
	assert.equal(
		shouldCreateRovoRealtimeVoiceFallbackResponse({
			isAwaitingSpeechResponse: true,
			manualTurnTaking: true,
		}),
		false,
	);
	assert.equal(
		shouldCreateRovoRealtimeVoiceFallbackResponse({
			active: false,
			isAwaitingSpeechResponse: true,
		}),
		false,
	);
});

test("browser transcript fallback is suppressed by Studio manual or server transcription state", () => {
	assert.equal(
		shouldCompleteRovoRealtimeVoiceBrowserTranscriptFallback({
			transcript: "hello",
		}),
		true,
	);
	assert.equal(
		shouldCompleteRovoRealtimeVoiceBrowserTranscriptFallback({
			manualTurnTaking: true,
			transcript: "hello",
		}),
		false,
	);
	assert.equal(
		shouldCompleteRovoRealtimeVoiceBrowserTranscriptFallback({
			serverTranscriptionActive: true,
			transcript: "hello",
		}),
		false,
	);
	assert.equal(
		shouldCompleteRovoRealtimeVoiceBrowserTranscriptFallback({
			hasReceivedServerDelta: true,
			transcript: "hello",
		}),
		false,
	);
	assert.equal(
		shouldCompleteRovoRealtimeVoiceBrowserTranscriptFallback({
			transcript: "",
		}),
		false,
	);
});
