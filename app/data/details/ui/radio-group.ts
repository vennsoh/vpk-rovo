import type { ComponentDetail } from "@/app/data/component-detail-types";

export const RADIO_GROUP_DETAIL: ComponentDetail = {
    description:
      "A radio group component built on Base UI with circle indicator styling.",
    adsUrl: "https://atlassian.design/components/radio",
    usage: `import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

<RadioGroup defaultValue="option-1">
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option-1" id="option-1" />
    <Label htmlFor="option-1">Option 1</Label>
  </div>
</RadioGroup>`,
    props: [
      {
        name: "defaultValue",
        type: "string",
        description: "Default selected value.",
      },
      {
        name: "value",
        type: "string",
        description: "Controlled selected value.",
      },
      {
        name: "onValueChange",
        type: "(value: string) => void",
        description: "Callback when selection changes.",
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disable the radio group.",
      },
    ],
    subComponents: [
      { name: "RadioGroupItem", description: "Individual radio button." },
    ],
    examples: [
      {
        title: "Default",
        description: "Radio group with three options.",
        demoSlug: "radio-group-demo-default",
      },
      {
        title: "Horizontal",
        description: "Horizontal layout.",
        demoSlug: "radio-group-demo-horizontal",
      },
      { title: "Disabled", demoSlug: "radio-group-demo-disabled" },
      { title: "Basic", demoSlug: "radio-group-demo-basic" },
      {
        title: "Grid layout",
        description: "Radio group in a grid layout.",
        demoSlug: "radio-group-demo-grid-layout",
      },
      {
        title: "Invalid",
        description: "Radio group in invalid/error state.",
        demoSlug: "radio-group-demo-invalid",
      },
      {
        title: "With descriptions",
        description: "Radio items with description text.",
        demoSlug: "radio-group-demo-with-descriptions",
      },
      {
        title: "With fieldset",
        description: "Radio group inside a fieldset with legend.",
        demoSlug: "radio-group-demo-with-fieldset",
      },
    ],
  };
