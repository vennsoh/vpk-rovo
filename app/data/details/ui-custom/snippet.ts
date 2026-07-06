import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SNIPPET_DETAIL: ComponentDetail = {
	description:
		"A lightweight composable snippet for displaying terminal commands and short code strings with copy-to-clipboard functionality. Built on InputGroup primitives with optional prefix text and animated copy state.",
	usage: `import {
  Snippet,
  SnippetAddon,
  SnippetText,
  SnippetInput,
  SnippetCopyButton,
} from "@/components/ui-custom/snippet";

<Snippet code="npm install ai">
  <SnippetAddon>
    <SnippetText>$</SnippetText>
  </SnippetAddon>
  <SnippetInput />
  <SnippetCopyButton />
</Snippet>`,
	props: [
		{
			name: "code",
			type: "string",
			required: true,
			description: "The code content to display and copy.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root InputGroup container.",
		},
		{
			name: "children",
			type: "ReactNode",
			description: "SnippetAddon, SnippetInput, and SnippetCopyButton sub-components.",
		},
	],
	subComponents: [
		{ name: "Snippet", description: "Root provider wrapping InputGroup. Supplies code value via React Context to SnippetInput and SnippetCopyButton." },
		{ name: "SnippetAddon", description: "Wrapper for supplementary elements like prefix text. Delegates to InputGroupAddon." },
		{ name: "SnippetText", description: "Prefix text display (e.g., '$' for terminal prompts). Delegates to InputGroupText." },
		{ name: "SnippetInput", description: "Read-only input displaying the code string. Value and readOnly are set automatically from context." },
		{ name: "SnippetCopyButton", description: "Copy-to-clipboard button with animated check icon on success. Accepts onCopy, onError, and timeout props." },
	],
	examples: [
		{ title: "Without prefix", description: "Plain snippet without terminal prompt prefix.", demoSlug: "snippet-demo-plain" },
		{ title: "Multiple commands", description: "Stacked snippets for multi-step install instructions.", demoSlug: "snippet-demo-multiple" },
		{ title: "With callbacks", description: "Snippet with onCopy/onError callbacks and custom timeout.", demoSlug: "snippet-demo-callbacks" },
	],
};
