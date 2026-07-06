import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SKELETON_DETAIL: ComponentDetail = {
    description:
      "A placeholder loading component with pulse animation for content that is still loading.",
    usage: `import { Skeleton } from "@/components/ui/skeleton";

<Skeleton className="h-4 w-48" />
<Skeleton className="h-12 w-12 rounded-full" />`,
    props: [
      {
        name: "className",
        type: "string",
        description: "CSS classes for sizing and shape.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic skeleton shapes.",
        demoSlug: "skeleton-demo-default",
      },
      {
        title: "Card",
        description: "Card-shaped skeleton layout.",
        demoSlug: "skeleton-demo-card",
      },
      {
        title: "List",
        description: "List-item skeleton layout.",
        demoSlug: "skeleton-demo-list",
      },
      {
        title: "Avatar",
        description: "Avatar-shaped skeleton.",
        demoSlug: "skeleton-demo-avatar",
      },
      {
        title: "Form",
        description: "Form skeleton layout.",
        demoSlug: "skeleton-demo-form",
      },
      {
        title: "Table",
        description: "Table skeleton layout.",
        demoSlug: "skeleton-demo-table",
      },
      {
        title: "Text",
        description: "Text paragraph skeleton.",
        demoSlug: "skeleton-demo-text",
      },
    ],
  };
