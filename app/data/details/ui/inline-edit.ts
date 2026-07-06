import type { ComponentDetail } from "@/app/data/component-detail-types";

export const INLINE_EDIT_DETAIL: ComponentDetail = {
    description:
      "An ADS-style inline editor with read and edit states, icon-based confirm/cancel controls, optional label/validation, and keyboard-friendly interactions.",
    adsUrl: "https://atlassian.design/components/inline-edit/examples",
    demoLayout: {
      previewContentWidth: "full",
      examplesContentWidth: "full",
    },
    usage: `import { InlineEdit } from "@/components/ui/inline-edit";

const [description, setDescription] = useState("");

<InlineEdit
  label="Description"
  value={description}
  placeholder="Add RFP requirements..."
  onConfirm={setDescription}
  inputProps={{ id: "rfp-description" }}
  textareaProps={{ variant: "subtle", rows: 4 }}
  readViewClassName="border-transparent bg-transparent"
  multiline
/>
<InlineEdit
  label="Team name"
  value=""
  placeholder="Add a name..."
  isRequired
  validate={(nextValue) =>
    nextValue.length > 25 ? "Keep this under 25 characters." : undefined
  }
  onConfirm={setValue}
/>`,
    props: [
      {
        name: "value",
        type: "string",
        required: true,
        description: "The current text value.",
      },
      {
        name: "onConfirm",
        type: "(value: string) => void",
        description: "Callback when the user saves the edited value.",
      },
      {
        name: "onCancel",
        type: "() => void",
        description: "Callback when the user cancels editing.",
      },
      {
        name: "label",
        type: "string",
        description: "Optional field label shown above the inline editor.",
      },
      {
        name: "placeholder",
        type: "string",
        description: "Placeholder text shown when value is empty.",
      },
      {
        name: "isRequired",
        type: "boolean",
        default: "false",
        description: "Prevents confirming an empty value.",
      },
      {
        name: "validate",
        type: "(value: string) => string | undefined",
        description:
          "Custom validation function. Return an error message to keep edit mode open.",
      },
      {
        name: "keepEditViewOpenOnBlur",
        type: "boolean",
        default: "false",
        description: "Keeps edit mode open when focus leaves the input.",
      },
      {
        name: "multiline",
        type: "boolean",
        default: "false",
        description: "Uses Textarea for edit mode instead of Input.",
      },
      {
        name: "inputProps",
        type: "InputProps",
        description:
          "Props passed to the single-line input. Also supplies the shared field id.",
      },
      {
        name: "textareaProps",
        type: "TextareaProps",
        description: "Props passed to the multiline textarea when multiline is true.",
      },
      {
        name: "readViewClassName",
        type: "string",
        description: "Additional CSS classes for the read-view button.",
      },
      {
        name: "hideActionButtons",
        type: "boolean",
        default: "false",
        description:
          "Hides confirm/cancel icon buttons for keyboard-only or blur-confirm flows.",
      },
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "inline-edit-demo-default" },
      {
        title: "With placeholder",
        description: "Empty state with placeholder text.",
        demoSlug: "inline-edit-demo-with-placeholder",
      },
      {
        title: "Multiple fields",
        description: "Several inline editable fields.",
        demoSlug: "inline-edit-demo-multiple",
      },
      {
        title: "With cancel",
        description: "Handling the cancel callback.",
        demoSlug: "inline-edit-demo-with-cancel",
      },
      {
        title: "Validation",
        description: "Required and custom validation rules.",
        demoSlug: "inline-edit-demo-validation",
      },
    ],
  };
