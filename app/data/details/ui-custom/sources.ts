import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SOURCES_DETAIL: ComponentDetail = {
	description:
		"A collapsible component that allows users to view the sources or citations used to generate an AI response. Built on Collapsible with animated expand/collapse and customizable trigger and content areas.",
	usage: `import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ui-custom/sources";

<Sources>
  <SourcesTrigger count={3} />
  <SourcesContent>
    <Source href="https://react.dev" title="React Documentation" />
    <Source href="https://developer.mozilla.org" title="MDN Web Docs" />
    <Source href="https://www.typescriptlang.org/docs" title="TypeScript Handbook" />
  </SourcesContent>
</Sources>`,
	props: [
		{
			name: "count",
			type: "number",
			required: true,
			description: "The number of sources displayed in the trigger label.",
		},
		{
			name: "href",
			type: "string",
			description: "URL for an individual Source link. Opens in a new tab with rel=\"noreferrer\".",
		},
		{
			name: "title",
			type: "string",
			description: "Display title for an individual Source when using default rendering.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional CSS classes applied to any sub-component.",
		},
	],
	subComponents: [
		{ name: "Sources", description: "Root Collapsible wrapper with default text styling." },
		{ name: "SourcesTrigger", description: "Collapsible trigger button displaying \"Used N sources\" label with chevron icon. Accepts children to override default rendering." },
		{ name: "SourcesContent", description: "Animated collapsible content container with slide-in/slide-out transitions." },
		{ name: "Source", description: "Individual source link opening in a new tab. Renders a BookIcon + title by default, or custom children." },
	],
	examples: [
		{ title: "Custom rendering", description: "Sources with custom trigger label, external link icons, and custom source titles.", demoSlug: "sources-demo-custom-rendering" },
	],
};
