"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import {
	createRealtimeAssistantTextStreamState,
	finalizeRealtimeAssistantText,
	reduceRealtimeAssistantTextDelta,
} from "@/components/projects/rovo-core/lib/rovo-app-realtime-assistant-state";
import {
	hasCompletedRovoAppVoiceTurn,
	isRovoAppVoiceCaptureAvailable,
	normalizeRovoAppVoiceTranscript,
	resolveRovoAppPausedVoiceCaptureEpoch,
	shouldStartNewRovoAppVoiceTurn,
	shouldProcessRovoAppVoiceTranscriptionCompletion,
	shouldProcessRovoAppVoiceTranscriptionDelta,
} from "@/components/projects/rovo-core/lib/rovo-app-voice-capture";
import {
	type RovoRealtimeVoiceSessionPolicyMode,
	resolveRovoRealtimeVoiceSessionPolicy,
	shouldCompleteRovoRealtimeVoiceBrowserTranscriptFallback,
	shouldCreateRovoRealtimeVoiceFallbackResponse,
} from "@/components/projects/rovo-core/lib/rovo-realtime-voice-session-policy";
import {
	REALTIME_AUDIO_SAMPLE_RATE,
	buildOutputWaveformBars,
	decodeBase64Pcm16,
	encodeFloat32ToPcm16Base64,
	resampleLinear,
} from "@/components/projects/rovo-core/lib/rovo-realtime-audio";
import { buildRealtimeThreadSummary } from "@/components/projects/rovo-core/lib/rovo-realtime-thread-summary";
import { buildRealtimeWsUrl } from "@/components/projects/rovo-core/lib/rovo-realtime-ws-url";
import {
	SCREEN_ASSISTANT_TOOL_NAMES,
	resolveRovoRealtimeFunctionCall,
	type RovoRealtimeDelegationRequest,
} from "@/components/projects/rovo-core/lib/rovo-realtime-function-call";
import {
	createPlaybackQueue,
	destroyPlaybackQueue,
	enqueueAudio,
	flushPlayback,
	type PlaybackQueue,
} from "@/components/projects/rovo-core/lib/rovo-realtime-playback";
import type {
	ClientContextInject,
	ClientMessage,
	ServerMessage,
} from "@/components/projects/rovo-core/lib/rovo-realtime-protocol";

export { SCREEN_ASSISTANT_TOOL_NAMES };

// Web Speech API — resolve constructor with vendor prefix fallback (Chrome/Edge)
function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
	if (typeof window === "undefined") return null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RealtimeVoiceState = "idle" | "connecting" | "listening" | "speaking";

export type RealtimeGenerationState =
	| "idle"
	| "delegating"
	| "generating"
	| "steering"
	| "complete";

export type DelegationRequest = RovoRealtimeDelegationRequest;

export interface UseRealtimeVoiceOptions {
	sessionPolicyMode: RovoRealtimeVoiceSessionPolicyMode;
	/** Called when GPT calls delegate_to_rovo with a synthesized task. */
	onDelegateToRovo: (request: DelegationRequest) => void;
	/** Called when realtime VAD detects that the user started speaking. */
	onSpeechStarted?: () => void;
	onSpeechTranscriptCompleted?: (payload: {
		messageId?: string;
		text?: string;
		transcript?: string;
	} | string) => void;
	onSpeechTranscriptDelta?: (payload: {
		delta?: string;
		messageId?: string;
		text?: string;
	} | string) => void;
	onTextResponseStart?: (payload?: { messageId?: string }) => void;
	onAssistantTextDelta?: (payload: {
		delta?: string;
		displayOnly?: boolean;
		messageId?: string;
		replace?: boolean;
		source?: "text" | "audio_transcript";
		text?: string;
	} | string) => void;
	onAssistantTextCompleted?: (payload: {
		messageId?: string;
		text?: string;
	} | string) => void;
	/** Called when the model explicitly ends the live voice session. */
	onEndVoiceSession?: () => void;
	/**
	 * Called when the model invokes an app-owned screen-assistant tool
	 * (get_screen_state, point_at_target, activate_screen_target,
	 * set_composer_text, submit_composer, apply_agent_draft_patch). The executor runs the action and returns the
	 * result via `sendFunctionCallOutput`.
	 */
	onToolCall?: (call: { name: string; args: Record<string, unknown>; callId: string }) => void;
	/** Current chat messages for thread context. */
	chatMessages: RovoUIMessage[];
	/** Whether Rovo is currently generating. */
	isGenerating?: boolean;
}

export interface RealtimeVoiceConnectOptions {
	transcriptionOnly?: boolean;
	explicitResponseOnly?: boolean;
}

export interface UseRealtimeVoiceResult {
	connect: (options?: RealtimeVoiceConnectOptions) => void;
	disconnect: () => void;
	sendTextInput: (payload: {
		contextDescription?: string;
		messageId?: string;
		text: string;
	}) => Promise<void>;
	/** Return an app-owned tool result to the model so it can continue. */
	sendFunctionCallOutput: (payload: {
		callId: string;
		output: unknown;
		createResponse?: boolean;
	}) => void;
	voiceState: RealtimeVoiceState;
	generationState: RealtimeGenerationState;
	isConnected: boolean;
	isReconnecting: boolean;
	connectionState: "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";
	statusMessage: string | null;
	currentTranscript: string;
	modelTranscript: string;
	outputWaveformBars: number[];
	/** The raw MediaStream for visualization (bar visualizer). */
	micStream: MediaStream | null;
	/** Push context updates into the Realtime session (artifact completions, thread messages). */
	injectContext: (data: {
		type:
			| "initial_context"
			| "thread_context"
			| "artifact_complete"
			| "thread_message"
			| "artifact_annotations"
			| "artifact_context"
			| "delegation_error";
		summary?: string;
		role?: string;
		content?: string;
	}) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RECONNECT_DELAYS = [500, 1_000, 2_000];
const MAX_RECONNECT_ATTEMPTS = RECONNECT_DELAYS.length;
const PLAYBACK_DRAIN_EPSILON_MS = 48;
const PLAYBACK_DRAIN_MAX_CHECK_MS = 240;
const PLAYBACK_SPEAKING_GRACE_MS = 900;
const MODEL_WAVEFORM_BAR_COUNT = 29;
const RESPONSE_CREATE_FALLBACK_MS = 1200;
const BROWSER_TRANSCRIPTION_COMPLETION_FALLBACK_MS = 700;

export function useRealtimeVoice({
	sessionPolicyMode,
	onDelegateToRovo,
	onSpeechStarted,
	onSpeechTranscriptCompleted,
	onSpeechTranscriptDelta,
	onTextResponseStart,
	onAssistantTextDelta,
	onAssistantTextCompleted,
	onEndVoiceSession,
	onToolCall,
	chatMessages,
	isGenerating = false,
}: UseRealtimeVoiceOptions): UseRealtimeVoiceResult {
	const [voiceState, setVoiceState] = useState<RealtimeVoiceState>("idle");
	const [generationState, setGenerationState] =
		useState<RealtimeGenerationState>("idle");
	const [connectionState, setConnectionState] = useState<
		"idle" | "connecting" | "connected" | "reconnecting" | "disconnected"
	>("idle");
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [currentTranscript, setCurrentTranscript] = useState("");
	const [modelTranscript, setModelTranscript] = useState("");
	const [outputWaveformBars, setOutputWaveformBars] = useState<number[]>([]);
	const [micStream, setMicStream] = useState<MediaStream | null>(null);

	// Refs for stable access in callbacks
	const voiceStateRef = useRef<RealtimeVoiceState>("idle");
	const activeRef = useRef(false);
	const wsRef = useRef<WebSocket | null>(null);
	const playbackQueueRef = useRef<PlaybackQueue | null>(null);
	const micStreamRef = useRef<MediaStream | null>(null);
	const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
	const micAudioContextRef = useRef<AudioContext | null>(null);
	const reconnectAttemptRef = useRef(0);
	const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const generationResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const responseCreateFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const browserTranscriptCompletionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const playbackDrainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastAudioDeltaAtRef = useRef<number | null>(null);
	const outputWaveformFrameRef = useRef<number | null>(null);
	const outputWaveformLastSampleAtRef = useRef<number>(0);
	const samplePlaybackWaveformRef = useRef<(time: number) => void>(() => {});
	const pendingTranscriptRef = useRef("");
	const hasReceivedServerDeltaRef = useRef(false);
	const serverTranscriptionActiveRef = useRef(false);
	const manualTurnTakingRef = useRef(false);
	const assistantTextStreamRef = useRef(createRealtimeAssistantTextStreamState());
	const queuedTextInputsRef = useRef<Array<{
		contextDescription?: string;
		text: string;
	}>>([]);
	const transcriptionOnlyModeRef = useRef(false);
	const explicitResponseOnlyModeRef = useRef(false);
	const connectWsRef = useRef<() => void>(() => {});
	const disconnectRef = useRef<() => void>(() => {});
	const cleanupConnectionRef = useRef<() => void>(() => {});
	const browserRecognitionRef = useRef<SpeechRecognition | null>(null);
	const resetBrowserRecognitionRef = useRef<() => void>(() => {});
	const startBrowserRecognitionRef = useRef<() => void>(() => {});
	const stopBrowserRecognitionRef = useRef<() => void>(() => {});
	const isCaptureAvailableRef = useRef(false);
	const captureEpochRef = useRef(0);
	const activeInputCaptureEpochRef = useRef<number | null>(null);
	const pausedInputCaptureEpochRef = useRef<number | null>(null);
	const lastAudioAppendCaptureEpochRef = useRef<number | null>(null);
	const isAwaitingSpeechResponseRef = useRef(false);
	const activeSpeechTurnIdRef = useRef<number | null>(null);
	const lastSpeechTurnIdRef = useRef(0);
	const completedSpeechTurnRef = useRef<{
		transcript: string;
		turnId: number;
	} | null>(null);

	// Keep callback and context refs stable
	const onDelegateToRovoRef = useRef(onDelegateToRovo);
	useEffect(() => {
		onDelegateToRovoRef.current = onDelegateToRovo;
	}, [onDelegateToRovo]);

	const onSpeechStartedRef = useRef(onSpeechStarted);
	useEffect(() => {
		onSpeechStartedRef.current = onSpeechStarted;
	}, [onSpeechStarted]);

	const onSpeechTranscriptDeltaRef = useRef(onSpeechTranscriptDelta);
	useEffect(() => {
		onSpeechTranscriptDeltaRef.current = onSpeechTranscriptDelta;
	}, [onSpeechTranscriptDelta]);

	const onSpeechTranscriptCompletedRef = useRef(onSpeechTranscriptCompleted);
	useEffect(() => {
		onSpeechTranscriptCompletedRef.current = onSpeechTranscriptCompleted;
	}, [onSpeechTranscriptCompleted]);

	const onTextResponseStartRef = useRef(onTextResponseStart);
	useEffect(() => {
		onTextResponseStartRef.current = onTextResponseStart;
	}, [onTextResponseStart]);

	const onAssistantTextDeltaRef = useRef(onAssistantTextDelta);
	useEffect(() => {
		onAssistantTextDeltaRef.current = onAssistantTextDelta;
	}, [onAssistantTextDelta]);

	const onAssistantTextCompletedRef = useRef(onAssistantTextCompleted);
	useEffect(() => {
		onAssistantTextCompletedRef.current = onAssistantTextCompleted;
	}, [onAssistantTextCompleted]);

	const onEndVoiceSessionRef = useRef(onEndVoiceSession);
	useEffect(() => {
		onEndVoiceSessionRef.current = onEndVoiceSession;
	}, [onEndVoiceSession]);

	const onToolCallRef = useRef(onToolCall);
	useEffect(() => {
		onToolCallRef.current = onToolCall;
	}, [onToolCall]);

	const chatMessagesRef = useRef(chatMessages);
	useEffect(() => {
		chatMessagesRef.current = chatMessages;
	}, [chatMessages]);

	const isGeneratingRef = useRef(isGenerating);
	useEffect(() => {
		isGeneratingRef.current = isGenerating;
	}, [isGenerating]);

	// -- State helpers -------------------------------------------------------

	const setVoice = useCallback((state: RealtimeVoiceState) => {
		const prev = voiceStateRef.current;
		voiceStateRef.current = state;
		setVoiceState(state);

		// Pause browser recognition while AI is speaking to prevent
		// capturing AI audio output as user speech
		if (state === "speaking" && prev !== "speaking") {
			stopBrowserRecognitionRef.current();
		} else if (state === "listening" && prev === "speaking") {
			startBrowserRecognitionRef.current();
		}
	}, []);

	const resetAssistantTextStream = useCallback(() => {
		assistantTextStreamRef.current = createRealtimeAssistantTextStreamState();
	}, []);

	const resetGenerationStateSoon = useCallback(() => {
		if (generationResetTimerRef.current !== null) {
			clearTimeout(generationResetTimerRef.current);
		}
		generationResetTimerRef.current = setTimeout(() => {
			generationResetTimerRef.current = null;
			setGenerationState("idle");
		}, 750);
	}, []);

	const clearPlaybackDrainTimer = useCallback(() => {
		if (playbackDrainTimerRef.current !== null) {
			clearTimeout(playbackDrainTimerRef.current);
			playbackDrainTimerRef.current = null;
		}
	}, []);

	const clearResponseCreateFallbackTimer = useCallback(() => {
		if (responseCreateFallbackTimerRef.current !== null) {
			clearTimeout(responseCreateFallbackTimerRef.current);
			responseCreateFallbackTimerRef.current = null;
		}
	}, []);

	const clearBrowserTranscriptCompletionTimer = useCallback(() => {
		if (browserTranscriptCompletionTimerRef.current !== null) {
			clearTimeout(browserTranscriptCompletionTimerRef.current);
			browserTranscriptCompletionTimerRef.current = null;
		}
	}, []);

	const ensureActiveSpeechTurn = useCallback(() => {
		if (
			shouldStartNewRovoAppVoiceTurn({
				activeTurnId: activeSpeechTurnIdRef.current,
				completedTurnId: completedSpeechTurnRef.current?.turnId ?? null,
				pendingTranscript: pendingTranscriptRef.current,
			})
		) {
			lastSpeechTurnIdRef.current += 1;
			activeSpeechTurnIdRef.current = lastSpeechTurnIdRef.current;
		}

		return activeSpeechTurnIdRef.current;
	}, []);

	const hasCompletedActiveSpeechTurn = useCallback((transcript: string) => {
		return hasCompletedRovoAppVoiceTurn({
			activeTurnId: activeSpeechTurnIdRef.current,
			completedTurnId: completedSpeechTurnRef.current?.turnId ?? null,
			completedTranscript: completedSpeechTurnRef.current?.transcript ?? null,
			transcript,
		});
	}, []);

	const markActiveSpeechTurnCompleted = useCallback((transcript: string) => {
		const turnId = ensureActiveSpeechTurn();
		if (turnId === null) {
			return null;
		}

		completedSpeechTurnRef.current = {
			transcript: normalizeRovoAppVoiceTranscript(transcript),
			turnId,
		};
		return turnId;
	}, [ensureActiveSpeechTurn]);

	const resetSpeechTurnTracking = useCallback(() => {
		activeSpeechTurnIdRef.current = null;
		completedSpeechTurnRef.current = null;
		clearBrowserTranscriptCompletionTimer();
	}, [clearBrowserTranscriptCompletionTimer]);

	const markSpeechTurnStarted = useCallback(() => {
		ensureActiveSpeechTurn();
		isAwaitingSpeechResponseRef.current = true;
		clearResponseCreateFallbackTimer();
	}, [clearResponseCreateFallbackTimer, ensureActiveSpeechTurn]);

	const markSpeechResponseStarted = useCallback(() => {
		isAwaitingSpeechResponseRef.current = false;
		clearResponseCreateFallbackTimer();
	}, [clearResponseCreateFallbackTimer]);

	const stopOutputWaveformSampling = useCallback(() => {
		if (outputWaveformFrameRef.current !== null) {
			window.cancelAnimationFrame(outputWaveformFrameRef.current);
			outputWaveformFrameRef.current = null;
		}
		outputWaveformLastSampleAtRef.current = 0;
	}, []);

	const resolveCaptureAvailability = useCallback((): boolean => {
		if (typeof document === "undefined") {
			return false;
		}

		return activeRef.current && isRovoAppVoiceCaptureAvailable({
			hasFocus: document.hasFocus(),
			visibilityState: document.visibilityState,
		});
	}, []);

	// -- Send WS message helper ----------------------------------------------

	const sendWsMessage = useCallback((message: ClientMessage) => {
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(message));
		}
	}, []);

	const scheduleResponseCreateFallback = useCallback(() => {
		if (
			!shouldCreateRovoRealtimeVoiceFallbackResponse({
				explicitResponseOnly: explicitResponseOnlyModeRef.current,
				isAwaitingSpeechResponse: isAwaitingSpeechResponseRef.current,
				manualTurnTaking: manualTurnTakingRef.current,
				transcriptionOnly: transcriptionOnlyModeRef.current,
			})
		) {
			return;
		}

		clearResponseCreateFallbackTimer();
		responseCreateFallbackTimerRef.current = setTimeout(() => {
			responseCreateFallbackTimerRef.current = null;
			if (
				!shouldCreateRovoRealtimeVoiceFallbackResponse({
					active: activeRef.current,
					explicitResponseOnly: explicitResponseOnlyModeRef.current,
					isAwaitingSpeechResponse: isAwaitingSpeechResponseRef.current,
					manualTurnTaking: manualTurnTakingRef.current,
					transcriptionOnly: transcriptionOnlyModeRef.current,
				})
			) {
				return;
			}

			sendWsMessage({
				type: "response_create",
			});
		}, RESPONSE_CREATE_FALLBACK_MS);
	}, [clearResponseCreateFallbackTimer, sendWsMessage]);

	const scheduleBrowserTranscriptCompletionFallback = useCallback((transcript: string) => {
		const normalizedTranscript = normalizeRovoAppVoiceTranscript(transcript);
		if (
			!shouldCompleteRovoRealtimeVoiceBrowserTranscriptFallback({
				manualTurnTaking: manualTurnTakingRef.current,
				serverTranscriptionActive: serverTranscriptionActiveRef.current,
				transcript: normalizedTranscript,
			})
		) {
			return;
		}

		const turnId = ensureActiveSpeechTurn();
		if (turnId === null || hasCompletedActiveSpeechTurn(transcript)) {
			return;
		}

		clearBrowserTranscriptCompletionTimer();
		browserTranscriptCompletionTimerRef.current = setTimeout(() => {
			browserTranscriptCompletionTimerRef.current = null;
			if (
				!shouldCompleteRovoRealtimeVoiceBrowserTranscriptFallback({
					hasReceivedServerDelta: hasReceivedServerDeltaRef.current,
					manualTurnTaking: manualTurnTakingRef.current,
					serverTranscriptionActive: serverTranscriptionActiveRef.current,
					transcript,
				})
			) {
				return;
			}
			if (!activeRef.current || activeSpeechTurnIdRef.current !== turnId) {
				return;
			}
			if (hasCompletedActiveSpeechTurn(transcript)) {
				return;
			}

			markActiveSpeechTurnCompleted(transcript);
			pendingTranscriptRef.current = "";
			setCurrentTranscript(transcript);
			onSpeechTranscriptCompletedRef.current?.({
				transcript,
				text: transcript,
			});
			resetBrowserRecognitionRef.current();
			scheduleResponseCreateFallback();
		}, BROWSER_TRANSCRIPTION_COMPLETION_FALLBACK_MS);
	}, [
		clearBrowserTranscriptCompletionTimer,
		ensureActiveSpeechTurn,
		hasCompletedActiveSpeechTurn,
		markActiveSpeechTurnCompleted,
		scheduleResponseCreateFallback,
	]);

	const dispatchTextInput = useCallback((payload: {
		contextDescription?: string;
		text: string;
	}) => {
		if (payload.contextDescription?.trim()) {
			sendWsMessage({
				type: "context_inject",
				data: {
					type: "thread_message",
					content: payload.contextDescription.trim(),
				},
			});
		}

		resetAssistantTextStream();
		setModelTranscript("");
		setGenerationState("generating");
		sendWsMessage({
			type: "text_message_from_user",
			text: payload.text,
		});
	}, [resetAssistantTextStream, sendWsMessage]);

	// -- Inject context into Realtime session --------------------------------

	const injectContext = useCallback(
		(data: ClientContextInject["data"]) => {
			sendWsMessage({ type: "context_inject", data });
		},
		[sendWsMessage],
	);

	// -- Playback management -------------------------------------------------

	const stopPlayback = useCallback(() => {
		clearPlaybackDrainTimer();
		const queue = playbackQueueRef.current;
		if (queue) {
			flushPlayback(queue);
		}
		stopOutputWaveformSampling();
		setOutputWaveformBars([]);
		if (voiceStateRef.current === "speaking") {
			setVoice("listening");
		}
	}, [clearPlaybackDrainTimer, setVoice, stopOutputWaveformSampling]);

	useEffect(() => {
		samplePlaybackWaveformRef.current = (time: number) => {
			const queue = playbackQueueRef.current;
			if (!activeRef.current || !queue) {
				outputWaveformFrameRef.current = null;
				return;
			}

			if (time - outputWaveformLastSampleAtRef.current >= 80) {
				outputWaveformLastSampleAtRef.current = time;
				const timeDomainData = new Uint8Array(queue.outputAnalyser.fftSize);
				queue.outputAnalyser.getByteTimeDomainData(timeDomainData);
				const samples = new Float32Array(timeDomainData.length);

				for (let index = 0; index < timeDomainData.length; index += 1) {
					samples[index] = (timeDomainData[index] - 128) / 128;
				}

				setOutputWaveformBars(
					buildOutputWaveformBars({
						barCount: MODEL_WAVEFORM_BAR_COUNT,
						samples,
					}),
				);
			}

			if (queue.isPlaying || voiceStateRef.current === "speaking") {
				outputWaveformFrameRef.current = window.requestAnimationFrame((frameTime) => {
					samplePlaybackWaveformRef.current(frameTime);
				});
				return;
			}

			outputWaveformFrameRef.current = null;
		};
	}, []);

	const ensureOutputWaveformSampling = useCallback(() => {
		if (outputWaveformFrameRef.current !== null) {
			return;
		}

		outputWaveformFrameRef.current = window.requestAnimationFrame((time) => {
			samplePlaybackWaveformRef.current(time);
		});
	}, []);

	const schedulePlaybackDrainCheck = useCallback(() => {
		clearPlaybackDrainTimer();

		const checkDrain = () => {
			const queue = playbackQueueRef.current;
			if (!queue) {
				playbackDrainTimerRef.current = null;
				return;
			}

			const remainingMs = Math.max(
				0,
				(queue.nextStartTime - queue.audioContext.currentTime) * 1000,
			);

			if (remainingMs <= PLAYBACK_DRAIN_EPSILON_MS) {
				const now = performance.now();
				const timeSinceLastAudioDelta =
					lastAudioDeltaAtRef.current == null
						? Number.POSITIVE_INFINITY
						: now - lastAudioDeltaAtRef.current;

				if (timeSinceLastAudioDelta < PLAYBACK_SPEAKING_GRACE_MS) {
					playbackDrainTimerRef.current = setTimeout(
						checkDrain,
						Math.min(
							Math.max(
								PLAYBACK_SPEAKING_GRACE_MS - timeSinceLastAudioDelta + PLAYBACK_DRAIN_EPSILON_MS,
								PLAYBACK_DRAIN_EPSILON_MS,
							),
							PLAYBACK_SPEAKING_GRACE_MS,
						),
					);
					return;
				}

				queue.isPlaying = false;
				playbackDrainTimerRef.current = null;
				if (voiceStateRef.current === "speaking") {
					setVoice("listening");
				}
				return;
			}

			playbackDrainTimerRef.current = setTimeout(
				checkDrain,
				Math.min(
					Math.max(remainingMs + PLAYBACK_DRAIN_EPSILON_MS, PLAYBACK_DRAIN_EPSILON_MS),
					PLAYBACK_DRAIN_MAX_CHECK_MS,
				),
			);
		};

		checkDrain();
	}, [clearPlaybackDrainTimer, setVoice]);

	// -- Browser speech recognition (live transcription) ----------------------
	// Runs in-browser alongside the OpenAI mic stream. Provides instant interim
	// results for live display in the composer. OpenAI's transcription_completed
	// remains the preferred source for auto-submit, with a browser-final fallback
	// if the upstream completion event never arrives.

	const startBrowserRecognition = useCallback(() => {
		const Ctor = getSpeechRecognitionCtor();
		if (!Ctor || !isCaptureAvailableRef.current || voiceStateRef.current === "speaking") {
			return;
		}

		const recognition = new Ctor();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = "en-US";

		recognition.onresult = (event: SpeechRecognitionEvent) => {
			// Drop results while AI is speaking — prevents capturing AI audio
			// output through the speakers as user speech. SpeechRecognition.stop()
			// may fire one final onresult with buffered audio before stopping.
			if (!isCaptureAvailableRef.current || voiceStateRef.current === "speaking") return;

			// Build display text from all results not yet auto-submitted.
			// Each call to startBrowserRecognition creates a fresh instance
			// so index 0 is always the start of the current utterance group.
			let text = "";
			let allResultsFinal = event.results.length > 0;
			for (let i = 0; i < event.results.length; i++) {
				const result = event.results[i];
				text += result[0].transcript;
				allResultsFinal = allResultsFinal && result.isFinal;
			}
			const trimmed = text.trim();
			if (!trimmed) {
				clearBrowserTranscriptCompletionTimer();
				return;
			}

			ensureActiveSpeechTurn();
			if (!hasReceivedServerDeltaRef.current) {
				pendingTranscriptRef.current = trimmed;
				setCurrentTranscript(trimmed);
				onSpeechTranscriptDeltaRef.current?.({ text: trimmed });
			}

			if (allResultsFinal) {
				scheduleBrowserTranscriptCompletionFallback(trimmed);
			} else {
				clearBrowserTranscriptCompletionTimer();
			}
		};

		recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
			if (event.error !== "aborted" && event.error !== "no-speech") {
				console.warn("[SpeechRecognition] error:", event.error);
			}
		};

		recognition.onend = () => {
			const pendingTranscript = pendingTranscriptRef.current.trim();
			if (
				pendingTranscript &&
				voiceStateRef.current !== "speaking" &&
				!hasCompletedActiveSpeechTurn(pendingTranscript)
			) {
				scheduleBrowserTranscriptCompletionFallback(pendingTranscript);
			}

			// Auto-restart if still in voice mode
			if (
				activeRef.current
				&& isCaptureAvailableRef.current
				&& browserRecognitionRef.current === recognition
			) {
				try {
					recognition.start();
				} catch {
					// Already started or disposed
				}
			}
		};

		browserRecognitionRef.current = recognition;
		try {
			recognition.start();
		} catch {
			// Failed to start — browser may not support it
		}
	}, [
		clearBrowserTranscriptCompletionTimer,
		ensureActiveSpeechTurn,
		hasCompletedActiveSpeechTurn,
		scheduleBrowserTranscriptCompletionFallback,
	]);

	const stopBrowserRecognition = useCallback(() => {
		const recognition = browserRecognitionRef.current;
		if (recognition) {
			browserRecognitionRef.current = null;
			try {
				recognition.stop();
			} catch {
				// Already stopped
			}
		}
	}, []);

	const resetBrowserRecognition = useCallback(() => {
		stopBrowserRecognition();
		if (isCaptureAvailableRef.current) {
			startBrowserRecognition();
		}
	}, [startBrowserRecognition, stopBrowserRecognition]);

	useEffect(() => {
		resetBrowserRecognitionRef.current = resetBrowserRecognition;
	}, [resetBrowserRecognition]);

	useEffect(() => {
		startBrowserRecognitionRef.current = startBrowserRecognition;
		stopBrowserRecognitionRef.current = stopBrowserRecognition;
	}, [startBrowserRecognition, stopBrowserRecognition]);

	const syncMicCaptureAvailability = useCallback((isCaptureAvailable: boolean) => {
		const audioContext = micAudioContextRef.current;
		if (audioContext && audioContext.state !== "closed") {
			if (isCaptureAvailable && audioContext.state === "suspended") {
				void audioContext.resume().catch(() => {});
			}
			if (!isCaptureAvailable && audioContext.state === "running") {
				void audioContext.suspend().catch(() => {});
			}
		}

		const stream = micStreamRef.current;
		if (!stream) {
			return;
		}

		for (const track of stream.getAudioTracks()) {
			track.enabled = isCaptureAvailable;
		}
	}, []);

	const syncCaptureAvailability = useCallback(() => {
		const nextIsCaptureAvailable = resolveCaptureAvailability();
		const previousIsCaptureAvailable = isCaptureAvailableRef.current;
		if (nextIsCaptureAvailable === previousIsCaptureAvailable) {
			return;
		}

		isCaptureAvailableRef.current = nextIsCaptureAvailable;
		syncMicCaptureAvailability(nextIsCaptureAvailable);

		if (!nextIsCaptureAvailable) {
			captureEpochRef.current += 1;
			pausedInputCaptureEpochRef.current =
				resolveRovoAppPausedVoiceCaptureEpoch({
					activeInputCaptureEpoch: activeInputCaptureEpochRef.current,
					pausedInputCaptureEpoch: pausedInputCaptureEpochRef.current,
				});
			activeInputCaptureEpochRef.current = null;
			clearBrowserTranscriptCompletionTimer();
			pendingTranscriptRef.current = "";
			hasReceivedServerDeltaRef.current = false;
			setCurrentTranscript("");
			stopBrowserRecognitionRef.current();
			return;
		}

		if (voiceStateRef.current !== "speaking") {
			startBrowserRecognitionRef.current();
		}
	}, [
		clearBrowserTranscriptCompletionTimer,
		resolveCaptureAvailability,
		syncMicCaptureAvailability,
	]);

	useEffect(() => {
		if (typeof window === "undefined" || typeof document === "undefined") {
			return;
		}

		const handleCaptureBoundaryChange = () => {
			syncCaptureAvailability();
		};

		handleCaptureBoundaryChange();
		window.addEventListener("focus", handleCaptureBoundaryChange);
		window.addEventListener("blur", handleCaptureBoundaryChange);
		document.addEventListener("visibilitychange", handleCaptureBoundaryChange);

		return () => {
			window.removeEventListener("focus", handleCaptureBoundaryChange);
			window.removeEventListener("blur", handleCaptureBoundaryChange);
			document.removeEventListener("visibilitychange", handleCaptureBoundaryChange);
		};
	}, [syncCaptureAvailability]);

	// -- Mic capture ---------------------------------------------------------

	const startMicCapture = useCallback(async () => {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true,
				sampleRate: REALTIME_AUDIO_SAMPLE_RATE,
			},
		});
		micStreamRef.current = stream;
		setMicStream(stream);

		// Use ScriptProcessorNode for reliable cross-browser PCM capture.
		// AudioWorklet would be ideal but requires a separate worklet file.
		const audioContext = new AudioContext();
		micAudioContextRef.current = audioContext;
		const source = audioContext.createMediaStreamSource(stream);
		const processor = audioContext.createScriptProcessor(4096, 1, 1);
		scriptProcessorRef.current = processor;
		syncMicCaptureAvailability(isCaptureAvailableRef.current);

		processor.onaudioprocess = (event: AudioProcessingEvent) => {
			if (!activeRef.current || !isCaptureAvailableRef.current) {
				return;
			}
			const inputData = event.inputBuffer.getChannelData(0);
			const resampled = resampleLinear(
				inputData,
				audioContext.sampleRate,
				REALTIME_AUDIO_SAMPLE_RATE,
			);
			const base64 = encodeFloat32ToPcm16Base64(resampled);
			lastAudioAppendCaptureEpochRef.current = captureEpochRef.current;
			sendWsMessage({ type: "audio_buffer_append", audio: base64 });
		};

		source.connect(processor);
		processor.connect(audioContext.destination);
	}, [sendWsMessage, syncMicCaptureAvailability]);

	const stopMicCapture = useCallback(() => {
		stopBrowserRecognition();
		if (scriptProcessorRef.current) {
			scriptProcessorRef.current.disconnect();
			scriptProcessorRef.current = null;
		}
		if (micAudioContextRef.current) {
			void micAudioContextRef.current.close().catch(() => {});
			micAudioContextRef.current = null;
		}
		if (micStreamRef.current) {
			for (const track of micStreamRef.current.getTracks()) {
				track.stop();
			}
			micStreamRef.current = null;
			setMicStream(null);
		}
	}, [stopBrowserRecognition]);

	// -- Handle completed transcription --------------------------------------
	// With delegate_to_rovo, GPT handles routing via function calling.
	// Transcription completion just updates the display state.

	// -- Handle server messages ----------------------------------------------

	const handleServerMessage = useCallback(
		(event: MessageEvent) => {
			if (!activeRef.current) {
				return;
			}

			let message: ServerMessage;
			try {
				message = JSON.parse(event.data as string) as ServerMessage;
			} catch {
				console.warn("[RealtimeVoice] Ignored an unparseable server message");
				return;
			}

			switch (message.type) {
				case "session_ready":
					reconnectAttemptRef.current = 0;
					serverTranscriptionActiveRef.current = false;
					resetAssistantTextStream();
					setConnectionState("connected");
					setStatusMessage(null);
					setVoice("listening");
					const sessionPolicy = resolveRovoRealtimeVoiceSessionPolicy({
						explicitResponseOnly: explicitResponseOnlyModeRef.current,
						mode: sessionPolicyMode,
						transcriptionOnly: transcriptionOnlyModeRef.current,
					});
					manualTurnTakingRef.current = sessionPolicy.manualTurnTaking;
					clearResponseCreateFallbackTimer();
					if (sessionPolicy.sessionUpdateConfig) {
						sendWsMessage({
							type: "session_update",
							config: sessionPolicy.sessionUpdateConfig,
						});
					}
					// Inject initial thread context
					{
						const summary = buildRealtimeThreadSummary(chatMessagesRef.current);
						if (summary) {
							injectContext({
								type: "thread_context",
								summary,
							});
						}
					}
					if (queuedTextInputsRef.current.length > 0) {
						const queuedInputs = [...queuedTextInputsRef.current];
						queuedTextInputsRef.current = [];
						for (const queuedInput of queuedInputs) {
							dispatchTextInput(queuedInput);
						}
					}
					break;

				case "response_created":
					markSpeechResponseStarted();
					break;

				case "audio_delta": {
					markSpeechResponseStarted();
					const samples = decodeBase64Pcm16(message.delta);
					const queue = playbackQueueRef.current;
					lastAudioDeltaAtRef.current = performance.now();
					if (queue) {
						enqueueAudio(queue, samples);
						ensureOutputWaveformSampling();
						schedulePlaybackDrainCheck();
					}
					setGenerationState("generating");
					if (voiceStateRef.current !== "speaking") {
						setVoice("speaking");
					}
					break;
				}

				case "text_delta": {
					markSpeechResponseStarted();
					const result = reduceRealtimeAssistantTextDelta(
						assistantTextStreamRef.current,
						{
							delta: message.delta,
							itemId: message.itemId ?? null,
							responseId: message.responseId ?? null,
							source: "text",
						},
					);
					assistantTextStreamRef.current = result.state;
					setGenerationState("generating");
					if (result.shouldEmitStart) {
						onTextResponseStartRef.current?.({
							messageId: result.messageId ?? message.itemId,
						});
					}
					setModelTranscript(result.state.transcript);
					onAssistantTextDeltaRef.current?.({
						delta: message.delta,
						messageId: result.messageId ?? message.itemId,
						replace: result.shouldReplaceTranscript,
						source: "text",
						text: result.state.transcript,
					});
					break;
				}

				case "audio_transcript_delta": {
					markSpeechResponseStarted();
					const previousTranscript = assistantTextStreamRef.current.transcript;
					const result = reduceRealtimeAssistantTextDelta(
						assistantTextStreamRef.current,
						{
							delta: message.delta,
							itemId: message.itemId ?? null,
							responseId: message.responseId ?? null,
							source: "audio_transcript",
						},
					);
					assistantTextStreamRef.current = result.state;
					if (result.state.transcript === previousTranscript) {
						if (message.delta && assistantTextStreamRef.current.source === "text") {
							onAssistantTextDeltaRef.current?.({
								delta: message.delta,
								displayOnly: true,
								messageId: result.messageId ?? message.itemId,
								source: "audio_transcript",
								text: `${previousTranscript}${message.delta}`,
							});
						}
						break;
					}
					setGenerationState("generating");
					if (result.shouldEmitStart) {
						onTextResponseStartRef.current?.({
							messageId: result.messageId ?? message.itemId,
						});
					}
					setModelTranscript(result.state.transcript);
					onAssistantTextDeltaRef.current?.({
						delta: message.delta,
						messageId: result.messageId ?? message.itemId,
						replace: result.shouldReplaceTranscript,
						source: "audio_transcript",
						text: result.state.transcript,
					});
					break;
				}

				case "audio_transcript_done": {
					markSpeechResponseStarted();
					const transcript = message.transcript;
					if (!transcript) {
						break;
					}
					if (assistantTextStreamRef.current.source === "text") {
						onAssistantTextDeltaRef.current?.({
							delta: transcript,
							displayOnly: true,
							messageId: message.itemId ?? undefined,
							replace: true,
							source: "audio_transcript",
							text: transcript,
						});
						break;
					}
					const previousState = assistantTextStreamRef.current;
					if (previousState.transcript === transcript) {
						break;
					}
					const messageId = message.itemId ?? previousState.itemId ?? null;
					assistantTextStreamRef.current = {
						...previousState,
						hasStarted: true,
						itemId: messageId,
						responseId: message.responseId ?? previousState.responseId ?? null,
						source: "audio_transcript",
						transcript,
					};
					setGenerationState("generating");
					if (!previousState.hasStarted) {
						onTextResponseStartRef.current?.({
							messageId: messageId ?? undefined,
						});
					}
					setModelTranscript(transcript);
					onAssistantTextDeltaRef.current?.({
						delta: transcript,
						messageId: messageId ?? undefined,
						replace: Boolean(previousState.transcript),
						source: "audio_transcript",
						text: transcript,
					});
					break;
				}

				case "transcription_delta":
					serverTranscriptionActiveRef.current = true;
					clearBrowserTranscriptCompletionTimer();
					if (
						!shouldProcessRovoAppVoiceTranscriptionDelta({
							activeInputCaptureEpoch: activeInputCaptureEpochRef.current,
							captureEpoch: captureEpochRef.current,
							isCaptureAvailable: isCaptureAvailableRef.current,
							lastAudioAppendCaptureEpoch:
								lastAudioAppendCaptureEpochRef.current,
							pausedInputCaptureEpoch: pausedInputCaptureEpochRef.current,
						})
					) {
						break;
					}
					if (pendingTranscriptRef.current === "" && !hasReceivedServerDeltaRef.current) {
						markSpeechTurnStarted();
					}
					ensureActiveSpeechTurn();
					if (!hasReceivedServerDeltaRef.current) {
						pendingTranscriptRef.current = "";
						hasReceivedServerDeltaRef.current = true;
					}
					pendingTranscriptRef.current += message.delta;
					setCurrentTranscript(pendingTranscriptRef.current);
					onSpeechTranscriptDeltaRef.current?.({
						delta: message.delta,
						text: pendingTranscriptRef.current,
					});
					break;

				case "transcription_completed": {
					serverTranscriptionActiveRef.current = true;
					clearBrowserTranscriptCompletionTimer();
					// Only require that speech_started validated this speech
					// session. If capture paused after audio was already sent,
					// preserve the epoch in pausedInputCaptureEpochRef so the
					// final transcript can still land after focus returns.
					if (
						!shouldProcessRovoAppVoiceTranscriptionCompletion({
							activeInputCaptureEpoch: activeInputCaptureEpochRef.current,
							captureEpoch: captureEpochRef.current,
							lastAudioAppendCaptureEpoch:
								lastAudioAppendCaptureEpochRef.current,
							pausedInputCaptureEpoch: pausedInputCaptureEpochRef.current,
						})
					) {
						break;
					}
					if (!isAwaitingSpeechResponseRef.current) {
						markSpeechTurnStarted();
					}
					const fullTranscript = message.transcript;
					pendingTranscriptRef.current = "";
					hasReceivedServerDeltaRef.current = false;
					setCurrentTranscript(fullTranscript);
					ensureActiveSpeechTurn();
					if (!hasCompletedActiveSpeechTurn(fullTranscript)) {
						markActiveSpeechTurnCompleted(fullTranscript);
						onSpeechTranscriptCompletedRef.current?.({
							transcript: fullTranscript,
							text: fullTranscript,
						});
						scheduleResponseCreateFallback();
					}
					// Reset browser speech recognition so the next utterance
					// starts with a clean result set (no stale accumulated text).
					resetBrowserRecognitionRef.current();
					activeInputCaptureEpochRef.current = null;
					pausedInputCaptureEpochRef.current = null;
					// GPT handles routing via delegate_to_rovo function calling —
					// no client-side classification needed.
					break;
				}

				case "speech_started":
					pausedInputCaptureEpochRef.current = null;
					if (
						!isCaptureAvailableRef.current
						|| lastAudioAppendCaptureEpochRef.current !== captureEpochRef.current
					) {
						activeInputCaptureEpochRef.current = null;
						break;
					}
					clearBrowserTranscriptCompletionTimer();
					markSpeechTurnStarted();
					activeInputCaptureEpochRef.current = captureEpochRef.current;
					// Barge-in: stop playback immediately
					stopPlayback();
					resetAssistantTextStream();
					setModelTranscript("");
					setOutputWaveformBars([]);
					pendingTranscriptRef.current = "";
					hasReceivedServerDeltaRef.current = false;
					setCurrentTranscript("");
					if (voiceStateRef.current !== "listening") {
						setVoice("listening");
					}
					onSpeechStartedRef.current?.();
					break;

				case "speech_stopped":
					// VAD detected end of speech. Transcription will follow.
					// Do NOT invalidate activeInputCaptureEpochRef here — the
					// speech was already validated by speech_started, and
					// transcription_completed needs the epoch to process the
					// final transcript. Clearing it on a transient focus change
					// (e.g., OS notification, devtools) would cause the user's
					// message to never get sent.
					break;

				case "response_done":
					{
						const completedAssistantText = finalizeRealtimeAssistantText(
							assistantTextStreamRef.current,
						);
						if (completedAssistantText.text) {
							onAssistantTextCompletedRef.current?.({
								messageId: completedAssistantText.messageId ?? undefined,
								text: completedAssistantText.text,
							});
						}
					}
					resetAssistantTextStream();
					setGenerationState("complete");
					resetGenerationStateSoon();
					break;

				case "function_call": {
					markSpeechResponseStarted();
					const functionCall = resolveRovoRealtimeFunctionCall(message);
					if (message.name === "end_voice_session") {
						// Model decided to end the voice session — disconnect after goodbye audio
						onEndVoiceSessionRef.current?.();
						setTimeout(() => {
							disconnectRef.current();
						}, 1500);
					} else if (message.name === "delegate_to_rovo") {
						// GPT called delegate_to_rovo — parse and forward to shell
						resetAssistantTextStream();
						if (functionCall.kind !== "delegate_to_rovo") {
							if (functionCall.kind === "invalid_delegate_to_rovo_arguments") {
								console.warn("[RealtimeVoice] Ignored unparseable delegate_to_rovo arguments:", functionCall.error);
							}
							break;
						}

						setGenerationState("delegating");
						setCurrentTranscript("");
						onDelegateToRovoRef.current(functionCall.request);
						resetGenerationStateSoon();
					} else if (functionCall.kind === "screen_assistant_tool") {
						// App-owned screen-assistant tool. Hand it to the registered
						// executor, which performs the whitelisted action and returns
						// the result via sendFunctionCallOutput.
						if (functionCall.parseError) {
							console.warn(`[RealtimeVoice] Ignored unparseable ${functionCall.name} arguments:`, functionCall.parseError);
						}
						onToolCallRef.current?.({
							name: functionCall.name,
							args: functionCall.args,
							callId: functionCall.callId,
						});
					}
					break;
				}

				case "error":
					console.error(
						"[RealtimeVoice] Server error:",
						message.error?.message ?? "unknown",
					);
					setStatusMessage(message.error?.message ?? "Voice disconnected");
					// If the upstream OpenAI connection closed, the backend
					// will also close our WS (triggering onclose/reconnect).
					// As a fallback, proactively close our side so the
					// reconnect logic fires even if the backend WS close
					// is delayed or lost.
					if (
						message.error?.code === "connection_closed"
						|| message.error?.code === "connection_error"
					) {
						const ws = wsRef.current;
						if (ws && ws.readyState === WebSocket.OPEN) {
							ws.close();
						}
					}
					break;
			}
		},
		[
			clearBrowserTranscriptCompletionTimer,
			clearResponseCreateFallbackTimer,
			dispatchTextInput,
			ensureOutputWaveformSampling,
			ensureActiveSpeechTurn,
			hasCompletedActiveSpeechTurn,
			injectContext,
			markActiveSpeechTurnCompleted,
			markSpeechResponseStarted,
			markSpeechTurnStarted,
			schedulePlaybackDrainCheck,
			scheduleResponseCreateFallback,
			resetGenerationStateSoon,
			resetAssistantTextStream,
			sendWsMessage,
			sessionPolicyMode,
			setVoice,
			stopPlayback,
		],
	);

	// -- Cleanup helper ------------------------------------------------------

	const cleanupConnection = useCallback(() => {
		if (reconnectTimerRef.current !== null) {
			clearTimeout(reconnectTimerRef.current);
			reconnectTimerRef.current = null;
		}
		if (generationResetTimerRef.current !== null) {
			clearTimeout(generationResetTimerRef.current);
			generationResetTimerRef.current = null;
		}
		clearResponseCreateFallbackTimer();
		clearBrowserTranscriptCompletionTimer();
		clearPlaybackDrainTimer();
		stopOutputWaveformSampling();
		if (wsRef.current) {
			wsRef.current.onopen = null;
			wsRef.current.onmessage = null;
			wsRef.current.onclose = null;
			wsRef.current.onerror = null;
			if (
				wsRef.current.readyState === WebSocket.OPEN ||
				wsRef.current.readyState === WebSocket.CONNECTING
			) {
				wsRef.current.close();
			}
			wsRef.current = null;
		}
		stopMicCapture();
		if (playbackQueueRef.current) {
			destroyPlaybackQueue(playbackQueueRef.current);
			playbackQueueRef.current = null;
		}
		pendingTranscriptRef.current = "";
		hasReceivedServerDeltaRef.current = false;
		serverTranscriptionActiveRef.current = false;
		manualTurnTakingRef.current = false;
		lastAudioDeltaAtRef.current = null;
		activeInputCaptureEpochRef.current = null;
		pausedInputCaptureEpochRef.current = null;
		lastAudioAppendCaptureEpochRef.current = null;
		isAwaitingSpeechResponseRef.current = false;
		transcriptionOnlyModeRef.current = false;
		explicitResponseOnlyModeRef.current = false;
		resetSpeechTurnTracking();
		resetAssistantTextStream();
		setOutputWaveformBars([]);
	}, [
		clearBrowserTranscriptCompletionTimer,
		clearResponseCreateFallbackTimer,
		clearPlaybackDrainTimer,
		resetSpeechTurnTracking,
		resetAssistantTextStream,
		stopMicCapture,
		stopOutputWaveformSampling,
	]);

	// Keep cleanupConnectionRef in sync so the unmount effect avoids TDZ during HMR
	useEffect(() => {
		cleanupConnectionRef.current = cleanupConnection;
	}, [cleanupConnection]);

	// -- Connect / reconnect -------------------------------------------------

	const connectWs = useCallback(() => {
		if (!activeRef.current) {
			return;
		}

		setVoice("connecting");
		setConnectionState(reconnectAttemptRef.current > 0 ? "reconnecting" : "connecting");
		setStatusMessage(
			reconnectAttemptRef.current > 0 ? "Reconnecting voice..." : null,
		);

		void buildRealtimeWsUrl().then((url) => {
			if (!activeRef.current) {
				return;
			}

			const ws = new WebSocket(url);
			wsRef.current = ws;

			// Initialize playback queue
			if (!playbackQueueRef.current) {
				playbackQueueRef.current = createPlaybackQueue();
			}

			ws.onopen = () => {
				if (!activeRef.current) {
					ws.close();
					return;
				}
				void startMicCapture().catch((error) => {
					console.error("[RealtimeVoice] Mic capture failed:", error);
					activeRef.current = false;
					cleanupConnection();
					setConnectionState("disconnected");
					setStatusMessage("Voice disconnected");
					setVoice("idle");
					setGenerationState("idle");
				});
			};

			ws.onmessage = handleServerMessage;

			ws.onclose = () => {
				if (!activeRef.current) {
					return;
				}

				// Attempt reconnect
				const attempt = reconnectAttemptRef.current;
				if (attempt < MAX_RECONNECT_ATTEMPTS) {
					setVoice("connecting");
					setConnectionState("reconnecting");
					setStatusMessage("Reconnecting voice...");
					const delay = RECONNECT_DELAYS[attempt] ?? 2_000;
					reconnectAttemptRef.current = attempt + 1;
					stopMicCapture();
					reconnectTimerRef.current = setTimeout(() => {
						reconnectTimerRef.current = null;
						if (activeRef.current) {
							connectWsRef.current();
						}
					}, delay);
				} else {
					// Max retries exceeded — exit voice mode gracefully
					activeRef.current = false;
					cleanupConnection();
					setConnectionState("disconnected");
					setStatusMessage("Voice disconnected");
					setVoice("idle");
					setGenerationState("idle");
				}
			};

			ws.onerror = () => {
				// onclose will handle reconnection
			};
		}).catch((error) => {
			console.error("[RealtimeVoice] Failed to resolve WS URL:", error);
			activeRef.current = false;
			setConnectionState("disconnected");
			setStatusMessage("Voice disconnected");
			setVoice("idle");
		});
	}, [
		cleanupConnection,
		handleServerMessage,
		setVoice,
		startMicCapture,
		stopMicCapture,
	]);

	useEffect(() => {
		connectWsRef.current = connectWs;
	}, [connectWs]);

	// -- Public API ----------------------------------------------------------

	const connect = useCallback((options?: RealtimeVoiceConnectOptions) => {
		if (activeRef.current) {
			return;
		}
		const sessionPolicy = resolveRovoRealtimeVoiceSessionPolicy({
			explicitResponseOnly: options?.explicitResponseOnly,
			mode: sessionPolicyMode,
			transcriptionOnly: options?.transcriptionOnly,
		});
		transcriptionOnlyModeRef.current = sessionPolicy.transcriptionOnly;
		explicitResponseOnlyModeRef.current = sessionPolicy.explicitResponseOnly;
		activeRef.current = true;
		serverTranscriptionActiveRef.current = false;
		manualTurnTakingRef.current = false;
		isCaptureAvailableRef.current = resolveCaptureAvailability();
		if (!isCaptureAvailableRef.current) {
			captureEpochRef.current += 1;
		}
		resetSpeechTurnTracking();
		startBrowserRecognition(); // start listening immediately when the tab is eligible
		reconnectAttemptRef.current = 0;
		stopOutputWaveformSampling();
		resetAssistantTextStream();
		setCurrentTranscript("");
		setModelTranscript("");
		lastAudioDeltaAtRef.current = null;
		setConnectionState("connecting");
		setStatusMessage(null);
		setGenerationState("idle");
		connectWs();
		setOutputWaveformBars([]);
		syncCaptureAvailability();
	}, [
		connectWs,
		resetSpeechTurnTracking,
		resetAssistantTextStream,
		resolveCaptureAvailability,
		sessionPolicyMode,
		startBrowserRecognition,
		stopOutputWaveformSampling,
		syncCaptureAvailability,
	]);

	const sendTextInput = useCallback(async ({
		contextDescription,
		text,
	}: {
		contextDescription?: string;
		messageId?: string;
		text: string;
	}) => {
		const trimmedText = text.trim();
		if (!trimmedText) {
			return;
		}

		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			queuedTextInputsRef.current.push({
				contextDescription,
				text: trimmedText,
			});
			return;
		}

		dispatchTextInput({
			contextDescription,
			text: trimmedText,
		});
	}, [dispatchTextInput]);

	const sendFunctionCallOutput = useCallback(({
		callId,
		output,
		createResponse,
	}: {
		callId: string;
		output: unknown;
		createResponse?: boolean;
	}) => {
		if (!callId) return;
		sendWsMessage({
			type: "function_call_output",
			callId,
			output: typeof output === "string" ? output : JSON.stringify(output ?? {}),
			...(createResponse === false ? { createResponse: false } : {}),
		});
	}, [sendWsMessage]);

	const disconnect = useCallback(() => {
		activeRef.current = false;
		isCaptureAvailableRef.current = false;
		transcriptionOnlyModeRef.current = false;
		explicitResponseOnlyModeRef.current = false;
		serverTranscriptionActiveRef.current = false;
		manualTurnTakingRef.current = false;
		queuedTextInputsRef.current = [];
		resetSpeechTurnTracking();
		cleanupConnection();
		resetAssistantTextStream();
		setConnectionState("idle");
		setStatusMessage(null);
		setVoice("idle");
		setGenerationState("idle");
		setCurrentTranscript("");
		setModelTranscript("");
		stopOutputWaveformSampling();
		lastAudioDeltaAtRef.current = null;
		setOutputWaveformBars([]);
	}, [
		cleanupConnection,
		resetAssistantTextStream,
		resetSpeechTurnTracking,
		setVoice,
		stopOutputWaveformSampling,
	]);

	// Keep disconnectRef in sync so handleServerMessage can call it
	useEffect(() => {
		disconnectRef.current = disconnect;
	}, [disconnect]);

	// -- Cleanup on unmount --------------------------------------------------

	useEffect(() => {
		return () => {
			activeRef.current = false;
			cleanupConnectionRef.current();
		};
	}, [cleanupConnection]);

	// -- Return --------------------------------------------------------------

	const isConnected =
		voiceState === "listening" || voiceState === "speaking";

	return {
		connect,
		disconnect,
		sendTextInput,
		sendFunctionCallOutput,
		voiceState,
		generationState,
		isConnected,
		isReconnecting: connectionState === "reconnecting",
		connectionState,
		statusMessage,
		currentTranscript,
		modelTranscript,
		outputWaveformBars,
		micStream,
		injectContext,
	};
}
