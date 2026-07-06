import type { ComponentDetail } from "@/app/data/component-detail-types";

export const VOICE_SELECTOR_DETAIL: ComponentDetail = {
	description:
		"A searchable voice selection dialog built on cmdk and Dialog primitives. Supports voice metadata (gender, accent, age), grouped provider organization, voice preview playback, and controlled/uncontrolled selection state.",
	usage: `import {
  VoiceSelector,
  VoiceSelectorTrigger,
  VoiceSelectorContent,
  VoiceSelectorInput,
  VoiceSelectorList,
  VoiceSelectorEmpty,
  VoiceSelectorGroup,
  VoiceSelectorItem,
  VoiceSelectorName,
  VoiceSelectorDescription,
  VoiceSelectorAttributes,
  VoiceSelectorGender,
  VoiceSelectorAccent,
  VoiceSelectorAge,
  VoiceSelectorBullet,
  VoiceSelectorPreview,
  VoiceSelectorSeparator,
} from "@/components/ui-custom/voice-selector";

<VoiceSelector>
  <VoiceSelectorTrigger render={<Button variant="outline" size="default" />}>
    Select voice
  </VoiceSelectorTrigger>
  <VoiceSelectorContent>
    <VoiceSelectorInput placeholder="Search voices..." />
    <VoiceSelectorList>
      <VoiceSelectorEmpty>No voices found.</VoiceSelectorEmpty>
      <VoiceSelectorGroup heading="Voices">
        <VoiceSelectorItem value="alloy">
          <VoiceSelectorName>Alloy</VoiceSelectorName>
          <VoiceSelectorAttributes>
            <VoiceSelectorGender value="non-binary" />
            <VoiceSelectorBullet />
            <VoiceSelectorAccent value="american" />
          </VoiceSelectorAttributes>
        </VoiceSelectorItem>
      </VoiceSelectorGroup>
    </VoiceSelectorList>
  </VoiceSelectorContent>
</VoiceSelector>`,
	props: [
		{
			name: "value",
			type: "string",
			description: "Controlled selected voice ID.",
		},
		{
			name: "defaultValue",
			type: "string",
			description: "Default selected voice ID for uncontrolled usage.",
		},
		{
			name: "onValueChange",
			type: "(value: string | undefined) => void",
			description: "Callback fired when the selected voice changes.",
		},
		{
			name: "open",
			type: "boolean",
			description: "Controlled open state of the dialog.",
		},
		{
			name: "onOpenChange",
			type: "(open: boolean) => void",
			description: "Callback fired when the dialog open state changes.",
		},
	],
	subComponents: [
		{ name: "VoiceSelector", description: "Root provider wrapping a Dialog. Manages voice selection and open state." },
		{ name: "VoiceSelectorTrigger", description: "DialogTrigger for opening the voice selection dialog." },
		{ name: "VoiceSelectorContent", description: "Dialog content with embedded Command, configurable title (default: 'Voice Selector')." },
		{ name: "VoiceSelectorDialog", description: "Alternative CommandDialog wrapper for full-screen command palette." },
		{ name: "VoiceSelectorInput", description: "Search input for filtering the voice list." },
		{ name: "VoiceSelectorList", description: "Scrollable list container for groups and items." },
		{ name: "VoiceSelectorEmpty", description: "Fallback content when search yields no results." },
		{ name: "VoiceSelectorGroup", description: "Category group with heading for organizing voices by provider." },
		{ name: "VoiceSelectorItem", description: "Individual selectable voice option with value and onSelect callback." },
		{ name: "VoiceSelectorName", description: "Truncated voice name text with font-medium styling." },
		{ name: "VoiceSelectorDescription", description: "Muted description text for a voice." },
		{ name: "VoiceSelectorAttributes", description: "Flex container for grouping gender, accent, and age metadata." },
		{ name: "VoiceSelectorGender", description: "Gender indicator with Lucide icons. Supports male, female, transgender, androgyne, non-binary, and intersex." },
		{ name: "VoiceSelectorAccent", description: "Accent representation with emoji flags for 27+ regions." },
		{ name: "VoiceSelectorAge", description: "Age metadata display with tabular-nums alignment." },
		{ name: "VoiceSelectorBullet", description: "Bullet separator (•) between attributes, hidden from screen readers." },
		{ name: "VoiceSelectorPreview", description: "Play/pause button for voice sample preview with loading spinner state." },
		{ name: "VoiceSelectorShortcut", description: "Keyboard shortcut display alongside an item." },
		{ name: "VoiceSelectorSeparator", description: "Visual separator between voice groups." },
	],
	examples: [
		{ title: "With attributes", description: "Voice items with gender icons, accent flags, and age metadata.", demoSlug: "voice-selector-demo-with-attributes" },
		{ title: "Multi-provider", description: "Grouped voices from multiple providers with separators.", demoSlug: "voice-selector-demo-multi-provider" },
		{ title: "With preview", description: "Play/pause buttons for previewing voice samples.", demoSlug: "voice-selector-demo-with-preview" },
	],
};
