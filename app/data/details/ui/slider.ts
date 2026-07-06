import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SLIDER_DETAIL: ComponentDetail = {
    description:
      "A range slider component built on Base UI Slider with single and multi-thumb support. Maps to @atlaskit/range.",
    adsUrl: "https://atlassian.design/components/range",
    usage: `import { Slider } from "@/components/ui/slider";

<Slider defaultValue={[50]} max={100} />
<Slider defaultValue={[25, 75]} max={100} />`,
    props: [
      {
        name: "defaultValue",
        type: "number[]",
        description: "Initial slider value(s).",
      },
      {
        name: "value",
        type: "number[]",
        description: "Controlled slider value(s).",
      },
      {
        name: "min",
        type: "number",
        default: "0",
        description: "Minimum value.",
      },
      {
        name: "max",
        type: "number",
        default: "100",
        description: "Maximum value.",
      },
      { name: "disabled", type: "boolean", description: "Disable the slider." },
    ],
    examples: [
      {
        title: "Default",
        description: "Single-thumb slider.",
        demoSlug: "slider-demo-default",
      },
      {
        title: "Range",
        description: "Two-thumb range slider.",
        demoSlug: "slider-demo-range",
      },
      {
        title: "Disabled",
        description: "Disabled slider.",
        demoSlug: "slider-demo-disabled",
      },
      { title: "Basic", demoSlug: "slider-demo-basic" },
      {
        title: "Controlled",
        description: "Controlled slider with state management.",
        demoSlug: "slider-demo-controlled",
      },
      {
        title: "Multiple thumbs",
        description: "Slider with multiple thumbs.",
        demoSlug: "slider-demo-multiple-thumbs",
      },
      {
        title: "Vertical",
        description: "Vertically-oriented slider.",
        demoSlug: "slider-demo-vertical",
      },
    ],
  };
