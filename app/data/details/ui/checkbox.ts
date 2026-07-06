import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CHECKBOX_DETAIL: ComponentDetail = {
    description:
      "A checkbox component built on Base UI with a checkmark indicator icon from Atlaskit.",
    adsUrl: "https://atlassian.design/components/checkbox",
    usage: `import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms</Label>
</div>`,
    props: [
      {
        name: "checked",
        type: "boolean",
        description: "Controlled checked state.",
      },
      {
        name: "defaultChecked",
        type: "boolean",
        description: "Default checked state (uncontrolled).",
      },
      {
        name: "onCheckedChange",
        type: "(checked: boolean) => void",
        description: "Callback when checked state changes.",
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disable the checkbox.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Checkbox with label.",
        demoSlug: "checkbox-demo-default",
      },
      {
        title: "Checked",
        description: "Checked by default.",
        demoSlug: "checkbox-demo-checked",
      },
      { title: "Disabled", demoSlug: "checkbox-demo-disabled" },
      {
        title: "With description",
        description: "Checkbox with label and helper text.",
        demoSlug: "checkbox-demo-with-description",
      },
      { title: "Basic", demoSlug: "checkbox-demo-basic" },
      {
        title: "Disabled (full)",
        description: "Checkbox disabled in all states.",
        demoSlug: "checkbox-demo-disabled-full",
      },
      {
        title: "Group",
        description: "Group of related checkboxes.",
        demoSlug: "checkbox-demo-group",
      },
      {
        title: "In table",
        description: "Checkboxes inside a data table.",
        demoSlug: "checkbox-demo-in-table",
      },
      {
        title: "Invalid",
        description: "Checkbox in invalid/error state.",
        demoSlug: "checkbox-demo-invalid",
      },
      {
        title: "With description (full)",
        description: "Checkbox with full description layout.",
        demoSlug: "checkbox-demo-with-description-full",
      },
      {
        title: "With title",
        description: "Checkbox with title text.",
        demoSlug: "checkbox-demo-with-title",
      },
    ],
  };
