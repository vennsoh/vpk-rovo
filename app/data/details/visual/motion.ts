import type { ComponentDetail } from "@/app/data/component-detail-types";

export const MOTION_DETAIL: ComponentDetail = {
		description:
			"Reference gallery for the vpk motion tokens. Shows every easing curve (--ease-*) as an SVG graph plus a shape animating with it, the three animatable property kinds (position, transform, opacity), and every duration token (--duration-*) side by side. All motion is CSS-driven from the real var(--ease-*)/var(--duration-*) tokens — the only way to render --ease-spring's overshoot — and stops under prefers-reduced-motion.",
		importStatement: `import { MotionTokens } from "@/components/visual/motion";`,
		usage: `<MotionTokens />`,
	};
