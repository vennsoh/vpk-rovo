import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ACCORDION_DETAIL: ComponentDetail = {
    description:
      "A collapsible content panel component built on Base UI Accordion with animated expand/collapse transitions.",
    usage: `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

<Accordion defaultValue={["item-1"]}>
  <AccordionItem value="item-1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionContent>Content 1</AccordionContent>
  </AccordionItem>
</Accordion>`,
    props: [
      {
        name: "defaultValue",
        type: "string[]",
        description: "Initially expanded item values.",
      },
      {
        name: "value",
        type: "string[]",
        description: "Controlled expanded item values.",
      },
      {
        name: "multiple",
        type: "boolean",
        description: "Allow multiple items open simultaneously.",
      },
    ],
    subComponents: [
      { name: "AccordionItem", description: "Individual collapsible section." },
      {
        name: "AccordionTrigger",
        description: "Button that toggles the section.",
      },
      { name: "AccordionContent", description: "Collapsible content panel." },
    ],
    examples: [
      {
        title: "Default",
        description: "Single-selection accordion.",
        demoSlug: "accordion-demo-default",
      },
      {
        title: "Open",
        description: "Initially expanded item.",
        demoSlug: "accordion-demo-open",
      },
      {
        title: "Multiple",
        description: "Multiple items open at once.",
        demoSlug: "accordion-demo-multiple",
      },
      { title: "Basic", demoSlug: "accordion-demo-basic" },
      {
        title: "In card",
        description: "Accordion inside a card container.",
        demoSlug: "accordion-demo-in-card",
      },
      {
        title: "With borders",
        description: "Accordion with visible borders.",
        demoSlug: "accordion-demo-with-borders",
      },
      {
        title: "With disabled",
        description: "Accordion with disabled items.",
        demoSlug: "accordion-demo-with-disabled",
      },
    ],
  };
