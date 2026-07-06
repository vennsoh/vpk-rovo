import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SEPARATOR_DETAIL: ComponentDetail = {
    description:
      "A visual divider component built on Base UI Separator with horizontal and vertical orientations.",
    usage: `import { Separator } from "@/components/ui/separator";

<Separator />
<Separator orientation="vertical" />`,
    props: [
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Direction of the separator.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Horizontal separator.",
        demoSlug: "separator-demo-default",
      },
      {
        title: "Vertical",
        description: "Vertical separator.",
        demoSlug: "separator-demo-vertical",
      },
      {
        title: "Horizontal",
        description: "Horizontal separator between content blocks.",
        demoSlug: "separator-demo-horizontal",
      },
      {
        title: "In list",
        description: "Separator between list items.",
        demoSlug: "separator-demo-in-list",
      },
      {
        title: "Vertical menu",
        description: "Vertical separator between menu items.",
        demoSlug: "separator-demo-vertical-menu",
      },
    ],
  };
