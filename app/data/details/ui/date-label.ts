import type { ComponentDetail } from "@/app/data/component-detail-types";

export const DATE_LABEL_DETAIL: ComponentDetail = {
    description:
      "A compact label that displays a formatted date and communicates status through a colored outline and text (neutral, warning, danger) on a transparent surface. DateLabelTrigger is the interactive, button-styled variant that adds hover/pressed/focus states and a chevron to open a dropdown.",
    adsUrl: "https://atlassian.design/components/date-label",
    usage: `import { DateLabel, DateLabelTrigger } from "@/components/ui/date-label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Static label
<DateLabel date={new Date(2026, 6, 29)} variant="warning" />

// Interactive dropdown trigger
<DropdownMenu>
  <DropdownMenuTrigger render={<DateLabelTrigger date={new Date(2026, 6, 29)} />} />
  <DropdownMenuContent align="start">
    <DropdownMenuItem onSelect={() => {}}>Today</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
    props: [
      {
        name: "date",
        type: "Date | number | string",
        description:
          "Date to display. Accepts a Date, epoch milliseconds, or a parseable date string.",
      },
      {
        name: "label",
        type: "string",
        description:
          "Package-compatible display text. If provided, this takes precedence over `date` formatting.",
      },
      {
        name: "appearance",
        type: '"neutral" | "warning" | "danger"',
        description:
          "Package-compatible alias for `variant`.",
      },
      {
        name: "variant",
        type: '"neutral" | "warning" | "danger"',
        default: '"neutral"',
        description:
          "Status appearance. Mirrors the ADS date-label color API; conveyed via a colored outline and text.",
      },
      {
        name: "size",
        type: '"default" | "spacious"',
        default: '"default"',
        description: "Horizontal density. Mirrors the ADS spacing API.",
      },
      {
        name: "dateStyle",
        type: '"full" | "long" | "medium" | "short"',
        default: '"medium"',
        description: "Intl.DateTimeFormat date style used to format the date (en-US locale).",
      },
      {
        name: "icon",
        type: "ReactNode",
        description:
          "Optional leading icon. Wrap atlaskit icons in the VPK Icon component. When omitted, DateLabel renders the package-default icon for the current appearance.",
      },
      {
        name: "hasIconBefore",
        type: "boolean",
        default: "true",
        description:
          "Package-compatible toggle for the default leading icon.",
      },
      {
        name: "isSpacious",
        type: "boolean",
        default: "false",
        description:
          "Package-compatible alias for `size=\"spacious\"`.",
      },
      {
        name: "maxWidth",
        type: "number | string",
        description: "Caps the label width and truncates overflowing text with an ellipsis.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "date-label-demo-default" },
      {
        title: "Appearance",
        description: "Neutral, warning, and danger status colors.",
        demoSlug: "date-label-demo-appearance",
      },
      {
        title: "Icon",
        description: "Date label with a leading icon.",
        demoSlug: "date-label-demo-icon",
      },
      {
        title: "Spacious",
        description: "Default and spacious horizontal density.",
        demoSlug: "date-label-demo-spacious",
      },
      {
        title: "Max width",
        description: "Caps width and truncates with an ellipsis.",
        demoSlug: "date-label-demo-max-width",
      },
      {
        title: "Date styles",
        description: "Short, medium, long, and full Intl date styles.",
        demoSlug: "date-label-demo-date-styles",
      },
      {
        title: "Dropdown trigger",
        description:
          "DateLabelTrigger wired to a DropdownMenu for interactive date selection.",
        demoSlug: "date-label-demo-dropdown-trigger",
      },
    ],
  };
