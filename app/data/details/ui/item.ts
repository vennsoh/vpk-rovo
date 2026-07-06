import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ITEM_DETAIL: ComponentDetail = {
    description:
      "A flexible list item component with media, content, title, description, and action slots in multiple variants and sizes.",
    usage: `import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription } from "@/components/ui/item";

<Item>
  <ItemMedia variant="icon"><UserIcon label="" /></ItemMedia>
  <ItemContent>
    <ItemTitle>Title</ItemTitle>
    <ItemDescription>Description</ItemDescription>
  </ItemContent>
</Item>`,
    props: [
      {
        name: "variant",
        type: '"default" | "outline" | "muted"',
        default: '"default"',
        description: "Visual style variant.",
      },
      {
        name: "size",
        type: '"default" | "sm" | "xs"',
        default: '"default"',
        description: "Size of the item.",
      },
    ],
    subComponents: [
      {
        name: "ItemMedia",
        description: "Media slot (icon, image, or default).",
      },
      { name: "ItemContent", description: "Main text content area." },
      { name: "ItemTitle", description: "Primary title text." },
      { name: "ItemDescription", description: "Secondary description text." },
      { name: "ItemActions", description: "Action buttons area." },
      { name: "ItemHeader", description: "Header section." },
      { name: "ItemFooter", description: "Footer section." },
      { name: "ItemGroup", description: "List container with role=list." },
      { name: "ItemSeparator", description: "Visual separator between items." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic item with title.",
        demoSlug: "item-demo-default",
      },
      {
        title: "With description",
        description: "Item with title and description.",
        demoSlug: "item-demo-with-description",
      },
      {
        title: "With media",
        description: "Item with icon media slot.",
        demoSlug: "item-demo-with-media",
      },
      {
        title: "As child",
        description: "Item rendered via asChild pattern.",
        demoSlug: "item-demo-as-child",
      },
      {
        title: "Default item media image",
        description: "Item with default media image slot.",
        demoSlug: "item-demo-default-item-media-image",
      },
      {
        title: "Extra small",
        description: "Extra small size item.",
        demoSlug: "item-demo-extra-small",
      },
      {
        title: "Item footer",
        description: "Item with footer content.",
        demoSlug: "item-demo-item-footer",
      },
      {
        title: "Item group",
        description: "Group of items in a list.",
        demoSlug: "item-demo-item-group",
      },
      {
        title: "Item header and footer",
        description: "Item with header and footer sections.",
        demoSlug: "item-demo-item-header-item-footer",
      },
      {
        title: "Item header",
        description: "Item with header content.",
        demoSlug: "item-demo-item-header",
      },
      {
        title: "Item separator",
        description: "Items separated by dividers.",
        demoSlug: "item-demo-item-separator",
      },
      {
        title: "Muted as child",
        description: "Muted variant with asChild pattern.",
        demoSlug: "item-demo-muted-as-child",
      },
      {
        title: "Muted extra small",
        description: "Muted variant in extra small size.",
        demoSlug: "item-demo-muted-extra-small",
      },
      {
        title: "Muted item group",
        description: "Muted variant in a group.",
        demoSlug: "item-demo-muted-item-group",
      },
      {
        title: "Muted item media image",
        description: "Muted variant with media image.",
        demoSlug: "item-demo-muted-item-media-image",
      },
      {
        title: "Muted small",
        description: "Muted variant in small size.",
        demoSlug: "item-demo-muted-small",
      },
      {
        title: "Muted",
        description: "Muted variant item.",
        demoSlug: "item-demo-muted",
      },
      {
        title: "Outline as child",
        description: "Outline variant with asChild pattern.",
        demoSlug: "item-demo-outline-as-child",
      },
      {
        title: "Outline extra small",
        description: "Outline variant in extra small size.",
        demoSlug: "item-demo-outline-extra-small",
      },
      {
        title: "Outline item group",
        description: "Outline variant in a group.",
        demoSlug: "item-demo-outline-item-group",
      },
      {
        title: "Outline item media image (extra small)",
        description: "Outline variant with media image in extra small.",
        demoSlug: "item-demo-outline-item-media-image-extra-small",
      },
      {
        title: "Outline item media image (small)",
        description: "Outline variant with media image in small.",
        demoSlug: "item-demo-outline-item-media-image-small",
      },
      {
        title: "Outline item media image",
        description: "Outline variant with media image.",
        demoSlug: "item-demo-outline-item-media-image",
      },
      {
        title: "Outline small",
        description: "Outline variant in small size.",
        demoSlug: "item-demo-outline-small",
      },
      {
        title: "Outline",
        description: "Outline variant item.",
        demoSlug: "item-demo-outline",
      },
      {
        title: "Small",
        description: "Small size item.",
        demoSlug: "item-demo-small",
      },
    ],
  };
