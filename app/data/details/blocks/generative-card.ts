import type { ComponentDetail } from "@/app/data/component-detail-types";

export const GENERATIVE_CARD_DETAIL: ComponentDetail = {
		description:
			"A collapsible AI result card for generated artifacts, with branded source media, summary metadata, preview content, dense collapsed companions, and footer actions.",
		usage: `import {
  GenerativeCard,
  GenerativeCardHeader,
  GenerativeCardBody,
  GenerativeCardContent,
  GenerativeCardFooter,
} from "@/components/blocks/generative-card";
import { Tile } from "@/components/ui/tile";
import { Button } from "@/components/ui/button";
import { SheetIcon } from "@/components/ui/vpk-icons";

<GenerativeCard className="max-w-[420px]">
  <GenerativeCardHeader
    title="Apple Inc.: A Comprehensive Overview"
    description="Created sheet"
    leading={(
      <Tile label="Sheet" size="medium" variant="greenSubtle">
        <SheetIcon className="size-4" />
      </Tile>
    )}
  />
  <GenerativeCardBody>
    <GenerativeCardContent>
      <div className="rounded-md bg-surface p-4">Artifact preview</div>
    </GenerativeCardContent>
    <GenerativeCardFooter>
      <Button variant="outline">Open sheet</Button>
    </GenerativeCardFooter>
  </GenerativeCardBody>
</GenerativeCard>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "defaultExpanded",
				type: "boolean",
				default: "true",
				description: "Initial expanded state when used uncontrolled.",
			},
			{
				name: "expanded",
				type: "boolean",
				description: "Controlled expanded state.",
			},
			{
				name: "onExpandedChange",
				type: "(expanded: boolean) => void",
				description: "Callback fired when expand/collapse state changes.",
			},
			{
				name: "animate",
				type: "boolean",
				default: "false",
				description: "When true, plays a one-shot WebGL bulge distortion entrance animation with Rovo color fringe glow and shimmer border.",
			},
			{
				name: "animateDuration",
				type: "number",
				default: "2000",
				description: "Duration of the entrance animation in milliseconds.",
			},
			{
				name: "animateDistortionScale",
				type: "number",
				default: "100",
				description: "Maximum WebGL displacement scale used by the sweep effect. Increase for a stronger distortion.",
			},
			{
				name: "animateBlur",
				type: "number",
				default: "8",
				description: "Maximum blur amount applied inside the moving distortion band.",
			},
			{
				name: "animateRadius",
				type: "number",
				default: "0.4",
				description: "Distortion radius mapped to moving band height (0-1). Higher values distort a thicker region.",
			},
			{
				name: "animateSpeed",
				type: "number",
				default: "1.35",
				description: "Sweep playback speed multiplier. Higher values move the distortion band from top to bottom faster.",
			},
			{
				name: "animateScaleSmoothing",
				type: "number",
				default: "0.5",
				description: "Smoothing factor (0-1) for displacement scale changes. Higher values react faster.",
			},
			{
				name: "animateSweepSmoothing",
				type: "number",
				default: "0.5",
				description: "Smoothing factor (0-1) for vertical sweep movement. Higher values react faster.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the card root.",
			},
			{
				name: "borderEffect",
				type: '"shimmer" | "trace" | false',
				default: "false",
				description: "Border effect style: \"shimmer\" fills the border uniformly, \"trace\" shows a concentrated arc comet traveling the perimeter with an interior mesh gradient glow.",
			},
			{
				name: "borderEffectDuration",
				type: "number",
				description: "Duration of the border effect cycle in milliseconds. Defaults to 1750 for shimmer, 2400 for trace.",
			},
			{
				name: "borderEffectArcWidth",
				type: "number",
				default: "90",
				description: "Trace only — angular width of the visible arc in degrees.",
			},
		],
		subComponents: [
			{ name: "GenerativeCardHeader", description: "Header row with leading media, title, description, optional action, and built-in collapse toggle." },
			{ name: "GenerativeCardBody", description: "Animated collapsible container for card details." },
			{ name: "GenerativeCardContent", description: "Body content section with default paddings for previews." },
			{ name: "GenerativeCardPreview", description: "Preview placeholder surface for generated output." },
			{ name: "GenerativeCardFooter", description: "Footer actions row aligned to the end. Accepts an optional `action` prop for a primary action button." },
		],
		examples: [
			{ title: "Artifact preview", description: "Expanded inline artifact card with a content excerpt and explicit open CTA.", demoSlug: "generative-card-demo-artifact" },
			{ title: "Artifact collapsed", description: "Dense collapsed companion state for the same artifact card, with a header CTA and expandable body.", demoSlug: "generative-card-demo-artifact-collapsed" },
			{ title: "3P source", description: "Generative card with third-party source branding.", demoSlug: "generative-card-demo-3p" },
			{ title: "Atlassian source", description: "Generative card with Atlassian product branding.", demoSlug: "generative-card-demo-1p" },
			{ title: "Icon source", description: "Generative card with a semantic icon tile source.", demoSlug: "generative-card-demo-icon" },
			{ title: "With action", description: "Footer with a primary action button (e.g. Send) alongside the preview button.", demoSlug: "generative-card-demo-action" },
			{ title: "Distortion effect", description: "One-shot WebGL bulge distortion entrance with Rovo color fringe glow and shimmer border.", demoSlug: "generative-card-demo-animated" },
			{ title: "Border trace", description: "One-shot gradient comet tracing the card perimeter with a smooth fade-out and replay control.", demoSlug: "generative-card-demo-trace" },
			{ title: "Inner glow", description: "Contained CSS mesh-like inner edge glow without the border trace effect.", demoSlug: "generative-card-demo-inner-glow" },
		],
	};
