import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CARD_DETAIL: ComponentDetail = {
    description:
      "A container component with header, content, footer, and action slots using a data-slot layout system.",
    usage: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>`,
    props: [
      {
        name: "size",
        type: '"default" | "sm"',
        default: '"default"',
        description: "Size variant of the card.",
      },
    ],
    subComponents: [
      { name: "CardHeader", description: "Top section with title and action." },
      { name: "CardTitle", description: "Primary heading." },
      { name: "CardDescription", description: "Secondary text." },
      { name: "CardAction", description: "Action element in header." },
      { name: "CardContent", description: "Main content area." },
      {
        name: "CardFooter",
        description: "Bottom section with muted background.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Card with header, content, and footer.",
        demoSlug: "card-demo-default",
      },
      {
        title: "Small",
        description: "Compact card size.",
        demoSlug: "card-demo-small",
      },
      {
        title: "With action",
        description: "Card with action button in header.",
        demoSlug: "card-demo-with-action",
      },
      {
        title: "Simple",
        description: "Minimal card with content only.",
        demoSlug: "card-demo-simple",
      },
      {
        title: "Default size",
        description: "Card in default size variant.",
        demoSlug: "card-demo-default-size",
      },
      {
        title: "Footer with border (small)",
        description: "Small card with bordered footer.",
        demoSlug: "card-demo-footer-with-border-small",
      },
      {
        title: "Footer with border",
        description: "Card with bordered footer.",
        demoSlug: "card-demo-footer-with-border",
      },
      {
        title: "Header with border (small)",
        description: "Small card with bordered header.",
        demoSlug: "card-demo-header-with-border-small",
      },
      {
        title: "Header with border",
        description: "Card with bordered header.",
        demoSlug: "card-demo-header-with-border",
      },
      {
        title: "Login",
        description: "Card styled as a login form.",
        demoSlug: "card-demo-login",
      },
      {
        title: "Meeting notes",
        description: "Card styled for meeting notes.",
        demoSlug: "card-demo-meeting-notes",
      },
      {
        title: "Small size",
        description: "Card in small size variant.",
        demoSlug: "card-demo-small-size",
      },
      {
        title: "With image (small)",
        description: "Small card with image.",
        demoSlug: "card-demo-with-image-small",
      },
      {
        title: "With image",
        description: "Card with full-width image.",
        demoSlug: "card-demo-with-image",
      },
    ],
  };
