import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PROMPT_INPUT_DETAIL: ComponentDetail = {
	description:
		"A composable AI prompt composer built on a tiptap rich-text editor, with an inline `/` (skills) and `@` (mentions) palette, Enter-to-submit semantics, action menus, model/tool controls, file attachments, and provider-based external control. Typing `/` or `@` opens the command palette; selections insert non-editable inline reference tokens (pills) while the serialized text stays a plain string for `onSubmit`/`value`/`onChange`. The catalog backing the palette is configurable via the `mentionSources` prop and defaults to the unified editor-palette directory.",
	usage: `import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputSubmit,
} from "@/components/ui-custom/prompt-input";
import AddIcon from "@atlaskit/icon/core/add";

<PromptInput onSubmit={({ text, files }) => sendMessage({ text, files })}>
  <PromptInputBody>
    {/* Type "/" for skills or "@" to mention. Pass mentionSources to scope the palette. */}
    <PromptInputTextarea placeholder="Ask, @mention, or / for skills" rows={1} />
  </PromptInputBody>
  <PromptInputFooter className="justify-between px-1">
    <PromptInputTools>
      <PromptInputActionMenu>
        <PromptInputActionMenuTrigger aria-label="Add">
          <AddIcon label="" />
        </PromptInputActionMenuTrigger>
        <PromptInputActionMenuContent>
          <PromptInputActionMenuItem>Add context</PromptInputActionMenuItem>
        </PromptInputActionMenuContent>
      </PromptInputActionMenu>
    </PromptInputTools>
    <PromptInputSubmit />
  </PromptInputFooter>
</PromptInput>`,
	props: [
		{
			name: "onSubmit",
			type: '(message: { text: string; files: FileUIPart[] }, event: FormEvent<HTMLFormElement>) => void | Promise<void>',
			required: true,
			description: "Submit handler for the composed message. Supports sync and async flows.",
		},
		{
			name: "accept",
			type: "string",
			description: "Optional file MIME filter for uploads (for example, 'image/*,application/pdf').",
		},
		{
			name: "multiple",
			type: "boolean",
			default: "false",
			description: "Allow selecting multiple files from the file picker.",
		},
		{
			name: "globalDrop",
			type: "boolean",
			default: "false",
			description: "When true, file drag-and-drop is captured at the document level.",
		},
		{
			name: "maxFiles",
			type: "number",
			description: "Maximum number of files accepted by the composer.",
		},
		{
			name: "maxFileSize",
			type: "number",
			description: "Maximum file size in bytes for each uploaded file.",
		},
		{
			name: "onError",
			type: '(error: { code: \"max_files\" | \"max_file_size\" | \"accept\"; message: string }) => void',
			description: "Validation callback for file acceptance/size/count failures.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the form wrapper.",
		},
		{
			name: "variant",
			type: '"default" | "floating"',
			default: '"default"',
			description: 'Visual variant. "floating" applies rounded border, input background, padding, and elevated shadow for overlay use.',
		},
		{
			name: "mentionSources",
			type: "RichTextMentionSources",
			description: "PromptInputTextarea prop. Catalog backing the inline `/` and `@` palette. Defaults to the unified editor-palette catalog built from the app directory; pass a custom catalog to scope skills/mentions per surface.",
		},
		{
			name: "onEditorReady",
			type: "(editor: Editor) => void",
			description: "PromptInputTextarea prop. Called once the tiptap editor mounts. Use it (or the forwarded ref, which points at the contentEditable DOM) to drive focus or measurement.",
		},
	],
	subComponents: [
		{ name: "PromptInputProvider", description: "Optional provider for externally controlled text input and attachments." },
		{ name: "PromptInputBody", description: "Body slot that wraps the main textarea input region." },
		{ name: "PromptInputTextarea", description: "Rich-text composer (tiptap) with Enter-to-submit, an inline `/` (skills) + `@` (mentions) palette, inline reference pills, and a configurable `mentionSources` catalog. Serializes to a plain string for `value`/`onChange`/`onSubmit`." },
		{ name: "PromptInputHeader", description: "Top aligned addon row for tabs, modes, or context chips." },
		{ name: "PromptInputFooter", description: "Bottom aligned addon row for tools and submit actions." },
		{ name: "PromptInputTools", description: "Inline tools container commonly used inside PromptInputFooter." },
		{ name: "PromptInputButton", description: "Action button primitive with optional tooltip support." },
		{ name: "PromptInputActionMenu", description: "Dropdown menu container for add/context actions." },
		{ name: "PromptInputActionMenuTrigger", description: "Menu trigger button specialized for PromptInput actions." },
		{ name: "PromptInputActionMenuContent", description: "Menu content panel aligned for prompt actions." },
		{ name: "PromptInputActionMenuItem", description: "Individual menu item for quick prompt actions." },
		{ name: "PromptInputActionAddAttachments", description: "Prebuilt menu item that opens the file picker." },
		{ name: "PromptInputSelect", description: "Select wrapper for model/reasoning/verbosity controls." },
		{ name: "PromptInputSubmit", description: "Submit/stop button with chat status-aware icon states." },
	],
	examples: [
		{ title: "Chat Composer style", description: "Rovo-style composer with the inline / (skills) and @ (mentions) palette, add menu, customize popover, reasoning selector, and live-chat action rail that reveals AI cursor while voice is active. Type / or @ in the input to open the palette.", demoSlug: "prompt-input-demo-chat-composer" },
		{ title: "Floating bar", description: 'Uses variant="floating" for a minimal single-line input with elevated shadow, ideal for overlaying on content areas.', demoSlug: "prompt-input-demo-floating-bar" },
		{ title: "Floating bar — experimental dark CTA", description: "The floating bar with the experimental dark/black CTA button (neutral-bold background, inverse icon) used in the Studio composer. The dark styling applies to both the submit and start-live-voice states; type to see the submit variant.", demoSlug: "prompt-input-demo-floating-bar-dark-cta" },
	],
};
