import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PLAN_DETAIL: ComponentDetail = {
	description:
		"A composable collapsible plan card with supported summary and tasks-only patterns. Includes shimmer-ready title/description rendering, markdown summary content, numbered task lists with overflow handling, and optional footer actions.",
	usage: `import {
  Plan,
  PlanHeader,
  PlanAvatar,
  PlanTitle,
  PlanDescription,
  PlanContent,
  PlanTabContent,
  PlanFooter,
} from "@/components/ui-custom/plan";
import { Button } from "@/components/ui/button";

<Plan open={isOpen} onOpenChange={setIsOpen}>
  <PlanHeader
    leading={<PlanAvatar visualIdentity={{ iconName: "dashboard", tileVariant: "blue" }} />}
    title={
      <PlanTitle className="truncate text-sm leading-5 font-semibold text-text">
        Implementation plan
      </PlanTitle>
    }
    description={
      <PlanDescription className="text-xs leading-4 text-text-subtlest">
        4 tasks
      </PlanDescription>
    }
  />
  <PlanContent className="pb-0">
    <PlanTabContent
      description={planSummaryMarkdown}
    />
    <PlanFooter className="justify-end gap-2">
      <Button variant="outline">Open preview</Button>
      <Button>Build</Button>
    </PlanFooter>
  </PlanContent>
</Plan>`,
	props: [
		{
			name: "isStreaming",
			type: "boolean",
			default: "false",
			description: "Enable shimmer loading animation for streamed content.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional CSS classes.",
		},
	],
	subComponents: [
		{ name: "PlanHeader", description: "Generative-style plan header with built-in chevron toggle. Accepts `leading`, `title`, and optional `description` props." },
		{ name: "PlanAvatar", description: "IconTile-based avatar for plan headers. Accepts a `visualIdentity` prop with `iconName` and subtle `tileVariant`." },
		{ name: "PlanTitle", description: "Title text with shimmer support." },
		{ name: "PlanDescription", description: "Description text with shimmer support." },
		{ name: "PlanAction", description: "Legacy action slot used by custom headers." },
		{ name: "PlanChevronTrigger", description: "Legacy chevron toggle button for custom plan headers." },
		{ name: "PlanContent", description: "Collapsible content area." },
		{ name: "PlanTabContent", description: "Built-in markdown summary body. Accepts `description`, optional `markdown`, and summary layout overrides." },
		{ name: "PlanSummary", description: "Markdown summary renderer with collapsed overflow treatment. Accepts `summary`, optional `emptyMessage`, and optional `showMoreLabel` props." },
		{ name: "PlanAgentBar", description: "Agent count row with people icon. Accepts `agents` string array." },
		{ name: "PlanTaskList", description: "Ordered list with overflow detection and \"Show more\" button. Accepts optional `showMoreLabel`; expansion state is shared with `PlanSummary`." },
		{ name: "PlanTaskItem", description: "Animated numbered task row with optional `blockedByLabels`, `blockedByText`, and `agent` badge." },
		{ name: "PlanTrigger", description: "Legacy toggle button for expand/collapse (ChevronsUpDown icon)." },
		{ name: "PlanFooter", description: "Bottom section for actions." },
	],
	examples: [
		{ title: "Summary", description: "Plan card variant with markdown summary content.", demoSlug: "plan-demo-summary-and-tasks" },
		{ title: "Tasks only", description: "Classic plan card with task list content only.", demoSlug: "plan-demo-tasks-only" },
	],
};
