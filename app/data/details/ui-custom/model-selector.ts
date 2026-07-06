import type { ComponentDetail } from "@/app/data/component-detail-types";

export const MODEL_SELECTOR_DETAIL: ComponentDetail = {
	description:
		"A searchable dropdown menu for selecting AI models, built on cmdk with fuzzy search, keyboard navigation, grouped provider organization, and provider logos fetched from models.dev.",
	usage: `import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
  ModelSelectorInput,
  ModelSelectorList,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorItem,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorSeparator,
} from "@/components/ui-custom/model-selector";

<ModelSelector>
  <ModelSelectorTrigger render={<Button variant="outline" size="default" className="gap-2" />}>
    <ModelSelectorLogoGroup>
      <ModelSelectorLogo provider="anthropic" />
    </ModelSelectorLogoGroup>
    Claude 4 Sonnet
  </ModelSelectorTrigger>
  <ModelSelectorContent>
    <ModelSelectorInput placeholder="Search models..." />
    <ModelSelectorList>
      <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
      <ModelSelectorGroup heading="Anthropic">
        <ModelSelectorItem value="claude-4-sonnet" onSelect={() => setModel("claude-4-sonnet")}>
          <ModelSelectorLogo provider="anthropic" />
          <ModelSelectorName>Claude 4 Sonnet</ModelSelectorName>
        </ModelSelectorItem>
      </ModelSelectorGroup>
    </ModelSelectorList>
  </ModelSelectorContent>
</ModelSelector>`,
	props: [
		{
			name: "children",
			type: "ReactNode",
			required: true,
			description: "ModelSelectorTrigger and ModelSelectorContent sub-components.",
		},
		{
			name: "open",
			type: "boolean",
			description: "Controlled open state for the dropdown menu.",
		},
		{
			name: "modal",
			type: "boolean",
			default: "false",
			description: "Whether the dropdown menu should trap outside interaction. Defaults to false so the embedded search input keeps focus.",
		},
		{
			name: "onOpenChange",
			type: "(open: boolean) => void",
			description: "Callback when dropdown menu open state changes.",
		},
	],
	subComponents: [
		{ name: "ModelSelector", description: "Root DropdownMenu wrapper." },
		{ name: "ModelSelectorTrigger", description: "Button trigger to open the dropdown menu." },
		{ name: "ModelSelectorContent", description: "Dropdown menu content with embedded Command, configurable title (default: 'Model Selector')." },
		{ name: "ModelSelectorInput", description: "Search input with fuzzy filtering." },
		{ name: "ModelSelectorList", description: "Scrollable list container for groups and items." },
		{ name: "ModelSelectorEmpty", description: "Fallback content when search yields no results." },
		{ name: "ModelSelectorGroup", description: "Provider category group with heading." },
		{ name: "ModelSelectorItem", description: "Individual model option with value and onSelect callback. Closes the dropdown by default after selection." },
		{ name: "ModelSelectorName", description: "Truncated model name text." },
		{ name: "ModelSelectorLogo", description: "Provider logo fetched from models.dev/logos. Supports autocomplete-friendly provider union type." },
		{ name: "ModelSelectorLogoGroup", description: "Stacked logo container with overlapping ring styling." },
		{ name: "ModelSelectorShortcut", description: "Keyboard shortcut display alongside an item." },
		{ name: "ModelSelectorSeparator", description: "Visual separator between groups." },
	],
	examples: [
		{ title: "With search", description: "Searchable model palette with grouped providers, selection state, and empty state.", demoSlug: "model-selector-demo-with-search" },
		{ title: "With logos", description: "Provider logos on trigger and items with separators between groups.", demoSlug: "model-selector-demo-with-logos" },
		{ title: "Multi-provider trigger", description: "Trigger showing stacked logos from multiple providers.", demoSlug: "model-selector-demo-multi-provider" },
		{ title: "Reasoning modes", description: "Grouped mode selector with selected state.", demoSlug: "model-selector-demo-reasoning-modes" },
	],
};
