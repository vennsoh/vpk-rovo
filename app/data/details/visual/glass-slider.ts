import type { ComponentDetail } from "@/app/data/component-detail-types";

export const GLASS_SLIDER_DETAIL: ComponentDetail = {
		description: "The vertical liquid-glass slider used by the Awake demo (CityRailEditor + inner GlassSlider). Renders the exact same component the /awake page uses, including the same city list, liquid-glass shell, and rainbow tick.",
		importStatement: `import { GlassSlider, DEFAULT_FILL_GLASS_PROPS, DEFAULT_FILL_TINT_GRADIENT } from "@/components/arts/awake/glass-slider";\nimport { CityRailEditor } from "@/components/arts/awake/city-popover";`,
		usage: `<CityRailEditor
	cities={cities}
	selectedIndex={selectedIndex}
	setSelectedIndex={setSelectedIndex}
	addCity={addCity}
	width={194}
	height={440}
	fillGlassProps={{
		distortionScale: -60,
		dispersion: 4,
		blur: 6,
		backgroundOpacity: 0.18,
	}}
	fillTintGradient={DEFAULT_FILL_TINT_GRADIENT}
/>`,
		props: [
			{ name: "cities", type: "ReadonlyArray<LockscreenLocation>", description: "Live city list (use the `useCities` hook for the same data source the Awake page uses)." },
			{ name: "selectedIndex", type: "number", description: "Currently selected city index (controlled)." },
			{ name: "setSelectedIndex", type: "(index: number) => void", description: "Setter called on hover-preview, drag, click, or keyboard navigation." },
			{ name: "addCity", type: "(city: LockscreenLocation) => void", description: "Append a city to the rail when the user adds one from the editor popover." },
			{ name: "width", type: "number", default: "150", description: "Outer width in pixels. CityRailEditor subtracts a 24px TRACK_INSET internally to derive the visible rail width." },
			{ name: "height", type: "number", default: "380", description: "Outer height in pixels." },
			{ name: "fillGlassProps", type: "Partial<LiquidGlassProps>", description: "Override the LiquidGlass props applied to the progress fill (distortion, dispersion, blur, etc.). Forwarded verbatim to the inner GlassSlider." },
			{ name: "fillTintGradient", type: "string", description: "CSS gradient string layered over the glass fill. Defaults to DEFAULT_FILL_TINT_GRADIENT (Rovo brand-color vertical gradient). Pass undefined to disable." },
			{ name: "fillTintBlendMode", type: "CSSProperties[\"mixBlendMode\"]", description: "How the tint composites with the refracted glass." },
			{ name: "fillMeniscusHeightPx", type: "number", description: "Height of the curved cap on top of the progress fill, in pixels. 0 = flat." },
			{ name: "fillMeniscusCurve", type: "number", description: "Curvature of the meniscus cap, 0 = flat (no cap), 1 = full half-ellipse." },
			{ name: "fillMeniscusHeightPxActive", type: "number", description: "Cap height when the slider is hovered or interacted with — springs from rest to this value." },
			{ name: "fillMeniscusCurveActive", type: "number", description: "Cap curvature (0–1) when hovered/interacted — springs from rest to this value." },
		],
	};
