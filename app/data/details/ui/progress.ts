import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PROGRESS_DETAIL: ComponentDetail = {
    description:
      "Horizontal progress bar with track, indicator, label, and value. Built on Base UI Progress. Maps to @atlaskit/progress-bar.",
    adsUrl: "https://atlassian.design/components/progress-bar",
    usage: `import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";

<Progress value={60} />

<Progress value={100} variant="success">
  <ProgressLabel>Complete</ProgressLabel>
  <ProgressValue />
</Progress>`,
    props: [
      {
        name: "value",
        type: "number",
        description: "Current progress value (0-100).",
      },
      {
        name: "variant",
        type: '"default" | "success" | "inverse" | "transparent"',
        default: '"default"',
        description:
          "Visual variant. Default uses neutral bold, success uses green, inverse uses white, transparent hides the track.",
      },
      {
        name: "isIndeterminate",
        type: "boolean",
        default: "false",
        description: "Show indeterminate sliding animation.",
      },
    ],
    subComponents: [
      { name: "ProgressTrack", description: "Background track element." },
      {
        name: "ProgressIndicator",
        description: "Filled indicator showing progress.",
      },
      {
        name: "ProgressLabel",
        description: "Text label for the progress bar.",
      },
      {
        name: "ProgressValue",
        description: "Displays the current percentage.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Progress bar at 60%.",
        demoSlug: "progress-demo-default",
      },
      {
        title: "Variants",
        description: "All visual variants.",
        demoSlug: "progress-demo-variants",
      },
      {
        title: "Success progress bar",
        description: "Green indicator for completed or positive progress.",
        demoSlug: "progress-demo-success",
      },
      {
        title: "Transparent progress bar",
        description: "Progress bar with no visible track background.",
        demoSlug: "progress-demo-transparent",
      },
      {
        title: "Indeterminate",
        description: "Sliding animation for unknown progress.",
        demoSlug: "progress-demo-indeterminate",
      },
      {
        title: "With label",
        description: "Progress with label and value.",
        demoSlug: "progress-demo-with-label",
      },
      {
        title: "Controlled",
        description: "Controlled progress with slider.",
        demoSlug: "progress-demo-controlled",
      },
      {
        title: "File upload list",
        description: "Progress bars in a file upload list.",
        demoSlug: "progress-demo-file-upload-list",
      },
      {
        title: "Zero",
        description: "Empty progress bar.",
        demoSlug: "progress-demo-zero",
      },
    ],
  };
