import type { ComponentDetail } from "@/app/data/component-detail-types";

export const HEADING_DETAIL: ComponentDetail = {
    description:
      "A small ADS heading-token wrapper for semantic heading elements that need one of the shared font.heading token sizes.",
    usage: `import Heading from "@/components/ui/heading";

<Heading as="h1" size="xlarge">Project overview</Heading>
<Heading as="h3" size="small" className="text-text-subtle">Details</Heading>`,
    props: [
      {
        name: "as",
        type: "ElementType",
        default: '"h2"',
        description: "Semantic element to render, such as h1, h2, h3, or p.",
      },
      {
        name: "size",
        type: '"xxsmall" | "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge"',
        default: '"medium"',
        description: "ADS heading token size applied through font.heading.*.",
      },
      {
        name: "className",
        type: "string",
        description: "Optional classes for color, truncation, alignment, and layout.",
      },
    ],
    examples: [
      {
        title: "Scale",
        description: "All supported ADS heading token sizes rendered through the wrapper.",
        demoSlug: "heading-demo-scale",
      },
      {
        title: "Semantics",
        description: "The same visual size rendered with different semantic heading levels.",
        demoSlug: "heading-demo-semantics",
      },
    ],
  };
