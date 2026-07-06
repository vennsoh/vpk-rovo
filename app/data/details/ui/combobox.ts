import type { ComponentDetail } from "@/app/data/component-detail-types";

export const COMBOBOX_DETAIL: ComponentDetail = {
    description:
      "A searchable select component built on Base UI Combobox with input filtering, chips for multi-select, and grouped items.",
    usage: `import {
  Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem,
} from "@/components/ui/combobox";

<Combobox>
  <ComboboxInput placeholder="Search..." />
  <ComboboxContent>
    <ComboboxList>
      <ComboboxItem value="react">React</ComboboxItem>
      <ComboboxItem value="vue">Vue</ComboboxItem>
    </ComboboxList>
  </ComboboxContent>
</Combobox>`,
    props: [
      {
        name: "showTrigger",
        type: "boolean",
        default: "true",
        description: "Show chevron trigger on input.",
      },
      {
        name: "showClear",
        type: "boolean",
        description: "Show clear button on input.",
      },
    ],
    subComponents: [
      {
        name: "ComboboxInput",
        description: "Search input with trigger and clear.",
      },
      { name: "ComboboxContent", description: "Floating dropdown container." },
      { name: "ComboboxList", description: "Scrollable item list." },
      { name: "ComboboxItem", description: "Individual selectable item." },
      { name: "ComboboxGroup", description: "Group of related items." },
      { name: "ComboboxLabel", description: "Group label." },
      { name: "ComboboxEmpty", description: "Empty state." },
      { name: "ComboboxChips", description: "Multi-select chips container." },
      { name: "ComboboxChip", description: "Individual removable chip." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic searchable select.",
        demoSlug: "combobox-demo-default",
      },
      {
        title: "Grouped",
        description: "Combobox with grouped items.",
        demoSlug: "combobox-demo-grouped",
      },
      { title: "Basic", demoSlug: "combobox-demo-basic" },
      {
        title: "Disabled items",
        description: "Combobox with disabled items.",
        demoSlug: "combobox-demo-disabled-items",
      },
      {
        title: "Disabled",
        description: "Disabled combobox.",
        demoSlug: "combobox-demo-disabled",
      },
      {
        title: "Form with combobox",
        description: "Combobox inside a form.",
        demoSlug: "combobox-demo-form-with-combobox",
      },
      {
        title: "In dialog",
        description: "Combobox inside a dialog.",
        demoSlug: "combobox-demo-in-dialog",
      },
      {
        title: "In popup",
        description: "Combobox inside a popup.",
        demoSlug: "combobox-demo-in-popup",
      },
      {
        title: "Invalid",
        description: "Combobox in invalid/error state.",
        demoSlug: "combobox-demo-invalid",
      },
      {
        title: "Large list",
        description: "Combobox with many options.",
        demoSlug: "combobox-demo-large-list",
      },
      {
        title: "Multiple disabled",
        description: "Multi-select combobox in disabled state.",
        demoSlug: "combobox-demo-multiple-disabled",
      },
      {
        title: "Multiple invalid",
        description: "Multi-select combobox in invalid state.",
        demoSlug: "combobox-demo-multiple-invalid",
      },
      {
        title: "Multiple no remove",
        description: "Multi-select without chip removal.",
        demoSlug: "combobox-demo-multiple-no-remove",
      },
      {
        title: "Multiple",
        description: "Multi-select combobox with chips.",
        demoSlug: "combobox-demo-multiple",
      },
      {
        title: "Sides",
        description: "Combobox opening on different sides.",
        demoSlug: "combobox-demo-sides",
      },
      {
        title: "With auto highlight",
        description: "Combobox with auto-highlighted first item.",
        demoSlug: "combobox-demo-with-auto-highlight",
      },
      {
        title: "With clear button",
        description: "Combobox with a clear button.",
        demoSlug: "combobox-demo-with-clear-button",
      },
      {
        title: "With custom item rendering",
        description: "Combobox with custom-rendered items.",
        demoSlug: "combobox-demo-with-custom-item-rendering",
      },
      {
        title: "With groups and separator",
        description: "Combobox with groups and separators.",
        demoSlug: "combobox-demo-with-groups-and-separator",
      },
      {
        title: "With groups",
        description: "Combobox with labeled groups.",
        demoSlug: "combobox-demo-with-groups",
      },
      {
        title: "With icon addon",
        description: "Combobox with icon addon.",
        demoSlug: "combobox-demo-with-icon-addon",
      },
      {
        title: "With other inputs",
        description: "Combobox combined with other inputs.",
        demoSlug: "combobox-demo-with-other-inputs",
      },
    ],
  };
