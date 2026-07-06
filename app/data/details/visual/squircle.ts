import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SQUIRCLE_DETAIL: ComponentDetail = {
		description: "Framer-aligned squircle surface that uses native CSS corner-shape when supported, with an SVG superellipse fallback for unsupported browsers.",
		importStatement: `import Squircle from "@/components/website/demos/visual/shaders/squircle";`,
		usage: `<Squircle
	width={240}
	height={240}
	smoothness={100}
	strokeWidth={1.5}
	strokeColor="rgb(255 255 255 / 0.4)"
/>`,
		props: [
			{ name: "children", type: "React.ReactNode", description: "Optional content centered inside the squircle." },
			{ name: "width", type: "number", default: "240", description: "Rendered width in pixels." },
			{ name: "height", type: "number", default: "240", description: "Rendered height in pixels." },
			{ name: "smoothness", type: "number", default: "100", description: "Superellipse smoothing amount from 0 to 100. The default matches Framer's `superellipse(2)` card shape." },
			{ name: "strokeWidth", type: "number", default: "1.5", description: "Inside stroke width in pixels. Set to 0 to disable it." },
			{ name: "strokeColor", type: "string", default: `"rgb(255 255 255 / 0.4)"`, description: "Stroke color string, including optional alpha." },
			{ name: "fillColor", type: "string", default: `"token(color.background.neutral)"`, description: "Background fill color for the squircle surface." },
			{ name: "className", type: "string", description: "Additional class names applied to the squircle host element." },
			{ name: "contentClassName", type: "string", description: "Class names applied to the inner content wrapper." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the squircle host element." },
		],
	};
