"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { token } from "@/lib/tokens";
import { createId } from "@/lib/utils";
import {
	createStudioScreenAssistantRegion,
	type StudioScreenAssistantRegion,
	type StudioScreenAssistantRegionPoint,
	type StudioScreenAssistantVisibleTarget,
} from "@/components/projects/rovo-core/lib/screen-assistant";

const MIN_POINT_DISTANCE = 5;
const TIPTOUR_BRUSH_COLOR = token("color.border.accent.blue");
const TIPTOUR_BRUSH_POINT_LIMIT = 220;
const TIPTOUR_BRUSH_BAND_COUNT = 28;
const TIPTOUR_BRUSH_FADE_EXPONENT = 1.8;
const TIPTOUR_BRUSH_LAYERS = [
	{ key: "halo", lineWidth: 54, maxStrokeOpacity: 0.11, postBlurRadius: 30 },
	{ key: "bloom", lineWidth: 32, maxStrokeOpacity: 0.26, postBlurRadius: 12 },
	{ key: "core", lineWidth: 18, maxStrokeOpacity: 0.72, postBlurRadius: 0 },
] as const;
const TIPTOUR_BRUSH_BANDS = Array.from({ length: TIPTOUR_BRUSH_BAND_COUNT }, (_, bandIndex) => {
	const startFraction = bandIndex / TIPTOUR_BRUSH_BAND_COUNT;
	const endFraction = (bandIndex + 1) / TIPTOUR_BRUSH_BAND_COUNT;
	const centerFraction = (startFraction + endFraction) / 2;

	return {
		dashArray: `${endFraction - startFraction} 1`,
		dashOffset: -startFraction,
		opacityFactor: Math.pow(centerFraction, TIPTOUR_BRUSH_FADE_EXPONENT),
	};
});
interface ShortcutKeyState {
	ctrl: boolean;
	shift: boolean;
}
interface ScreenAssistantRegionOverlayProps {
	active: boolean;
	getVisibleTargets: () => readonly StudioScreenAssistantVisibleTarget[];
	onPaintingChange?: (painting: boolean) => void;
	onRegionChange: (region: StudioScreenAssistantRegion | null) => void;
	region: StudioScreenAssistantRegion | null;
}

function distanceBetween(a: StudioScreenAssistantRegionPoint, b: StudioScreenAssistantRegionPoint): number {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointFromEvent(event: PointerEvent): StudioScreenAssistantRegionPoint {
	return { x: event.clientX, y: event.clientY };
}

function formatPathPoint(point: StudioScreenAssistantRegionPoint): string {
	return `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
}

function buildContinuousSmoothTrailPath(points: readonly StudioScreenAssistantRegionPoint[]): string {
	if (points.length === 0) {
		return "";
	}

	if (points.length === 1) {
		return `M ${formatPathPoint(points[0])}`;
	}

	if (points.length === 2) {
		return `M ${formatPathPoint(points[0])} L ${formatPathPoint(points[1])}`;
	}

	const lastPointIndex = points.length - 1;
	const commands = [`M ${formatPathPoint(points[0])}`];

	for (let segmentIndex = 0; segmentIndex < lastPointIndex; segmentIndex += 1) {
		const segmentStartPoint = points[segmentIndex];
		const segmentEndPoint = points[segmentIndex + 1];
		const pointBeforeSegmentStart = segmentIndex === 0
			? points[0]
			: points[segmentIndex - 1];
		const pointAfterSegmentEnd = segmentIndex + 2 <= lastPointIndex
			? points[segmentIndex + 2]
			: points[lastPointIndex];
		const tangentAtSegmentStart = {
			x: (segmentEndPoint.x - pointBeforeSegmentStart.x) / 2,
			y: (segmentEndPoint.y - pointBeforeSegmentStart.y) / 2,
		};
		const tangentAtSegmentEnd = {
			x: (pointAfterSegmentEnd.x - segmentStartPoint.x) / 2,
			y: (pointAfterSegmentEnd.y - segmentStartPoint.y) / 2,
		};
		const firstCubicControlPoint = {
			x: segmentStartPoint.x + tangentAtSegmentStart.x / 3,
			y: segmentStartPoint.y + tangentAtSegmentStart.y / 3,
		};
		const secondCubicControlPoint = {
			x: segmentEndPoint.x - tangentAtSegmentEnd.x / 3,
			y: segmentEndPoint.y - tangentAtSegmentEnd.y / 3,
		};

		commands.push(
			`C ${formatPathPoint(firstCubicControlPoint)} ${formatPathPoint(secondCubicControlPoint)} ${formatPathPoint(segmentEndPoint)}`,
		);
	}

	return commands.join(" ");
}

function getShortcutKeyStateFromEvent(event: KeyboardEvent): ShortcutKeyState {
	const nextState = {
		ctrl: event.getModifierState("Control") || event.ctrlKey,
		shift: event.getModifierState("Shift") || event.shiftKey,
	};

	if (event.key === "Control") {
		nextState.ctrl = event.type === "keydown";
	}
	if (event.key === "Shift") {
		nextState.shift = event.type === "keydown";
	}

	return nextState;
}

function isShortcutChordPressed(state: ShortcutKeyState): boolean {
	return state.ctrl && state.shift;
}

function shouldToggleShortcutPaint(
	event: KeyboardEvent,
	shortcutState: ShortcutKeyState,
	shortcutArmed: boolean,
): boolean {
	return (
		isShortcutChordPressed(shortcutState) &&
		!event.altKey &&
		!event.metaKey &&
		!shortcutArmed &&
		!event.defaultPrevented
	);
}

export function ScreenAssistantRegionOverlay({
	active,
	getVisibleTargets,
	onPaintingChange,
	onRegionChange,
	region,
}: Readonly<ScreenAssistantRegionOverlayProps>) {
	const [mounted, setMounted] = useState(false);
	const [draftPath, setDraftPath] = useState<StudioScreenAssistantRegionPoint[]>([]);
	const paintingRef = useRef(false);
	const latestPointerRef = useRef<StudioScreenAssistantRegionPoint | null>(null);
	const pathRef = useRef<StudioScreenAssistantRegionPoint[]>([]);
	const pressedShortcutKeysRef = useRef<ShortcutKeyState>({ ctrl: false, shift: false });
	const shortcutArmedRef = useRef(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const clearDraftPaint = useCallback(() => {
		paintingRef.current = false;
		pathRef.current = [];
		pressedShortcutKeysRef.current = { ctrl: false, shift: false };
		shortcutArmedRef.current = false;
		setDraftPath([]);
		onPaintingChange?.(false);
	}, [onPaintingChange]);

	const finishPaint = useCallback(() => {
		if (!paintingRef.current) {
			return;
		}

		paintingRef.current = false;
		const regionPath = pathRef.current;
		pathRef.current = [];
		setDraftPath([]);
		onPaintingChange?.(false);

		const nextRegion = createStudioScreenAssistantRegion({
			id: createId("screen-region"),
			path: regionPath,
			visibleTargets: getVisibleTargets(),
		});
		onRegionChange(nextRegion);
	}, [getVisibleTargets, onPaintingChange, onRegionChange]);

	const appendPoint = useCallback((point: StudioScreenAssistantRegionPoint) => {
		const previousPoint = pathRef.current[pathRef.current.length - 1];
		if (previousPoint && distanceBetween(previousPoint, point) < MIN_POINT_DISTANCE) {
			return;
		}

		pathRef.current = [...pathRef.current, point];
		setDraftPath(pathRef.current);
	}, []);

	const beginPaint = useCallback(() => {
		if (!active) {
			return;
		}

		paintingRef.current = true;
		onRegionChange(null);
		onPaintingChange?.(true);
		const point = latestPointerRef.current ?? {
			x: window.innerWidth / 2,
			y: window.innerHeight / 2,
		};
		pathRef.current = [point];
		setDraftPath([point]);
	}, [active, onPaintingChange, onRegionChange]);

	useEffect(() => {
		if (!active) {
			clearDraftPaint();
			onRegionChange(null);
		}
	}, [active, clearDraftPaint, onRegionChange]);

	useEffect(() => {
		const handlePointerMove = (event: PointerEvent) => {
			const point = pointFromEvent(event);
			latestPointerRef.current = point;
			if (!paintingRef.current) {
				return;
			}
			event.preventDefault();
			appendPoint(point);
		};
		const handlePointerDown = (event: PointerEvent) => {
			latestPointerRef.current = pointFromEvent(event);
			if (!paintingRef.current) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
		};
		const handleClick = (event: MouseEvent) => {
			if (!paintingRef.current) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
		};

		window.addEventListener("pointermove", handlePointerMove, { capture: true });
		window.addEventListener("pointerdown", handlePointerDown, { capture: true });
		window.addEventListener("click", handleClick, { capture: true });
		return () => {
			window.removeEventListener("pointermove", handlePointerMove, { capture: true });
			window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
			window.removeEventListener("click", handleClick, { capture: true });
		};
	}, [appendPoint]);

	useEffect(() => {
		if (!active) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			pressedShortcutKeysRef.current = getShortcutKeyStateFromEvent(event);
			if (shouldToggleShortcutPaint(event, pressedShortcutKeysRef.current, shortcutArmedRef.current)) {
				event.preventDefault();
				event.stopPropagation();
				shortcutArmedRef.current = true;
				if (paintingRef.current) {
					finishPaint();
				} else {
					beginPaint();
				}
				return;
			}

			if (event.key !== "Escape") {
				return;
			}
			if (!paintingRef.current && !region) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			clearDraftPaint();
			onRegionChange(null);
		};
		const handleKeyUp = (event: KeyboardEvent) => {
			pressedShortcutKeysRef.current = getShortcutKeyStateFromEvent(event);
			if (!isShortcutChordPressed(pressedShortcutKeysRef.current)) {
				shortcutArmedRef.current = false;
			}
		};

		window.addEventListener("keydown", handleKeyDown, { capture: true });
		window.addEventListener("keyup", handleKeyUp, { capture: true });
		return () => {
			pressedShortcutKeysRef.current = { ctrl: false, shift: false };
			shortcutArmedRef.current = false;
			window.removeEventListener("keydown", handleKeyDown, { capture: true });
			window.removeEventListener("keyup", handleKeyUp, { capture: true });
		};
	}, [active, beginPaint, clearDraftPaint, finishPaint, onRegionChange, region]);

	const visiblePath = (draftPath.length > 0 ? draftPath : (region?.path ?? [])).slice(-TIPTOUR_BRUSH_POINT_LIMIT);
	const pathData = buildContinuousSmoothTrailPath(visiblePath);
	const shouldShowRegion = active && visiblePath.length > 1;

	if (!mounted) {
		return null;
	}

	return createPortal(
		<AnimatePresence>
			{shouldShowRegion ? (
				<motion.svg
					aria-hidden="true"
					className="pointer-events-none fixed inset-0 h-screen w-screen"
					data-screen-assistant-region-overlay
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.12 }}
					style={{ zIndex: 9997 }}
				>
					{TIPTOUR_BRUSH_LAYERS.map((layer) => (
						<g
							data-screen-assistant-region-brush-layer={layer.key}
							key={layer.key}
							style={{
								filter: layer.postBlurRadius > 0 ? `blur(${layer.postBlurRadius}px)` : undefined,
							}}
						>
							{TIPTOUR_BRUSH_BANDS.map((band, bandIndex) => (
								<path
									d={pathData}
									data-screen-assistant-region-brush-band={bandIndex}
									fill="none"
									key={bandIndex}
									pathLength={1}
									stroke={TIPTOUR_BRUSH_COLOR}
									strokeDasharray={band.dashArray}
									strokeDashoffset={band.dashOffset}
									strokeLinecap="butt"
									strokeLinejoin="round"
									strokeOpacity={layer.maxStrokeOpacity * band.opacityFactor}
									strokeWidth={layer.lineWidth}
									vectorEffect="non-scaling-stroke"
								/>
							))}
						</g>
					))}
				</motion.svg>
			) : null}
		</AnimatePresence>,
		document.body,
	);
}
