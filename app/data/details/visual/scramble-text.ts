import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SCRAMBLE_TEXT_DETAIL: ComponentDetail = {
		description: "Official Motion+ ScrambleText component. Letter-by-letter scramble that cycles random characters before each character settles on its target. The demo uses the exact charset, word lists, and stagger values from the official motion.dev examples (Normal, Hover, Stagger from center) plus a Playground tile with live GUI controls for every prop. The motion.dev reference charset is `!@#$%^&*()_+-=[]{}|;:,.<>?/~`░▒▓█▀▄■□▪▫●○◆◇◈◊※†‡` — punctuation + Unicode block-drawing chars for a glitchy texture.",
		importStatement: `import { ScrambleText } from "motion-plus/react";
import { stagger } from "motion/react";`,
		usage: `// Normal — plays once on mount
<ScrambleText duration={1}>Scramble text</ScrambleText>

// Hover — perpetual scramble while active
<span onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
	<ScrambleText active={hovered} duration={Infinity}>Hover me!</ScrambleText>
</span>

// Stagger from center
<ScrambleText duration={1} delay={stagger(0.05, { from: "center" })}>
	Stagger from center
</ScrambleText>`,
		props: [
			{ name: "children", type: "string", description: "The text content to scramble. Spaces pass through unchanged." },
			{ name: "as", type: "ElementType", default: '"span"', description: "The HTML element or component to render as. Polymorphic — pass any tag name or component." },
			{ name: "active", type: "boolean", default: "true", description: "Whether the scramble animation is active. When true, characters scramble according to delay/duration. When false, characters reveal with stagger offsets preserved." },
			{ name: "delay", type: "number | StaggerFunction", default: "0", description: "Delay before each character starts scrambling, in seconds. Pass a stagger function (e.g. stagger(0.1, { from: 'center' })) for per-character delays." },
			{ name: "duration", type: "number | StaggerFunction", default: "1", description: "How long each character stays scrambled before revealing, in seconds. Pass Infinity to keep scrambling until active becomes false." },
			{ name: "interval", type: "number", default: "0.05", description: "Seconds between random character switches while scrambling." },
			{ name: "chars", type: "string | string[]", default: '"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"', description: "Characters to use for scrambling. String of characters, or an array of strings for emoji support." },
			{ name: "onComplete", type: "() => void", description: "Callback fired when all characters have been revealed." },
			{ name: "className", type: "string", description: "Custom className applied to the wrapper element." },
			{ name: "style", type: "CSSProperties", description: "Custom inline styles." },
		],
	};
