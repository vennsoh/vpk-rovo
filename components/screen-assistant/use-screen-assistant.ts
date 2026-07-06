"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createId } from "@/lib/utils";
import { useClicky } from "@/components/projects/rovo-core/hooks/use-clicky";
import { useClickyVoice } from "@/components/projects/studio/hooks/use-clicky-voice";
import {
	type DelegationRequest,
	useRealtimeVoice,
} from "@/components/projects/studio/hooks/use-realtime-voice";
import {
	activateStudioScreenAssistantTarget,
	createStudioScreenAssistantSnapshot,
	groundStudioScreenAssistantTarget,
	type StudioScreenAssistantRegion,
	type StudioScreenAssistantSnapshot,
	type StudioScreenAssistantVisibleTarget,
} from "@/components/projects/rovo-core/lib/screen-assistant";
import { normalizeAgentDraftPatch } from "@/components/projects/studio/lib/studio-agent-draft-patch";
import type {
	ScreenAssistantAdapter,
	ScreenAssistantTranscriptEntry,
	UseScreenAssistantOptions,
} from "./types";
import { viewportPointFromTarget } from "./screen-assistant-geometry";

const DEFAULT_COMPOSER_PLACEHOLDER = "Ask the screen assistant…";

export interface ScreenAssistantTextEntry {
	id: string;
	role: "user" | "assistant";
	text: string;
}

export interface UseScreenAssistantResult {
	/** AI cursor (Clicky) state machine handle. */
	clicky: ReturnType<typeof useClicky>;
	/** Realtime voice (Live chat) handle. */
	realtime: ReturnType<typeof useRealtimeVoice>;
	/** Whether the AI cursor companion is active. */
	isActive: boolean;
	/** Whether a Realtime voice session is live. */
	isRealtimeActive: boolean;
	/** Toggle the AI cursor on/off. */
	toggleCursor: () => void;
	/** Toggle the Realtime voice session on/off. */
	toggleVoice: () => void;
	/** Completed live-chat transcript entries. */
	transcript: ScreenAssistantTranscriptEntry[];
	/** Clear the transcript log. */
	clearTranscript: () => void;
	/** In-flight user transcript (interim speech), if any. */
	liveUserTranscript: string;
	/** In-flight assistant text (streaming), if any. */
	liveAssistantTranscript: string;
	/** Controlled composer text (used by set/submit composer defaults). */
	composerText: string;
	setComposerText: (text: string) => void;
	/** Current painted screen region, if any. */
	activeRegion: StudioScreenAssistantRegion | null;
	/** Clear the current painted region. */
	clearRegion: () => void;
	/** Set the current painted region from the overlay. */
	setActiveRegion: (region: StudioScreenAssistantRegion | null) => void;
	/** Return visible targets for region target-hint calculation. */
	getVisibleTargets: () => readonly StudioScreenAssistantVisibleTarget[];
	/** Send composer/typed text into the Live chat session. */
	sendText: (text: string) => void;
	/** Drive the cursor state machine directly (offline harness). */
	simulate: {
		listening: () => void;
		processing: () => void;
		speaking: (text?: string) => void;
		point: () => void;
	};
}

/**
 * Composes the two Studio experiences — the Clicky AI cursor and the OpenAI
 * Realtime "Live chat" — into one route-neutral unit. The wiring mirrors the
 * Studio shell's screen-assistant integration (state transitions, app-owned
 * tool execution, voice bridge) but is decoupled from Studio-specific chat,
 * agent-registry, and artifact plumbing via the {@link ScreenAssistantAdapter}.
 */
export function useScreenAssistant({
	adapter,
	chatMessages,
	defaultActive = false,
	onActiveChange,
}: UseScreenAssistantOptions = {}): UseScreenAssistantResult {
	const clicky = useClicky();
	const {
		isActive: isClickyActive,
		toggle: toggleClicky,
		activate: activateClicky,
		startListening: clickyStartListening,
		startProcessing: clickyStartProcessing,
		startSpeaking: clickyStartSpeaking,
		startPointing: clickyStartPointing,
		addExchange: clickyAddExchange,
	} = clicky;

	const [transcript, setTranscript] = useState<ScreenAssistantTranscriptEntry[]>([]);
	const [liveUserTranscript, setLiveUserTranscript] = useState("");
	const [composerText, setComposerText] = useState("");
	const [activeRegion, setActiveRegion] = useState<StudioScreenAssistantRegion | null>(null);

	// Stable refs so the screen-assistant tool executor (created with the
	// realtime hook) can reach the latest values without re-creating the hook.
	const adapterRef = useRef<ScreenAssistantAdapter | undefined>(adapter);
	useEffect(() => {
		adapterRef.current = adapter;
	}, [adapter]);

	const composerTextRef = useRef(composerText);
	useEffect(() => {
		composerTextRef.current = composerText;
	}, [composerText]);

	const isClickyActiveRef = useRef(isClickyActive);
	useEffect(() => {
		isClickyActiveRef.current = isClickyActive;
	}, [isClickyActive]);

	const onActiveChangeRef = useRef(onActiveChange);
	useEffect(() => {
		onActiveChangeRef.current = onActiveChange;
	}, [onActiveChange]);

	const sendFunctionCallOutputRef = useRef<
		((payload: { callId: string; output: unknown; createResponse?: boolean }) => void) | null
	>(null);
	const sendTextInputRef = useRef<
		((payload: { text: string }) => void | Promise<void>) | null
	>(null);

	// Track pointer position for snapshot pointer-context (matches the shell).
	const pointerRef = useRef<{ x: number; y: number } | null>(null);
	useEffect(() => {
		const handlePointerMove = (event: PointerEvent) => {
			pointerRef.current = { x: event.clientX, y: event.clientY };
		};
		window.addEventListener("pointermove", handlePointerMove, { passive: true });
		return () => window.removeEventListener("pointermove", handlePointerMove);
	}, []);

	useEffect(() => {
		onActiveChangeRef.current?.(isClickyActive);
	}, [isClickyActive]);

	useEffect(() => {
		if (!isClickyActive) {
			setActiveRegion(null);
		}
	}, [isClickyActive]);

	const appendTranscript = useCallback(
		(role: ScreenAssistantTranscriptEntry["role"], content: string) => {
			const trimmed = content.trim();
			if (!trimmed) return;
			setTranscript((prev) => [
				...prev,
				{ id: createId("screen-assistant-msg"), role, content: trimmed },
			]);
		},
		[],
	);

	// Default screen snapshot — live DOM scan when the host provides none.
	const getSnapshot = useCallback((): StudioScreenAssistantSnapshot => {
		const fromAdapter = adapterRef.current?.getSnapshot;
		if (fromAdapter) {
			const snapshot = fromAdapter();
			return activeRegion ? { ...snapshot, activeRegion } : snapshot;
		}
		return createStudioScreenAssistantSnapshot({
			activeRegion,
			activePanel: "sandbox",
			composer: {
				placeholder: DEFAULT_COMPOSER_PLACEHOLDER,
				hasPrefill: Boolean(composerTextRef.current.trim()),
			},
			pointer: pointerRef.current,
		});
	}, [activeRegion]);

	const getVisibleTargets = useCallback(
		(): readonly StudioScreenAssistantVisibleTarget[] => getSnapshot().visibleTargets,
		[getSnapshot],
	);

	const handleDelegateToRovo = useCallback((request: DelegationRequest) => {
		const fromAdapter = adapterRef.current?.onDelegateToRovo;
		if (fromAdapter) {
			fromAdapter(request);
			return;
		}
		appendTranscript("system", `Delegated to Rovo: ${request.prompt}`);
	}, [appendTranscript]);

	const realtime = useRealtimeVoice({
		chatMessages: chatMessages ?? [],
		isGenerating: false,
		onDelegateToRovo: handleDelegateToRovo,
		onSpeechStarted: useCallback(() => {
			setLiveUserTranscript("");
			if (isClickyActiveRef.current) {
				clickyStartListening();
			}
		}, [clickyStartListening]),
		onSpeechTranscriptDelta: useCallback((payload: { delta?: string; text?: string } | string) => {
			const text = typeof payload === "string" ? payload : (payload.text ?? payload.delta ?? "");
			if (text) {
				setLiveUserTranscript(text);
			}
		}, []),
		onSpeechTranscriptCompleted: useCallback((payload: { transcript?: string; text?: string } | string) => {
			const text = typeof payload === "string" ? payload : (payload.transcript ?? payload.text ?? "");
			setLiveUserTranscript("");
			if (!text) return;
			if (isClickyActiveRef.current) {
				clickyStartProcessing();
				clickyAddExchange({ role: "user", content: text });
			}
			appendTranscript("user", text);
			}, [appendTranscript, clickyAddExchange, clickyStartProcessing]),
		onAssistantTextDelta: useCallback((payload: { displayOnly?: boolean; source?: "text" | "audio_transcript"; text?: string } | string) => {
			const text = typeof payload === "string" ? payload : (payload.text ?? "");
			if (!text || !isClickyActiveRef.current) return;
			clickyStartSpeaking(text);
			}, [clickyStartSpeaking]),
		onAssistantTextCompleted: useCallback((payload: { text?: string } | string) => {
			const text = typeof payload === "string" ? payload : (payload.text ?? "");
			if (!text) return;
			if (isClickyActiveRef.current) {
				clickyAddExchange({ role: "assistant", content: text });
				clickyStartSpeaking(text);
			}
			appendTranscript("assistant", text);
			}, [appendTranscript, clickyAddExchange, clickyStartSpeaking]),
		onToolCall: useCallback(
			({ name, args, callId }: { name: string; args: Record<string, unknown>; callId: string }) => {
				const respond = (output: unknown, createResponse?: boolean) =>
					sendFunctionCallOutputRef.current?.({
						callId,
						output,
						...(createResponse === false ? { createResponse: false } : {}),
					});

				switch (name) {
					case "get_screen_state": {
						respond(getSnapshot());
						return;
					}
					case "point_at_target": {
						const snapshot = getSnapshot();
						const grounded = groundStudioScreenAssistantTarget({
							fieldId: typeof args.fieldId === "string" ? args.fieldId : undefined,
							id: typeof args.targetId === "string" ? args.targetId : undefined,
							label: typeof args.label === "string" ? args.label : undefined,
							activeRegion: snapshot.activeRegion ?? null,
							pointerTarget: snapshot.pointerContext?.target ?? null,
							visibleTargets: snapshot.visibleTargets,
						});
						const point = viewportPointFromTarget(grounded);
						const label = typeof args.label === "string" ? args.label : grounded?.label ?? "";
						let pointingStarted = false;
						if (point) {
							if (!isClickyActiveRef.current) {
								activateClicky();
							}
							clickyStartPointing(point, label);
							pointingStarted = true;
						}
						respond({
							ok: pointingStarted,
							pointed: pointingStarted && grounded ? { id: grounded.id, label: grounded.label } : null,
						});
						return;
					}
					case "activate_screen_target": {
						const snapshot = getSnapshot();
						respond(activateStudioScreenAssistantTarget({
							fieldId: typeof args.fieldId === "string" ? args.fieldId : undefined,
							id: typeof args.targetId === "string" ? args.targetId : undefined,
							label: typeof args.label === "string" ? args.label : undefined,
							pointerTarget: snapshot.pointerContext?.target ?? null,
							visibleTargets: snapshot.visibleTargets,
						}));
						return;
					}
					case "set_composer_text": {
						const text = typeof args.text === "string" ? args.text : "";
						if (adapterRef.current?.onSetComposerText) {
							adapterRef.current.onSetComposerText(text);
						} else {
							setComposerText(text);
						}
						respond({ ok: Boolean(text) });
						return;
					}
					case "submit_composer": {
						const text = (adapterRef.current?.getComposerText?.() ?? composerTextRef.current).trim();
						if (text) {
							if (adapterRef.current?.onSubmitComposer) {
								adapterRef.current.onSubmitComposer(text);
							} else {
								void sendTextInputRef.current?.({ text });
								appendTranscript("user", text);
								setComposerText("");
							}
						}
						respond({ ok: Boolean(text) });
						return;
					}
					case "apply_agent_draft_patch": {
						const normalized = normalizeAgentDraftPatch(args.patch);
						let ok = false;
						if (normalized && adapterRef.current?.onApplyAgentDraftPatch) {
							ok = adapterRef.current.onApplyAgentDraftPatch(normalized);
						}
						respond({ ok });
						return;
					}
					default:
						respond({ ok: false, error: "unknown_tool" });
				}
			},
			[activateClicky, appendTranscript, clickyStartPointing, getSnapshot],
		),
	});

	// Keep the tool executor pointed at the latest realtime handlers without
	// re-creating the realtime hook.
	sendFunctionCallOutputRef.current = realtime.sendFunctionCallOutput;
	sendTextInputRef.current = ({ text }) => realtime.sendTextInput({ text });

	// Bridge the AI cursor activation to the Realtime voice session + Clicky
	// system prompt (reuses the Studio voice bridge verbatim).
	useClickyVoice({
		isClickyActive,
		isRealtimeConnected: realtime.isConnected,
		connectRealtime: realtime.connect,
		injectContext: realtime.injectContext,
	});

	// Optional auto-activation on mount.
	const didAutoActivateRef = useRef(false);
	useEffect(() => {
		if (defaultActive && !didAutoActivateRef.current) {
			didAutoActivateRef.current = true;
			activateClicky();
		}
	}, [defaultActive, activateClicky]);

	const sendText = useCallback((text: string) => {
		const trimmed = text.trim();
		if (!trimmed) return;
		if (isClickyActiveRef.current) {
			clickyStartProcessing();
			clickyAddExchange({ role: "user", content: trimmed });
		}
		appendTranscript("user", trimmed);
		void realtime.sendTextInput({ text: trimmed });
		setComposerText("");
	}, [appendTranscript, clickyAddExchange, clickyStartProcessing, realtime]);

	const toggleVoice = useCallback(() => {
		if (realtime.voiceState === "idle") {
			realtime.connect();
		} else {
			realtime.disconnect();
		}
	}, [realtime]);

	const clearTranscript = useCallback(() => {
		setTranscript([]);
		clicky.clearHistory();
	}, [clicky]);

	const clearRegion = useCallback(() => {
		setActiveRegion(null);
	}, []);

	const simulate = useMemo(() => ({
		listening: () => {
			if (!isClickyActiveRef.current) activateClicky();
			clickyStartListening();
		},
		processing: () => {
			if (!isClickyActiveRef.current) activateClicky();
			clickyStartProcessing();
		},
		speaking: (text?: string) => {
			if (!isClickyActiveRef.current) activateClicky();
			clickyStartProcessing();
			const message = text ?? "Here's what I found on this screen.";
			clickyStartSpeaking(message);
			clickyAddExchange({ role: "assistant", content: message });
			appendTranscript("assistant", message);
		},
		point: () => {
			if (!isClickyActiveRef.current) activateClicky();
			const snapshot = getSnapshot();
			const grounded = snapshot.visibleTargets[0] ?? null;
			const point = viewportPointFromTarget(grounded);
			clickyStartProcessing();
			if (point) {
				clickyStartPointing(point, point.label);
			} else {
				clickyStartSpeaking("I couldn't find a target to point at on this screen.");
			}
		},
	}), [
		activateClicky,
		appendTranscript,
		clickyAddExchange,
		clickyStartListening,
		clickyStartPointing,
		clickyStartProcessing,
		clickyStartSpeaking,
		getSnapshot,
	]);

	return {
		clicky,
		realtime,
		isActive: isClickyActive,
		isRealtimeActive: realtime.voiceState !== "idle",
		toggleCursor: toggleClicky,
		toggleVoice,
		transcript,
		clearTranscript,
		liveUserTranscript,
		liveAssistantTranscript: realtime.modelTranscript,
		composerText,
		setComposerText,
		activeRegion,
		clearRegion,
		setActiveRegion,
		getVisibleTargets,
		sendText,
		simulate,
	};
}
