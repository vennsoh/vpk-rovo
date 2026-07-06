import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PAGE_HEADER_DETAIL: ComponentDetail = {
    description:
      "A page-level header component with title, description, breadcrumbs, and action slots. Provides consistent page header layout across views.",
    usage: `import { PageHeader } from "@/components/ui/page-header";

<PageHeader title="Projects" description="Manage your projects." />
<PageHeader title="Issues" actions={<Button>Create</Button>} />`,
    props: [
      {
        name: "title",
        type: "React.ReactNode",
        description: "Primary page heading.",
      },
      {
        name: "description",
        type: "React.ReactNode",
        description: "Optional subtitle or description text.",
      },
      {
        name: "actions",
        type: "React.ReactNode",
        description: "Action buttons displayed on the right.",
      },
      {
        name: "breadcrumbs",
        type: "React.ReactNode",
        description: "Breadcrumb navigation above the title.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "page-header-demo-default" },
      {
        title: "With description",
        demoSlug: "page-header-demo-with-description",
      },
      { title: "With actions", demoSlug: "page-header-demo-with-actions" },
      {
        title: "With breadcrumbs",
        demoSlug: "page-header-demo-with-breadcrumbs",
      },
      { title: "Title only", demoSlug: "page-header-demo-title-only" },
    ],
  };
