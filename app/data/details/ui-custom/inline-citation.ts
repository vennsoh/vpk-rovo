import type { ComponentDetail } from "@/app/data/component-detail-types";

export const INLINE_CITATION_DETAIL: ComponentDetail = {
	description:
		"An inline citation system for AI-generated text that displays source references as hover-triggered badges with a carousel of source details, quotes, and descriptions.",
	usage: `import {
  InlineCitation,
  InlineCitationText,
  InlineCitationCard,
  InlineCitationCardTrigger,
  InlineCitationCardBody,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselHeader,
  InlineCitationCarouselItem,
  InlineCitationCarouselIndex,
  InlineCitationCarouselButtons,
  InlineCitationCarouselPrev,
  InlineCitationCarouselNext,
  InlineCitationSource,
  InlineCitationQuote,
} from "@/components/ui-custom/inline-citation";

<InlineCitation>
  <InlineCitationText>React uses a virtual DOM</InlineCitationText>
  <InlineCitationCard>
    <InlineCitationCardTrigger sources={["https://react.dev"]} />
    <InlineCitationCardBody>
      <InlineCitationCarousel>
        <InlineCitationCarouselContent>
          <InlineCitationCarouselItem>
            <InlineCitationSource
              title="React Docs"
              url="https://react.dev"
              description="Official React documentation."
            />
          </InlineCitationCarouselItem>
        </InlineCitationCarouselContent>
      </InlineCitationCarousel>
    </InlineCitationCardBody>
  </InlineCitationCard>
</InlineCitation>`,
	props: [
		{
			name: "sources",
			type: "string[]",
			required: true,
			description: "Array of source URLs displayed on InlineCitationCardTrigger. The first URL hostname is shown as the badge label; additional sources show as a +N count.",
		},
		{
			name: "title",
			type: "string",
			description: "Source title displayed in InlineCitationSource.",
		},
		{
			name: "url",
			type: "string",
			description: "Source URL displayed in InlineCitationSource.",
		},
		{
			name: "description",
			type: "string",
			description: "Brief source description displayed in InlineCitationSource.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional CSS classes applied to any sub-component.",
		},
	],
	subComponents: [
		{ name: "InlineCitation", description: "Root inline container grouping text and citation badge." },
		{ name: "InlineCitationText", description: "Text span that highlights on group hover." },
		{ name: "InlineCitationCard", description: "HoverCard wrapper managing open/close with zero delay." },
		{ name: "InlineCitationCardTrigger", description: "Badge trigger showing hostname and source count from the sources prop." },
		{ name: "InlineCitationCardBody", description: "HoverCard content panel (w-80, no padding)." },
		{ name: "InlineCitationCarousel", description: "Carousel wrapper with internal API context for multi-source navigation." },
		{ name: "InlineCitationCarouselContent", description: "Carousel content container." },
		{ name: "InlineCitationCarouselItem", description: "Individual carousel slide for a single source." },
		{ name: "InlineCitationCarouselHeader", description: "Navigation header with prev/next buttons and index indicator." },
		{ name: "InlineCitationCarouselIndex", description: "Position indicator displaying current/total (e.g., 1/3)." },
		{ name: "InlineCitationCarouselButtons", description: "ButtonGroup wrapper that joins the prev/next navigation arrows into a connected control." },
		{ name: "InlineCitationCarouselPrev", description: "Previous source navigation button." },
		{ name: "InlineCitationCarouselNext", description: "Next source navigation button." },
		{ name: "InlineCitationSource", description: "Source metadata display with title, URL, and description." },
		{ name: "InlineCitationQuote", description: "Blockquote for source excerpts with left border styling." },
	],
	examples: [
		{ title: "With carousel", description: "Multi-source citation with carousel navigation, descriptions, and a quote.", demoSlug: "inline-citation-demo-with-carousel" },
		{ title: "Basic", description: "Minimal inline citation badge without hover card body.", demoSlug: "inline-citation-demo-basic" },
		{ title: "Multiple citations", description: "Paragraph with two separate inline citations referencing different topics.", demoSlug: "inline-citation-demo-multiple" },
		{ title: "Single source", description: "Single-source citation with description and quote excerpt.", demoSlug: "inline-citation-demo-single-source" },
	],
};
