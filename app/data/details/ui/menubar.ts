import type { ComponentDetail } from "@/app/data/component-detail-types";

export const MENUBAR_DETAIL: ComponentDetail = {
    description:
      "A horizontal menu bar component composing Base UI Menubar and DropdownMenu for application-level menus.",
    usage: `import {
  Menubar, MenubarMenu, MenubarTrigger, MenubarContent,
  MenubarItem, MenubarSeparator,
} from "@/components/ui/menubar";

<Menubar>
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>New</MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Exit</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
    subComponents: [
      { name: "MenubarMenu", description: "Individual menu in the bar." },
      { name: "MenubarTrigger", description: "Button that opens the menu." },
      { name: "MenubarContent", description: "Floating menu content." },
      { name: "MenubarItem", description: "Individual menu item." },
      { name: "MenubarCheckboxItem", description: "Toggleable checkbox item." },
      { name: "MenubarRadioGroup", description: "Radio group container." },
      { name: "MenubarRadioItem", description: "Radio selection item." },
      { name: "MenubarLabel", description: "Group label." },
      { name: "MenubarSeparator", description: "Visual separator." },
      { name: "MenubarShortcut", description: "Keyboard shortcut text." },
      { name: "MenubarSub", description: "Sub-menu container." },
      { name: "MenubarSubTrigger", description: "Sub-menu trigger." },
      { name: "MenubarSubContent", description: "Sub-menu content." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic menubar with menus.",
        demoSlug: "menubar-demo-default",
      },
      {
        title: "With shortcuts",
        description: "Menubar with keyboard shortcuts.",
        demoSlug: "menubar-demo-with-shortcuts",
      },
      { title: "Basic", demoSlug: "menubar-demo-basic" },
      {
        title: "Destructive",
        description: "Menu items with destructive styling.",
        demoSlug: "menubar-demo-destructive",
      },
      {
        title: "Format",
        description: "Format menu with text formatting options.",
        demoSlug: "menubar-demo-format",
      },
      {
        title: "In dialog",
        description: "Menubar inside a dialog.",
        demoSlug: "menubar-demo-in-dialog",
      },
      {
        title: "Insert",
        description: "Insert menu with various content types.",
        demoSlug: "menubar-demo-insert",
      },
      {
        title: "Sides",
        description: "Menubar opening on different sides.",
        demoSlug: "menubar-demo-sides",
      },
      {
        title: "With checkboxes",
        description: "Menu items with toggleable checkboxes.",
        demoSlug: "menubar-demo-with-checkboxes",
      },
      {
        title: "With icons",
        description: "Menu items with leading icons.",
        demoSlug: "menubar-demo-with-icons",
      },
      {
        title: "With inset",
        description: "Menu items with inset padding.",
        demoSlug: "menubar-demo-with-inset",
      },
      {
        title: "With radio",
        description: "Menu items with radio selection.",
        demoSlug: "menubar-demo-with-radio",
      },
      {
        title: "With submenu",
        description: "Menubar with nested sub-menu.",
        demoSlug: "menubar-demo-with-submenu",
      },
    ],
  };
