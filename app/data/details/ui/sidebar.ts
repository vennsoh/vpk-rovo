import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SIDEBAR_DETAIL: ComponentDetail = {
    description:
      "A comprehensive sidebar navigation component with multiple variants, collapsible modes, mobile adaptation, and rich menu system.",
    usage: `import {
  SidebarProvider, Sidebar, SidebarContent, SidebarGroup,
  SidebarGroupLabel, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, SidebarTrigger, SidebarInset,
} from "@/components/ui/sidebar";

<SidebarProvider>
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>Home</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
  <SidebarInset>Main content</SidebarInset>
</SidebarProvider>`,
    props: [
      {
        name: "variant",
        type: '"sidebar" | "floating" | "inset"',
        default: '"sidebar"',
        description: "Visual style of the sidebar.",
      },
      {
        name: "collapsible",
        type: '"offcanvas" | "icon" | "none"',
        default: '"offcanvas"',
        description: "Collapse behavior.",
      },
      {
        name: "side",
        type: '"left" | "right"',
        default: '"left"',
        description: "Sidebar position.",
      },
      {
        name: "defaultOpen",
        type: "boolean",
        default: "true",
        description: "Initial open state (on SidebarProvider).",
      },
    ],
    subComponents: [
      {
        name: "SidebarProvider",
        description: "Context provider for sidebar state.",
      },
      { name: "SidebarTrigger", description: "Toggle button for sidebar." },
      { name: "SidebarContent", description: "Scrollable content area." },
      { name: "SidebarHeader", description: "Top section." },
      { name: "SidebarFooter", description: "Bottom section." },
      { name: "SidebarGroup", description: "Group container." },
      { name: "SidebarGroupLabel", description: "Group heading." },
      { name: "SidebarMenu", description: "Menu list container." },
      { name: "SidebarMenuItem", description: "Individual menu entry." },
      {
        name: "SidebarMenuButton",
        description: "Clickable menu button with tooltip support.",
      },
      {
        name: "SidebarInset",
        description: "Main content area alongside sidebar.",
      },
      { name: "SidebarRail", description: "Thin toggle rail." },
    ],
    examples: [
      {
        title: "Default",
        description: "Full sidebar with menu items.",
        demoSlug: "sidebar-demo-default",
      },
      {
        title: "Collapsed",
        description: "Icon-only collapsed sidebar.",
        demoSlug: "sidebar-demo-collapsed",
      },
    ],
  };
