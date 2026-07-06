import type { ComponentDetail } from "@/app/data/component-detail-types";

export const NAVIGATION_MENU_DETAIL: ComponentDetail = {
    description:
      "A horizontal navigation menu component built on Base UI NavigationMenu with dropdown content panels and animated indicators.",
    usage: `import {
  NavigationMenu, NavigationMenuList, NavigationMenuItem,
  NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink,
} from "@/components/ui/navigation-menu";

<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Getting Started</NavigationMenuTrigger>
      <NavigationMenuContent>Content here</NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink href="/docs">Docs</NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`,
    subComponents: [
      { name: "NavigationMenuList", description: "Container for menu items." },
      { name: "NavigationMenuItem", description: "Individual menu entry." },
      {
        name: "NavigationMenuTrigger",
        description: "Button that opens content panel.",
      },
      { name: "NavigationMenuContent", description: "Dropdown content panel." },
      { name: "NavigationMenuLink", description: "Direct navigation link." },
      {
        name: "NavigationMenuIndicator",
        description: "Visual indicator for active item.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Navigation menu with links.",
        demoSlug: "navigation-menu-demo-default",
      },
      {
        title: "With trigger",
        description: "Menu with dropdown content panel.",
        demoSlug: "navigation-menu-demo-with-trigger",
      },
      { title: "Basic", demoSlug: "navigation-menu-demo-basic" },
    ],
  };
