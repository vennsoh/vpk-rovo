"use client";

import { motion } from "motion/react";

import { RovoCursor, type RovoCursorState } from "@/components/ui-custom/rovo-cursor";
import type { ClickyState } from "@/components/projects/rovo-core/hooks/use-clicky";

// ---------------------------------------------------------------------------
// Clicky cursor — rendered with the shared RovoCursor design so the AI
// companion matches the brand pointer / loading / speaking glyphs.
// ---------------------------------------------------------------------------

/** Base glyph unit (px). RovoCursor scales every state from this. */
const CURSOR_SIZE = 18;
/**
 * Idle rotation the overlay parks the cursor at. The Rovo arrow is already a
 * pointer shape, so we normalize this back to 0 (natural orientation) and only
 * rotate while flying along a pointing arc.
 */
const IDLE_ROTATION = -35;

/** Map a Clicky lifecycle state to the matching RovoCursor glyph. */
function toRovoCursorState(state: ClickyState): RovoCursorState {
	switch (state) {
		case "listening":
			return "cursor"; // keep the pointer stable while the user talks
		case "processing":
			return "loading"; // rainbow spinner — thinking
		case "speaking":
			return "speaking"; // brand equalizer — replying
		default:
			return "cursor"; // idle + pointing — the brand pointer arrow
	}
}

interface ClickyCursorProps {
	state: ClickyState;
	/** True only during an active region-painting drag gesture. */
	paintingActive?: boolean;
	/** Rotation angle in degrees (tangent-following during flight). */
	rotation?: number;
	/** Scale factor (pulse during flight). */
	flightScale?: number;
}

export function ClickyCursor({
	state,
	paintingActive = false,
	rotation = IDLE_ROTATION,
	flightScale = 1,
}: Readonly<ClickyCursorProps>) {
	if (state === "off") return null;

	const rovoState = paintingActive ? "painting" : toRovoCursorState(state);
	const isPointer = rovoState === "cursor" || rovoState === "painting";
	// Only the pointer arrow follows the flight arc; the mic / spinner /
	// equalizer glyphs stay upright. Normalize idle (-35) back to 0 so the arrow
	// keeps its natural orientation, then rotate relative to that while pointing.
	const appliedRotation = isPointer ? rotation - IDLE_ROTATION : 0;
	const appliedScale = isPointer ? flightScale : 1;

	return (
		<motion.div
			animate={{ rotate: appliedRotation, scale: appliedScale }}
			transition={{ rotate: { duration: 0 }, scale: { duration: 0 } }}
			style={{
				display: "inline-block",
				transformOrigin: "top left",
				willChange: "transform",
			}}
		>
			<RovoCursor state={rovoState} size={CURSOR_SIZE} />
		</motion.div>
	);
}
