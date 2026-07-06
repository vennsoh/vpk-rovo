import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TERMINAL_DETAIL: ComponentDetail = {
	description:
		"A composable terminal output display with ANSI color support, streaming indicators, auto-scroll, copy-to-clipboard, and clear functionality. Uses ansi-to-react for escape sequence parsing (256 colors, bold, italic, underline).",
	usage: `import {
  Terminal,
  TerminalHeader,
  TerminalTitle,
  TerminalStatus,
  TerminalActions,
  TerminalCopyButton,
  TerminalClearButton,
  TerminalContent,
} from "@/components/ui-custom/terminal";

<Terminal output={output} isStreaming={isStreaming} onClear={handleClear}>
  <TerminalHeader>
    <TerminalTitle />
    <TerminalActions>
      <TerminalCopyButton />
      <TerminalClearButton />
    </TerminalActions>
  </TerminalHeader>
  <TerminalContent />
</Terminal>`,
	props: [
		{
			name: "output",
			type: "string",
			required: true,
			description: "Terminal output text. Supports ANSI escape sequences for color and formatting.",
		},
		{
			name: "isStreaming",
			type: "boolean",
			default: "false",
			description: "When true, shows a streaming status indicator and blinking cursor.",
		},
		{
			name: "autoScroll",
			type: "boolean",
			default: "true",
			description: "Auto-scroll to bottom when new output arrives.",
		},
		{
			name: "onClear",
			type: "() => void",
			description: "Callback to clear output. When provided, enables the clear button.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root container.",
		},
		{
			name: "children",
			type: "ReactNode",
			description: "Custom compound composition. Falls back to default layout with header, status, actions, and content.",
		},
	],
	subComponents: [
		{ name: "Terminal", description: "Root container and context provider. Renders default header + content layout when no children are provided." },
		{ name: "TerminalHeader", description: "Flex header row with border-bottom separator." },
		{ name: "TerminalTitle", description: "Title with terminal icon. Renders 'Terminal' by default, accepts custom children." },
		{ name: "TerminalStatus", description: "Streaming status indicator using Shimmer. Only visible when isStreaming is true." },
		{ name: "TerminalActions", description: "Flex container for action buttons (copy, clear)." },
		{
			name: "TerminalCopyButton",
			description: "Copy-to-clipboard button with animated check icon on success.",
			props: [
				{ name: "onCopy", type: "() => void", description: "Callback after successful copy." },
				{ name: "onError", type: "(error: Error) => void", description: "Callback if copying fails." },
				{ name: "timeout", type: "number", default: "2000", description: "Duration to show copied state in milliseconds." },
			],
		},
		{ name: "TerminalClearButton", description: "Clear button that calls onClear from context. Only renders when onClear is provided." },
		{ name: "TerminalContent", description: "Scrollable output area with monospace font and ANSI rendering. Shows blinking cursor when streaming." },
	],
	examples: [
		{ title: "Streaming", description: "Simulated streaming output with line-by-line rendering and blinking cursor.", demoSlug: "terminal-demo-streaming" },
		{ title: "Clearable", description: "Terminal with clear button to reset output.", demoSlug: "terminal-demo-clearable" },
		{ title: "Composed", description: "Custom compound composition with custom title and explicit sub-component layout.", demoSlug: "terminal-demo-composed" },
		{ title: "ANSI colors", description: "Terminal output with ANSI escape sequences for colored git status.", demoSlug: "terminal-demo-ansi" },
	],
};
