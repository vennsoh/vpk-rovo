import type { ComponentDetail } from "@/app/data/component-detail-types";

export const LIQUID_GLASS_DETAIL: ComponentDetail = {
		description: "Apple-style liquid glass surface with real-time SVG displacement distortion, chromatic dispersion, a crisp hairline edge with inner specular highlights, a soft drop shadow, and backdrop-filter refraction. Use LiquidGlass for static cards and panels; use LiquidGlassButton when the surface itself should be an interactive button.",
		importStatement: `import LiquidGlass from "@/components/website/demos/visual/shaders/liquid-glass";
import { LiquidGlassButton } from "@/components/website/demos/visual/shaders/liquid-glass-button";`,
		usage: `<LiquidGlass width={200} height={400} borderRadius={50} />

<LiquidGlass
	width={300}
	height={200}
	borderRadius={30}
	distortionScale={-180}
	redOffset={50}
	greenOffset={-1}
	blueOffset={-19}
	yChannel="G"
	backgroundOpacity={0.1}
>
	<p className="text-sm text-text">Content inside the glass</p>
</LiquidGlass>

<LiquidGlassButton aria-label="Interactive glass button" className="w-28" />`,
		props: [
			{ name: "children", type: "React.ReactNode", description: "Content displayed inside the glass surface." },
			{ name: "width", type: "number | string", default: "200", description: "Width of the glass surface (pixels or CSS value)." },
			{ name: "height", type: "number | string", default: "400", description: "Height of the glass surface (pixels or CSS value)." },
			{ name: "borderRadius", type: "number", default: "50", description: "Corner radius in pixels." },
			{ name: "borderWidth", type: "number", default: "0.05", description: "Border width factor for the displacement map inset." },
			{ name: "brightness", type: "number", default: "50", description: "Brightness percentage (0–100) for the displacement map." },
			{ name: "opacity", type: "number", default: "0.93", description: "Opacity of the displacement map inner fill." },
			{ name: "blur", type: "number", default: "8", description: "Output Gaussian blur (stdDeviation) on the refracted result." },
			{ name: "displace", type: "number", default: "5", description: "Softens the displacement map inner transition in output pixels." },
			{ name: "backgroundOpacity", type: "number", default: "0", description: "Background frost opacity (0 = clear, 1 = fully frosted)." },
			{ name: "saturation", type: "number", default: "1", description: "Backdrop-filter saturation multiplier." },
			{ name: "distortionScale", type: "number", default: "-90", description: "Base displacement scale applied to the center channel." },
			{ name: "dispersion", type: "number", default: "6", description: "Legacy VPK uniform boost added to every channel before per-channel offsets. Set to 0 for ReactBits scale parity." },
			{ name: "redOffset", type: "number", default: "0", description: "ReactBits-compatible red channel displacement offset added to the base scale." },
			{ name: "greenOffset", type: "number", default: "0", description: "ReactBits-compatible green channel displacement offset added to the base scale." },
			{ name: "blueOffset", type: "number", default: "0", description: "ReactBits-compatible blue channel displacement offset added to the base scale." },
			{ name: "xChannel", type: `"R" | "G" | "B"`, default: `"R"`, description: "Displacement-map channel selector for the x axis." },
			{ name: "yChannel", type: `"R" | "G" | "B"`, default: `"B"`, description: "Displacement-map channel selector for the y axis. Use \"G\" to match ReactBits GlassSurface." },
			{ name: "borderOpacity", type: "number", default: "0.35", description: "Opacity of the inset hairline edge." },
			{ name: "borderColor", type: "string", default: "\"#000000\"", description: "Color of the inset hairline edge." },
			{ name: "pointerLayers", type: "boolean | LiquidGlassPointerLayer[]", default: "false", description: "Advanced opt-in pointer-reactive visual layer. Pass true for the default VPK edge sheen or an array for custom layer tuning." },
			{ name: "mouseContainer", type: "RefObject<HTMLElement | null> | null", default: "null", description: "Optional external element used for pointer tracking when the glass should react to a larger surface." },
			{ name: "pointerInput", type: "{ kind: \"client\" | \"local\"; x: number; y: number; active?: boolean } | null", default: "null", description: "Optional externally controlled pointer coordinates. Client coordinates are converted from the viewport into the glass surface." },
			{ name: "pointerActivationRadius", type: "number", default: "180", description: "Distance in pixels outside the glass edge where pointer layers fade out." },
			{ name: "pointerSmoothing", type: "number", default: "1", description: "Per-frame pointer interpolation amount for the pointer-reactive layer. Lower values follow the cursor more slowly." },
			{ name: "LiquidGlassButton.glassProps", type: "Partial<LiquidGlassProps>", description: "Overrides the LiquidGlass backdrop inside the interactive button." },
			{ name: "LiquidGlassButton.elasticity", type: "number", default: "0.35", description: "Amount of pill stretch and perpendicular compression while the pointer is near the button." },
			{ name: "LiquidGlassButton.magnetDistance", type: "number", default: "10", description: "Maximum magnetic translation in pixels toward the pointer." },
			{ name: "LiquidGlassButton.hoverArea", type: "number", default: "24", description: "Pointer activation distance outside the button bounds." },
			{ name: "LiquidGlassButton.pointerFill", type: "boolean", default: "true", description: "Whether pointer strength should tint the button fill. Disable it when the button should keep a normal ghost appearance while only the edge light tracks the pointer." },
			{ name: "LiquidGlassButton.pressScale", type: "number", default: "0.92", description: "Uniform spring scale applied while pressing the button." },
			{ name: "className", type: "string", description: "Additional CSS class names." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles object." },
		],
	};
