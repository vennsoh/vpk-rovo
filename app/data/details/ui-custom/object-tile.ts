import type { ComponentDetail } from "@/app/data/component-detail-types";

export const OBJECT_TILE_DETAIL: ComponentDetail = {
	description:
		"A tile that represents Atlassian content (Jira issues, Confluence pages, etc.) with icon, title, description, metadata, and action slots. Optionally interactive when an href is provided.",
	usage: `import { ObjectTile } from "@/components/ui-custom/object-tile";
import { IconTile } from "@/components/ui/icon-tile";
import BugIcon from "@atlaskit/icon/core/bug";

<ObjectTile
  icon={<IconTile icon={<BugIcon label="" />} label="Bug" variant="blue" size="small" />}
  title="PROJ-123: Add user authentication"
  description="Implement OAuth2 login flow"
/>`,
	props: [
		{
			name: "title",
			type: "string",
			required: true,
			description: "Primary text for the tile.",
		},
		{
			name: "icon",
			type: "React.ReactNode",
			description: "Icon slot, typically an IconTile or Avatar.",
		},
		{
			name: "description",
			type: "string",
			description: "Secondary text displayed below the title.",
		},
		{
			name: "meta",
			type: "React.ReactNode",
			description: "Trailing metadata slot (e.g. a Lozenge).",
		},
		{
			name: "action",
			type: "React.ReactNode",
			description: "Action area slot.",
		},
		{
			name: "href",
			type: "string",
			description:
				"Makes the tile an interactive link with hover/active states.",
		},
		{
			name: "hasBorder",
			type: "boolean",
			default: "true",
			description: "Whether the tile has a border.",
		},
	],
	examples: [
		{ title: "Default", demoSlug: "object-tile-demo-default" },
		{
			title: "With description",
			description: "Object tile with secondary text.",
			demoSlug: "object-tile-demo-description",
		},
		{
			title: "With metadata",
			description: "Object tile with a trailing lozenge.",
			demoSlug: "object-tile-demo-meta",
		},
		{
			title: "As link",
			description: "Interactive object tile with hover states.",
			demoSlug: "object-tile-demo-link",
		},
		{
			title: "Stacked list",
			description: "Multiple object tiles in a list.",
			demoSlug: "object-tile-demo-list",
		},
		{
			title: "With avatar",
			description: "Object tile using an avatar instead of icon tile.",
			demoSlug: "object-tile-demo-with-avatar",
		},
	],
};
