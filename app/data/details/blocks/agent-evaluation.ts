import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AGENT_EVALUATION_DETAIL: ComponentDetail = {
		description:
			"Agent “Evaluation” screen for compact agent sections. Builders create datasets (CSV prompts/responses) to simulate agent responses, then configure and run evaluations that score how consistently the agent performs.",
		importStatement: `import { AgentEvaluation } from "@/components/blocks/agent-evaluation";`,
		usage: `import { AgentEvaluation } from "@/components/blocks/agent-evaluation";

<AgentEvaluation
  datasets={datasets}
  agents={agents}
  evaluationTypes={evaluationTypes}
  completedEvaluations={completedEvaluations}
/>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{ name: "agents", type: "AgentEvaluationAgentOption[]", description: "Agents (and versions) available to evaluate, shown in the agent select." },
			{ name: "datasets", type: "AgentEvaluationDatasetOption[]", description: "Datasets available to evaluate against. Empty renders the dataset empty state." },
			{ name: "evaluationTypes", type: "AgentEvaluationTypeOption[]", description: "Evaluation strategies (e.g. Response Accuracy, Resolution Rate, Manual Testing)." },
			{ name: "completedEvaluations", type: "AgentEvaluationCompletedRow[]", description: "Rows for the completed evaluations table. Empty renders the empty-state row." },
			{ name: "className", type: "string", description: "Additional classes applied to the outer container." },
		],
		examples: [
			{ title: "Empty state", description: "Default Evaluation screen before any datasets or evaluations exist.", demoSlug: "agent-evaluation" },
			{ title: "With data", description: "Datasets present and a completed evaluation listed in the results table.", demoSlug: "agent-evaluation-demo-filled" },
		],
	};
