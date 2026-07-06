import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SPOTLIGHT_DETAIL: ComponentDetail = {
		description:
			"Introduces users to points of interest, from a single focused message to a multi-step tour. A compound dark inverse card (heading, body, media, footer actions, step count, dismiss control) that can stand alone or anchor to a real element with a pulse highlight.",
		adsUrl: "https://atlassian.design/components/spotlight/examples",
		demoLayout: { previewHeight: "fit" },
		importStatement: `import {
  SpotlightCard,
  SpotlightHeader,
  SpotlightHeadline,
  SpotlightBody,
  SpotlightFooter,
  SpotlightActions,
  SpotlightPrimaryAction,
  SpotlightStepCount,
  SpotlightControls,
  SpotlightDismissControl,
  SpotlightTarget,
} from "@/components/blocks/spotlight";`,
		usage: `<SpotlightCard>
  <SpotlightHeader>
    <SpotlightHeadline>Meet your Rovo agents</SpotlightHeadline>
    <SpotlightControls>
      <SpotlightDismissControl />
    </SpotlightControls>
  </SpotlightHeader>
  <SpotlightBody>Agents help you draft, summarize, and automate work.</SpotlightBody>
  <SpotlightFooter>
    <SpotlightStepCount current={1} total={4} />
    <SpotlightActions>
      <SpotlightPrimaryAction>Next</SpotlightPrimaryAction>
    </SpotlightActions>
  </SpotlightFooter>
</SpotlightCard>

// Anchor to an element with a pulse
<SpotlightTarget open={open} onOpenChange={setOpen} content={<SpotlightCard>…</SpotlightCard>}>
  <Button variant="discovery">Create agent</Button>
</SpotlightTarget>`,
		subComponents: [
			{ name: "SpotlightCard", description: "Root dark inverse surface that lays out the spotlight content." },
			{ name: "SpotlightMedia", description: "Optional full-bleed media region at the top of the card." },
			{ name: "SpotlightHeader", description: "Row holding the headline and optional controls." },
			{ name: "SpotlightHeadline", description: "Heading text styled with font.heading.xsmall." },
			{ name: "SpotlightBody", description: "Body copy rendered in inverse text." },
			{ name: "SpotlightFooter", description: "Bottom row pairing the step count with the actions." },
			{
				name: "SpotlightStepCount",
				description: "Sequence indicator (e.g. \"2 of 4\").",
				props: [
					{ name: "current", type: "number", required: true, description: "1-based index of the current step." },
					{ name: "total", type: "number", required: true, description: "Total number of steps." },
				],
			},
			{ name: "SpotlightActions", description: "Right-aligned cluster of action buttons." },
			{ name: "SpotlightPrimaryAction", description: "Primary button, filled with the inverse-text color for guaranteed contrast." },
			{ name: "SpotlightSecondaryAction", description: "Subtle inverse action (e.g. Back, Maybe later)." },
			{ name: "SpotlightControls", description: "Container for header controls such as dismiss." },
			{
				name: "SpotlightDismissControl",
				description: "Cross icon button that dismisses the spotlight.",
				props: [
					{ name: "label", type: "string", default: '"Dismiss"', description: "Accessible label for the dismiss button." },
				],
			},
			{
				name: "SpotlightTarget",
				description: "Anchors a spotlight card to a target element with an optional pulse ring (built on the Popover primitive).",
				props: [
					{ name: "content", type: "ReactNode", required: true, description: "The spotlight card rendered in the anchored popover (with a connecting notch)." },
					{ name: "open", type: "boolean", description: "Controlled open state." },
					{ name: "onOpenChange", type: "(open: boolean, details) => void", description: "Called when the open state changes (base-ui change event details included)." },
					{ name: "placement", type: "SpotlightPlacement", description: "ADS-style placement (e.g. \"top-end\"); overrides side/align when set." },
					{ name: "side", type: '"top" | "bottom" | "left" | "right"', default: '"bottom"', description: "base-ui side, used when placement is not provided." },
					{ name: "pulse", type: "boolean", default: "true", description: "Render the animated pulse glow around the target while open." },
					{ name: "shape", type: '"rounded" | "circle"', default: '"rounded"', description: "Corner style for the pulse glow." },
				],
			},
		],
		examples: [
			{ title: "Focused message", description: "A single spotlight card with a headline, body, dismiss control, and one primary action.", demoSlug: "spotlight-basic" },
			{ title: "With media", description: "Spotlight card with a full-bleed illustration and primary/secondary actions.", demoSlug: "spotlight-media" },
			{ title: "Multi-step tour", description: "Sequenced spotlight with a step count and Back/Next/Done navigation.", demoSlug: "spotlight-tour" },
			{ title: "Targeted with pulse", description: "Spotlight anchored to a real element with an animated pulse highlight.", demoSlug: "spotlight-target" },
			{ title: "Placements", description: "Anchored spotlight with a connecting notch; use the picker to try each static placement (top/bottom/left/right × start/center/end).", demoSlug: "spotlight-placements" },
		],
	};
