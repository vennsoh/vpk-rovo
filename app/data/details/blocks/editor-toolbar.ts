import type { ComponentDetail } from "@/app/data/component-detail-types";

export const EDITOR_TOOLBAR_DETAIL: ComponentDetail = {
		description: "Reusable rich text editor toolbar with text style, formatting, list, alignment, link, add-content, rendered/Markdown mode tabs, and slot controls for Tiptap editor surfaces.",
		importStatement: `import { EditorToolbar } from "@/components/blocks/editor-toolbar";`,
		usage: `import { EditorToolbar } from "@/components/blocks/editor-toolbar";
import type { Editor } from "@tiptap/react";

function FormattingToolbar({ editor }: { editor: Editor }) {
  return <EditorToolbar editor={editor} />;
}`,
		demoLayout: { previewHeight: "default" },
		props: [
			{
				name: "editor",
				type: "Editor",
				required: true,
				description: "Tiptap editor instance that receives formatting commands and reports active selection state.",
			},
			{
				name: "className",
				type: "string",
				description: "Optional class names applied to the toolbar root.",
			},
			{
				name: "controlsClassName",
				type: "string",
				description: "Optional class names applied to the inner controls row.",
			},
			{
				name: "leadingSlot",
				type: "ReactNode",
				description: "Optional content rendered before the toolbar controls.",
			},
			{
				name: "endSlot",
				type: "ReactNode",
				description: "Optional content rendered at the end of the toolbar before the rendered/Markdown mode tabs.",
			},
			{
				name: "isMarkdownMode",
				type: "boolean",
				default: "false",
				description: "Marks the toolbar as controlling a Markdown source editor instead of the rendered Tiptap document.",
			},
			{
				name: "onToggleMarkdownMode",
				type: "() => void",
				description: "Called when the rendered/Markdown mode tabs request a mode change. When omitted, the mode tabs are hidden.",
			},
			{
				name: "onMarkdownFormat",
				type: "(kind: MarkdownFormatKind) => void",
				description: "Called for formatting actions while Markdown source mode is active.",
			},
		],
	};
