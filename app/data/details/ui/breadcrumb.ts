import type { ComponentDetail } from "@/app/data/component-detail-types";

export const BREADCRUMB_DETAIL: ComponentDetail = {
    description:
      "A navigation breadcrumb component with semantic HTML, slash separators, medium and small sizes, label slots, and ellipsis support for deep paths.",
    adsUrl: "https://atlassian.design/components/breadcrumbs",
    usage: `import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

<Breadcrumb size="medium">
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Current</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
    subComponents: [
      {
        name: "Breadcrumb",
        description:
          "Navigation wrapper. Set size to medium or small; medium is the default.",
      },
      {
        name: "BreadcrumbList",
        description: "Ordered list container for items.",
      },
      { name: "BreadcrumbItem", description: "Individual breadcrumb entry." },
      {
        name: "BreadcrumbLabel",
        description: "Composable label wrapper with before and after slots.",
      },
      { name: "BreadcrumbLink", description: "Clickable navigation link." },
      {
        name: "BreadcrumbPage",
        description: "Current page indicator (non-clickable).",
      },
      {
        name: "BreadcrumbSeparator",
        description: "Visual separator between items.",
      },
      {
        name: "BreadcrumbEllipsis",
        description: "Ellipsis for truncated paths.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic breadcrumb with links.",
        demoSlug: "breadcrumb-demo-default",
      },
      {
        title: "Ellipsis",
        description: "Truncated path with ellipsis.",
        demoSlug: "breadcrumb-demo-ellipsis",
      },
      {
        title: "Custom separator",
        description: "Custom separator character.",
        demoSlug: "breadcrumb-demo-custom-separator",
      },
      { title: "Basic", demoSlug: "breadcrumb-demo-basic" },
      {
        title: "Sizes",
        description: "Medium and small breadcrumb sizes.",
        demoSlug: "breadcrumb-demo-sizes",
      },
      {
        title: "With label slots",
        description: "Breadcrumb labels with icons, tiles, and icon tiles.",
        demoSlug: "breadcrumb-demo-with-slots",
      },
      {
        title: "With dropdown",
        description: "Breadcrumb with dropdown for hidden items.",
        demoSlug: "breadcrumb-demo-with-dropdown",
      },
      {
        title: "With link",
        description: "Breadcrumb with clickable links.",
        demoSlug: "breadcrumb-demo-with-link",
      },
    ],
  };
