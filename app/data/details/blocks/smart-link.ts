import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SMART_LINK_DETAIL: ComponentDetail = {
		description: "Inline smart link chips with hover-only rich previews for Atlassian and third-party work references. Built on the shared HoverCard primitive.",
		importStatement: `import { SmartLink } from "@/components/blocks/smart-link";
import type { SmartLinkItem } from "@/components/blocks/smart-link";`,
		usage: `import { SmartLink } from "@/components/blocks/smart-link";
import type { SmartLinkItem } from "@/components/blocks/smart-link";

const item: SmartLinkItem = {
  id: "page-1",
  href: "#page-1",
  title: "Project slingshot release plan",
  variant: "confluence",
  provider: { name: "Confluence", logo: { kind: "atlassian", name: "confluence" } },
  icon: { kind: "atlassian", name: "confluence" },
};

<SmartLink
  item={item}
  onActionSelect={(action, smartLink) => console.log(action.id, smartLink.id)}
/>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "item",
				type: "SmartLinkItem",
				required: true,
				description: "Link, provider, preview metadata, and action data rendered by the trigger and hover card.",
			},
			{
				name: "side",
				type: '"top" | "bottom" | "left" | "right"',
				default: '"bottom"',
				description: "Placement side forwarded to HoverCardContent.",
			},
			{
				name: "align",
				type: '"start" | "center" | "end"',
				default: '"start"',
				description: "Alignment forwarded to HoverCardContent.",
			},
			{
				name: "onActionSelect",
				type: "(action: SmartLinkAction, item: SmartLinkItem) => void",
				description: "Callback for action rows such as Copy link, Open preview, or Summarize.",
			},
		],
		examples: [
			{ title: "Confluence and Jira", description: "Rich Atlassian previews with metadata and action rows.", demoSlug: "smart-link-demo-rich" },
			{ title: "External article", description: "External article preview using fallback brand tile artwork.", demoSlug: "smart-link-demo-article" },
			{ title: "Team", description: "Team preview with avatar stack and provider footer.", demoSlug: "smart-link-demo-team" },
			{ title: "Goal", description: "Goal preview with status, score, date, and goal-specific action.", demoSlug: "smart-link-demo-goal" },
			{ title: "Loom", description: "Loom preview with media-style title, excerpt, and actions.", demoSlug: "smart-link-demo-loom" },
			{ title: "Generic links", description: "File and message previews backed by existing third-party provider assets.", demoSlug: "smart-link-demo-generic" },
		],
	};
