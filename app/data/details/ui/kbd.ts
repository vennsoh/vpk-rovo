import type { ComponentDetail } from "@/app/data/component-detail-types";

export const KBD_DETAIL: ComponentDetail = {
    description:
      "A keyboard key display component for showing keyboard shortcuts with optional grouping.",
    usage: `import { Kbd, KbdGroup } from "@/components/ui/kbd";

<Kbd>⌘</Kbd>
<KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>`,
    subComponents: [
      {
        name: "KbdGroup",
        description: "Container for grouping multiple keys.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Single keyboard keys.",
        demoSlug: "kbd-demo-default",
      },
      {
        title: "Group",
        description: "Grouped keyboard shortcut.",
        demoSlug: "kbd-demo-group",
      },
      {
        title: "Arrow keys",
        description: "Arrow key representations.",
        demoSlug: "kbd-demo-arrow-keys",
      },
      { title: "Combined", demoSlug: "kbd-demo-basic" },
      {
        title: "Input group",
        description: "Kbd inside an input group.",
        demoSlug: "kbd-demo-input-group",
      },
      {
        title: "Kbd group",
        description: "Multiple grouped key combinations.",
        demoSlug: "kbd-demo-kbd-group",
      },
      {
        title: "Modifier keys",
        description: "Modifier key representations.",
        demoSlug: "kbd-demo-modifier-keys",
      },
      {
        title: "Tooltip",
        description: "Kbd inside a tooltip.",
        demoSlug: "kbd-demo-tooltip",
      },
      {
        title: "With icons and text",
        description: "Kbd with icons and text labels.",
        demoSlug: "kbd-demo-with-icons-and-text",
      },
      {
        title: "With icons",
        description: "Kbd with icon representations.",
        demoSlug: "kbd-demo-with-icons",
      },
      {
        title: "With samp",
        description: "Kbd with samp element for output.",
        demoSlug: "kbd-demo-with-samp",
      },
    ],
  };
