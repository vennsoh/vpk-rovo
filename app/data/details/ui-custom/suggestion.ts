import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SUGGESTION_DETAIL: ComponentDetail = {
	description:
		"Clickable suggestion chips that present follow-up prompts or quick actions to users. Supports horizontal scrollable and vertical stacked layouts via the Suggestions container, with each Suggestion rendered as a rounded pill Button.",
	usage: `import { Suggestions, Suggestion } from "@/components/ui-custom/suggestion";

<Suggestions>
  <Suggestion suggestion="Tell me a joke" />
  <Suggestion suggestion="Explain AI" />
  <Suggestion suggestion="Write code" />
</Suggestions>

// Vertical layout (right-aligned, for follow-up suggestions)
<Suggestions orientation="vertical">
  <Suggestion suggestion="How does this work?" />
  <Suggestion suggestion="Show me an example" />
</Suggestions>`,
	props: [
		{
			name: "suggestion",
			type: "string",
			required: true,
			description: "The suggestion text to display and emit on click.",
		},
		{
			name: "onClick",
			type: "(suggestion: string) => void",
			description: "Callback fired with the suggestion string when clicked.",
		},
		{
			name: "variant",
			type: "ButtonProps[\"variant\"]",
			default: '"outline"',
			description: "Button variant passed to the underlying Button component.",
		},
		{
			name: "size",
			type: "ButtonProps[\"size\"]",
			default: '"sm"',
			description: "Button size passed to the underlying Button component.",
		},
		{
			name: "children",
			type: "ReactNode",
			description: "Custom content. Falls back to the suggestion text when not provided.",
		},
	],
	subComponents: [
		{ name: "Suggestions", description: "Container that arranges Suggestion chips. Horizontal (default) uses ScrollArea; vertical stacks right-aligned." },
		{ name: "Suggestion", description: "Individual clickable suggestion button rendered as a rounded pill." },
	],
	examples: [
		{ title: "Vertical", description: "Right-aligned vertical stack with icons, matching the plan follow-up suggestion pattern.", demoSlug: "suggestion-demo-vertical" },
		{ title: "With icons", description: "Horizontal suggestions with leading icons using the same button styling as the vertical follow-up pattern.", demoSlug: "suggestion-demo-with-icons" },
	],
};
