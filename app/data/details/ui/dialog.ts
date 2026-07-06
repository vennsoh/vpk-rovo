import type { ComponentDetail } from "@/app/data/component-detail-types";

export const DIALOG_DETAIL: ComponentDetail = {
    description:
      "A modal dialog component using Base UI with customizable header, content, footer, title, and description sub-components. Supports backdrop overlay with animations.",
    adsUrl: "https://atlassian.design/components/modal-dialog",
    usage: `import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger>
    <Button>Open dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <p>Dialog body content</p>
  </DialogContent>
</Dialog>`,
    props: [
      {
        name: "showCloseButton",
        type: "boolean",
        default: "true",
        description: "Show or hide the close button in the dialog header.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg" | "xl"',
        default: '"sm"',
        description:
          "Width preset for the dialog content. Maps to ADS modal-dialog named widths.",
      },
      {
        name: "variant",
        type: '"default" | "warning" | "destructive"',
        default: '"default"',
        description:
          "Visual variant for the dialog title. Warning and destructive variants prepend a status icon.",
      },
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes for the dialog content.",
      },
    ],
    subComponents: [
      { name: "DialogTrigger", description: "Element that opens the dialog." },
      { name: "DialogContent", description: "The dialog popup container." },
      { name: "DialogHeader", description: "Top section of the dialog." },
      {
        name: "DialogTitle",
        description:
          "Primary heading in the dialog. Accepts variant prop for warning/destructive appearance.",
      },
      { name: "DialogDescription", description: "Secondary descriptive text." },
      { name: "DialogFooter", description: "Bottom section for actions." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic dialog with title, description, and close button.",
        demoSlug: "dialog-demo-default",
      },
      {
        title: "Warning",
        description: "Dialog with warning appearance title.",
        demoSlug: "dialog-demo-warning",
      },
      {
        title: "Destructive",
        description: "Dialog with destructive appearance title.",
        demoSlug: "dialog-demo-destructive",
      },
      {
        title: "Width",
        description: "Dialog with different width presets.",
        demoSlug: "dialog-demo-widths",
      },
      {
        title: "With form",
        description: "Dialog containing a simple form.",
        demoSlug: "dialog-demo-form",
      },
      {
        title: "No close button",
        description: "Dialog without the header close button.",
        demoSlug: "dialog-demo-no-close",
      },
      {
        title: "Custom width",
        description: "Dialog with wider content area.",
        demoSlug: "dialog-demo-custom-width",
      },
      {
        title: "Chat settings",
        description: "Dialog styled as a chat settings panel.",
        demoSlug: "dialog-demo-chat-settings",
      },
      {
        title: "No close button (alt)",
        description: "Alternate no-close-button dialog.",
        demoSlug: "dialog-demo-no-close-button",
      },
      {
        title: "Scrollable content",
        description: "Dialog with scrollable overflow content.",
        demoSlug: "dialog-demo-scrollable-content",
      },
      {
        title: "With form (alt)",
        description: "Dialog with labeled form fields.",
        demoSlug: "dialog-demo-with-form",
      },
      {
        title: "With sticky footer",
        description: "Dialog with a fixed footer for actions.",
        demoSlug: "dialog-demo-with-sticky-footer",
      },
    ],
  };
