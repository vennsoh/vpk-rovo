import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PROGRESS_INDICATOR_DETAIL: ComponentDetail = {
    description:
      "Dot-based step indicator showing current position in a sequence. Maps to @atlaskit/progress-indicator.",
    adsUrl: "https://atlassian.design/components/progress-indicator",
    usage: `import { ProgressIndicator } from "@/components/ui/progress-indicator"

<ProgressIndicator steps={5} currentStep={2} />
<ProgressIndicator steps={5} currentStep={2} variant="primary" />
<ProgressIndicator steps={5} currentStep={2} size="sm" />`,
    props: [
      { name: "steps", type: "number", description: "Total number of steps." },
      {
        name: "currentStep",
        type: "number",
        description: "Current active step (0-indexed).",
      },
      {
        name: "variant",
        type: '"default" | "primary" | "discovery" | "inverted"',
        description: "Visual appearance of the indicator dots.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        description: "Size of the dots.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Default appearance with neutral selected dot.",
        demoSlug: "progress-indicator-demo-default",
      },
      {
        title: "Appearances",
        description: "Default, primary, discovery, and inverted variants.",
        demoSlug: "progress-indicator-demo-appearances",
      },
      {
        title: "Sizes",
        description: "Small, medium, and large dot sizes.",
        demoSlug: "progress-indicator-demo-sizes",
      },
      {
        title: "Interaction",
        description: "Navigate between steps with buttons.",
        demoSlug: "progress-indicator-demo-interaction",
      },
      {
        title: "Start",
        description: "First step active.",
        demoSlug: "progress-indicator-demo-start",
      },
      {
        title: "Complete",
        description: "Last step active.",
        demoSlug: "progress-indicator-demo-complete",
      },
      {
        title: "Three steps",
        description: "Three-step indicator.",
        demoSlug: "progress-indicator-demo-three-steps",
      },
    ],
  };
