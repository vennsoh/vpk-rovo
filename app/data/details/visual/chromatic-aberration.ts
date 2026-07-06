import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CHROMATIC_ABERRATION_DETAIL: ComponentDetail = {
		description: "VPK-rovo chromatic aberration shader with radial, horizontal, vertical, and swirl modes, uploaded image support, animated pulse, and swirl controls.",
		importStatement: `import ChromaticAberration from "@/components/website/demos/visual/shaders/chromatic-aberration";`,
		usage: `<ChromaticAberration
	mode={3}
	radius={60}
	pulse={30}
	swirl={3}
/>`,
		props: [
			{ name: "imageSrc", type: "string", description: "Optional source image URL. When omitted, the shader uses its generated demo source." },
			{ name: "mode", type: "0 | 1 | 2 | 3", default: "3", description: "Aberration mode: 0 radial, 1 horizontal, 2 vertical, 3 swirl." },
			{ name: "radius", type: "number", default: "60", description: "Channel split radius." },
			{ name: "pulse", type: "number", default: "30", description: "Animated pulse amount." },
			{ name: "speed", type: "number", default: "0", description: "Pulse animation speed." },
			{ name: "swirl", type: "number", default: "3", description: "Swirl strength when mode is 3." },
			{ name: "swirlSpeed", type: "number", default: "0", description: "Swirl animation speed when mode is 3." },
		],
	};
