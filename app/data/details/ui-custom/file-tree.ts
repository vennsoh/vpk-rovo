import type { ComponentDetail } from "@/app/data/component-detail-types";

export const FILE_TREE_DETAIL: ComponentDetail = {
	description:
		"A hierarchical file system explorer with expandable folders, file selection, custom icons, and inline action buttons. Supports both controlled and uncontrolled expand/select state.",
	usage: `import {
  FileTree,
  FileTreeFolder,
  FileTreeFile,
  FileTreeIcon,
  FileTreeName,
  FileTreeActions,
} from "@/components/ui-custom/file-tree";

<FileTree
  defaultExpanded={new Set(["src"])}
  selectedPath={selectedPath}
  onSelect={setSelectedPath}
>
  <FileTreeFolder path="src" name="src">
    <FileTreeFile path="src/index.ts" name="index.ts" />
    <FileTreeFile path="src/utils.ts" name="utils.ts" />
  </FileTreeFolder>
  <FileTreeFile path="package.json" name="package.json" />
</FileTree>`,
	props: [
		{
			name: "expanded",
			type: "Set<string>",
			description: "Controlled expanded folder paths.",
		},
		{
			name: "defaultExpanded",
			type: "Set<string>",
			default: "new Set()",
			description: "Default expanded folder paths for uncontrolled usage.",
		},
		{
			name: "selectedPath",
			type: "string",
			description: "Currently selected file or folder path.",
		},
		{
			name: "onSelect",
			type: "(path: string) => void",
			description: "Callback when a file or folder is selected.",
		},
		{
			name: "onExpandedChange",
			type: "(expanded: Set<string>) => void",
			description: "Callback when expanded folder paths change.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root container.",
		},
	],
	subComponents: [
		{ name: "FileTree", description: "Root container with tree role and expand/select context provider." },
		{ name: "FileTreeFolder", description: "Collapsible folder node with chevron, folder icon, and nested children." },
		{ name: "FileTreeFile", description: "Leaf file node with click/keyboard selection and optional custom icon." },
		{ name: "FileTreeIcon", description: "Inline icon wrapper for custom file or folder icons." },
		{ name: "FileTreeName", description: "Truncated text display for file or folder names." },
		{ name: "FileTreeActions", description: "Right-aligned action button container with click propagation isolation." },
	],
	examples: [
		{ title: "Project structure", description: "Nested folder hierarchy with multiple levels expanded.", demoSlug: "file-tree-demo-project" },
		{ title: "With selection", description: "Interactive file tree with controlled selection state.", demoSlug: "file-tree-demo-with-selection" },
		{ title: "Custom icons", description: "File-type-specific icons for code, image, JSON, and text files.", demoSlug: "file-tree-demo-custom-icons" },
		{ title: "With actions", description: "File rows with inline copy, download, and delete action buttons.", demoSlug: "file-tree-demo-with-actions" },
	],
};
