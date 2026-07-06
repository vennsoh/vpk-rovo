import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_BENTO_DETAIL: ComponentDetail = {
		description: "Two Rovo agent prompt-starter bentos: a tabbed landing variant with an auto-cycling category bar, a hero tile (\"Works with\" sources + \"Skills\"), and a \"Browse all\" pill; and a minimal five-tile \"Start with these agent templates\" row. Both use an avatar-colored hover glow and collapse from their desktop grid to a horizontal carousel below the lg breakpoint.",
		importStatement: `import { HomeStarterBento, AgentCompactOperationsBento } from "@/components/blocks/agent-bento";`,
		usage: `import {
  HomeStarterBento,
  AgentCompactOperationsBento,
} from "@/components/blocks/agent-bento";

// Full landing bento (tabs + hero tile + responsive carousel)
<HomeStarterBento
  onSelect={(prompt) => console.log(prompt)}
  onBrowseTemplates={(category) => console.log(category)}
  onDismiss={() => undefined}
/>

// Minimal "Start with these agent templates" row
<AgentCompactOperationsBento onDismiss={() => undefined} />`,
		demoLayout: { previewHeight: "fit" },
		props: [
			{
				name: "onSelect",
				type: "(prompt: string) => void",
				description: "HomeStarterBento: called when a tile is clicked, with its prompt. Defaults to a no-op.",
			},
			{
				name: "onBrowseTemplates",
				type: "(category: HomeStarterCategory) => void",
				description: "HomeStarterBento: called when the \"Browse all\" pill is clicked, with the active category. Defaults to a no-op.",
			},
			{
				name: "onPreviewStart",
				type: "(prompt: string) => void",
				description: "HomeStarterBento: called when a tile is hovered or focused, with its prompt. Defaults to a no-op.",
			},
			{
				name: "onPreviewEnd",
				type: "() => void",
				description: "HomeStarterBento: called when a tile preview should stop. Defaults to a no-op.",
			},
			{
				name: "onDismiss",
				type: "() => void",
				description: "Called when the \"Dismiss\" (HomeStarterBento) or \"Not now\" (AgentCompactOperationsBento) control is clicked. Defaults to a no-op.",
			},
		],
	};
