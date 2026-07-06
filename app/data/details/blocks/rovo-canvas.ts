import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ROVO_CANVAS_DETAIL: ComponentDetail = {
		description: "Full-screen Rovo canvas chrome extracted as a VPK-native shell: per-kind artefact tabs, code artefact toolbar controls, version history, select mode, and the shared VPK sidebar chat rail without kg-prototyping generation state or demo content.",
		importStatement: `import { RovoCanvas } from "@/components/blocks/rovo-canvas/page";`,
		usage: `import { RovoCanvas } from "@/components/blocks/rovo-canvas/page";

<RovoCanvas
  open={open}
  onOpenChange={setOpen}
  kind="dashboard"
  title="Canvas draft"
/>`,
		props: [
			{
				name: "open",
				type: "boolean",
				description: "Controlled open state for the canvas dialog.",
			},
			{
				name: "defaultOpen",
				type: "boolean",
				default: "false",
				description: "Initial open state when the component is uncontrolled.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				description: "Called when the dialog opens or closes.",
			},
			{
				name: "kind",
				type: "RovoCanvasArtefactKind",
				default: '"dashboard"',
				description: "Chooses the default tab set and landing view: dashboard/report/app/integration, script, agent, or automation.",
			},
			{
				name: "status",
				type: "RovoCanvasStatus",
				default: '"ready"',
				description: "Controls loading and edit shimmer states for planning, executing, editing, ready, idle, and error states.",
			},
			{
				name: "title",
				type: "string",
				default: '"Canvas draft"',
				description: "Title rendered in the canvas header.",
			},
			{
				name: "primaryActionLabel",
				type: "string",
				default: '"Save"',
				description: "Header primary action label.",
			},
			{
				name: "onPrimaryAction",
				type: "() => void",
				description: "Optional handler for the header primary action.",
			},
			{
				name: "views",
				type: "ReadonlyArray<RovoCanvasView>",
				description: "Optional artefact tabs and content slots. Omit to use chrome-only defaults for the selected kind.",
			},
			{
				name: "viewId",
				type: "string",
				description: "Controlled active canvas view id.",
			},
			{
				name: "defaultViewId",
				type: "string",
				description: "Initial active view when the component is uncontrolled.",
			},
			{
				name: "onViewChange",
				type: "(viewId: string) => void",
				description: "Called when the active Plan, Preview, HTML, Details, Surfaces, Setup, Rule, or Code view changes.",
			},
			{
				name: "artefactLabel",
				type: "string",
				description: "Primary label shown in the left-card artefact identity block. Defaults to Code artefact, Agent artefact, or Automation rule.",
			},
			{
				name: "artefactMetadata",
				type: "string",
				description: "Optional secondary metadata shown below the artefact label.",
			},
			{
				name: "rightRail",
				type: "ReactNode",
				description: "Optional replacement for the default shared VPK sidebar ChatPanel rail.",
			},
			{
				name: "footer",
				type: "ReactNode",
				description: "Optional footer slot. Defaults to the AI verification footer.",
			},
			{
				name: "feedbackBanner",
				type: "ReactNode",
				description: "Optional banner slot rendered below the header.",
			},
			{
				name: "versionHistory",
				type: "ReadonlyArray<RovoCanvasVersion>",
				description: "Version drawer rows used by the Preview and HTML/Code toolbar history action.",
			},
			{
				name: "onRefresh",
				type: "(viewId: string) => void",
				description: "Optional handler for the toolbar refresh action.",
			},
			{
				name: "onCopy",
				type: "(view: RovoCanvasView) => void",
				description: "Optional handler for source-view Copy code.",
			},
			{
				name: "onSelectModeChange",
				type: "(isSelectMode: boolean) => void",
				description: "Optional handler for the preview select-element toggle.",
			},
		],
	};
