import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ASPECT_RATIO_DETAIL: ComponentDetail = {
    description:
      "A utility component that maintains a specified aspect ratio for its child content.",
    usage: `import { AspectRatio } from "@/components/ui/aspect-ratio";

<AspectRatio ratio={16 / 9}>
  <img src="/illustration/rich-icon/design/standard.svg" alt="Photo" className="h-full w-full object-cover" />
</AspectRatio>`,
    props: [
      {
        name: "ratio",
        type: "number",
        required: true,
        description: "Aspect ratio to maintain (e.g., 16/9, 4/3, 1).",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "16:9 aspect ratio.",
        demoSlug: "aspect-ratio-demo-default",
      },
      {
        title: "Square",
        description: "1:1 square aspect ratio.",
        demoSlug: "aspect-ratio-demo-square",
      },
      {
        title: "16:9",
        description: "16:9 widescreen ratio.",
        demoSlug: "aspect-ratio-demo-16x9",
      },
      {
        title: "1:1",
        description: "1:1 square ratio.",
        demoSlug: "aspect-ratio-demo-1x1",
      },
      {
        title: "21:9",
        description: "21:9 ultrawide ratio.",
        demoSlug: "aspect-ratio-demo-21x9",
      },
      {
        title: "9:16",
        description: "9:16 portrait ratio.",
        demoSlug: "aspect-ratio-demo-9x16",
      },
    ],
  };
