import type { ComponentDetail } from "@/app/data/component-detail-types";

export const INPUT_GROUP_DETAIL: ComponentDetail = {
    adsUrl: "https://atlassian.design/components/textfield",
    description:
      "A wrapper component that combines an input or textarea with addons and buttons for composite form controls.",
    usage: `import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import SearchIcon from "@atlaskit/icon/core/search";

<InputGroup>
  <InputGroupAddon><SearchIcon label="" /></InputGroupAddon>
  <InputGroupInput placeholder="Search..." />
</InputGroup>`,
    props: [
      {
        name: "align",
        type: '"inline-start" | "inline-end" | "block-start" | "block-end"',
        description: "Addon placement position (on InputGroupAddon).",
      },
      {
        name: "size",
        type: '"xs" | "sm" | "icon-xs" | "icon-sm"',
        description: "Button size variant (on InputGroupButton).",
      },
    ],
    subComponents: [
      { name: "InputGroupInput", description: "Borderless input element." },
      {
        name: "InputGroupTextarea",
        description: "Borderless textarea element.",
      },
      {
        name: "InputGroupAddon",
        description: "Non-interactive addon (icon, text, etc.).",
      },
      { name: "InputGroupButton", description: "Interactive button addon." },
      { name: "InputGroupText", description: "Text addon." },
    ],
    examples: [
      {
        title: "Default",
        description: "Input with search icon addon.",
        demoSlug: "input-group-demo-default",
      },
      {
        title: "Prefix",
        description: "Input with text prefix addon.",
        demoSlug: "input-group-demo-prefix",
      },
      {
        title: "With button",
        description: "Input with action button.",
        demoSlug: "input-group-demo-button",
      },
      {
        title: "Textarea",
        description: "Textarea with addon.",
        demoSlug: "input-group-demo-textarea",
      },
      { title: "Basic", demoSlug: "input-group-demo-basic" },
      {
        title: "In card",
        description: "Input group inside a card.",
        demoSlug: "input-group-demo-in-card",
      },
      {
        title: "With addons",
        description: "Input group with multiple addons.",
        demoSlug: "input-group-demo-with-addons",
      },
      {
        title: "With buttons",
        description: "Input group with multiple buttons.",
        demoSlug: "input-group-demo-with-buttons",
      },
      {
        title: "With kbd",
        description: "Input group with keyboard shortcut indicator.",
        demoSlug: "input-group-demo-with-kbd",
      },
      {
        title: "With tooltip, dropdown, popover",
        description: "Input group with tooltip, dropdown, and popover.",
        demoSlug: "input-group-demo-with-tooltip-dropdown-popover",
      },
    ],
  };
