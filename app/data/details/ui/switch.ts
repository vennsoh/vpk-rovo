import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SWITCH_DETAIL: ComponentDetail = {
    description:
      "An ADS Toggle-aligned switch component with success checked state, neutral unchecked state, and animated thumb.",
    adsUrl: "https://atlassian.design/components/toggle",
    usage: `import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

<div className="flex items-center gap-2">
  <Switch id="airplane" label="Toggle airplane mode" />
  <Label htmlFor="airplane">Airplane mode</Label>
</div>`,
    props: [
      {
        name: "size",
        type: '"sm" | "default" | "lg"',
        default: '"default"',
        description: "Size of the switch.",
      },
      {
        name: "checked",
        type: "boolean",
        description: "Controlled checked state.",
      },
      {
        name: "defaultChecked",
        type: "boolean",
        description: "Default checked state.",
      },
      {
        name: "onCheckedChange",
        type: "(checked: boolean) => void",
        description: "Callback when state changes.",
      },
      {
        name: "label",
        type: "string",
        description: "Accessibility label (aria-label).",
      },
      { name: "disabled", type: "boolean", description: "Disable the switch." },
    ],
    examples: [
      {
        title: "Default",
        description: "Switch with label.",
        demoSlug: "switch-demo-default",
      },
      {
        title: "Small",
        description: "Compact switch.",
        demoSlug: "switch-demo-small",
      },
      {
        title: "Checked",
        description: "Checked by default.",
        demoSlug: "switch-demo-checked",
      },
      { title: "Disabled", demoSlug: "switch-demo-disabled" },
      { title: "Basic", demoSlug: "switch-demo-basic" },
      {
        title: "Sizes",
        description: "All switch size variants.",
        demoSlug: "switch-demo-sizes",
      },
      {
        title: "With description",
        description: "Switch with description text.",
        demoSlug: "switch-demo-with-description",
      },
    ],
  };
