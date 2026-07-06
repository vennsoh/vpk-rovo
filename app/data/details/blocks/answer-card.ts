import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ANSWER_CARD_DETAIL: ComponentDetail = {
		description: "Displays captured question/answer pairs as a compact summary card. Typically rendered after a user submits answers to a QuestionCard.",
		demoLayout: { previewHeight: "default" },
		usage: `import { AnswerCard } from "@/components/blocks/answer-card/page";
import type { AnswerCardRow } from "@/components/blocks/answer-card/page";

const rows: AnswerCardRow[] = [
  { question: "What type of data?", answer: "Product metrics" },
  { question: "Which chart types?", answer: "Line and bar" },
];

<AnswerCard rows={rows} />
<AnswerCard label="Your answers" rows={rows} />`,
		props: [
			{
				name: "rows",
				type: "ReadonlyArray<AnswerCardRow>",
				required: true,
				description: "Ordered list of question/answer pairs to display.",
			},
			{
				name: "label",
				type: "string",
				default: '"Your answers"',
				description: "Header label displayed in the card header.",
			},
			{
				name: "defaultCollapsed",
				type: "boolean",
				default: "false",
				description: "Whether the card starts in a collapsed state.",
			},
		],
	};
