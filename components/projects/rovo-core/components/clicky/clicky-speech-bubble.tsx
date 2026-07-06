"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

const TYPEWRITER_INTERVAL_MS = 40;

type ClickySpeechBubblePlacement = "below" | "above";

const SPEECH_BUBBLE_POSITIONS: Record<
	ClickySpeechBubblePlacement,
	{ left: number; top: number; transformOrigin: string }
> = {
	below: { left: 10, top: 18, transformOrigin: "left top" },
	above: { left: 18, top: -44, transformOrigin: "left bottom" },
};

interface ClickySpeechBubbleProps {
	text: string;
	opacity?: number;
	placement?: ClickySpeechBubblePlacement;
	typewriter?: boolean;
	onTypewriterComplete?: () => void;
}

export function ClickySpeechBubble({
	text,
	opacity = 1,
	placement = "below",
	typewriter = false,
	onTypewriterComplete,
}: Readonly<ClickySpeechBubbleProps>) {
	const [displayedText, setDisplayedText] = useState(typewriter ? "" : text);
	const position = SPEECH_BUBBLE_POSITIONS[placement];

	useEffect(() => {
		if (!typewriter) {
			setDisplayedText(text);
			return;
		}

		setDisplayedText("");
		if (!text) return;

		let index = 0;
		const interval = setInterval(() => {
			index += 1;
			const nextText = text.slice(0, index);
			setDisplayedText(nextText);

			if (index >= text.length) {
				clearInterval(interval);
				onTypewriterComplete?.();
			}
		}, TYPEWRITER_INTERVAL_MS);

		return () => clearInterval(interval);
	}, [onTypewriterComplete, text, typewriter]);

	if (!displayedText) return null;

	return (
		<motion.div
			className="pointer-events-none absolute w-max"
			data-clicky-speech-bubble-placement={placement}
			style={{
				left: position.left,
				top: position.top,
				transformOrigin: position.transformOrigin,
				willChange: "transform, opacity",
			}}
			initial={{ scale: 0.5, opacity: 0 }}
			animate={{ scale: 1, opacity }}
			exit={{ scale: 0.5, opacity: 0 }}
			transition={{
				type: "spring",
				duration: 0.4,
				bounce: 0.4,
			}}
		>
			<div className="inline-block w-max max-w-none whitespace-nowrap rounded-md bg-bg-neutral-bold px-3 py-1.5 text-xs text-text-inverse shadow-md outline-hidden">
				{displayedText}
			</div>
		</motion.div>
	);
}
