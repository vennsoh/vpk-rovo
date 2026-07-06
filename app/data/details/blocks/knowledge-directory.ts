import type { ComponentDetail } from "@/app/data/component-detail-types";

export const KNOWLEDGE_DIRECTORY_DETAIL: ComponentDetail = {
		description: "Knowledge directory block for connecting external knowledge apps, choosing all content, or narrowing to selected content rows.",
		importStatement: `import { KnowledgeDirectoryDialog } from "@/components/blocks/knowledge-directory";`,
		usage: `import { KnowledgeDirectoryDialog } from "@/components/blocks/knowledge-directory";
import { ConfluenceIcon } from "@/components/ui/logo";
import type { KnowledgeDirectoryApp } from "@/components/blocks/knowledge-directory";

const apps: KnowledgeDirectoryApp[] = [
  {
    id: "confluence",
    name: "Confluence",
    description: "Create, organize, and reuse rich pages and decisions.",
    providerName: "Atlassian",
    icon: <ConfluenceIcon label="" size="small" />,
    contents: [
      {
        id: "product-requirements",
        name: "Product requirements",
        description: "Specs, goals, and release criteria.",
      },
    ],
  },
];

<KnowledgeDirectoryDialog
  open={open}
  onOpenChange={setOpen}
  apps={apps}
  onBrowseFiles={() => console.log("browse files")}
  onAddKnowledge={(payload) => console.log("add knowledge", payload)}
/>`,
		demoLayout: { previewHeight: "fixed" },
		props: [
			{
				name: "apps",
				type: "readonly KnowledgeDirectoryApp[]",
				description: "Knowledge connector apps rendered in the app grid. Defaults to the bundled demo connectors.",
			},
			{
				name: "selectedAppId",
				type: "string | null",
				description: "Controlled selected connector id. When null, the dialog shows the app list.",
			},
			{
				name: "defaultSelectedAppId",
				type: "string | null",
				description: "Initial uncontrolled connector id.",
			},
			{
				name: "selectedMode",
				type: "\"all\" | \"custom\"",
				description: "Controlled content scope mode.",
			},
			{
				name: "defaultSelectedMode",
				type: "\"all\" | \"custom\"",
				description: "Initial uncontrolled content scope mode. Defaults to \"all\".",
			},
			{
				name: "selectedContentIds",
				type: "readonly string[]",
				description: "Controlled selected content ids for custom content mode.",
			},
			{
				name: "defaultSelectedContentIds",
				type: "readonly string[]",
				description: "Initial uncontrolled selected content ids for custom content mode.",
			},
			{
				name: "open",
				type: "boolean",
				required: true,
				description: "Controlled dialog open state.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				required: true,
				description: "Called when the dialog requests an open-state change.",
			},
			{
				name: "onBrowseFiles",
				type: "() => void",
				description: "Optional file browser callback for the upload-zone button.",
			},
			{
				name: "onSelectApp",
				type: "(app: KnowledgeDirectoryApp) => void",
				description: "Called when a connector app is selected.",
			},
			{
				name: "onSelectedAppIdChange",
				type: "(appId: string | null) => void",
				description: "Called whenever the selected connector id changes.",
			},
			{
				name: "onSelectMode",
				type: "(mode: KnowledgeDirectoryMode) => void",
				description: "Called when the user chooses all content or custom content.",
			},
			{
				name: "onSelectedContentIdsChange",
				type: "(contentIds: readonly string[]) => void",
				description: "Called whenever custom selected content ids change.",
			},
			{
				name: "onAddKnowledge",
				type: "(payload: { appId: string; mode: KnowledgeDirectoryMode; contentIds: \"all\" | readonly string[] }) => void",
				description: "Called by the Add button with the selected app and content scope.",
			},
			{
				name: "title",
				type: "string",
				description: "Optional dialog title. Defaults to “Browse knowledge”.",
			},
		],
	};
