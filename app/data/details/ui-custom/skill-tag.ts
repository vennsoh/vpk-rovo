import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SKILL_TAG_DETAIL: ComponentDetail = {
	description:
		"Skewed parallelogram-shaped tag for displaying AI skill references inline. Features a colored slash bar on the left edge, optional icon, and counter-skewed content.",
	usage: `import { SkillTag, SkillTagGroup } from "@/components/ui-custom/skill-tag"
import SearchIcon from "@atlaskit/icon/core/search"

<SkillTag icon={<SearchIcon label="" size="small" />} color="teamwork">
  Search
</SkillTag>`,
	props: [
		{
			name: "color",
			type: '"default" | "platform" | "marketplace" | "custom" | "teamwork" | "software" | "strategy" | "service" | "product"',
			default: '"default"',
			description:
				"Collection variant. Controls both slash bar color and icon color. Maps to Figma collection names.",
		},
		{
			name: "icon",
			type: "ReactNode",
			description:
				"Icon rendered before the label (12px, counter-skewed to remain upright).",
		},
		{
			name: "onClick",
			type: "(e: MouseEvent) => void",
			description:
				"Click handler. When provided, adds hover/active states and pointer cursor.",
		},
		{
			name: "onRemove",
			type: "() => void",
			description:
				"Remove handler. When provided, renders an X button.",
		},
		{
			name: "removeVariant",
			type: '"inline" | "overlay"',
			default: '"inline"',
			description:
				"Controls remove button treatment. Inline keeps the X persistently visible; overlay reveals it over the tag on hover or focus.",
		},
		{
			name: "maxRows",
			type: "number",
			description:
				"SkillTagGroup-only prop. Collapses tags that would wrap past the row limit into the +N overflow tag.",
		},
	],
	examples: [
		{ title: "Default", demoSlug: "skill-tag-demo-default" },
		{
			title: "Colors",
			description: "All collection and fallback variants.",
			demoSlug: "skill-tag-demo-colors",
		},
		{
			title: "With icon",
			description: "Tags with ADS icons.",
			demoSlug: "skill-tag-demo-with-icon",
		},
		{
			title: "Interactive",
			description: "Clickable tags with hover/active states.",
			demoSlug: "skill-tag-demo-interactive",
		},
		{
			title: "Removable",
			description: "Persistent and overlay remove button variants.",
			demoSlug: "skill-tag-demo-removable",
		},
		{
			title: "Group",
			description: "SkillTagGroup for organizing multiple tags.",
			demoSlug: "skill-tag-demo-group",
		},
		{
			title: "Inline",
			description: "Tags inline with text.",
			demoSlug: "skill-tag-demo-inline",
		},
		{
			title: "Count",
			description:
				"SkillTagCount variant — same shape, no icon or slash bar, renders a +N count for overflow.",
			demoSlug: "skill-tag-demo-count",
		},
		{
			title: "Overflow",
			description:
				"SkillTagGroup with maxRows collapses extra wrapped tags into SkillTagCount.",
			demoSlug: "skill-tag-demo-overflow",
		},
	],
};
