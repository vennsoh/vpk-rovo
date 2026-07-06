import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SPINNER_DETAIL: ComponentDetail = {
    description:
      "A loading spinner with an indeterminate arc that sweeps around the circle. Supports an `inherit` text-color variant, an `invert` variant for dark surfaces, and a `rainbow` variant that paints the arc with the Rovo brand gradient.",
    adsUrl: "https://atlassian.design/components/spinner",
    usage: `import { Spinner } from "@/components/ui/spinner";

<Spinner />
<Spinner size="xl" />
<Spinner variant="rainbow" />`,
    props: [
      {
        name: "size",
        type: `"xs" | "sm" | "default" | "lg" | "xl"`,
        default: `"default"`,
        description: "Glyph size.",
      },
      {
        name: "variant",
        type: `"inherit" | "invert" | "rainbow"`,
        default: `"inherit"`,
        description:
          "Stroke color. `inherit` follows currentColor, `invert` paints the background token, `rainbow` uses the Rovo brand gradient.",
      },
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes for sizing.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "spinner-demo-default" },
      {
        title: "Sizes",
        description: "Different spinner sizes.",
        demoSlug: "spinner-demo-sizes",
      },
      {
        title: "Rainbow",
        description: "Rovo brand-gradient variant used for agent loading states.",
        demoSlug: "spinner-demo-rainbow",
      },
      { title: "Basic", demoSlug: "spinner-demo-basic" },
      {
        title: "In badges",
        description: "Spinner inside badge components.",
        demoSlug: "spinner-demo-in-badges",
      },
      {
        title: "In buttons",
        description: "Spinner inside button components.",
        demoSlug: "spinner-demo-in-buttons",
      },
      {
        title: "In empty state",
        description: "Spinner in an empty state layout.",
        demoSlug: "spinner-demo-in-empty-state",
      },
      {
        title: "In input group",
        description: "Spinner inside an input group.",
        demoSlug: "spinner-demo-in-input-group",
      },
    ],
  };
