import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TOGGLE_GROUP_DETAIL: ComponentDetail = {
    description:
      "A group of toggle buttons built on Base UI with shared context for variant and size.",
    usage: `import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

<ToggleGroup>
  <ToggleGroupItem value="bold" aria-label="Bold">B</ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Italic">I</ToggleGroupItem>
</ToggleGroup>`,
    props: [
      {
        name: "variant",
        type: '"default" | "outline"',
        default: '"default"',
        description: "Visual style for all items.",
      },
      {
        name: "size",
        type: '"default" | "sm" | "lg"',
        default: '"default"',
        description: "Size for all items.",
      },
      {
        name: "spacing",
        type: "number",
        default: "0",
        description: "Gap between items in pixels.",
      },
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Layout direction.",
      },
    ],
    subComponents: [
      {
        name: "ToggleGroupItem",
        description: "Individual toggle button within the group.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Single-select toggle group.",
        demoSlug: "toggle-group-demo-default",
      },
      {
        title: "Outline",
        description: "Outline variant.",
        demoSlug: "toggle-group-demo-outline",
      },
      {
        title: "Multiple",
        description: "Multi-select toggle group.",
        demoSlug: "toggle-group-demo-multiple",
      },
      { title: "Basic", demoSlug: "toggle-group-demo-basic" },
      {
        title: "Date range",
        description: "Toggle group as a date range picker.",
        demoSlug: "toggle-group-demo-date-range",
      },
      {
        title: "Filter",
        description: "Toggle group used as a filter bar.",
        demoSlug: "toggle-group-demo-filter",
      },
      {
        title: "Outline with icons",
        description: "Outline variant with icon items.",
        demoSlug: "toggle-group-demo-outline-with-icons",
      },
      {
        title: "Sizes",
        description: "Toggle group size variants.",
        demoSlug: "toggle-group-demo-sizes",
      },
      {
        title: "Sort",
        description: "Toggle group used as a sort selector.",
        demoSlug: "toggle-group-demo-sort",
      },
      {
        title: "Vertical outline with icons",
        description: "Vertical outline variant with icons.",
        demoSlug: "toggle-group-demo-vertical-outline-with-icons",
      },
      {
        title: "Vertical outline",
        description: "Vertical outline variant.",
        demoSlug: "toggle-group-demo-vertical-outline",
      },
      {
        title: "Vertical with spacing",
        description: "Vertical group with spacing between items.",
        demoSlug: "toggle-group-demo-vertical-with-spacing",
      },
      {
        title: "Vertical",
        description: "Vertically-oriented toggle group.",
        demoSlug: "toggle-group-demo-vertical",
      },
      {
        title: "With icons",
        description: "Toggle group items with icons.",
        demoSlug: "toggle-group-demo-with-icons",
      },
      {
        title: "With input and select",
        description: "Toggle group combined with input and select.",
        demoSlug: "toggle-group-demo-with-input-and-select",
      },
      {
        title: "With spacing",
        description: "Toggle group with spacing between items.",
        demoSlug: "toggle-group-demo-with-spacing",
      },
    ],
  };
