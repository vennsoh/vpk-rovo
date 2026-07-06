import type { ComponentDetail } from "@/app/data/component-detail-types";

export const POPOVER_DETAIL: ComponentDetail = {
    description:
      "A floating popover component built on Base UI with configurable positioning and arrow.",
    adsUrl: "https://atlassian.design/components/popup/",
    usage: `import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

<Popover>
  <PopoverTrigger><Button>Open</Button></PopoverTrigger>
  <PopoverContent>Content here</PopoverContent>
</Popover>`,
    props: [
      {
        name: "side",
        type: '"top" | "bottom" | "left" | "right"',
        default: '"bottom"',
        description: "Placement side.",
      },
      {
        name: "sideOffset",
        type: "number",
        description: "Offset from the trigger.",
      },
      {
        name: "align",
        type: '"start" | "center" | "end"',
        description: "Alignment relative to trigger.",
      },
    ],
    subComponents: [
      {
        name: "PopoverTrigger",
        description: "Element that opens the popover.",
      },
      { name: "PopoverContent", description: "Floating content container." },
      { name: "PopoverHeader", description: "Header section." },
      { name: "PopoverTitle", description: "Title text." },
      { name: "PopoverDescription", description: "Description text." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic popover with text content.",
        demoSlug: "popover-demo-default",
      },
      {
        title: "With form",
        description: "Popover containing form fields.",
        demoSlug: "popover-demo-with-form",
      },
      {
        title: "Placement",
        description: "Top-side placement.",
        demoSlug: "popover-demo-placement",
      },
      {
        title: "Alignments",
        description: "Popover with different alignment options.",
        demoSlug: "popover-demo-alignments",
      },
      { title: "Basic", demoSlug: "popover-demo-basic" },
      {
        title: "In dialog",
        description: "Popover inside a dialog.",
        demoSlug: "popover-demo-in-dialog",
      },
      {
        title: "Sides",
        description: "Popover opening on different sides.",
        demoSlug: "popover-demo-sides",
      },
    ],
  };
