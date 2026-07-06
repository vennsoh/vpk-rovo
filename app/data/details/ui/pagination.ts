import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PAGINATION_DETAIL: ComponentDetail = {
    description:
      "A pagination component with previous/next navigation, page links, and ellipsis for large datasets.",
    usage: `import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from "@/components/ui/pagination";

<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
    <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
    <PaginationItem><PaginationNext href="#" /></PaginationItem>
  </PaginationContent>
</Pagination>`,
    props: [
      {
        name: "isActive",
        type: "boolean",
        description: "Marks the page link as active (on PaginationLink).",
      },
    ],
    subComponents: [
      {
        name: "PaginationContent",
        description: "Container for pagination items.",
      },
      {
        name: "PaginationItem",
        description: "Wrapper for each pagination element.",
      },
      { name: "PaginationLink", description: "Page number link." },
      { name: "PaginationPrevious", description: "Previous page button." },
      { name: "PaginationNext", description: "Next page button." },
      {
        name: "PaginationEllipsis",
        description: "Ellipsis for skipped pages.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic pagination with pages.",
        demoSlug: "pagination-demo-default",
      },
      {
        title: "With ellipsis",
        description: "Pagination with skipped page ranges.",
        demoSlug: "pagination-demo-with-ellipsis",
      },
      {
        title: "Simple",
        description: "Previous and next only.",
        demoSlug: "pagination-demo-simple",
      },
      { title: "Basic", demoSlug: "pagination-demo-basic" },
      {
        title: "With select",
        description: "Pagination with page size select.",
        demoSlug: "pagination-demo-with-select",
      },
    ],
  };
