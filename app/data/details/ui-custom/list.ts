import type { ComponentDetail } from "@/app/data/component-detail-types";

export const LIST_DETAIL: ComponentDetail = {
		description:
			"A presentational compound for rendering record lists styled as a rounded card with a fixed-width column layout. List.Root provides the labelled section wrapper, List.Heading renders a subtle section label, and List.Table sets up the colgroup and table body. Compose rows with List.Row and cells with List.Cell — rows get a 14-unit height, divider borders, and a row-wide hover highlight, while the leading/trailing edge cells round the outer corners automatically. Keep state and interaction logic in the consuming component; List stays purely presentational.",
		usage: `import { List, type ListColumn } from "@/components/ui-custom/list";

const COLUMNS: readonly ListColumn[] = [{}, { className: "w-[120px]" }];

<List.Root aria-labelledby="recent-heading">
  <List.Heading id="recent-heading">Recent work items</List.Heading>
  <List.Table columns={COLUMNS}>
    <List.Row>
      <List.Cell edge="leading">PROJ-123: Add user authentication</List.Cell>
      <List.Cell edge="trailing">2 days ago</List.Cell>
    </List.Row>
  </List.Table>
</List.Root>`,
		props: [
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the List.Root section.",
			},
		],
		subComponents: [
			{ name: "List.Root", description: "Section wrapper (flex column, gap-2). Forwards props such as aria-labelledby for accessible labelling." },
			{ name: "List.Heading", description: "h2 rendered with the subtle section-label styling. Pair its id with List.Root's aria-labelledby." },
			{ name: "List.Table", description: "Table with a table-fixed layout. Renders one <col> per entry in the `columns` array, wraps children in a TableBody, and tracks each row's position so edge cells can round the outer corners." },
			{ name: "List.Row", description: "A table row styled for lists: 14-unit height, divider border, and a group hover target. The hover highlight is applied by List.Cell so the rounded corners can clip it." },
			{ name: "List.Cell", description: "A list cell with px-2 padding and the row-wide hover highlight. Pass edge=\"leading\" / edge=\"trailing\" on the first/last cell so it rounds the matching outer corners on the first and last rows." },
		],
		examples: [
			{ title: "Basic", description: "A minimal two-column list without a heading.", demoSlug: "list-demo-basic" },
			{ title: "With status", description: "A three-column list with a heading and status lozenges.", demoSlug: "list-demo-with-status" },
		],
	};
