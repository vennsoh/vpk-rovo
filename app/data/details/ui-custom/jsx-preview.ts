import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JSX_PREVIEW_DETAIL: ComponentDetail = {
	description:
		"Renders JSX strings dynamically using react-jsx-parser, supporting streaming scenarios where JSX may be incomplete. Automatically closes unclosed tags during streaming and supports custom component injection and error handling.",
	usage: `import {
  JSXPreview,
  JSXPreviewContent,
  JSXPreviewError,
} from "@/components/ui-custom/jsx-preview";

<JSXPreview jsx={jsxString} isStreaming={isStreaming} components={{ Button }}>
  <JSXPreviewContent />
  <JSXPreviewError />
</JSXPreview>`,
	props: [
		{
			name: "jsx",
			type: "string",
			required: true,
			description: "The JSX string to render.",
		},
		{
			name: "isStreaming",
			type: "boolean",
			default: "false",
			description: "When true, auto-completes unclosed tags so partial JSX renders safely during streaming.",
		},
		{
			name: "components",
			type: "Record<string, React.ComponentType>",
			description: "Custom components available within the rendered JSX scope.",
		},
		{
			name: "bindings",
			type: "Record<string, unknown>",
			description: "Variables and functions available within the JSX execution scope.",
		},
		{
			name: "onError",
			type: "(error: Error) => void",
			description: "Callback when parsing or rendering fails.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root container.",
		},
	],
	subComponents: [
		{ name: "JSXPreview", description: "Root provider with JSX processing, tag completion, and error state management." },
		{ name: "JSXPreviewContent", description: "Renders the parsed JSX output via react-jsx-parser with error deduplication." },
		{ name: "JSXPreviewError", description: "Displays error information when parsing fails. Accepts static children or a render function receiving the Error object." },
	],
	examples: [
		{ title: "Basic", description: "Static JSX string rendered dynamically.", demoSlug: "jsx-preview-demo-basic" },
		{ title: "Streaming", description: "Simulated streaming with automatic tag completion for partial JSX.", demoSlug: "jsx-preview-demo-streaming" },
		{ title: "Custom components", description: "Injecting shadcn Badge components into the JSX render scope.", demoSlug: "jsx-preview-demo-with-components" },
		{ title: "Error state", description: "Default error display when JSX references an unknown component.", demoSlug: "jsx-preview-demo-with-error" },
		{ title: "Custom error", description: "Custom error content with styled warning appearance.", demoSlug: "jsx-preview-demo-custom-error" },
	],
};
