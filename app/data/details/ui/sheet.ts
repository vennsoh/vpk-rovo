import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SHEET_DETAIL: ComponentDetail = {
    description:
      "A side panel component built on Base UI Dialog that slides in from any edge of the screen.",
    usage: `import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

<Sheet>
  <SheetTrigger><Button>Open</Button></SheetTrigger>
  <SheetContent>
    <SheetHeader><SheetTitle>Title</SheetTitle></SheetHeader>
    <p>Content</p>
  </SheetContent>
</Sheet>`,
    props: [
      {
        name: "side",
        type: '"top" | "right" | "bottom" | "left"',
        default: '"right"',
        description: "Side the sheet slides in from.",
      },
      {
        name: "showCloseButton",
        type: "boolean",
        default: "true",
        description: "Show close button.",
      },
    ],
    subComponents: [
      { name: "SheetTrigger", description: "Element that opens the sheet." },
      { name: "SheetContent", description: "The sliding panel container." },
      { name: "SheetHeader", description: "Header section." },
      { name: "SheetTitle", description: "Title text." },
      { name: "SheetDescription", description: "Description text." },
      { name: "SheetFooter", description: "Footer section." },
      { name: "SheetClose", description: "Close button." },
    ],
    examples: [
      {
        title: "Default",
        description: "Right-side sheet.",
        demoSlug: "sheet-demo-default",
      },
      {
        title: "Left",
        description: "Left-side sheet.",
        demoSlug: "sheet-demo-left",
      },
      {
        title: "Top",
        description: "Top-edge sheet.",
        demoSlug: "sheet-demo-top",
      },
      { title: "No close button", demoSlug: "sheet-demo-no-close" },
      {
        title: "No close button (alt)",
        demoSlug: "sheet-demo-no-close-button",
      },
      {
        title: "Sides",
        description: "Sheet opening from all four sides.",
        demoSlug: "sheet-demo-sides",
      },
      {
        title: "With form",
        description: "Sheet containing a form.",
        demoSlug: "sheet-demo-with-form",
      },
    ],
  };
