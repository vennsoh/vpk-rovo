import type { ComponentDetail } from "@/app/data/component-detail-types";

export const STACK_TRACE_DETAIL: ComponentDetail = {
	description:
		"A compound component for displaying parsed JavaScript/Node.js error stack traces with collapsible frames, clickable file paths, internal-frame dimming, and copy-to-clipboard. Parses raw stack trace strings into structured error type, message, and frame data.",
	usage: `import {
  StackTrace,
  StackTraceHeader,
  StackTraceError,
  StackTraceErrorType,
  StackTraceErrorMessage,
  StackTraceActions,
  StackTraceCopyButton,
  StackTraceExpandButton,
  StackTraceContent,
  StackTraceFrames,
} from "@/components/ui-custom/stack-trace";

<StackTrace trace={errorString} defaultOpen>
  <StackTraceHeader>
    <StackTraceError>
      <StackTraceErrorType />
      <StackTraceErrorMessage />
    </StackTraceError>
    <StackTraceActions>
      <StackTraceCopyButton />
      <StackTraceExpandButton />
    </StackTraceActions>
  </StackTraceHeader>
  <StackTraceContent>
    <StackTraceFrames />
  </StackTraceContent>
</StackTrace>`,
	props: [
		{
			name: "trace",
			type: "string",
			required: true,
			description: "Raw stack trace string to parse and display.",
		},
		{
			name: "open",
			type: "boolean",
			description: "Controlled open/closed state for the collapsible frames section.",
		},
		{
			name: "defaultOpen",
			type: "boolean",
			default: "false",
			description: "Initial open state when uncontrolled.",
		},
		{
			name: "onOpenChange",
			type: "(open: boolean) => void",
			description: "Callback fired when the collapse state changes.",
		},
		{
			name: "onFilePathClick",
			type: "(path: string, line?: number, column?: number) => void",
			description: "Callback when a file path in a stack frame is clicked. Enables clickable file paths for IDE integration.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional CSS classes applied to the root container.",
		},
	],
	subComponents: [
		{ name: "StackTrace", description: "Root provider and container. Parses the raw trace string and supplies context to all sub-components." },
		{ name: "StackTraceHeader", description: "Clickable header row that toggles the collapsible content. Wraps CollapsibleTrigger." },
		{ name: "StackTraceError", description: "Flex container for the error icon, type, and message." },
		{ name: "StackTraceErrorType", description: "Displays the parsed error type (e.g., 'TypeError'). Falls back to context value when no children provided." },
		{ name: "StackTraceErrorMessage", description: "Displays the parsed error message text. Falls back to context value when no children provided." },
		{ name: "StackTraceActions", description: "Container for action buttons with click/keydown event isolation." },
		{ name: "StackTraceCopyButton", description: "Copies the full raw stack trace to clipboard with animated check icon feedback." },
		{ name: "StackTraceExpandButton", description: "Chevron icon that rotates to indicate expand/collapse state." },
		{ name: "StackTraceContent", description: "Collapsible content area with max-height scroll and fade animations." },
		{ name: "StackTraceFrames", description: "Renders parsed stack frames with function names, clickable file paths, and dimmed internal (node_modules/node:) frames." },
	],
	examples: [
		{ title: "Expanded", description: "Stack trace with frames visible by default.", demoSlug: "stack-trace-demo-open" },
		{ title: "Filter internals", description: "Hides node_modules and Node.js internal frames.", demoSlug: "stack-trace-demo-filter-internals" },
		{ title: "Clickable paths", description: "File paths trigger a callback for IDE integration.", demoSlug: "stack-trace-demo-clickable" },
	],
};
