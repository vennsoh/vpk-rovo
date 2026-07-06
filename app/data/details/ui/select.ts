import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SELECT_DETAIL: ComponentDetail = {
    description:
      "A dropdown select component using Base UI with support for groups, scroll buttons, and keyboard navigation.",
    adsUrl: "https://atlassian.design/components/select",
    usage: `import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>`,
    props: [
      {
        name: "size",
        type: '"sm" | "default"',
        default: '"default"',
        description: "Size of the select trigger.",
      },
      {
        name: "side",
        type: '"top" | "bottom" | "left" | "right"',
        default: '"bottom"',
        description: "Popup placement side.",
      },
      {
        name: "align",
        type: '"start" | "center" | "end"',
        default: '"center"',
        description: "Horizontal alignment of the popup.",
      },
    ],
    subComponents: [
      { name: "SelectTrigger", description: "Button that opens the dropdown." },
      { name: "SelectValue", description: "Displays the selected value." },
      { name: "SelectContent", description: "Dropdown popup container." },
      { name: "SelectItem", description: "Individual selectable option." },
      { name: "SelectGroup", description: "Groups related items together." },
      { name: "SelectLabel", description: "Label for a group of items." },
    ],
    examples: [
      {
        title: "Default",
        description: "Simple select with basic options.",
        demoSlug: "select-demo-default",
      },
      {
        title: "Grouped",
        description: "Select with grouped options and labels.",
        demoSlug: "select-demo-grouped",
      },
      {
        title: "Small",
        description: "Compact select trigger.",
        demoSlug: "select-demo-small",
      },
      {
        title: "Disabled",
        description: "Disabled select trigger.",
        demoSlug: "select-demo-disabled",
      },
      { title: "Basic", demoSlug: "select-demo-basic" },
      {
        title: "In dialog",
        description: "Select inside a dialog.",
        demoSlug: "select-demo-in-dialog",
      },
      {
        title: "Inline with input and native select",
        description: "Select combined with input and native select.",
        demoSlug: "select-demo-inline-with-input-nativeselect",
      },
      {
        title: "Invalid",
        description: "Select in invalid/error state.",
        demoSlug: "select-demo-invalid",
      },
      {
        title: "Item aligned",
        description: "Select with item-aligned positioning.",
        demoSlug: "select-demo-item-aligned",
      },
      {
        title: "Large list",
        description: "Select with many scrollable options.",
        demoSlug: "select-demo-large-list",
      },
      {
        title: "Multiple selection",
        description: "Select with multiple item selection.",
        demoSlug: "select-demo-multiple-selection",
      },
      {
        title: "Sides",
        description: "Select opening on different sides.",
        demoSlug: "select-demo-sides",
      },
      {
        title: "Sizes",
        description: "Select in different size variants.",
        demoSlug: "select-demo-sizes",
      },
      {
        title: "Subscription plan",
        description: "Select styled as a subscription plan picker.",
        demoSlug: "select-demo-subscription-plan",
      },
      {
        title: "With button",
        description: "Select combined with a button.",
        demoSlug: "select-demo-with-button",
      },
      {
        title: "With field",
        description: "Select inside a form field.",
        demoSlug: "select-demo-with-field",
      },
      {
        title: "With groups and labels",
        description: "Select with labeled option groups.",
        demoSlug: "select-demo-with-groups-labels",
      },
      {
        title: "With icons",
        description: "Select items with leading icons.",
        demoSlug: "select-demo-with-icons",
      },
    ],
  };
