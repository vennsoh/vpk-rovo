import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CONTEXT_MENU_DETAIL: ComponentDetail = {
    description:
      "A right-click context menu component built on Base UI ContextMenu with items, groups, separators, and sub-menus.",
    usage: `import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
} from "@/components/ui/context-menu";

<ContextMenu>
  <ContextMenuTrigger>
    <div className="border border-dashed p-8">Right-click here</div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Cut</ContextMenuItem>
    <ContextMenuItem>Copy</ContextMenuItem>
    <ContextMenuItem>Paste</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
    subComponents: [
      {
        name: "ContextMenuTrigger",
        description: "Area that triggers on right-click.",
      },
      { name: "ContextMenuContent", description: "Floating menu container." },
      { name: "ContextMenuItem", description: "Individual menu item." },
      {
        name: "ContextMenuCheckboxItem",
        description: "Toggleable checkbox item.",
      },
      { name: "ContextMenuRadioGroup", description: "Radio group container." },
      { name: "ContextMenuRadioItem", description: "Radio selection item." },
      { name: "ContextMenuLabel", description: "Group label." },
      { name: "ContextMenuSeparator", description: "Visual separator." },
      { name: "ContextMenuShortcut", description: "Keyboard shortcut text." },
      { name: "ContextMenuSub", description: "Sub-menu container." },
      { name: "ContextMenuSubTrigger", description: "Sub-menu trigger." },
      { name: "ContextMenuSubContent", description: "Sub-menu content." },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic context menu.",
        demoSlug: "context-menu-demo-default",
      },
      {
        title: "With shortcuts",
        description: "Context menu with keyboard shortcuts.",
        demoSlug: "context-menu-demo-with-shortcuts",
      },
      { title: "Basic", demoSlug: "context-menu-demo-basic" },
      {
        title: "In dialog",
        description: "Context menu inside a dialog.",
        demoSlug: "context-menu-demo-in-dialog",
      },
      {
        title: "With checkboxes",
        description: "Context menu with toggleable checkbox items.",
        demoSlug: "context-menu-demo-with-checkboxes",
      },
      {
        title: "With destructive items",
        description: "Context menu with destructive-styled items.",
        demoSlug: "context-menu-demo-with-destructive-items",
      },
      {
        title: "With groups, labels, separators",
        description: "Context menu with organized sections.",
        demoSlug: "context-menu-demo-with-groups-labels-separators",
      },
      {
        title: "With icons",
        description: "Context menu items with leading icons.",
        demoSlug: "context-menu-demo-with-icons",
      },
      {
        title: "With inset",
        description: "Context menu items with inset padding.",
        demoSlug: "context-menu-demo-with-inset",
      },
      {
        title: "With radio group",
        description: "Context menu with radio selection items.",
        demoSlug: "context-menu-demo-with-radio-group",
      },
      {
        title: "With sides",
        description: "Context menu opening on different sides.",
        demoSlug: "context-menu-demo-with-sides",
      },
      {
        title: "With submenu",
        description: "Context menu with nested sub-menu.",
        demoSlug: "context-menu-demo-with-submenu",
      },
    ],
  };
