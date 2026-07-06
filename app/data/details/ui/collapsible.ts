import type { ComponentDetail } from "@/app/data/component-detail-types";

export const COLLAPSIBLE_DETAIL: ComponentDetail = {
    description:
      "A collapsible content section built on Base UI Collapsible with animated expand/collapse.",
    usage: `import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

<Collapsible>
  <CollapsibleTrigger><Button>Toggle</Button></CollapsibleTrigger>
  <CollapsibleContent>Hidden content</CollapsibleContent>
</Collapsible>`,
    props: [
      {
        name: "defaultOpen",
        type: "boolean",
        description: "Initially open state.",
      },
      { name: "open", type: "boolean", description: "Controlled open state." },
      {
        name: "onOpenChange",
        type: "(open: boolean) => void",
        description: "Callback when open state changes.",
      },
    ],
    subComponents: [
      {
        name: "CollapsibleTrigger",
        description: "Element that toggles the content.",
      },
      { name: "CollapsibleContent", description: "The collapsible panel." },
    ],
    examples: [
      { title: "Default", demoSlug: "collapsible-demo-default" },
      {
        title: "Open",
        description: "Initially open.",
        demoSlug: "collapsible-demo-open",
      },
      {
        title: "Styled",
        description: "Styled with borders and multiple items.",
        demoSlug: "collapsible-demo-styled",
      },
      {
        title: "File tree",
        description: "Nested collapsible file tree explorer.",
        demoSlug: "collapsible-demo-file-tree",
      },
      {
        title: "Settings",
        description: "Collapsible settings panel with form fields.",
        demoSlug: "collapsible-demo-settings",
      },
    ],
  };
