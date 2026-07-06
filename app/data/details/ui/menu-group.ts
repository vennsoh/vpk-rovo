import type { ComponentDetail } from "@/app/data/component-detail-types";

export const MENU_GROUP_DETAIL: ComponentDetail = {
    description:
      "A family of menu primitives for building structured menus: items with icons and descriptions, link items, sections with headings and separators, and skeleton loading states. Maps to the full @atlaskit/menu API.",
    adsUrl: "https://atlassian.design/components/menu",
    usage: `import { MenuGroup, MenuSection, MenuItem, MenuLinkItem, MenuHeading, MenuSkeletonItem, MenuSkeletonHeading } from "@/components/ui/menu-group";

<MenuGroup>
  <MenuSection title="Actions">
    <MenuItem iconBefore={<EditIcon label="" />}>Edit</MenuItem>
    <MenuItem iconBefore={<CopyIcon label="" />}>Duplicate</MenuItem>
  </MenuSection>
  <MenuSection hasSeparator>
    <MenuItem iconBefore={<DeleteIcon label="" />}>Delete</MenuItem>
  </MenuSection>
</MenuGroup>`,
    props: [
      {
        name: "title",
        type: "React.ReactNode",
        description:
          "Optional group heading label (also used as aria-label when a string).",
      },
      {
        name: "spacing",
        type: '"cozy" | "compact"',
        default: '"cozy"',
        description: "Density of item padding within the group.",
      },
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes.",
      },
      {
        name: "children",
        type: "React.ReactNode",
        description: "Menu items, sections, or headings.",
      },
    ],
    subComponents: [
      {
        name: "MenuSection",
        description: "Groups items with optional title and separator.",
      },
      {
        name: "MenuItem",
        description:
          "Interactive button-style menu item with iconBefore, iconAfter, and description slots.",
      },
      {
        name: "MenuLinkItem",
        description: "Anchor-style menu item for navigation links.",
      },
      { name: "MenuHeading", description: "Non-interactive heading label." },
      {
        name: "MenuSkeletonItem",
        description: "Loading placeholder for a menu item.",
      },
      {
        name: "MenuSkeletonHeading",
        description: "Loading placeholder for a heading.",
      },
    ],
    examples: [
      { title: "Default", demoSlug: "menu-group-demo-default" },
      { title: "Menu structure", demoSlug: "menu-group-demo-menu-structure" },
      { title: "Button item", demoSlug: "menu-group-demo-button-item" },
      { title: "Link item", demoSlug: "menu-group-demo-link-item" },
      { title: "Custom item", demoSlug: "menu-group-demo-custom-item" },
      {
        title: "Section and heading item",
        demoSlug: "menu-group-demo-section-and-heading",
      },
      { title: "Density", demoSlug: "menu-group-demo-density" },
      { title: "Scrolling", demoSlug: "menu-group-demo-scrolling" },
      { title: "Loading", demoSlug: "menu-group-demo-loading" },
    ],
  };
