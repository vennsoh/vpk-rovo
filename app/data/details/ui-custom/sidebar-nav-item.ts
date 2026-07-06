import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SIDEBAR_NAV_ITEM_DETAIL: ComponentDetail = {
	description:
		"A compact side navigation item with disclosure icons, selected and focus states, trailing actions, and optional numeric metadata.",
	adsUrl: "https://atlassian.design/components/navigation-system/side-nav-items",
	adsLinks: [
		{
			label: "Side nav items",
			url: "https://atlassian.design/components/navigation-system/side-nav-items",
		},
		{
			label: "Badge",
			url: "https://atlassian.design/components/badge/",
		},
		{
			label: "Icon button",
			url: "https://atlassian.design/components/button/icon-button/",
		},
	],
	importStatement:
		'import { SidebarNavItem, SidebarNavItemAction, SidebarNavItemCount } from "@/components/ui-custom/sidebar-nav-item";',
	usage: `import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import { SidebarNavItem, SidebarNavItemAction, SidebarNavItemCount } from "@/components/ui-custom/sidebar-nav-item";

<div className="w-[276px]">
  <SidebarNavItem
    label="Artifacts"
    leading={<ChevronRightIcon label="" size="small" />}
    meta={<SidebarNavItemCount>25</SidebarNavItemCount>}
    actions={
      <SidebarNavItemAction aria-label="Open artifacts">
        <ShowMoreHorizontalIcon label="" size="small" />
      </SidebarNavItemAction>
    }
  />
</div>`,
	props: [
		{
			name: "label",
			type: "React.ReactNode",
			required: true,
			description: "Primary row label.",
		},
		{
			name: "leading",
			type: "React.ReactNode",
			description: "Optional leading visual, typically a 12px chevron or 16px product icon.",
		},
		{
			name: "leadingSize",
			type: '"small" | "medium"',
			default: '"small"',
			description: "Size contract for the leading icon slot. Use `medium` for 16px product icons.",
		},
		{
			name: "meta",
			type: "React.ReactNode",
			description: "Optional trailing metadata slot, typically a count badge.",
		},
		{
			name: "actions",
			type: "React.ReactNode",
			description: "Optional trailing action area. Keep action buttons separately labelled for accessibility.",
		},
		{
			name: "isSelected",
			type: "boolean",
			default: "false",
			description: "Applies the selected background, text color, and left notch.",
		},
		{
			name: "isExpanded",
			type: "boolean",
			description: "Mirrors disclosure state via `aria-expanded` on the primary action.",
		},
		{
			name: "interactionState",
			type: '"rest" | "hovered" | "focus-visible"',
			default: '"rest"',
			description: "Preview override for docs and static mocks.",
		},
		{
			name: "onClick",
			type: "(event: React.MouseEvent<HTMLButtonElement>) => void",
			description: "Click handler for the primary label area.",
		},
		{
			name: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables the primary action and dims the row.",
		},
	],
	subComponents: [
		{
			name: "SidebarNavItemAction",
			description: "24px ghost icon button for trailing actions.",
		},
		{
			name: "SidebarNavItemCount",
			description: "Neutral 16px count badge tuned for sidebar metadata.",
		},
	],
	examples: [
		{
			title: "Default",
			description: "Collapsed disclosure row with a single trailing action.",
			demoSlug: "sidebar-nav-item-demo-default",
		},
		{
			title: "Tile leading avatar",
			description:
				"Leading avatar standardized on the Tile snug variant — a transparent 24x24 tile holding 20x20 content (the same treatment as the Studio agent rows).",
			demoSlug: "sidebar-nav-item-demo-tile-leading",
		},
		{
			title: "Expanded",
			description: "Expanded disclosure row with add and drill-in actions.",
			demoSlug: "sidebar-nav-item-demo-expanded",
		},
		{
			title: "Hovered",
			description: "Hovered state from the Figma reference.",
			demoSlug: "sidebar-nav-item-demo-hovered",
		},
		{
			title: "Selected",
			description: "Selected state with left notch and selected icon/text colors.",
			demoSlug: "sidebar-nav-item-demo-selected",
		},
		{
			title: "Focus visible",
			description: "Focused state with the 2px ADS-style focus ring.",
			demoSlug: "sidebar-nav-item-demo-focus-visible",
		},
		{
			title: "With count",
			description: "Trailing neutral count badge plus action slot.",
			demoSlug: "sidebar-nav-item-demo-with-count",
		},
		{
			title: "Project icon",
			description: "Leading 16px project icon with the same count treatment.",
			demoSlug: "sidebar-nav-item-demo-project-count",
		},
		{
			title: "With description",
			description: "Secondary description text below the label, useful for metadata like timestamps.",
			demoSlug: "sidebar-nav-item-demo-with-description",
		},
		{
			title: "Nested levels",
			description: "Nested items use 12px left indentation per level.",
			demoSlug: "sidebar-nav-item-demo-nested-levels",
		},
	],
};
