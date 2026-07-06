import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ENTITY_CARD_DETAIL: ComponentDetail = {
	description:
		"Shared entity-card visual system for skills, apps, tools, agents, knowledge, and object tiles. Use the ready-made directory cards (EntityCard*Card) for embedded grids, or compose the bare EntityCard variants directly inside HoverCardContent for hover previews.",
	usage: `import { EntityCardSkillCard } from "@/components/ui-custom/entity-card"
import PageIcon from "@atlaskit/icon/core/page"

<EntityCardSkillCard
  name="Create page"
  description="Create a new formatted, rich text document or page in Confluence."
  icon={<PageIcon label="" />}
  iconVariant="blue"
  source={{ type: "custom", name: "Venn", avatarSrc: "/avatar-human/maia-ma.png" }}
  teammateCount={6273}
/>`,
	props: [
		{
			name: "name",
			type: "string",
			required: true,
			description: "Primary title shown in the card header.",
		},
		{
			name: "description",
			type: "string",
			description:
				"Optional secondary text. Variant-specific layouts clamp or wrap this text.",
		},
		{
			name: "onSelect",
			type: "(checked?: boolean) => void",
			description:
				"Optional whole-card action handler owned by the EntityCardShell.",
		},
		{
			name: "cardActionLabel",
			type: "string",
			description:
				"Accessible label for the whole-card action when it differs from the leading checkbox label.",
		},
		{
			name: "added",
			type: "boolean",
			description:
				"Marks the entity as already added and keeps the trailing status slot visible at rest.",
		},
		{
			name: "onAddedChange",
			type: "(checked: boolean) => void",
			description:
				"Renders the shared add/remove Switch. The switch appears on hover/focus when off and stays visible when added.",
		},
		{
			name: "trailingStatus",
			type: "ReactNode",
			description:
				"Advanced caller-owned trailing status control for custom add/remove affordances.",
		},
		{
			name: "density",
			type: '"directory" | "preview" | "compact"',
			default: '"directory"',
			description:
				"Visual sizing mode available on the bare EntityCard variants when composing outside the shell.",
		},
	],
	subComponents: [
		{
			name: "EntityCardSkillCard",
			description: "Ready-made directory card for skills (shell + content).",
		},
		{
			name: "EntityCardAppCard",
			description: "Ready-made directory card for apps (shell + content).",
		},
		{
			name: "EntityCardToolCard",
			description: "Ready-made directory card for tools (shell + content).",
		},
		{
			name: "EntityCardAgentCard",
			description: "Ready-made directory card for agents (shell + content).",
		},
		{
			name: "EntityCardKnowledgeCard",
			description: "Ready-made directory card for knowledge apps (shell + content).",
		},
		{
			name: "EntityCard.Shell",
			description: "Bordered, hover-elevating surface with an optional whole-card select button.",
		},
		{
			name: "EntityCard.Skill",
			description: "Bare skill entity visual for directory cards and hover previews.",
		},
		{
			name: "EntityCard.App",
			description: "App entity visual with app identity, tools, knowledge, and teammate metadata.",
		},
		{
			name: "EntityCard.Tool",
			description: "Tool entity visual with app identity and tool metadata.",
		},
		{
			name: "EntityCard.Agent",
			description: "Agent directory card visual with avatar, rating, and usage metadata.",
		},
		{
			name: "EntityCard.AgentProfile",
			description: "Block-level agent profile card visual used by the Agent Profile Card block.",
		},
		{
			name: "EntityCard.Knowledge",
			description: "Knowledge app card visual for the knowledge directory.",
		},
		{
			name: "EntityCard.ObjectTile",
			description: "Compact object tile visual kept compatible with the ObjectTile shim.",
		},
	],
	examples: [
		{ title: "Directory cards", demoSlug: "entity-card-demo-default" },
		{
			title: "Add/remove",
			description: "Skill cards with a hover-revealed Switch that persists when the skill is added.",
			demoSlug: "entity-card-demo-add-remove",
		},
		{
			title: "Skills",
			description: "Skill cards through the EntityCardSkillCard directory card.",
			demoSlug: "entity-card-demo-skills",
		},
		{
			title: "Apps",
			description: "App cards through the EntityCardAppCard directory card.",
			demoSlug: "entity-card-demo-apps",
		},
		{
			title: "Tools",
			description: "Tool cards through the EntityCardToolCard directory card.",
			demoSlug: "entity-card-demo-tools",
		},
		{
			title: "Agents",
			description: "Agent cards through the EntityCardAgentCard directory card.",
			demoSlug: "entity-card-demo-agents",
		},
		{
			title: "Knowledge",
			description: "Knowledge app cards through the EntityCardKnowledgeCard directory card.",
			demoSlug: "entity-card-demo-knowledge",
		},
	],
};
