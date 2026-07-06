import type { ComponentDetail } from "@/app/data/component-detail-types";

export const NATIVE_SELECT_DETAIL: ComponentDetail = {
    description:
      "A styled native HTML select element with size variants and chevron icon overlay.",
    usage: `import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

<NativeSelect>
  <NativeSelectOption value="1">Option 1</NativeSelectOption>
  <NativeSelectOption value="2">Option 2</NativeSelectOption>
</NativeSelect>`,
    props: [
      {
        name: "size",
        type: '"sm" | "default"',
        default: '"default"',
        description: "Size of the select.",
      },
      { name: "disabled", type: "boolean", description: "Disable the select." },
    ],
    subComponents: [
      { name: "NativeSelectOption", description: "Individual option element." },
      { name: "NativeSelectOptGroup", description: "Option group element." },
    ],
    examples: [
      { title: "Default", demoSlug: "native-select-demo-default" },
      {
        title: "Small",
        description: "Compact select.",
        demoSlug: "native-select-demo-small",
      },
      { title: "Disabled", demoSlug: "native-select-demo-disabled" },
      { title: "Basic", demoSlug: "native-select-demo-basic" },
      {
        title: "Invalid",
        description: "Native select in invalid/error state.",
        demoSlug: "native-select-demo-invalid",
      },
      {
        title: "Sizes",
        description: "All native select size variants.",
        demoSlug: "native-select-demo-sizes",
      },
      {
        title: "With field",
        description: "Native select inside a form field.",
        demoSlug: "native-select-demo-with-field",
      },
      {
        title: "With groups",
        description: "Native select with option groups.",
        demoSlug: "native-select-demo-with-groups",
      },
    ],
  };
