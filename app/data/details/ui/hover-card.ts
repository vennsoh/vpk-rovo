import type { ComponentDetail } from "@/app/data/component-detail-types";

export const HOVER_CARD_DETAIL: ComponentDetail = {
    description:
      "A floating preview card component built on Base UI PreviewCard that appears on hover. Covers the use cases of ADS InlineDialog and InlineMessage — contextual previews, inline info, and lightweight popups.",
    adsUrl: "https://atlassian.design/components/inline-dialog",
    usage: `import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

<HoverCard>
  <HoverCardTrigger>Hover me</HoverCardTrigger>
  <HoverCardContent>Preview content</HoverCardContent>
</HoverCard>`,
    props: [
      {
        name: "openDelay",
        type: "number",
        description: "Delay before showing.",
      },
      {
        name: "closeDelay",
        type: "number",
        description: "Delay before hiding.",
      },
      {
        name: "side",
        type: '"top" | "bottom" | "left" | "right"',
        default: '"bottom"',
        description: "Placement side.",
      },
    ],
    subComponents: [
      {
        name: "HoverCardTrigger",
        description: "Element that triggers the card on hover.",
      },
      { name: "HoverCardContent", description: "Floating card content." },
    ],
    examples: [
      {
        title: "Default",
        description: "Hover over a text link to show a profile preview.",
        demoSlug: "hover-card-demo-default",
      },
      {
        title: "Button trigger",
        description: "Hover over a button to show contextual details.",
        demoSlug: "hover-card-demo-button",
      },
      {
        title: "Inline message",
        description: "Status messages with icons that reveal details on hover.",
        demoSlug: "hover-card-demo-inline-message",
      },
      {
        title: "Placement",
        description: "Right-side placement.",
        demoSlug: "hover-card-demo-placement",
      },
      {
        title: "Sides",
        description: "Hover card on different sides.",
        demoSlug: "hover-card-demo-sides",
      },
    ],
  };
