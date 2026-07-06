import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TOOLTIP_DETAIL: ComponentDetail = {
    description:
      "A floating tooltip component built on Base UI with arrow indicator and configurable delay.",
    adsUrl: "https://atlassian.design/components/tooltip",
    usage: `import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger><Button>Hover me</Button></TooltipTrigger>
    <TooltipContent>Tooltip text</TooltipContent>
  </Tooltip>
</TooltipProvider>`,
    props: [
      {
        name: "delay",
        type: "number",
        default: "0",
        description: "Delay before showing (on TooltipProvider).",
      },
      {
        name: "side",
        type: '"top" | "bottom" | "left" | "right"',
        description: "Placement side.",
      },
      {
        name: "sideOffset",
        type: "number",
        description: "Offset from trigger.",
      },
    ],
    subComponents: [
      {
        name: "TooltipProvider",
        description: "Context provider for tooltip configuration.",
      },
      {
        name: "TooltipTrigger",
        description: "Element that triggers the tooltip.",
      },
      { name: "TooltipContent", description: "Floating tooltip content." },
    ],
    examples: [
      { title: "Default", demoSlug: "tooltip-demo-default" },
      {
        title: "Side",
        description: "Right-side placement.",
        demoSlug: "tooltip-demo-side",
      },
      {
        title: "Icon button",
        description: "Tooltip on an icon-only button.",
        demoSlug: "tooltip-demo-icon-button",
      },
      { title: "Basic", demoSlug: "tooltip-demo-basic" },
      {
        title: "Disabled",
        description: "Tooltip on a disabled element.",
        demoSlug: "tooltip-demo-disabled",
      },
      {
        title: "Formatted content",
        description: "Tooltip with rich formatted content.",
        demoSlug: "tooltip-demo-formatted-content",
      },
      {
        title: "Long content",
        description: "Tooltip with long text content.",
        demoSlug: "tooltip-demo-long-content",
      },
      {
        title: "On link",
        description: "Tooltip on a text link.",
        demoSlug: "tooltip-demo-on-link",
      },
      {
        title: "Sides",
        description: "Tooltips on all four sides.",
        demoSlug: "tooltip-demo-sides",
      },
      {
        title: "With icon",
        description: "Tooltip triggered by an icon.",
        demoSlug: "tooltip-demo-with-icon",
      },
      {
        title: "With keyboard shortcut",
        description: "Tooltip showing a keyboard shortcut.",
        demoSlug: "tooltip-demo-with-keyboard-shortcut",
      },
    ],
  };
