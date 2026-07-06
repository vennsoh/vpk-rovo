"use client";

// oxlint-disable react-doctor/no-initialize-state -- These components intentionally seed local interactive state from props once before user edits take ownership.

import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ClickyState, ClickyPointTarget } from "@/components/projects/rovo-core/hooks/use-clicky";
import { ClickyCursor } from "./clicky-cursor";
import { ClickyResponseOverlay } from "@/components/projects/rovo-core/components/clicky/clicky-response-overlay";
import { ClickySpeechBubble } from "@/components/projects/rovo-core/components/clicky/clicky-speech-bubble";

// ---------------------------------------------------------------------------
// Cursor overlay constants
// ---------------------------------------------------------------------------

const TRACKING_OFFSET_X = 35;
const TRACKING_OFFSET_Y = 25;
const CURSOR_TIP_X = 8;
const CURSOR_TIP_Y = 0;
const IDLE_ROTATION = -35;
const FOLLOW_SPRING = { damping: 12, stiffness: 250, mass: 0.4 };
const ARC_HEIGHT_RATIO = 0.2;
const ARC_HEIGHT_MAX = 80;
const FLIGHT_SPEED = 800;
const FLIGHT_MIN_S = 0.6;
const FLIGHT_MAX_S = 1.4;
const FLIGHT_SCALE_BOOST = 0.3;

/** Hold time at target before return transition (ms) */
const POINT_HOLD_MS = 3000;
/** Bubble fade-out duration before return flight (ms) */
const BUBBLE_FADE_MS = 500;
const RESPONSE_SETTLE_MS = 2400;
const WELCOME_MESSAGE = "Yo, let's cook";
const WELCOME_DISMISS_AFTER_TYPE_MS = 1600;
const ROVO_CURSOR_TRIGGER_SELECTOR = 'button[aria-label="Rovo cursor"], button[aria-label="Rovo Cursor"]';
/** Mouse movement threshold to interrupt return flight (px) */
const RETURN_INTERRUPT_DISTANCE = 100;
const NAV_PHRASES = [
	"right here!",
	"this one!",
	"over here!",
	"here it is!",
	"look here!",
	"see this?",
];

// ---------------------------------------------------------------------------
// Math utilities
// ---------------------------------------------------------------------------

function smoothstep(t: number): number {
	return t * t * (3 - 2 * t);
}

function quadBezier(t: number, p0: number, p1: number, p2: number): number {
	const u = 1 - t;
	return u * u * p0 + 2 * u * t * p1 + t * t * p2;
}

function quadBezierTangent(t: number, p0: number, p1: number, p2: number): number {
	return 2 * (1 - t) * (p1 - p0) + 2 * t * (p2 - p1);
}

function pickRandom<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Shared bezier flight runner
// ---------------------------------------------------------------------------

interface FlightOptions {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	onFrame: (bx: number, by: number, rotation: number, scale: number) => void;
	onComplete: () => void;
}

function startBezierFlight(
	opts: FlightOptions,
	timerRef: { current: ReturnType<typeof setInterval> | null },
) {
	const { startX, startY, endX, endY, onFrame, onComplete } = opts;
	const dx = endX - startX;
	const dy = endY - startY;
	const distance = Math.hypot(dx, dy);

	const midX = (startX + endX) / 2;
	const midY = (startY + endY) / 2;
	const arcHeight = Math.min(distance * ARC_HEIGHT_RATIO, ARC_HEIGHT_MAX);
	const controlX = midX;
	const controlY = midY - arcHeight;

	const durationS = Math.min(Math.max(distance / FLIGHT_SPEED, FLIGHT_MIN_S), FLIGHT_MAX_S);
	const frameMs = 1000 / 60;
	const totalFrames = Math.ceil(durationS * 60);
	let frame = 0;

	if (timerRef.current) clearInterval(timerRef.current);

	timerRef.current = setInterval(() => {
		frame++;
		const linearT = Math.min(frame / totalFrames, 1);
		const easedT = smoothstep(linearT);

		const bx = quadBezier(easedT, startX, controlX, endX);
		const by = quadBezier(easedT, startY, controlY, endY);

		const tx = quadBezierTangent(easedT, startX, controlX, endX);
		const ty = quadBezierTangent(easedT, startY, controlY, endY);
		const angle = Math.atan2(ty, tx) * (180 / Math.PI) + 90;

		const scalePulse = Math.sin(linearT * Math.PI);
		const scale = 1 + scalePulse * FLIGHT_SCALE_BOOST;

		onFrame(bx, by, angle, scale);

		if (linearT >= 1) {
			clearInterval(timerRef.current!);
			timerRef.current = null;
			onComplete();
		}
	}, frameMs);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type FlightPhase =
	| "idle"         // following cursor
	| "flying"       // bezier arc to target
	| "holding"      // at target, showing bubble
	| "fading"       // bubble fading out
	| "returning";   // bezier arc back to cursor

interface ClickyOverlayProps {
	state: ClickyState;
	/** True only while the user is actively painting a screen region. */
	paintingActive?: boolean;
	pointTarget?: ClickyPointTarget | null;
	responseText?: string | null;
	/** Called when the pointing cycle completes (hold + return flight done). */
	onReturnToIdle?: () => void;
}

export function ClickyOverlay({
	state,
	paintingActive = false,
	pointTarget = null,
	responseText = null,
	onReturnToIdle,
}: Readonly<ClickyOverlayProps>) {
	// The overlay is `position: fixed` and tracks the mouse in viewport
	// coordinates. Rendering it through a portal on `document.body` keeps it out
	// of any transformed/`will-change` ancestor (e.g. animated chat panels),
	// which would otherwise become the containing block for the fixed layer and
	// push the cursor away from the real pointer.
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);

	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const springX = useSpring(x, FOLLOW_SPRING);
	const springY = useSpring(y, FOLLOW_SPRING);

	const isActive = state !== "off";
	const isPointing = state === "pointing" && pointTarget !== null;
	const isSpeaking = state === "speaking";

	const rafRef = useRef<number>(0);
	const mouseRef = useRef({ x: 0, y: 0 });
	const flightTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const welcomeDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const wasActiveRef = useRef(false);
	const hasMousePositionRef = useRef(false);

	// Flight animation state
	const [rotation, setRotation] = useState(IDLE_ROTATION);
	const [flightScale, setFlightScale] = useState(1);
	const [flightPhase, setFlightPhase] = useState<FlightPhase>("idle");
	const [navPhrase, setNavPhrase] = useState("");
	const [bubbleOpacity, setBubbleOpacity] = useState(1);
	const [showWelcome, setShowWelcome] = useState(false);
	const [cursorPositionReady, setCursorPositionReady] = useState(false);

	// Return flight interruption
	const returnStartMouseRef = useRef({ x: 0, y: 0 });
	const flightPhaseRef = useRef<FlightPhase>("idle");
	useEffect(() => {
		flightPhaseRef.current = flightPhase;
	}, [flightPhase]);

	const cancelFlightAndResume = useCallback(() => {
		if (flightTimerRef.current) {
			clearInterval(flightTimerRef.current);
			flightTimerRef.current = null;
		}
		setFlightPhase("idle");
		setRotation(IDLE_ROTATION);
		setFlightScale(1);
		onReturnToIdle?.();
	}, [onReturnToIdle]);

	const cancelFlightRef = useRef(cancelFlightAndResume);
	useEffect(() => {
		cancelFlightRef.current = cancelFlightAndResume;
	}, [cancelFlightAndResume]);

	// Track mouse position
	const handleMouseMove = useCallback((e: MouseEvent) => {
		mouseRef.current = { x: e.clientX, y: e.clientY };
		hasMousePositionRef.current = true;

		// Interrupt return flight if mouse moved >100px
		if (flightPhaseRef.current === "returning") {
			const dx = e.clientX - returnStartMouseRef.current.x;
			const dy = e.clientY - returnStartMouseRef.current.y;
			if (Math.hypot(dx, dy) > RETURN_INTERRUPT_DISTANCE) {
				cancelFlightRef.current();
			}
		}
	}, []);

	// Cleanup all timers
	const clearAllTimers = useCallback(() => {
		if (flightTimerRef.current) {
			clearInterval(flightTimerRef.current);
			flightTimerRef.current = null;
		}
		if (holdTimerRef.current) {
			clearTimeout(holdTimerRef.current);
			holdTimerRef.current = null;
		}
		if (fadeTimerRef.current) {
			clearTimeout(fadeTimerRef.current);
			fadeTimerRef.current = null;
		}
	}, []);

	// Animate cursor to follow mouse (only when idle phase)
	useEffect(() => {
		if (!isActive) return;

		const tick = () => {
			if (flightPhaseRef.current === "idle") {
				x.set(mouseRef.current.x + TRACKING_OFFSET_X);
				y.set(mouseRef.current.y + TRACKING_OFFSET_Y);
			}
			rafRef.current = requestAnimationFrame(tick);
		};

		rafRef.current = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafRef.current);
	}, [isActive, x, y]);

	// Keep the last pointer position warm even while the overlay is off, so the
	// activation frame never falls back to the viewport origin.
	useEffect(() => {
		window.addEventListener("mousemove", handleMouseMove, { passive: true });
		window.addEventListener("pointerdown", handleMouseMove, { passive: true, capture: true });
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("pointerdown", handleMouseMove, { capture: true });
		};
	}, [handleMouseMove]);

	const seedCursorPosition = useCallback(() => {
		if (!hasMousePositionRef.current) {
			const trigger = document.querySelector<HTMLElement>(ROVO_CURSOR_TRIGGER_SELECTOR);
			const rect = trigger?.getBoundingClientRect();

			mouseRef.current = rect
				? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
				: { x: window.innerWidth / 2, y: window.innerHeight / 2 };
			hasMousePositionRef.current = true;
		}

		const targetX = mouseRef.current.x + TRACKING_OFFSET_X;
		const targetY = mouseRef.current.y + TRACKING_OFFSET_Y;
		x.jump(targetX);
		y.jump(targetY);
		springX.jump(targetX);
		springY.jump(targetY);
		setCursorPositionReady(true);
	}, [springX, springY, x, y]);

	const dismissWelcomeAfterTyping = useCallback(() => {
		if (welcomeDismissTimerRef.current) {
			clearTimeout(welcomeDismissTimerRef.current);
		}
		welcomeDismissTimerRef.current = setTimeout(() => {
			setShowWelcome(false);
			welcomeDismissTimerRef.current = null;
		}, WELCOME_DISMISS_AFTER_TYPE_MS);
	}, []);

	useEffect(() => {
		if (!isActive) {
			wasActiveRef.current = false;
			setCursorPositionReady(false);
			setShowWelcome(false);
			if (welcomeDismissTimerRef.current) {
				clearTimeout(welcomeDismissTimerRef.current);
				welcomeDismissTimerRef.current = null;
			}
			return;
		}

		if (!wasActiveRef.current) {
			wasActiveRef.current = true;
			seedCursorPosition();
			setShowWelcome(true);
			if (welcomeDismissTimerRef.current) {
				clearTimeout(welcomeDismissTimerRef.current);
				welcomeDismissTimerRef.current = null;
			}
		}
	}, [isActive, seedCursorPosition]);

	useEffect(() => {
		if (isActive && !cursorPositionReady && responseText) {
			seedCursorPosition();
		}
	}, [cursorPositionReady, isActive, responseText, seedCursorPosition]);

	useEffect(() => {
		return () => {
			if (welcomeDismissTimerRef.current) {
				clearTimeout(welcomeDismissTimerRef.current);
			}
		};
	}, []);

	// Full pointing cycle: fly → hold → fade → return → idle
	// react-doctor-disable-next-line react-doctor/effect-needs-cleanup
	useEffect(() => {
		if (!isPointing || !pointTarget) {
			if (!isPointing) {
				clearAllTimers();
				// Reset state on next microtask to avoid synchronous setState in effect
				queueMicrotask(() => {
					setFlightPhase("idle");
					setRotation(IDLE_ROTATION);
					setFlightScale(1);
					setBubbleOpacity(1);
				});
			}
			return clearAllTimers;
		}

		// Targets are resolved from DOM rects, so coordinates are viewport-space.
		const targetX = pointTarget.x - CURSOR_TIP_X;
		const targetY = pointTarget.y - CURSOR_TIP_Y;

		const phrase = pickRandom(NAV_PHRASES);
		queueMicrotask(() => {
			setNavPhrase(phrase);
			setFlightPhase("flying");
			setBubbleOpacity(1);
		});

		const startX = springX.get();
		const startY = springY.get();

		// Phase 1: Fly to target
		startBezierFlight(
			{
				startX,
				startY,
				endX: targetX,
				endY: targetY,
				onFrame: (bx, by, angle, scale) => {
					x.set(bx);
					y.set(by);
					setRotation(angle);
					setFlightScale(scale);
				},
				onComplete: () => {
					x.set(targetX);
					y.set(targetY);
					setFlightScale(1);
					setRotation(IDLE_ROTATION);
					setFlightPhase("holding");

					// Phase 2: Hold at target
					holdTimerRef.current = setTimeout(() => {
						// Phase 3: Fade out bubble
						setBubbleOpacity(0);
						setFlightPhase("fading");

						fadeTimerRef.current = setTimeout(() => {
							// Phase 4: Return flight to cursor
							setFlightPhase("returning");
							returnStartMouseRef.current = { ...mouseRef.current };

							const returnTargetX = mouseRef.current.x + TRACKING_OFFSET_X;
							const returnTargetY = mouseRef.current.y + TRACKING_OFFSET_Y;

							startBezierFlight(
								{
									startX: targetX,
									startY: targetY,
									endX: returnTargetX,
									endY: returnTargetY,
									onFrame: (bx, by, angle, scale) => {
										x.set(bx);
										y.set(by);
										setRotation(angle);
										setFlightScale(scale);
									},
									onComplete: () => {
										setFlightPhase("idle");
										setRotation(IDLE_ROTATION);
										setFlightScale(1);
										onReturnToIdle?.();
									},
								},
								flightTimerRef,
							);
						}, BUBBLE_FADE_MS);
					}, POINT_HOLD_MS);
				},
			},
			flightTimerRef,
		);

		return () => clearAllTimers();
	}, [isPointing, pointTarget, x, y, springX, springY, clearAllTimers, onReturnToIdle]);

	// Speaking state — show bubble immediately, then dismiss only after the
	// latest streamed response text has had time to settle.
	useEffect(() => {
		if (!isSpeaking) {
			return;
		}

		if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
		if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
		holdTimerRef.current = null;
		fadeTimerRef.current = null;

		queueMicrotask(() => {
			setFlightPhase("holding");
			setBubbleOpacity(1);
		});

		holdTimerRef.current = setTimeout(() => {
			setBubbleOpacity(0);
			setFlightPhase("fading");

			fadeTimerRef.current = setTimeout(() => {
				setFlightPhase("idle");
				onReturnToIdle?.();
			}, BUBBLE_FADE_MS);
		}, RESPONSE_SETTLE_MS);

		return () => {
			if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
			if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
			holdTimerRef.current = null;
			fadeTimerRef.current = null;
		};
	}, [isSpeaking, responseText, onReturnToIdle]);

	const shouldRenderOverlay = isActive && (cursorPositionReady || Boolean(responseText));
	const shouldUseFlightTransform = flightPhase === "flying" || flightPhase === "returning";
	const showNavBubble = (flightPhase === "holding" || flightPhase === "fading") && isPointing;
	const showResponseOverlay = Boolean(responseText) && isActive;
	const showStandaloneNavBubble = showNavBubble && !showResponseOverlay;
	const shouldShowWelcome = showWelcome && !showResponseOverlay && !isSpeaking;

	if (!mounted) {
		return null;
	}

	return createPortal(
		<AnimatePresence>
			{shouldRenderOverlay ? (
				<motion.div
					className="pointer-events-none fixed inset-0"
					data-clicky-overlay
					style={{ zIndex: 9998 }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.15 }}
				>
					{/* Cursor companion */}
					<motion.div
						className="absolute"
						style={{
							x: springX,
							y: springY,
							willChange: "transform",
						}}
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0, opacity: 0 }}
						transition={{
							type: "spring",
							damping: 15,
							stiffness: 300,
						}}
					>
						<ClickyCursor
							state={state}
							paintingActive={paintingActive}
							rotation={shouldUseFlightTransform ? rotation : IDLE_ROTATION}
							flightScale={shouldUseFlightTransform ? flightScale : 1}
						/>

						{showStandaloneNavBubble ? <ClickySpeechBubble text={navPhrase} opacity={bubbleOpacity} /> : null}

						{/* Welcome message */}
						<AnimatePresence>
							{shouldShowWelcome ? (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.5, ease: "easeOut" }}
								>
									<ClickySpeechBubble
										placement="above"
										text={WELCOME_MESSAGE}
										typewriter
										onTypewriterComplete={dismissWelcomeAfterTyping}
									/>
								</motion.div>
							) : null}
						</AnimatePresence>
					</motion.div>

					<AnimatePresence>
						{showResponseOverlay && responseText ? (
							<ClickyResponseOverlay
								cursorX={springX}
								cursorY={springY}
								label={showNavBubble ? navPhrase : null}
								opacity={1}
								text={responseText}
							/>
						) : null}
					</AnimatePresence>
				</motion.div>
			) : null}
		</AnimatePresence>,
		document.body,
	);
}
