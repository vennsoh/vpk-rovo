import type { ComponentDetail } from "@/app/data/component-detail-types";

export const BADGE_DETAIL: ComponentDetail = {
    description:
      "A numeric status badge that mirrors the full @atlaskit/badge appearance API (12 appearances, new semantic naming), with optional icons and built-in numeric capping. Legacy appearances (default, primary, primaryInverted, important, added, removed) have been removed.",
    adsUrl: "https://atlassian.design/components/badge",
    usage: `import { Badge } from "@/components/ui/badge";

<Badge>8</Badge>
<Badge variant="information">12</Badge>
<Badge variant="success">+100</Badge>
<Badge variant="dangerBold">3</Badge>
<Badge variant="discoveryBold">7</Badge>`,
    props: [
      {
        name: "variant",
        type: '"neutral" | "danger" | "success" | "warning" | "information" | "discovery" | "inverse" | "informationBold" | "successBold" | "dangerBold" | "warningBold" | "discoveryBold"',
        default: '"neutral"',
        description:
          "Visual style variant of the badge, mirroring the full ADS Badge appearance API (new semantic naming convention). Bold appearances use the visual-uplift label fills such as color.background.danger.subtle; warningBold uses color.background.warning.bold.",
      },
      {
        name: "max",
        type: "number | false",
        default: "99",
        description:
          "Maximum numeric value to display. Values exceeding max show as 'max+'. Set to false to disable capping.",
      },
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes.",
      },
    ],
    examples: [
      // ADS appearances — new semantic naming (mirror atlassian.design/components/badge/examples)
      {
        title: "Neutral",
        description: "Gray count — the default appearance.",
        demoSlug: "badge-demo-neutral",
      },
      {
        title: "Danger",
        description: "Red count for errors or removals.",
        demoSlug: "badge-demo-danger",
      },
      {
        title: "Success",
        description: "Green count for positive or added values.",
        demoSlug: "badge-demo-success",
      },
      {
        title: "Warning",
        description: "Yellow count for cautionary values.",
        demoSlug: "badge-demo-warning",
      },
      {
        title: "Information",
        description: "Blue count for informational values.",
        demoSlug: "badge-demo-information",
      },
      {
        title: "Discovery",
        description: "Purple count for discovery or new features.",
        demoSlug: "badge-demo-discovery",
      },
      {
        title: "Inverse",
        description:
          "Inverted colors for high contrast against a darker background.",
        demoSlug: "badge-demo-inverse",
      },
      // Bold appearances — opaque bold-tone fills
      {
        title: "Information bold",
        description: "Bold blue fill with inverse text.",
        demoSlug: "badge-demo-information-bold",
      },
      {
        title: "Success bold",
        description: "Bold green fill with inverse text.",
        demoSlug: "badge-demo-success-bold",
      },
      {
        title: "Danger bold",
        description: "Bold red fill with inverse text.",
        demoSlug: "badge-demo-danger-bold",
      },
      {
        title: "Warning bold",
        description: "Bold yellow fill with dark inverse text.",
        demoSlug: "badge-demo-warning-bold",
      },
      {
        title: "Discovery bold",
        description: "Bold purple fill with inverse text.",
        demoSlug: "badge-demo-discovery-bold",
      },
      {
        title: "Max value",
        description: "Values exceeding max display as 'max+'. Defaults to 99.",
        demoSlug: "badge-demo-max-value",
      },
      {
        title: "All variants",
        description: "Every badge appearance side by side.",
        demoSlug: "badge-demo-variants",
      },
      {
        title: "With icon",
        description: "Badge with inline icon using VPK Icon wrapper.",
        demoSlug: "badge-demo-with-icon",
      },
      {
        title: "With spinner",
        description: "Badge with inline spinner for loading states.",
        demoSlug: "badge-demo-with-spinner",
      },
      {
        title: "Letters and special characters",
        description:
          "Optional leading symbols and trailing letters add meaning: leading + or - represents additions or subtractions, and trailing letters abbreviate units (d for day, K for thousand, M for million).",
        demoSlug: "badge-demo-letters-symbols",
      },
      {
        title: "Disabled",
        description: "Disabled badge states.",
        demoSlug: "badge-demo-disabled",
      },
    ],
  };
