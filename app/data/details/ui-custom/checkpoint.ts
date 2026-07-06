import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CHECKPOINT_DETAIL: ComponentDetail = {
	description:
		"A conversation checkpoint marker that lets users save and restore specific points in a chat history. Renders a visual separator with a bookmark icon and a restore trigger button.",
	usage: `import {
  Checkpoint,
  CheckpointIcon,
  CheckpointTrigger,
} from "@/components/ui-custom/checkpoint";

<Checkpoint>
  <CheckpointIcon />
  <CheckpointTrigger tooltip="Restore to this point">
    Restore checkpoint
  </CheckpointTrigger>
</Checkpoint>`,
	props: [
		{
			name: "children",
			type: "ReactNode",
			required: true,
			description: "CheckpointIcon and CheckpointTrigger sub-components.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root container.",
		},
	],
	subComponents: [
		{ name: "Checkpoint", description: "Root flex container with separator line." },
		{ name: "CheckpointIcon", description: "Visual indicator icon, defaults to BookmarkIcon. Pass custom children to override." },
		{ name: "CheckpointTrigger", description: "Ghost button that triggers a restore action. Supports an optional tooltip prop." },
	],
	examples: [
		{ title: "In conversation", description: "Checkpoints placed between messages with restore-on-click behavior.", demoSlug: "checkpoint-demo-conversation" },
		{ title: "Basic", description: "Minimal checkpoint with default bookmark icon and label.", demoSlug: "checkpoint-demo-basic" },
		{ title: "With tooltip", description: "Checkpoint trigger with a descriptive tooltip on hover.", demoSlug: "checkpoint-demo-with-tooltip" },
		{ title: "Custom icons", description: "Checkpoints using FlagIcon and HistoryIcon instead of the default bookmark.", demoSlug: "checkpoint-demo-custom-icon" },
	],
};
