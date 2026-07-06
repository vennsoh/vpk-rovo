import type { ComponentDetail } from "@/app/data/component-detail-types";

export const DIRECTION_DETAIL: ComponentDetail = {
    description:
      "A provider component for RTL/LTR direction support, wrapping Base UI's DirectionProvider.",
    usage: `import { DirectionProvider } from "@/components/ui/direction";

<DirectionProvider direction="rtl">
  <div>Right-to-left content</div>
</DirectionProvider>`,
    props: [
      {
        name: "direction",
        type: '"ltr" | "rtl"',
        description: "Text direction.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Left-to-right direction.",
        demoSlug: "direction-demo-default",
      },
      {
        title: "RTL",
        description: "Right-to-left direction.",
        demoSlug: "direction-demo-rtl",
      },
    ],
  };
