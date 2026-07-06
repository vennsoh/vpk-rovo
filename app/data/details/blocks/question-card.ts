import type { ComponentDetail } from "@/app/data/component-detail-types";

export const QUESTION_CARD_DETAIL: ComponentDetail = {
		description: "ADS-style question card with single-select (numbered) and multi-select (checkbox) options, keyboard navigation, question pagination, and free-form custom input.",
		usage: `import { QuestionCard } from "@/components/blocks/question-card/page";
import type { QuestionCardQuestion } from "@/components/blocks/question-card/page";

const questions: QuestionCardQuestion[] = [
  {
    id: "deploy",
    label: "Which deployment strategy?",
    kind: "single-select",
    options: [
      { id: "blue-green", label: "Blue-green" },
      { id: "staged-rollout", label: "Staged rollout" },
    ],
  },
];

<QuestionCard
  questions={questions}
  onSubmit={(answers) => console.log(answers)}
  onDismiss={() => {}}
/>`,
		props: [
			{
				name: "questions",
				type: "ReadonlyArray<QuestionCardQuestion>",
				required: true,
				description: "Ordered list of questions to present. Each question defines its selection mode via the kind field.",
			},
			{
				name: "onSubmit",
				type: "(answers: QuestionCardAnswers) => void",
				required: true,
				description: "Called with the collected answers when the user completes all questions or clicks Submit.",
			},
			{
				name: "onDismiss",
				type: "() => void",
				description: "Called when the user dismisses the card. When omitted the dismiss button is hidden.",
			},
			{
				name: "isSubmitting",
				type: "boolean",
				default: "false",
				description: "Disables all interactions and shows a loading state on the submit button.",
			},
			{
				name: "maxVisibleOptions",
				type: "number",
				default: "4",
				description: "Maximum number of pre-defined options to show per question. Additional options are truncated.",
			},
			{
				name: "customInputPlaceholder",
				type: "string",
				default: '"Tell Rovo what to do..."',
				description: "Placeholder text for the free-form custom input row.",
			},
			{
				name: "showCustomInput",
				type: "boolean",
				default: "true",
				description: "Whether to show the free-form custom input row after the option list.",
			},
			{
				name: "defaultAnswers",
				type: "QuestionCardAnswers",
				default: "{}",
				description: "Pre-populated answers keyed by question ID. Useful for restoring previous selections.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional CSS classes merged onto the root container.",
			},
		],
		subComponents: [
			{
				name: "QuestionCardQuestion",
				description: "Shape of each question in the questions array.",
				props: [
					{ name: "id", type: "string", required: true, description: "Unique identifier for the question." },
					{ name: "label", type: "string", required: true, description: "Question text displayed as a heading." },
					{
						name: "kind",
						type: '"single-select" | "multi-select" | "text"',
						required: true,
						description: "Selection mode. single-select shows numbered options and auto-advances. multi-select shows checkboxes on the right and allows multiple picks.",
					},
					{ name: "options", type: "ReadonlyArray<QuestionCardOption>", required: true, description: "Pre-defined answer options." },
				],
			},
			{
				name: "QuestionCardOption",
				description: "Shape of each option within a question.",
				props: [
					{ name: "id", type: "string", required: true, description: "Unique identifier for the option." },
					{ name: "label", type: "string", required: true, description: "Display label for the option." },
					{ name: "description", type: "string", description: "Optional secondary description shown below the label." },
				],
			},
		],
		examples: [
			{ title: "Single-select", description: "Numbered options with auto-advance on selection.", demoSlug: "question-card-demo-single-select" },
			{ title: "Multi-select", description: "Checkbox indicators on the right allow multiple selections.", demoSlug: "question-card-demo-multi-select" },
			{ title: "Multi-step multi-select", description: "Several multi-select questions in sequence; the footer reads Next once the step has a selection, then Submit on the last step.", demoSlug: "question-card-demo-multi-step-multi-select" },
			{ title: "Text only", description: "Single free-form text input with no pre-defined options.", demoSlug: "question-card-demo-text-only" },
			{ title: "Mixed flow", description: "Multi-question flow combining single-select and multi-select with pagination.", demoSlug: "question-card-demo-mixed" },
			{ title: "Without custom input", description: "Custom input row hidden via showCustomInput={false}.", demoSlug: "question-card-demo-no-custom-input" },
			{ title: "Custom placeholder", description: "Custom placeholder text for the free-form input.", demoSlug: "question-card-demo-custom-placeholder" },
			{ title: "Pre-populated answers", description: "Answers pre-selected via defaultAnswers prop.", demoSlug: "question-card-demo-pre-populated" },
		],
	};
