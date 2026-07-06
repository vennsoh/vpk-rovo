import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ICON_DETAIL: ComponentDetail = {
	description:
		'An accessible icon wrapper that renders any icon element with proper ARIA attributes. Wraps icons in a semantic span with role="img".',
	adsUrl: "https://atlassian.design/components/icon",
	usage: `import { Icon } from "@/components/ui/icon";
import SearchIcon from "@atlaskit/icon/core/search";

<Icon render={<SearchIcon label="" />} label="Search" />`,
	props: [
		{
			name: "render",
			type: "React.ReactElement",
			required: true,
			description: "The icon element to render.",
		},
		{
			name: "label",
			type: "string",
			required: true,
			description: "Accessible label for the icon (used as aria-label).",
		},
		{
			name: "className",
			type: "string",
			description: "Additional CSS classes for sizing and color.",
		},
	],
	examples: [
		{ title: "Default", demoSlug: "icon-demo-default" },
		{
			title: "Multiple icons",
			description: "Several icons displayed together.",
			demoSlug: "icon-demo-multiple",
		},
		{
			title: "Sizes",
			description:
				'Pass size="small" (12px) or size="medium" (16px, default) directly to the Atlaskit icon.',
			demoSlug: "icon-demo-sized",
		},
		{
			title: "Colors",
			description: "Icons with semantic color classes.",
			demoSlug: "icon-demo-colored",
		},
	],
};
