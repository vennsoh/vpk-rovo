import type { ComponentDetail } from "@/app/data/component-detail-types";

export const FOOTER_DETAIL: ComponentDetail = {
	description:
		"A compact footer bar with an information icon and customizable text. Place below prompt inputs or chat composers to communicate AI usage or other contextual information.",
	usage: `import { Footer } from "@/components/ui-custom/footer";

<Footer />

<Footer>AI-generated content may contain errors.</Footer>

<Footer hideIcon>Uses AI. Verify results.</Footer>`,
	props: [
		{
			name: "children",
			type: "ReactNode",
			default: '"Uses AI. Verify results."',
			description:
				"Custom footer text. Falls back to the default message when omitted.",
		},
		{
			name: "hideIcon",
			type: "boolean",
			default: "false",
			description: "When true, hides the information circle icon.",
		},
	],
	examples: [
		{ title: "Default", demoSlug: "footer-demo-default" },
		{
			title: "Custom text",
			description: "Footer with custom message text.",
			demoSlug: "footer-demo-custom-text",
		},
		{
			title: "Without icon",
			description: "Footer with the icon hidden.",
			demoSlug: "footer-demo-no-icon",
		},
		{
			title: "Keyboard hints",
			description:
				"Footer used for keyboard shortcut hints below question cards.",
			demoSlug: "footer-demo-keyboard-hints",
		},
	],
};
