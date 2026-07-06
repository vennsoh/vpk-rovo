"use client";

import { ClickyOverlay } from "@/components/projects/rovo-core/components/clicky/clicky-overlay";
import { useClicky } from "@/components/projects/rovo-core/hooks/use-clicky";
import { useRealtimeVoice } from "@/components/projects/studio/hooks/use-realtime-voice";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { detectAgentTeamIntent } from "./agent-team-intent";
import { pickAgentTeamLine } from "./agent-team-lines";
import { CURSOR_AGENT_COUNT } from "./cursor-agents";
import { CursorFanOut, type CursorFanOutBurst } from "./cursor-fan-out";
import { CursorSpeechBubble } from "./cursor-speech-bubble";
import { CursorVoiceControl } from "./cursor-voice-control";
import { detectLaunchIntent } from "./launch-intent";

interface CursorsProps {
	className?: string;
}

// Stable empty thread context — this art has no chat surface to summarize.
const NO_CHAT_MESSAGES: RovoUIMessage[] = [];
// Number of companion cursors in a team (kept in sync with CursorFanOut).
const FAN_COUNT = CURSOR_AGENT_COUNT;
// Total time for the staggered launch send-off before the team is cleared.
const LAUNCH_SEQUENCE_MS = 2500;
// How long Rovo's reply lingers (in the cursor-following bubble) after the last
// streamed delta before it clears.
const SPEECH_LINGER_MS = 3000;
// How long the team caption ("The Rovo gang's all here.") holds before it
// scales back out — the team cursors stay, only the caption dismisses (mirrors
// the cursor's "Yo, let's cook" welcome, which auto-dismisses while the cursor
// persists).
const TEAM_CAPTION_HOLD_MS = 2600;

function resolveDeltaText(payload: { text?: string; transcript?: string } | string): string | undefined {
	if (typeof payload === "string") {
		return payload;
	}
	return payload.text ?? payload.transcript;
}

/**
 * Cursors — the live-voice + Rovo cursor control (no text composer).
 *
 * Voice uses the same `useRealtimeVoice` hook as the Studio composer, streaming to the
 * realtime GPT model through the AI Gateway-backed `/api/realtime/audio-conversation`
 * socket. The cursor + voice rail is always visible. The floating Rovo cursor is rendered
 * by `ClickyOverlay` (driven by `useClicky`). Say "create me a team of agents" and the
 * cursor multiplies into a fanned-out team; say "let's go" and the team launches off-
 * screen one-by-one with tiny send-off tooltips.
 */
export default function Cursors({ className }: Readonly<CursorsProps>) {
	const clicky = useClicky();
	const [burst, setBurst] = useState<CursorFanOutBurst | null>(null);
	const [launching, setLaunching] = useState(false);
	// Whether the dispatched team is now "working" (rail reveals the team on hover).
	const [working, setWorking] = useState(false);
	// Rovo's streamed reply, shown in a cursor-following bubble (null = silent).
	const [speech, setSpeech] = useState<string | null>(null);
	// The team caption, shown briefly then auto-dismissed (team cursors persist).
	const [teamCaption, setTeamCaption] = useState<string | null>(null);
	const burstIdRef = useRef(0);
	const pointerRef = useRef<{ x: number; y: number } | null>(null);
	const clickyActiveRef = useRef(false);
	clickyActiveRef.current = clicky.isActive;
	// The last line shown (avoid immediate repeats), whether a team is up (so the
	// model's real answer doesn't overwrite the funny caption), and whether the
	// team is mid-launch (so a second "let's go" doesn't restart it).
	const lastLineRef = useRef<string | null>(null);
	const burstActiveRef = useRef(false);
	const launchingRef = useRef(false);
	launchingRef.current = launching;
	const launchTimerRef = useRef<number | null>(null);
	const speechTimerRef = useRef<number | null>(null);
	const captionTimerRef = useRef<number | null>(null);

	// Track the pointer so the fan-out can originate where the Rovo cursor is.
	useEffect(() => {
		pointerRef.current = { x: window.innerWidth / 2, y: window.innerHeight * 0.55 };
		const handlePointerMove = (event: PointerEvent) => {
			pointerRef.current = { x: event.clientX, y: event.clientY };
		};
		window.addEventListener("pointermove", handlePointerMove, { passive: true });
		return () => window.removeEventListener("pointermove", handlePointerMove);
	}, []);

	useEffect(
		() => () => {
			if (launchTimerRef.current !== null) {
				window.clearTimeout(launchTimerRef.current);
			}
			if (speechTimerRef.current !== null) {
				window.clearTimeout(speechTimerRef.current);
			}
			if (captionTimerRef.current !== null) {
				window.clearTimeout(captionTimerRef.current);
			}
		},
		[],
	);

	const triggerFanOut = useCallback(() => {
		const origin = pointerRef.current ?? {
			x: window.innerWidth / 2,
			y: window.innerHeight * 0.55,
		};
		const line = pickAgentTeamLine(lastLineRef.current);
		lastLineRef.current = line;
		// Re-summoning from a working state starts fresh.
		setWorking(false);
		burstActiveRef.current = true;
		burstIdRef.current += 1;
		setBurst({ id: burstIdRef.current, x: origin.x, y: origin.y, line });
		// Show the caption, then let it scale back out on its own — the team
		// cursors stay up, only the caption dismisses (like the welcome bubble).
		setTeamCaption(line);
		if (captionTimerRef.current !== null) {
			window.clearTimeout(captionTimerRef.current);
		}
		captionTimerRef.current = window.setTimeout(() => {
			captionTimerRef.current = null;
			setTeamCaption(null);
		}, TEAM_CAPTION_HOLD_MS);
	}, []);

	const clearTeam = useCallback(() => {
		if (launchTimerRef.current !== null) {
			window.clearTimeout(launchTimerRef.current);
			launchTimerRef.current = null;
		}
		if (speechTimerRef.current !== null) {
			window.clearTimeout(speechTimerRef.current);
			speechTimerRef.current = null;
		}
		if (captionTimerRef.current !== null) {
			window.clearTimeout(captionTimerRef.current);
			captionTimerRef.current = null;
		}
		burstActiveRef.current = false;
		setBurst(null);
		setLaunching(false);
		setWorking(false);
		setSpeech(null);
		setTeamCaption(null);
	}, []);

	// The team has been dispatched — drop the launch visuals and enter the
	// "working" state (the rail now reveals the team on hover). burstActiveRef
	// is cleared so Rovo replies flow back into the cursor-following bubble.
	const enterWorking = useCallback(() => {
		if (launchTimerRef.current !== null) {
			window.clearTimeout(launchTimerRef.current);
			launchTimerRef.current = null;
		}
		burstActiveRef.current = false;
		setBurst(null);
		setLaunching(false);
		setWorking(true);
	}, []);

	// Stagger the team off-screen, then enter the working state once the last
	// cursor has flown.
	const startLaunch = useCallback(() => {
		// Drop any lingering team caption before the send-off begins.
		if (captionTimerRef.current !== null) {
			window.clearTimeout(captionTimerRef.current);
			captionTimerRef.current = null;
		}
		setTeamCaption(null);
		setLaunching(true);
		if (launchTimerRef.current !== null) {
			window.clearTimeout(launchTimerRef.current);
		}
		launchTimerRef.current = window.setTimeout(enterWorking, LAUNCH_SEQUENCE_MS);
	}, [enterWorking]);

	const realtime = useRealtimeVoice({
		// No Rovo chat surface in the art — keep the session conversational only.
		onDelegateToRovo: () => {},
		chatMessages: NO_CHAT_MESSAGES,
		// Drive the on-screen cursor from the live conversation, like Studio.
		onSpeechStarted: () => clicky.startListening(),
		onAssistantTextDelta: (payload) => {
			// While the team is up, the team caption stands in for Rovo's reply.
			if (burstActiveRef.current) {
				return;
			}
			// The reply bubble is cursor UI — if cursor mode is off (voice-only,
			// after toggling the cursor off while voice keeps running), don't
			// render a floating cursor-following bubble with no cursor.
			if (!clickyActiveRef.current) {
				return;
			}
			const text = resolveDeltaText(payload);
			if (!text) {
				return;
			}
			// Show Rovo's reply in a cursor-following bubble. The empty startSpeaking
			// keeps the cursor's speaking glyph without the overlay's fixed bubble.
			clicky.startSpeaking("");
			setSpeech(text);
			if (speechTimerRef.current !== null) {
				window.clearTimeout(speechTimerRef.current);
			}
			speechTimerRef.current = window.setTimeout(() => {
				speechTimerRef.current = null;
				setSpeech(null);
				clicky.returnToIdle();
			}, SPEECH_LINGER_MS);
		},
		onSpeechTranscriptCompleted: (payload) => {
			const text = resolveDeltaText(payload);
			if (!text) {
				return;
			}
			// With a team up, "let's go" sends them off; otherwise asking for a
			// team of agents fans a new one out.
			if (burstActiveRef.current) {
				if (!launchingRef.current && detectLaunchIntent(text)) {
					startLaunch();
				}
				return;
			}
			if (clickyActiveRef.current && detectAgentTeamIntent(text)) {
				triggerFanOut();
			}
		},
	});

	// Cursor mode + live voice come up together, mirroring the Studio composer.
	const startRealtimeVoice = useCallback(() => {
		clicky.activate();
		realtime.connect();
	}, [clicky, realtime]);

	const handleToggleRealtimeVoice = useCallback(() => {
		if (realtime.voiceState === "idle") {
			startRealtimeVoice();
			return;
		}

		realtime.disconnect();
		clicky.deactivate();
		clearTeam();
	}, [clearTeam, clicky, realtime, startRealtimeVoice]);

	// Activating the cursor starts voice; deactivating it leaves voice running
	// (only the waveform/stop control disconnects) — same contract as Studio.
	const handleToggleClicky = useCallback(() => {
		if (clicky.isActive) {
			clicky.deactivate();
			clearTeam();
			return;
		}

		startRealtimeVoice();
	}, [clearTeam, clicky, startRealtimeVoice]);

	// Rovo's line: the auto-dismissing team caption while a team is up, otherwise
	// the streamed reply. Shown in a bubble that trails the cursor.
	const captionText = teamCaption ?? speech;

	return (
		<div className={cn("flex items-center justify-center bg-surface px-6 py-16", className)}>
			{/* Always-visible cursor + voice rail. Voice stays idle (calm static
			    waveform) until the human clicks — nothing auto-connects. */}
			<CursorVoiceControl
				clickyActive={clicky.isActive}
				voiceActive={realtime.voiceState !== "idle"}
				listening={realtime.voiceState === "listening"}
				micStream={realtime.micStream}
				working={working}
				onToggleCursor={handleToggleClicky}
				onToggleVoice={handleToggleRealtimeVoice}
			/>

			<ClickyOverlay
				state={clicky.state}
				pointTarget={clicky.pointTarget}
				responseText={clicky.responseText}
				onReturnToIdle={clicky.returnToIdle}
			/>

			<CursorFanOut burst={burst} count={FAN_COUNT} launching={launching} />

			<AnimatePresence>
				{captionText ? <CursorSpeechBubble key="rovo-speech" text={captionText} /> : null}
			</AnimatePresence>
		</div>
	);
}
