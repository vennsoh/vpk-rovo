import type { ComponentDetail } from "@/app/data/component-detail-types";

export const MARKER_DETAIL: ComponentDetail = {
    description:
      "A lightweight inline marker for timestamps, status notices, and separators in message streams.",
    usage: `import { Marker, MarkerContent } from "@/components/ui/marker";

<Marker variant="separator">
  <MarkerContent>Today</MarkerContent>
</Marker>`,
    props: [
      {
        name: "variant",
        type: '"default" | "border" | "separator"',
        default: '"default"',
        description: "Marker layout and divider treatment.",
      },
      {
        name: "render",
        type: "React.ReactElement",
        description: "Optional element to render as the marker root.",
      },
    ],
    subComponents: [
      { name: "MarkerIcon", description: "Decorative marker icon slot." },
      { name: "MarkerContent", description: "Marker text/content slot." },
    ],
    examples: [
      { title: "Markers", demoSlug: "marker-demo-markers" },
      { title: "Border", demoSlug: "marker-demo-border" },
      { title: "Separator", demoSlug: "marker-demo-separator" },
      { title: "Accordion", demoSlug: "marker-demo-accordion" },
      { title: "Drawer", demoSlug: "marker-demo-drawer" },
    ],
  };
