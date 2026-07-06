import type { ComponentDetail } from "@/app/data/component-detail-types";

export const BLANKET_DETAIL: ComponentDetail = {
    description:
      "Fullscreen overlay for modals and focus-trapping. Maps to @atlaskit/blanket.",
    usage: `import { Blanket } from "@/components/ui/blanket"

<Blanket onClick={handleClose} />`,
    props: [
      {
        name: "isTinted",
        type: "boolean",
        default: "true",
        description: "Whether the blanket has a dark tinted background.",
      },
    ],
    examples: [
      { title: "Default (tinted)", demoSlug: "blanket-demo-default" },
      { title: "Transparent", demoSlug: "blanket-demo-transparent" },
      {
        title: "With content",
        description: "Blanket with centered content overlay.",
        demoSlug: "blanket-demo-with-content",
      },
    ],
  };
