import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SPLIT_BUTTON_DETAIL: ComponentDetail = {
    adsUrl: "https://atlassian.design/components/button/split-button",
    description:
      "Button with a primary action and a dropdown for secondary actions. Maps to @atlaskit/button SplitButton.",
    usage: `import { SplitButton } from "@/components/ui/split-button"

<SplitButton
  items={[
    { label: "Save as draft", onSelect: handleDraft },
    { label: "Schedule", onSelect: handleSchedule },
  ]}
>
  Publish
</SplitButton>`,
    props: [
      {
        name: "items",
        type: "SplitButtonItem[]",
        description: "Dropdown menu items.",
      },
      {
        name: "variant",
        type: '"default" | "outline" | "destructive"',
        default: '"default"',
        description: "Visual style variant.",
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disables the entire split button.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "split-button-demo-default" },
      { title: "Outline", demoSlug: "split-button-demo-outline" },
      { title: "Destructive", demoSlug: "split-button-demo-destructive" },
      { title: "Disabled", demoSlug: "split-button-demo-disabled" },
      {
        title: "Variants",
        description: "All split button variants.",
        demoSlug: "split-button-demo-variants",
      },
    ],
  };
