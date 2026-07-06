import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PROGRESS_TRACKER_DETAIL: ComponentDetail = {
    description:
      "Step tracker with labels, optional bylines, and completion states. Maps to @atlaskit/progress-tracker.",
    usage: `import { ProgressTracker, type ProgressTrackerStep } from "@/components/ui/progress-tracker"

const steps: ProgressTrackerStep[] = [
  { id: "1", label: "Step 1", state: "done" },
  { id: "2", label: "Step 2", byline: "Optional detail", state: "current" },
  { id: "3", label: "Step 3", state: "warning" },
]
<ProgressTracker steps={steps} />`,
    props: [
      {
        name: "steps",
        type: "ProgressTrackerStep[]",
        description: "Array of step objects with id, label, optional byline, and state.",
      },
      {
        name: "labelClassName",
        type: "string",
        description: "Optional classes applied to each step label.",
      },
      {
        name: "bylineClassName",
        type: "string",
        description: "Optional classes applied to each step byline.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Mixed step statuses.",
        demoSlug: "progress-tracker-demo-default",
      },
      {
        title: "All done",
        description: "All steps completed.",
        demoSlug: "progress-tracker-demo-all-done",
      },
      {
        title: "All todo",
        description: "All steps pending.",
        demoSlug: "progress-tracker-demo-all-todo",
      },
      {
        title: "Activity timeline",
        description:
          "Agent activity feed with timestamp bylines, Rovo thread-link tags, and mixed running, completed, and failed states.",
        demoSlug: "progress-tracker-demo-activity-timeline",
      },
    ],
  };
