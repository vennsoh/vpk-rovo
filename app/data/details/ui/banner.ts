import type { ComponentDetail } from "@/app/data/component-detail-types";

export const BANNER_DETAIL: ComponentDetail = {
    description:
      "Full-width message bar pinned to the top of the page for warnings, errors, and announcements. Maps to @atlaskit/banner.",
    adsUrl: "https://atlassian.design/components/banner",
    usage: `import { Banner } from "@/components/ui/banner";

<Banner variant="warning">
  Your license is about to expire.
</Banner>`,
    props: [
      {
        name: "variant",
        type: '"warning" | "error" | "announcement"',
        default: '"warning"',
        description:
          "Visual style variant. Each variant includes a corresponding icon.",
      },
    ],
    examples: [
      {
        title: "Warning",
        description: "Warning banner.",
        demoSlug: "banner-demo-warning",
      },
      {
        title: "Error",
        description: "Error banner.",
        demoSlug: "banner-demo-error",
      },
      {
        title: "Announcement",
        description: "Announcement banner.",
        demoSlug: "banner-demo-announcement",
      },
      {
        title: "All variants",
        description: "All banner variants.",
        demoSlug: "banner-demo-variants",
      },
    ],
  };
