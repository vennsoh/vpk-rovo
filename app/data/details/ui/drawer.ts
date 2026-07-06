import type { ComponentDetail } from "@/app/data/component-detail-types";

export const DRAWER_DETAIL: ComponentDetail = {
    description:
      "A draggable drawer component built on Vaul with swipe-to-dismiss and direction support.",
    usage: `import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";

<Drawer>
  <DrawerTrigger><Button>Open</Button></DrawerTrigger>
  <DrawerContent>
    <DrawerHeader><DrawerTitle>Title</DrawerTitle></DrawerHeader>
  </DrawerContent>
</Drawer>`,
    props: [
      {
        name: "direction",
        type: '"top" | "right" | "bottom" | "left"',
        default: '"bottom"',
        description: "Direction the drawer opens from.",
      },
    ],
    subComponents: [
      { name: "DrawerTrigger", description: "Element that opens the drawer." },
      { name: "DrawerContent", description: "The drawer container." },
      { name: "DrawerHeader", description: "Header section." },
      { name: "DrawerTitle", description: "Title text." },
      { name: "DrawerDescription", description: "Description text." },
      { name: "DrawerFooter", description: "Footer section." },
      { name: "DrawerClose", description: "Close button." },
    ],
    examples: [
      {
        title: "Default",
        description: "Bottom drawer with close button.",
        demoSlug: "drawer-demo-default",
      },
      {
        title: "With form",
        description: "Drawer containing a form.",
        demoSlug: "drawer-demo-with-form",
      },
      {
        title: "Right",
        description: "Right-side drawer.",
        demoSlug: "drawer-demo-right",
      },
      {
        title: "Scrollable content",
        description: "Drawer with scrollable overflow content.",
        demoSlug: "drawer-demo-scrollable-content",
      },
      {
        title: "Sides",
        description: "Drawer opening from all four sides.",
        demoSlug: "drawer-demo-sides",
      },
    ],
  };
