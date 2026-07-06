import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CODE_BLOCK_DETAIL: ComponentDetail = {
	description:
		"An ADS-aligned syntax-highlighted code block using Shiki with copy-to-clipboard, download, line numbers, and optional language selection.",
	adsUrl: "https://atlassian.design/components/code/code-block/",
	usage: `import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
  CodeBlockTitle,
} from "@/components/ui-custom/code-block";

<CodeBlock code={codeString} language="typescript" showLineNumbers>
  <CodeBlockHeader>
    <CodeBlockTitle>
      <CodeBlockFilename>example.ts</CodeBlockFilename>
    </CodeBlockTitle>
    <CodeBlockActions>
      <CodeBlockDownloadButton />
      <CodeBlockCopyButton />
    </CodeBlockActions>
  </CodeBlockHeader>
</CodeBlock>`,
	props: [
		{
			name: "code",
			type: "string",
			required: true,
			description: "The code string to highlight and display.",
		},
		{
			name: "language",
			type: "BundledLanguage",
			required: true,
			description: "Programming language for syntax highlighting.",
		},
		{
			name: "showLineNumbers",
			type: "boolean",
			default: "false",
			description: "Show line numbers in the gutter.",
		},
		{
			name: "size",
			type: "\"default\" | \"sm\"",
			default: "\"default\"",
			description: "Controls code text size. Use `sm` for 12px code text; default renders 14px.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the outer container.",
		},
	],
	subComponents: [
		{ name: "CodeBlockContainer", description: "Wrapper with language data attribute." },
		{ name: "CodeBlockHeader", description: "Top bar for metadata and actions." },
		{ name: "CodeBlockTitle", description: "Title section in the header." },
		{ name: "CodeBlockFilename", description: "Filename display in the header." },
		{ name: "CodeBlockActions", description: "Container for action buttons." },
		{ name: "CodeBlockContent", description: "Syntax-highlighted code area." },
		{ name: "CodeBlockCopyButton", description: "Copy to clipboard button." },
		{ name: "CodeBlockDownloadButton", description: "Download raw code with a language-appropriate filename." },
		{ name: "CodeBlockLanguageSelector", description: "Select wrapper for choosing code language." },
	],
	examples: [
		{ title: "ADS basic", description: "Standard code block with filename and copy action.", demoSlug: "code-block-demo-ads-basic" },
		{ title: "Small font", description: "Code block with 12px code text for dense surfaces.", demoSlug: "code-block-demo-ads-small" },
		{ title: "ADS line numbers", description: "Code block with gutter line numbers for review workflows.", demoSlug: "code-block-demo-ads-line-numbers" },
		{ title: "ADS shell output", description: "Terminal-style command snippets following ADS usage.", demoSlug: "code-block-demo-ads-shell" },
		{ title: "ADS language selector", description: "Switch between languages in a single code block surface.", demoSlug: "code-block-demo-ads-language-selector" },
	],
};
