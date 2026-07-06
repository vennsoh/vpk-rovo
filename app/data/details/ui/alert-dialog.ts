import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ALERT_DIALOG_DETAIL: ComponentDetail = {
    description:
      "A modal confirmation dialog built on Base UI AlertDialog with action and cancel buttons for destructive or important actions.",
    usage: `import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger><Button>Delete</Button></AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
    props: [
      {
        name: "size",
        type: '"default" | "sm"',
        default: '"default"',
        description: "Size of the dialog content.",
      },
    ],
    subComponents: [
      {
        name: "AlertDialogTrigger",
        description: "Element that opens the dialog.",
      },
      { name: "AlertDialogContent", description: "The dialog container." },
      {
        name: "AlertDialogHeader",
        description: "Top section with title and description.",
      },
      { name: "AlertDialogTitle", description: "Primary heading." },
      { name: "AlertDialogDescription", description: "Secondary text." },
      {
        name: "AlertDialogFooter",
        description: "Bottom section for action buttons.",
      },
      { name: "AlertDialogAction", description: "Primary action button." },
      { name: "AlertDialogCancel", description: "Cancel/dismiss button." },
      {
        name: "AlertDialogMedia",
        description: "Icon or image slot in header.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic confirmation dialog.",
        demoSlug: "alert-dialog-demo-default",
      },
      {
        title: "Destructive",
        description: "Destructive action styling.",
        demoSlug: "alert-dialog-demo-destructive",
      },
      {
        title: "Small",
        description: "Compact dialog.",
        demoSlug: "alert-dialog-demo-small",
      },
      {
        title: "Custom actions",
        description: "Multiple action buttons.",
        demoSlug: "alert-dialog-demo-custom-actions",
      },
      { title: "Basic", demoSlug: "alert-dialog-demo-basic" },
      {
        title: "In dialog",
        description: "Alert dialog nested inside a dialog.",
        demoSlug: "alert-dialog-demo-in-dialog",
      },
      {
        title: "Small with media",
        description: "Compact dialog with media icon.",
        demoSlug: "alert-dialog-demo-small-with-media",
      },
      {
        title: "With media",
        description: "Dialog with media icon in header.",
        demoSlug: "alert-dialog-demo-with-media",
      },
    ],
  };
