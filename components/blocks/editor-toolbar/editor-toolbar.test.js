const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Editor toolbar is exposed as a website block", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\("editor-toolbar", "Editor toolbar"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\("editor-toolbar", "Editor toolbar"\)/u,
	);
	assert.match(
		readDetailCategorySource("blocks"),
		/import \{ EditorToolbar \} from "@\/components\/blocks\/editor-toolbar";/u,
	);
	assert.match(
		readWebsiteRegistrySource(),
		/"editor-toolbar": dynamic\(\(\) => import\("\.\/demos\/blocks\/editor-toolbar-demo"\)/u,
	);
});

test("Editor toolbar block exports the public component and props", () => {
	const indexSource = readProjectFile("components/blocks/editor-toolbar/index.ts");
	const componentSource = readProjectFile("components/blocks/editor-toolbar/components/editor-toolbar.tsx");

	assert.match(indexSource, /export \{ EditorToolbar \} from "\.\/components\/editor-toolbar";/u);
	assert.match(indexSource, /export type \{ EditorToolbarInsertReferenceCategory, EditorToolbarProps, EditorToolbarViewMode \} from "\.\/components\/editor-toolbar";/u);
	assert.match(componentSource, /export interface EditorToolbarProps/u);
	assert.match(componentSource, /export function EditorToolbar/u);
	assert.match(componentSource, /endSlot\?: ReactNode;/u);
	assert.match(componentSource, /controlsOverflow\?: "responsive" \| "fixed";/u);
	assert.match(componentSource, /onMarkdownFormat\?: \(kind: MarkdownFormatKind\) => void;/u);
});

test("RichTextEditorToolbar remains as a compatibility wrapper", () => {
	const richToolbarSource = readProjectFile("components/ui-custom/rich-text-editor/toolbar.tsx");

	assert.match(
		richToolbarSource,
		/import \{\s*EditorToolbar,\s*type EditorToolbarProps,?\s*\} from "@\/components\/blocks\/editor-toolbar";/u,
	);
	assert.match(richToolbarSource, /export type RichTextEditorToolbarProps = EditorToolbarProps;/u);
	assert.match(
		richToolbarSource,
		/export function RichTextEditorToolbar\([\s\S]*return <EditorToolbar \{\.\.\.props\} \/>;/u,
	);
	assert.match(richToolbarSource, /<BubbleMenu[\s\S]*<EditorToolbar[\s\S]*controlsOverflow="fixed"[\s\S]*controlsClassName="pl-1 pr-2 py-1"/u);
	assert.match(richToolbarSource, /<FloatingMenu[\s\S]*<EditorToolbar[\s\S]*controlsOverflow="fixed"[\s\S]*controlsClassName="px-2 py-1"/u);
	assert.match(richToolbarSource, /<EditorToolbar[\s\S]*controlsClassName="px-2 py-1"/u);
});

test("Editor toolbar demo renders the block directly", () => {
	const pageSource = readProjectFile("components/blocks/editor-toolbar/page.tsx");
	const demoSource = readProjectFile("components/website/demos/blocks/editor-toolbar-demo.tsx");

	assert.match(pageSource, /import \{ EditorToolbar \} from "@\/components\/blocks\/editor-toolbar";/u);
	assert.doesNotMatch(pageSource, /import \{ Button \} from "@\/components\/ui\/button";/u);
	assert.match(pageSource, /createRichTextEditorExtensions\(\)/u);
	assert.doesNotMatch(pageSource, />\s*Saved\s*</u);
	assert.match(demoSource, /import EditorToolbarPage from "@\/components\/blocks\/editor-toolbar\/page";/u);
	assert.match(demoSource, /<EditorToolbarPage \/>/u);
});

test("Editor toolbar demo exposes the Markdown source mode", () => {
	const pageSource = readProjectFile("components/blocks/editor-toolbar/page.tsx");

	assert.match(pageSource, /useState\(false\)/u);
	assert.match(pageSource, /const \[markdownSource, setMarkdownSource\] = useState\(""\);/u);
	assert.match(pageSource, /applyMarkdownFormat/u);
	assert.match(pageSource, /function handleToggleMarkdownMode\(\): void/u);
	assert.match(pageSource, /isMarkdownMode=\{isMarkdownMode\}/u);
	assert.match(pageSource, /onToggleMarkdownMode=\{handleToggleMarkdownMode\}/u);
	assert.match(pageSource, /onMarkdownFormat=\{handleMarkdownFormat\}/u);
	assert.match(pageSource, /aria-label="Editor toolbar demo Markdown source"/u);
});

test("Editor toolbar exposes block inserts and an Add content reference dropdown", () => {
	const componentSource = readProjectFile("components/blocks/editor-toolbar/components/editor-toolbar.tsx");
	const vpkIconsSource = readProjectFile("components/ui/vpk-icons.tsx");

	assert.match(componentSource, /import AddIcon from "@atlaskit\/icon\/core\/add";/u);
	assert.match(componentSource, /import \{ Tabs, TabsList, TabsTrigger \} from "@\/components\/ui\/tabs";/u);
	assert.match(componentSource, /import \{ TextNormalIcon \} from "@\/components\/ui\/vpk-icons";/u);
	assert.match(vpkIconsSource, /import TextNormalIconGlyph from "@atlaskit\/icon-lab\/core\/text-normal";/u);
	assert.match(vpkIconsSource, /export const TextNormalIcon = createUnsafeVpkIcon\(TextNormalIconGlyph\);/u);
	assert.doesNotMatch(vpkIconsSource, /TextNormalIcon = createUnsafeVpkIcon\(TextIconGlyph\)/u);
	assert.match(componentSource, /function handleAddContent\(\): void/u);
	assert.match(componentSource, /aria-label="Add content"[\s\S]*onClick=\{handleAddContent\}/u);
	// Code block, Horizontal rule, and Table are exposed directly on the toolbar
	// as dedicated controls. Code block toggles (and is removed from the text
	// style dropdown); there is no separate Paragraph control because "Normal
	// text" already sets a paragraph.
	assert.match(componentSource, /aria-label="Code block"[\s\S]*onPressedChange=\{handleToggleCodeBlock\}/u);
	assert.match(componentSource, /import AngleBracketsIcon from "@atlaskit\/icon\/core\/angle-brackets";/u);
	assert.match(componentSource, /aria-label="Table"[\s\S]*onClick=\{handleInsertTable\}/u);
	assert.match(componentSource, /aria-label="Horizontal rule"[\s\S]*onClick=\{handleInsertHorizontalRule\}/u);
	assert.doesNotMatch(componentSource, /aria-label="Paragraph"/u);
	// Code block must no longer be selectable from the text style dropdown.
	assert.doesNotMatch(componentSource, /label="Code block"\s*\n\s*isSelected=\{editor\.isActive\("codeBlock"\)\}/u);
	// The `+` button is wrapped in a positioned, pinned anchor div (it never
	// folds) so it can anchor the Insert dropdown, which offers reference
	// categories (Knowledge / Tools / Skills / Subagents) inserted as mention
	// tokens at the caret. When the toolbar is space-constrained, foldable
	// control groups collapse into this same dropdown above the references.
	assert.match(componentSource, /<LinkIcon label="" size="small" \/>\s*<\/Toggle>[\s\S]*<div data-toolbar-anchor[^>]*>[\s\S]*<Button[\s\S]*<AddIcon label="" size="small" \/>[\s\S]*<\/Button>[\s\S]*<\/div>/u);
	// Foldable groups are measured and collapse into the "+" dropdown via the
	// overflow hook; the anchored "+" group carries the marker attribute.
	assert.match(componentSource, /useToolbarOverflow/u);
	assert.match(componentSource, /const foldsControls = controlsOverflow === "responsive";/u);
	assert.match(componentSource, /const visibleCount = foldsControls \? measuredVisibleCount : FOLDABLE_GROUP_COUNT;/u);
	assert.match(componentSource, /data-toolbar-group/u);
	assert.match(componentSource, /data-toolbar-anchor/u);
	assert.match(componentSource, /function handleInsertReference\(/u);
	assert.match(componentSource, /\.focus\(\)\s*\.insertContent\(\[\s*\{\s*type: "mention"/u);
	assert.match(componentSource, /import \{ RICH_TEXT_REFERENCE_CATEGORY_OPTIONS \} from "@\/components\/ui-custom\/rich-text-editor\/reference-categories";/u);
	assert.match(componentSource, /type InsertReferenceCategory = RichTextReferenceCategory;/u);
	assert.match(componentSource, /\{RICH_TEXT_REFERENCE_CATEGORY_OPTIONS\.map\(\(option\) => \(/u);
	assert.doesNotMatch(componentSource, /label: "Memory"|category: "memory"|AiModelIcon/u);
	assert.doesNotMatch(componentSource, /<\/div>\s*<ToolbarSeparator \/>\s*\{onToggleMarkdownMode/u);
	assert.match(componentSource, /\{endSlot \|\| showModeTabs \? \(\s*<div className="flex shrink-0 items-center gap-2">[\s\S]*\{endSlot\}[\s\S]*<Tabs[\s\S]*value=\{currentMode\}/u);
	assert.match(componentSource, /<TabsTrigger[\s\S]*aria-label="Rendered text"[\s\S]*value="rendered"[\s\S]*<TextNormalIcon size="small" \/>[\s\S]*<TabsTrigger[\s\S]*aria-label="Markdown source"[\s\S]*value="markdown"[\s\S]*<MarkdownIcon label="" size="small" \/>/u);
	assert.doesNotMatch(componentSource, />\s*Rendered\s*</u);
	assert.doesNotMatch(componentSource, />\s*Markdown\s*</u);
});
