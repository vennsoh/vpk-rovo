import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CONTEXT_DETAIL: ComponentDetail = {
	description:
		"A context window usage indicator that displays token consumption as a circular progress icon with a hover card breakdown of input, output, reasoning, and cache tokens with cost estimates powered by tokenlens.",
	usage: `import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextContentBody,
  ContextContentFooter,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextCacheUsage,
} from "@/components/ui-custom/context";

<Context
  maxTokens={128_000}
  usedTokens={21_490}
  usage={usage}
  modelId="openai:gpt-4o"
>
  <ContextTrigger />
  <ContextContent>
    <ContextContentHeader />
    <ContextContentBody>
      <ContextInputUsage />
      <ContextOutputUsage />
      <ContextReasoningUsage />
      <ContextCacheUsage />
    </ContextContentBody>
    <ContextContentFooter />
  </ContextContent>
</Context>`,
	props: [
		{
			name: "maxTokens",
			type: "number",
			required: true,
			description: "Total context window size in tokens.",
		},
		{
			name: "usedTokens",
			type: "number",
			required: true,
			description: "Currently consumed tokens.",
		},
		{
			name: "usage",
			type: "LanguageModelUsage",
			description: "AI SDK usage object with inputTokens, outputTokens, reasoningTokens, and cachedInputTokens breakdown.",
		},
		{
			name: "modelId",
			type: "string",
			description: "Model identifier for cost estimation via tokenlens (e.g., 'openai:gpt-4o').",
		},
	],
	subComponents: [
		{ name: "Context", description: "Root provider wrapping a HoverCard. Supplies token data to all children via React Context." },
		{ name: "ContextTrigger", description: "Ghost button showing usage percentage and a circular progress icon. Activates the hover card." },
		{ name: "ContextContent", description: "HoverCard content container with divided sections." },
		{ name: "ContextContentHeader", description: "Percentage label, compact token counts, and progress bar." },
		{ name: "ContextContentBody", description: "Container for usage breakdown rows." },
		{ name: "ContextContentFooter", description: "Total cost display computed from modelId via tokenlens." },
		{ name: "ContextInputUsage", description: "Input token count and cost row. Hidden when zero." },
		{ name: "ContextOutputUsage", description: "Output token count and cost row. Hidden when zero." },
		{ name: "ContextReasoningUsage", description: "Reasoning token count and cost row. Hidden when zero." },
		{ name: "ContextCacheUsage", description: "Cached input token count and cost row. Hidden when zero." },
	],
	examples: [
		{ title: "With cost", description: "Full context breakdown with input, output, reasoning, cache tokens and cost.", demoSlug: "context-demo-with-cost" },
		{ title: "Minimal", description: "Percentage and progress bar without usage breakdown or cost.", demoSlug: "context-demo-minimal" },
		{ title: "High usage", description: "Near-capacity context window showing 96% usage.", demoSlug: "context-demo-high-usage" },
		{ title: "Custom trigger", description: "Custom trigger text replacing the default percentage and icon.", demoSlug: "context-demo-custom-trigger" },
	],
};
