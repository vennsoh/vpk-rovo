import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TABLE_DETAIL: ComponentDetail = {
    description:
      "A semantic HTML table component with styled header, body, footer, rows, and cells for data display.",
    adsUrl: "https://atlassian.design/components/dynamic-table",
    usage: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
    subComponents: [
      { name: "TableHeader", description: "Table header section." },
      { name: "TableBody", description: "Table body section." },
      { name: "TableFooter", description: "Table footer section." },
      { name: "TableRow", description: "Individual table row." },
      { name: "TableHead", description: "Header cell." },
      { name: "TableCell", description: "Body cell." },
      { name: "TableCaption", description: "Table caption for accessibility." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic data table.",
        demoSlug: "table-demo-default",
      },
      {
        title: "With caption",
        description: "Table with accessibility caption.",
        demoSlug: "table-demo-with-caption",
      },
      {
        title: "With footer",
        description: "Table with totals footer.",
        demoSlug: "table-demo-with-footer",
      },
      { title: "Basic", demoSlug: "table-demo-basic" },
      {
        title: "Simple",
        description: "Simple minimal table.",
        demoSlug: "table-demo-simple",
      },
      {
        title: "With actions",
        description: "Table rows with action buttons.",
        demoSlug: "table-demo-with-actions",
      },
      {
        title: "With badges",
        description: "Table cells with badge indicators.",
        demoSlug: "table-demo-with-badges",
      },
      {
        title: "With input",
        description: "Table cells with editable inputs.",
        demoSlug: "table-demo-with-input",
      },
      {
        title: "With select",
        description: "Table cells with select dropdowns.",
        demoSlug: "table-demo-with-select",
      },
      {
        title: "Striped",
        description: "Alternating row backgrounds for readability.",
        demoSlug: "table-demo-striped",
      },
      {
        title: "Row highlight",
        description: "Highlighted and selected rows.",
        demoSlug: "table-demo-row-highlight",
      },
    ],
  };
