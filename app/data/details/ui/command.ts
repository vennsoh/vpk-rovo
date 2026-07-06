import type { ComponentDetail } from "@/app/data/component-detail-types";

export const COMMAND_DETAIL: ComponentDetail = {
    description:
      "A command palette component built on CMDK with search input, item list, groups, and dialog mode.",
    usage: `import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty } from "@/components/ui/command";

<Command>
  <CommandInput placeholder="Search..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Actions">
      <CommandItem>Search</CommandItem>
      <CommandItem>Settings</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`,
    subComponents: [
      { name: "CommandDialog", description: "Command palette in a dialog." },
      { name: "CommandInput", description: "Search input field." },
      { name: "CommandList", description: "Scrollable results list." },
      {
        name: "CommandEmpty",
        description: "Empty state when no results match.",
      },
      { name: "CommandGroup", description: "Group of related items." },
      { name: "CommandItem", description: "Individual selectable item." },
      { name: "CommandShortcut", description: "Keyboard shortcut display." },
      {
        name: "CommandSeparator",
        description: "Visual separator between groups.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Basic command palette.",
        demoSlug: "command-demo-default",
      },
      {
        title: "Empty",
        description: "Command with no results state.",
        demoSlug: "command-demo-empty",
      },
      {
        title: "Groups",
        description: "Command with grouped items.",
        demoSlug: "command-demo-groups",
      },
      { title: "Basic", demoSlug: "command-demo-basic" },
      {
        title: "Inline",
        description: "Inline command palette.",
        demoSlug: "command-demo-inline",
      },
      {
        title: "Many groups and items",
        description: "Command with many groups and items.",
        demoSlug: "command-demo-many-groups-and-items",
      },
      {
        title: "With groups",
        description: "Command with labeled groups.",
        demoSlug: "command-demo-with-groups",
      },
      {
        title: "With shortcuts",
        description: "Command items with keyboard shortcuts.",
        demoSlug: "command-demo-with-shortcuts",
      },
    ],
  };
