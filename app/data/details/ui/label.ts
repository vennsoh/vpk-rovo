import type { ComponentDetail } from "@/app/data/component-detail-types";

export const LABEL_DETAIL: ComponentDetail = {
    description:
      "A styled label component for form fields with peer/group-aware disabled states.",
    usage: `import { Label } from "@/components/ui/label";

<Label htmlFor="email">Email address</Label>`,
    props: [
      {
        name: "htmlFor",
        type: "string",
        description: "ID of the associated form element.",
      },
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "label-demo-default" },
      {
        title: "With input",
        description: "Label paired with an input field.",
        demoSlug: "label-demo-with-input",
      },
      {
        title: "Disabled",
        description: "Label in disabled state.",
        demoSlug: "label-demo-disabled",
      },
      {
        title: "With checkbox",
        description: "Label paired with a checkbox.",
        demoSlug: "label-demo-with-checkbox",
      },
      {
        title: "With textarea",
        description: "Label paired with a textarea.",
        demoSlug: "label-demo-with-textarea",
      },
    ],
  };
