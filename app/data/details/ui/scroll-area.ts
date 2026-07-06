import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SCROLL_AREA_DETAIL: ComponentDetail = {
    description:
      "A scrollable area component built on Base UI ScrollArea with custom styled scrollbars.",
    usage: `import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

<ScrollArea className="h-48 w-48 rounded-md border">
  <div className="p-4">Scrollable content</div>
</ScrollArea>`,
    props: [
      {
        name: "orientation",
        type: '"vertical" | "horizontal"',
        default: '"vertical"',
        description: "Scrollbar orientation (on ScrollBar).",
      },
    ],
    subComponents: [
      { name: "ScrollBar", description: "Custom styled scrollbar element." },
    ],
    examples: [
      {
        title: "Default",
        description: "Vertical scrollable list.",
        demoSlug: "scroll-area-demo-default",
      },
      {
        title: "Horizontal",
        description: "Horizontal scroll with scrollbar.",
        demoSlug: "scroll-area-demo-horizontal",
      },
      {
        title: "Vertical",
        description: "Vertical scroll with scrollbar.",
        demoSlug: "scroll-area-demo-vertical",
      },
    ],
  };
