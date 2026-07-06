import type { ComponentDetail } from "@/app/data/component-detail-types";

export const FORMS_DETAIL: ComponentDetail = {
    description:
      "TanStack Form examples using VPK field primitives, validation, arrays, and complex multi-control forms.",
    adsUrl: "https://atlassian.design/components/form/examples",
    usage: `import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
});

const form = useForm({
  defaultValues: { username: "" },
  validators: { onSubmit: schema },
  onSubmit: async ({ value }) => {
    console.log(value);
  },
});

<form onSubmit={(event) => { event.preventDefault(); form.handleSubmit(); }}>
  <form.Field name="username">
    {(field) => {
      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
      return (
        <Field data-invalid={isInvalid}>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            aria-invalid={isInvalid}
          />
          {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
        </Field>
      );
    }}
  </form.Field>
  <Button type="submit">Save</Button>
</form>`,
    props: [
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      {
        title: "ADS Basic Form",
        description:
          "Mapped from the ADS basic form pattern with required fields and terms acceptance.",
        demoSlug: "forms-demo-ads-basic",
      },
      {
        title: "ADS Field Validation",
        description:
          "Single field validation pattern aligned with ADS form guidance.",
        demoSlug: "forms-demo-ads-validation",
      },
      {
        title: "ADS Disabled Form",
        description: "Disabled controls and actions using VPK form primitives.",
        demoSlug: "forms-demo-ads-disabled",
      },
      {
        title: "TanStack Basic",
        description: "Bug report form with text and textarea validation.",
        demoSlug: "forms-demo-tanstack-basic",
      },
      {
        title: "TanStack Input",
        description: "Single input field with schema validation.",
        demoSlug: "forms-demo-tanstack-input",
      },
      {
        title: "TanStack Textarea",
        description: "Textarea field with min/max validation.",
        demoSlug: "forms-demo-tanstack-textarea",
      },
      {
        title: "TanStack Select",
        description: "Controlled select with validation and grouped options.",
        demoSlug: "forms-demo-tanstack-select",
      },
      {
        title: "TanStack Checkbox",
        description: "Boolean and array checkbox fields.",
        demoSlug: "forms-demo-tanstack-checkbox",
      },
      {
        title: "TanStack Radio Group",
        description: "Required single-choice plan selection.",
        demoSlug: "forms-demo-tanstack-radiogroup",
      },
      {
        title: "TanStack Switch",
        description: "Boolean switch with refinement validation.",
        demoSlug: "forms-demo-tanstack-switch",
      },
      {
        title: "TanStack Complex",
        description:
          "Combined radio, select, checkbox array, and switch controls.",
        demoSlug: "forms-demo-tanstack-complex",
      },
      {
        title: "TanStack Array",
        description: "Dynamic array fields with add/remove controls.",
        demoSlug: "forms-demo-tanstack-array",
      },
    ],
  };
