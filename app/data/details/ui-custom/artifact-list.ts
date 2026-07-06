import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ARTIFACT_LIST_DETAIL: ComponentDetail = {
	description: "A card listing worked-on artifacts and smart links. Each row shows a neutral icon tile (or 3rd-party logo), a title, a source and owner metadata line, and an Open button revealed on row hover or keyboard focus.",
	importStatement: `import { ArtifactList } from "@/components/ui-custom/artifact-list";`,
	usage: `import { ArtifactList } from "@/components/ui-custom/artifact-list";
import type { ArtifactListItem } from "@/components/ui-custom/artifact-list";
import PageIcon from "@atlaskit/icon/core/page";

const items: ArtifactListItem[] = [
  {
    id: "audience-engagement-report",
    title: "Audience Engagement Report",
    source: "Confluence page",
    owner: "Vitafleet Team",
    icon: <PageIcon label="" />,
  },
  {
    id: "content-variation-analysis",
    title: "Content Variation Analysis",
    source: "Google Spreadsheet",
    owner: "Vitafleet Team",
    brandName: "google-drive",
  },
];

<ArtifactList items={items} onOpen={(item) => console.log(item.id)} />`,
	demoLayout: { previewHeight: "fixed" },
	props: [
		{
			name: "items",
			type: "readonly ArtifactListItem[]",
			required: true,
			description: "Rows to render. Each item provides a title, source/owner metadata, and either an ADS icon or a logo path.",
		},
		{
			name: "onOpen",
			type: "(item: ArtifactListItem) => void",
			description: "Called when a row's hover/focus-revealed Open button is activated.",
		},
		{
			name: "openLabel",
			type: "string",
			description: "Label for the per-row Open button. Defaults to \"Open\".",
		},
	],
};
