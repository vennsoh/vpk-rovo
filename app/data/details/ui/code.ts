import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CODE_DETAIL: ComponentDetail = {
    description:
      "Inline code snippet for embedding code references in text. Maps to @atlaskit/code.",
    usage: `import { Code } from "@/components/ui/code"

<p>Use the <Code>useState</Code> hook for state.</p>`,
    props: [],
    examples: [
      { title: "Default", demoSlug: "code-demo-default" },
      { title: "Inline in text", demoSlug: "code-demo-inline" },
      {
        title: "Multiple inline",
        description: "Multiple code snippets in a sentence.",
        demoSlug: "code-demo-multiple-inline",
      },
      { title: "File path", demoSlug: "code-demo-file-path" },
    ],
  };
