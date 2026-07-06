const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const COMPOSER_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-composer.tsx"), "utf8");
const CARD_BODY_SOURCE = fs.readFileSync(path.join(__dirname, "composer-card-body.tsx"), "utf8");
const FLOATING_BODY_SOURCE = fs.readFileSync(path.join(__dirname, "composer-floating-body.tsx"), "utf8");
const FLOATING_COMPOSER_SOURCE = fs.readFileSync(path.join(__dirname, "floating-composer.tsx"), "utf8");
const SEND_CONTROLS_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-composer-send-controls.tsx"), "utf8");
const LIVE_WAVEFORM_SOURCE = fs.readFileSync(path.join(__dirname, "../../../ui-audio/live-waveform.tsx"), "utf8");
const COMPOSER_EXTENSIONS_SOURCE = fs.readFileSync(path.join(__dirname, "../../../ui-custom/rich-text-editor/composer-extensions.ts"), "utf8");
const PROMPT_INPUT_SOURCE = fs.readFileSync(path.join(__dirname, "../../../ui-custom/prompt-input.tsx"), "utf8");
const VISUAL_TRACE_AUTO_TAGGING_SOURCE = fs.readFileSync(path.join(__dirname, "../../../ui-custom/rich-text-editor/use-composer-visual-trace-auto-tagging.ts"), "utf8");
const RICH_TEXT_EDITOR_CSS = fs.readFileSync(path.join(__dirname, "../../../ui-custom/rich-text-editor/rich-text-editor.css"), "utf8");
const MENTION_EXTENSIONS_SOURCE = fs.readFileSync(path.join(__dirname, "../../../ui-custom/rich-text-editor/extensions.ts"), "utf8");
const MENTION_NODE_VIEW_SOURCE = fs.readFileSync(path.join(__dirname, "../../../ui-custom/rich-text-editor/mention-node-view.tsx"), "utf8");
const TAG_SOURCE = fs.readFileSync(path.join(__dirname, "../../../ui/tag.tsx"), "utf8");
const SKILL_TAG_SOURCE = fs.readFileSync(path.join(__dirname, "../../../ui-custom/skill-tag.tsx"), "utf8");
const CLICKY_OVERLAY_SOURCE = fs.readFileSync(path.join(__dirname, "../../rovo-core/components/clicky/clicky-overlay.tsx"), "utf8");
const ROVO_CURSOR_SOURCE = fs.readFileSync(path.join(__dirname, "../../../ui-custom/rovo-cursor.tsx"), "utf8");
const VERTICAL_OVERFLOW_HOOK_SOURCE = fs.readFileSync(path.join(__dirname, "../../../hooks/use-has-vertical-overflow.ts"), "utf8");

test("RovoAppComposer uses the shared edit context bar for open artifacts", () => {
	assert.match(COMPOSER_SOURCE, /import ChatContextBar from "@\/components\/projects\/shared\/components\/chat-context-bar";/u);
	assert.match(COMPOSER_SOURCE, /variant: "edit" as const/u);
	assert.match(COMPOSER_SOURCE, /iconName: "artifact" as const/u);
	assert.match(COMPOSER_SOURCE, /<ChatContextBar context=\{artifactContextBar\} onDismiss=\{onDismissArtifactContext\} \/>/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /Editing:/u);
});

test("RovoAppComposer gates the floating-only send-now queued action behind onSendQueuedPromptNow", () => {
	// Card chrome (Rovo) does not pass onSendQueuedPromptNow, so the Send-now
	// button must only render when the prop is provided (Studio floating chrome).
	assert.match(COMPOSER_SOURCE, /\{onSendQueuedPromptNow \?/u);
	assert.match(COMPOSER_SOURCE, /aria-label="Send now"/u);
});

test("RovoAppComposer renders both card and floating chrome bodies", () => {
	assert.match(COMPOSER_SOURCE, /chrome === "floating"/u);
	assert.match(COMPOSER_SOURCE, /import \{ ComposerCardBody \} from "@\/components\/projects\/shared\/components\/composer-card-body";/u);
	assert.match(COMPOSER_SOURCE, /import \{ ComposerFloatingBody \} from "@\/components\/projects\/shared\/components\/composer-floating-body";/u);
	assert.match(COMPOSER_SOURCE, /<ComposerFloatingBody/u);
	assert.match(COMPOSER_SOURCE, /<ComposerCardBody/u);
});

test("RovoAppComposer does not render the ambient response gradient around the composer", () => {
	assert.doesNotMatch(COMPOSER_SOURCE, /RovoAppComposerResponseGradient/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /renderResponseGradient/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /pointer-events-none absolute inset-0 overflow-visible/u);
});

test("FloatingComposer restores compact mode and expands from compact-width measurement", () => {
	assert.match(FLOATING_COMPOSER_SOURCE, /const \[isExpanded, setIsExpanded\] = useState\(false\);/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /const compactFieldWidth = Math\.max\(/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /const getComposerPlainText = \(field: HTMLElement\): string => \{/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /querySelector<HTMLInputElement>\('\[data-slot="prompt-input-message"\]'\)/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /const probe = document\.createElement\("div"\);/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /probe\.textContent = fieldText;/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /setIsExpanded\(lineCount > 1\);/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /className="flex w-full flex-wrap items-center gap-2"/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /isExpanded \? "order-1 basis-full" : "order-2 flex-1"/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /className="order-3 ml-auto flex shrink-0 items-center gap-1"/u);
	assert.doesNotMatch(FLOATING_COMPOSER_SOURCE, /isMultiline/u);
});

test("active voice controls do not use border beam visual effects", () => {
	assert.doesNotMatch(FLOATING_COMPOSER_SOURCE, /BorderBeam/u);
	assert.doesNotMatch(FLOATING_BODY_SOURCE, /beamActive/u);
	assert.doesNotMatch(SEND_CONTROLS_SOURCE, /BorderBeam|ACTIVE_VOICE_BEAM_PROPS/u);
	assert.match(SEND_CONTROLS_SOURCE, /aria-label="Stop dictation"/u);
	assert.match(SEND_CONTROLS_SOURCE, /aria-label="Stop live voice"/u);
});

test("shared composer voice waveform uses ADS motion duration tokens", () => {
	assert.match(SEND_CONTROLS_SOURCE, /className="min-h-0 min-w-0 flex-1 animate-in fade-in duration-slow"/u);
	assert.doesNotMatch(SEND_CONTROLS_SOURCE, /duration-300/u);
});

test("Rovo Cursor is gated behind active live voice in shared composer chrome", () => {
	assert.doesNotMatch(CARD_BODY_SOURCE, /<PromptInputButton[\s\S]*aria-label="Rovo cursor"/u);
	assert.doesNotMatch(FLOATING_BODY_SOURCE, /<PromptInputButton[\s\S]*aria-label="Rovo Cursor"/u);
	assert.match(CARD_BODY_SOURCE, /clickyActive=\{clickyActive\}/u);
	assert.match(CARD_BODY_SOURCE, /onToggleClicky=\{onToggleClicky\}/u);
	assert.match(FLOATING_BODY_SOURCE, /clickyActive=\{clickyActive\}/u);
	assert.match(FLOATING_BODY_SOURCE, /onToggleClicky=\{onToggleClicky\}/u);
	assert.match(SEND_CONTROLS_SOURCE, /key="live-voice-active"/u);
	assert.doesNotMatch(SEND_CONTROLS_SOURCE, /live-voice-cursor-active/u);
	assert.match(SEND_CONTROLS_SOURCE, /const shouldShowRealtimeVoiceRail = realtimeVoiceActive && Boolean\(onToggleClicky\);/u);
	assert.match(SEND_CONTROLS_SOURCE, /const ACTION_FRAME_CLASS_NAME = "flex h-9 shrink-0 items-center justify-center";/u);
	assert.match(SEND_CONTROLS_SOURCE, /function ComposerActionFrame/u);
	assert.doesNotMatch(SEND_CONTROLS_SOURCE, /shouldShowRegionPaintControl/u);
	assert.match(SEND_CONTROLS_SOURCE, /"relative flex h-9 w-\[68px\] items-center justify-center overflow-hidden rounded-\[8px\]"/u);
	assert.match(SEND_CONTROLS_SOURCE, /<span aria-hidden="true" className="absolute inset-0 rounded-\[8px\] bg-bg-neutral" \/>/u);
	assert.match(SEND_CONTROLS_SOURCE, /"absolute top-0\.5 right-0\.5 bottom-0\.5 rounded-md bg-bg-neutral-bold shadow-sm transition-\[width\] duration-medium ease-in-out motion-reduce:transition-none"[\s\S]*clickyActive \? "w-16" : "w-8"/u);
	assert.match(SEND_CONTROLS_SOURCE, /<div className="relative z-10 flex h-8 w-16 items-center gap-0">/u);
	assert.doesNotMatch(SEND_CONTROLS_SOURCE, /aria-label="Paint screen area"/u);
	assert.doesNotMatch(SEND_CONTROLS_SOURCE, /HighlightIcon/u);
	assert.match(SEND_CONTROLS_SOURCE, /<ComposerActionFrame>[\s\S]*<div className="flex h-9 items-center gap-1">[\s\S]*aria-label="Start live voice"[\s\S]*className=\{cn\("size-8 hover:opacity-90 active:opacity-80", liveVoiceCtaClassName, voiceStartButtonClassName\)\}/u);
	assert.match(SEND_CONTROLS_SOURCE, /className=\{cn\("flex h-9 min-w-0 shrink-0 items-center justify-end gap-1", className\)\}/u);
	assert.doesNotMatch(SEND_CONTROLS_SOURCE, /className="flex h-8 w-16 overflow-hidden rounded-md bg-bg-neutral-bold text-text-inverse shadow-sm"/u);
	assert.doesNotMatch(SEND_CONTROLS_SOURCE, /import \{ RovoCursor \} from "@\/components\/ui-custom\/rovo-cursor";/u);
	assert.match(SEND_CONTROLS_SOURCE, /aria-label="Rovo cursor"[\s\S]*aria-pressed=\{clickyActive\}[\s\S]*"group\/rovo-cursor-button flex size-8 shrink-0 items-center justify-center rounded-md/u);
	assert.match(SEND_CONTROLS_SOURCE, /clickyActive \? \([\s\S]*<RovoCursorTrackingIcon active \/>[\s\S]*\) : \(/u);
	assert.match(SEND_CONTROLS_SOURCE, /clickyActive \? \([\s\S]*<RovoCursorTrackingIcon active \/>[\s\S]*\) : \([\s\S]*<RovoCursorTrackingIcon active=\{false\} \/>[\s\S]*\)/u);
	assert.match(SEND_CONTROLS_SOURCE, /<motion\.button[\s\S]*aria-label="Rovo cursor"/u);
	assert.match(SEND_CONTROLS_SOURCE, /whileHover="hover"/u);
	assert.match(SEND_CONTROLS_SOURCE, /whileTap="tap"/u);
	assert.match(SEND_CONTROLS_SOURCE, /variants=\{shouldReduceMotion \? ROVO_CURSOR_BUTTON_REDUCED_VARIANTS : ROVO_CURSOR_BUTTON_VARIANTS\}/u);
	assert.match(SEND_CONTROLS_SOURCE, /const ROVO_CURSOR_BUTTON_TRANSITION = \{ type: "spring", bounce: 0\.18, visualDuration: 0\.22 \} as const;/u);
	assert.doesNotMatch(SEND_CONTROLS_SOURCE, /ROVO_CURSOR_IDLE_ICON_VARIANTS|ROVO_CURSOR_PREVIEW_ICON_VARIANTS|ROVO_CURSOR_PREVIEW_ICON_REDUCED_VARIANTS/u);
	assert.doesNotMatch(SEND_CONTROLS_SOURCE, /<RovoCursor state="cursor" size=\{16\} \/>/u);
	const cursorButtonStart = SEND_CONTROLS_SOURCE.indexOf('aria-label="Rovo cursor"');
	const cursorButtonSource = SEND_CONTROLS_SOURCE.slice(cursorButtonStart, SEND_CONTROLS_SOURCE.indexOf("</motion.button>", cursorButtonStart));
	assert.doesNotMatch(cursorButtonSource, /hover:bg-bg-neutral/u);
	assert.doesNotMatch(cursorButtonSource, /active:bg-bg-neutral/u);
	assert.doesNotMatch(cursorButtonSource, /group-hover\/rovo-cursor-button/u);
	assert.doesNotMatch(cursorButtonSource, /RovoCursor state="cursor"|data-rovo-cursor/u);
	assert.match(ROVO_CURSOR_SOURCE, /const ARROW_STROKE_OUTSET_PX = 2;/u);
	assert.match(ROVO_CURSOR_SOURCE, /const ARROW_STROKE_WIDTH = ARROW_STROKE_OUTSET_PX \* 2 \* \(ARROW_VIEWBOX \/ 16\);/u);
	assert.match(ROVO_CURSOR_SOURCE, /import \{ AnimatePresence, motion, useReducedMotion \} from "motion\/react";/u);
	assert.match(ROVO_CURSOR_SOURCE, /const CURSOR_MODE_TRANSITION = \{ type: "spring", bounce: 0\.16, visualDuration: 0\.24 \} as const;/u);
	assert.match(ROVO_CURSOR_SOURCE, /import \{ token \} from "@\/lib\/tokens";/u);
	assert.match(ROVO_CURSOR_SOURCE, /token\("color\.icon\.accent\.orange"\)[\s\S]*token\("color\.icon\.accent\.lime"\)[\s\S]*token\("color\.icon\.accent\.blue"\)[\s\S]*token\("color\.icon\.accent\.purple"\)/u);
	assert.match(ROVO_CURSOR_SOURCE, /data-rovo-cursor-rainbow-stroke/u);
	assert.match(ROVO_CURSOR_SOURCE, /data-rovo-cursor-body/u);
	assert.match(ROVO_CURSOR_SOURCE, /className="bg-icon"/u);
	assert.match(ROVO_CURSOR_SOURCE, /export type RovoCursorState = "cursor" \| "painting"/u);
	assert.match(ROVO_CURSOR_SOURCE, /<AnimatePresence initial=\{false\} mode="popLayout">/u);
	assert.match(ROVO_CURSOR_SOURCE, /data-rovo-cursor-mode-transition/u);
	assert.match(ROVO_CURSOR_SOURCE, /willChange: shouldAnimateMode \? "transform, opacity" : undefined/u);
	assert.match(ROVO_CURSOR_SOURCE, /state === "painting" \? \([\s\S]*<PaintingCursor/u);
	assert.match(ROVO_CURSOR_SOURCE, /data-rovo-cursor-rainbow-fill/u);
	assert.doesNotMatch(ROVO_CURSOR_SOURCE, /data-rovo-cursor-rainbow-halo/u);
	assert.doesNotMatch(ROVO_CURSOR_SOURCE, /borderRadius: barWidth \/ 2/u);
	assert.match(SEND_CONTROLS_SOURCE, /aria-label="Stop live voice"[\s\S]*className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md/u);
	assert.match(CARD_BODY_SOURCE, /rounded-xl border border-border bg-surface px-4 py-2\.5/u);
	assert.match(CARD_BODY_SOURCE, /compact \? "pb-2 pt-3" : undefined/u);
	assert.match(FLOATING_COMPOSER_SOURCE, /className=\{cn\(composerPromptInputClassName, "px-4 py-3\.5", className\)\}/u);
	assert.equal((SEND_CONTROLS_SOURCE.match(/^\s*<ComposerVoiceWaveform\b/gmu) ?? []).length, 3);
	assert.match(SEND_CONTROLS_SOURCE, /function ComposerVoiceWaveform/u);
	assert.match(SEND_CONTROLS_SOURCE, /barCount\?: 4 \| 8;/u);
	assert.match(SEND_CONTROLS_SOURCE, /barCount = 8/u);
	assert.match(SEND_CONTROLS_SOURCE, /className=\{cn\("flex h-full shrink-0 items-center", barCount === 4 \? "w-4" : "w-8"\)\}/u);
	assert.match(SEND_CONTROLS_SOURCE, /barCount=\{barCount\}/u);
	assert.equal((SEND_CONTROLS_SOURCE.match(/barCount=\{4\}/gu) ?? []).length, 2);
	assert.match(LIVE_WAVEFORM_SOURCE, /barCount\?: number/u);
	assert.match(LIVE_WAVEFORM_SOURCE, /barCount: fixedBarCount/u);
	assert.match(LIVE_WAVEFORM_SOURCE, /const getBarCount = useCallback\([\s\S]*\(width: number\) =>/u);
	assert.equal((LIVE_WAVEFORM_SOURCE.match(/const barCount = getBarCount\(/gu) ?? []).length, 3);
	assert.doesNotMatch(LIVE_WAVEFORM_SOURCE, /const barCount = Math\.floor\([\s\S]*width \/ \(barWidth \+ barGap\)/u);
	assert.match(SEND_CONTROLS_SOURCE, /height="100%"/u);
	assert.doesNotMatch(SEND_CONTROLS_SOURCE, /className="flex size-4 min-w-0 items-center justify-center overflow-hidden"/u);
	assert.doesNotMatch(SEND_CONTROLS_SOURCE, /height="16px"/u);
	assert.match(CLICKY_OVERLAY_SOURCE, /button\[aria-label="Rovo cursor"\], button\[aria-label="Rovo Cursor"\]/u);
	assert.match(CLICKY_OVERLAY_SOURCE, /const shouldUseFlightTransform = flightPhase === "flying" \|\| flightPhase === "returning";/u);
	assert.match(CLICKY_OVERLAY_SOURCE, /paintingActive\?: boolean;/u);
	assert.match(CLICKY_OVERLAY_SOURCE, /paintingActive=\{paintingActive\}/u);
	assert.match(CLICKY_OVERLAY_SOURCE, /rotation=\{shouldUseFlightTransform \? rotation : IDLE_ROTATION\}/u);
	assert.match(CLICKY_OVERLAY_SOURCE, /flightScale=\{shouldUseFlightTransform \? flightScale : 1\}/u);
});

test("shared composer forwards screen-assistant target prefixes to cursor controls", () => {
	assert.match(COMPOSER_SOURCE, /screenAssistantTargetPrefix\?: string;/u);
	assert.match(COMPOSER_SOURCE, /screenAssistantTargetPrefix,/u);
	assert.match(CARD_BODY_SOURCE, /data-screen-assistant-target=\{screenAssistantTargetPrefix\}/u);
	assert.match(CARD_BODY_SOURCE, /screenAssistantTargetPrefix=\{screenAssistantTargetPrefix\}/u);
	assert.match(FLOATING_BODY_SOURCE, /screenAssistantTargetPrefix = "studio-composer"/u);
	assert.match(FLOATING_BODY_SOURCE, /data-screen-assistant-target=\{screenAssistantTargetPrefix\}/u);
	assert.match(FLOATING_BODY_SOURCE, /screenAssistantTargetPrefix=\{screenAssistantTargetPrefix\}/u);
});

test("RovoAppComposer forwards directory autocomplete control to both composer bodies", () => {
	assert.match(COMPOSER_SOURCE, /directoryAutocompleteListVisible\?: boolean;/u);
	assert.match(COMPOSER_SOURCE, /directoryAutocompleteLimit\?: number;/u);
	assert.match(COMPOSER_SOURCE, /onDirectoryAutocompleteChange\?: \(state: DirectoryAutocompleteState \| null\) => void;/u);
	assert.match(COMPOSER_SOURCE, /onDirectoryAutocompleteControllerChange\?: \(controller: ComposerDirectoryAutocompleteController \| null\) => void;/u);
	assert.match(COMPOSER_SOURCE, /directoryAutocompleteListVisible = false/u);
	assert.match(COMPOSER_SOURCE, /directoryAutocompleteLimit,/u);
	assert.match(COMPOSER_SOURCE, /directoryAutocompleteListVisible,/u);
	assert.match(COMPOSER_SOURCE, /onDirectoryAutocompleteChange,/u);
	assert.match(COMPOSER_SOURCE, /onDirectoryAutocompleteControllerChange,/u);
	assert.match(PROMPT_INPUT_SOURCE, /directoryAutocompleteLimit\?: number;/u);
	assert.match(PROMPT_INPUT_SOURCE, /limit: directoryAutocompleteLimitRef\.current/u);
	assert.match(CARD_BODY_SOURCE, /<PromptInputTextarea[\s\S]*directoryAutocompleteListVisible=\{directoryAutocompleteListVisible\}[\s\S]*directoryAutocompleteLimit=\{directoryAutocompleteLimit\}[\s\S]*onDirectoryAutocompleteChange=\{onDirectoryAutocompleteChange\}[\s\S]*onDirectoryAutocompleteControllerChange=\{onDirectoryAutocompleteControllerChange\}/u);
	assert.match(FLOATING_BODY_SOURCE, /<PromptInputTextarea[\s\S]*directoryAutocompleteListVisible=\{directoryAutocompleteListVisible\}[\s\S]*directoryAutocompleteLimit=\{directoryAutocompleteLimit\}[\s\S]*onDirectoryAutocompleteChange=\{onDirectoryAutocompleteChange\}[\s\S]*onDirectoryAutocompleteControllerChange=\{onDirectoryAutocompleteControllerChange\}/u);
});

test("RovoAppComposer opts both shared bodies into visual trace auto-tagging", () => {
	assert.match(PROMPT_INPUT_SOURCE, /enableVisualTraceAutoTagging\?: boolean;/u);
	assert.match(PROMPT_INPUT_SOURCE, /enableVisualTraceAutoTagging = false/u);
	assert.match(CARD_BODY_SOURCE, /<PromptInputTextarea[\s\S]*enableVisualTraceAutoTagging[\s\S]*onDirectoryAutocompleteChange=\{onDirectoryAutocompleteChange\}/u);
	assert.match(FLOATING_BODY_SOURCE, /<PromptInputTextarea[\s\S]*enableVisualTraceAutoTagging[\s\S]*onDirectoryAutocompleteChange=\{onDirectoryAutocompleteChange\}/u);
});

test("PromptInputTextarea fades overflowing Tiptap composer text with the shared scroll mask", () => {
	assert.match(PROMPT_INPUT_SOURCE, /import \{ useHasVerticalOverflow \} from "@\/components\/hooks\/use-has-vertical-overflow";/u);
	assert.match(PROMPT_INPUT_SOURCE, /import \{ buildScrollMaskStyle \} from "@\/components\/visual\/scroll-mask\/lib";/u);
	assert.match(PROMPT_INPUT_SOURCE, /ref: composerScrollOverflowRef,[\s\S]*hasReachedVerticalLimit: hasComposerReachedScrollLimit,[\s\S]*showBottomScrollMask: showComposerBottomScrollMask,[\s\S]*showTopScrollMask: showComposerTopScrollMask,[\s\S]*= useHasVerticalOverflow<HTMLElement>\(\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /buildScrollMaskStyle\(\{ fadeSize: "var\(--ds-space-200\)" \}\)/u);
	assert.match(PROMPT_INPUT_SOURCE, /const showComposerTopMask = hasComposerReachedScrollLimit && showComposerTopScrollMask;/u);
	assert.match(PROMPT_INPUT_SOURCE, /const showComposerBottomMask = hasComposerReachedScrollLimit && showComposerBottomScrollMask;/u);
	assert.match(PROMPT_INPUT_SOURCE, /composerScrollOverflowRef\(editor\.view\.dom\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /<EditorContent[\s\S]*showComposerTopMask[\s\S]*"scroll-mask-top"[\s\S]*showComposerBottomMask[\s\S]*"scroll-mask-bottom"[\s\S]*style=\{[\s\S]*composerScrollMaskStyle/u);
	// PromptInputTextarea attaches the scrollport after the editor mounts. The
	// overflow hook must observe that late ref and recompute after layout settles;
	// otherwise a temporary auto-tag trace overflow can leave a bottom fade stuck
	// on a single-line composer chip.
	assert.match(VERTICAL_OVERFLOW_HOOK_SOURCE, /hasReachedVerticalLimit: boolean;/u);
	assert.match(VERTICAL_OVERFLOW_HOOK_SOURCE, /const maxHeight = element \? Number\.parseFloat\(getComputedStyle\(element\)\.maxHeight\) : Number\.NaN;/u);
	assert.match(VERTICAL_OVERFLOW_HOOK_SOURCE, /setHasReachedVerticalLimit\(element \? hasFiniteMaxHeight && element\.clientHeight >= maxHeight - 1 : false\);/u);
	assert.match(VERTICAL_OVERFLOW_HOOK_SOURCE, /const \[element, setElement\] = useState<T \| null>\(null\);/u);
	assert.match(VERTICAL_OVERFLOW_HOOK_SOURCE, /setElement\(node\);[\s\S]*window\.requestAnimationFrame\(updateScrollState\);/u);
	assert.match(VERTICAL_OVERFLOW_HOOK_SOURCE, /\}, \[element, updateScrollState\]\);/u);
});

test("PromptInputTextarea applies directory prefill as a rich mention without visual tracing", () => {
	assert.match(PROMPT_INPUT_SOURCE, /prefillMentionRequest\?: \{ mention: RichTextMentionItem; requestKey: number \};/u);
	assert.match(PROMPT_INPUT_SOURCE, /const lastMentionPrefillKeyRef = useRef\(0\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /const pendingMentionPrefillKeyRef = useRef\(0\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /const lastMentionPrefillTextRef = useRef<string \| null>\(null\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /pendingMentionPrefillKeyRef\.current === prefillMentionRequest\.requestKey/u);
	assert.match(PROMPT_INPUT_SOURCE, /queueMicrotask\(\(\) => \{[\s\S]*if \(cancelled \|\| activeEditorRef\.current !== editor\) \{[\s\S]*lastMentionPrefillKeyRef\.current = requestKey;[\s\S]*clearPendingAutoTagging\(\);[\s\S]*resetVisualTraceEditorState\(editor\);[\s\S]*setDirectoryAutocompleteState\(null\);[\s\S]*type: "mention",[\s\S]*attrs: getMentionNodeAttrs\(mention\),[\s\S]*const prefillText = serializeComposerDoc\(editor\);[\s\S]*publishText\(prefillText, editor\.view\.dom, true\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /return \(\) => \{[\s\S]*cancelled = true;[\s\S]*pendingMentionPrefillKeyRef\.current = 0;[\s\S]*\};/u);
	assert.match(PROMPT_INPUT_SOURCE, /if \(lastMentionPrefillTextRef\.current === currentText && resolvedValue !== currentText\) \{[\s\S]*return;[\s\S]*\}/u);
});

test("visual trace auto-tagging flushes before submit and cancels stale delayed ranges", () => {
	assert.match(PROMPT_INPUT_SOURCE, /useComposerVisualTraceAutoTagging\(\{/u);
	assert.match(PROMPT_INPUT_SOURCE, /flushAutoTagging,/u);
	assert.match(PROMPT_INPUT_SOURCE, /const handleEnterSubmit = useCallback/u);
	assert.match(PROMPT_INPUT_SOURCE, /flushAutoTagging\(\);[\s\S]*form\.requestSubmit\(\);/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /getDirectoryAutocompleteExactLabelMatches/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const VISUAL_TRACE_AUTO_TAG_TYPED_IDLE_MS = 180;/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const VISUAL_TRACE_AUTO_TAG_CONVERT_MS = 940;/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const VISUAL_TRACE_AUTO_TAG_STAGGER_MS = 140;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /animation: prompt-input-trace-decoration-sweep 900ms cubic-bezier\(0\.4, 0, 0\.2, 1\) forwards;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.prompt-input-trace-decoration \{[\s\S]*display: inline-block;[\s\S]*margin: -2px -4px;[\s\S]*padding: 2px 4px;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /filter: blur\(4px\);[\s\S]*opacity: 0\.74;[\s\S]*filter: blur\(1\.4px\);[\s\S]*filter: blur\(0\.35px\);[\s\S]*filter: blur\(0\);[\s\S]*opacity: 1;/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /setTimeout\(\(\) => \{[\s\S]*runAutoTagging\(activeEditor, generation, scope\);[\s\S]*\}, delay\)/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const delay = immediate \? 0 : VISUAL_TRACE_AUTO_TAG_TYPED_IDLE_MS;/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /suppressTrailingPrefixMatches: scope !== "document"/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /scheduleAutoTagging\(activeEditor, immediate, immediate \? "document" : "block"\);/u);
	assert.doesNotMatch(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /scheduleAutoTagging\(activeEditor, immediate\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /const field = form\.querySelector<HTMLInputElement>\([\s\S]*data-slot="prompt-input-message"[\s\S]*const text = field[\s\S]*\? field\.value[\s\S]*: usingProvider/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /generationRef\.current \+= 1;/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /generation !== generationRef\.current/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /getAutoTagMatches\(activeEditor, "document"\)/u);
});

test("visual trace auto-tagging limits append-only dictation syncs to the appended range", () => {
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /import \{ TextSelection \} from "@tiptap\/pm\/state";/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /serializeComposerMentionAttrs,/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /interface VisualTraceRangeScope \{[\s\S]*type: "range";[\s\S]*\}/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /type VisualTraceAutoTagScope = "block" \| "document" \| VisualTraceRangeScope;/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /function getVisualTraceRangeText\(\s*editor: Editor,\s*range: VisualTraceRangeScope,\s*\): VisualTraceBlockText/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const VISUAL_TRACE_EXTERNAL_SYNC_LOOKBACK_CHARS = 96;/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /function getCommonPrefixLength\(left: string, right: string\): number/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /function getVisualTraceExternalSyncTextOffset\(text: string, changedFromOffset: number\): number/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /function getComposerDocPositionAtSerializedOffset\(editor: Editor, textOffset: number\): number/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /serializeComposerMentionAttrs\(node\.attrs\)/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /function replaceComposerPlainTextFrom\(editor: Editor, from: number, text: string\): void/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /function appendComposerPlainTextAtEnd\(editor: Editor, text: string\): void/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const insertFrom = TextSelection\.atEnd\(editor\.state\.doc\)\.from;[\s\S]*replaceComposerPlainTextFrom\(editor, insertFrom, text\);/u);
	assert.doesNotMatch(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /insertText\(text, editor\.state\.doc\.content\.size\)/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const externalAppendRangeRef = useRef<VisualTraceRangeScope \| null>\(null\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /const lastEditorPublishedTextRef = useRef<string \| null>\(null\);/u);
	assert.doesNotMatch(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /type VisualTraceAutoTagMode/u);
	assert.match(PROMPT_INPUT_SOURCE, /if \(!fromEditor\) \{[\s\S]*lastEditorPublishedTextRef\.current = null;[\s\S]*return;[\s\S]*\}[\s\S]*lastEditorPublishedTextRef\.current = text;/u);
	assert.doesNotMatch(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /getInstantDocumentFallbackMatches/u);
	assert.doesNotMatch(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /mode === "instant"/u);
	assert.doesNotMatch(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /queueMicrotask/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /scheduleAutoTagging\(activeEditor, true, "document"\);/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const externalAppendScope = externalAppendRangeRef\.current;[\s\S]*scheduleAutoTagging\(activeEditor, true, externalAppendScope\);[\s\S]*return;/u);
	assert.doesNotMatch(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const convertedExternalAppend = scheduleAutoTagging/u);
	assert.doesNotMatch(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /scheduleAutoTagging\(activeEditor, true, externalAppendScope, "instant"\);/u);
	assert.doesNotMatch(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /scheduleAutoTagging\(activeEditor, false, externalAppendScope\);/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const setExternalVisualTraceRange = \(changedFromTextOffset: number, rangeTo: number\) => \{[\s\S]*getVisualTraceExternalSyncTextOffset\([\s\S]*resolvedValue,[\s\S]*changedFromTextOffset,[\s\S]*\);[\s\S]*externalAppendRangeRef\.current = \{[\s\S]*from: traceFrom,[\s\S]*to: rangeTo,[\s\S]*type: "range",[\s\S]*\};[\s\S]*\};/u);
	assert.doesNotMatch(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /externalAppendFromRef\.current \?\? from/u);
	assert.match(PROMPT_INPUT_SOURCE, /const currentText = serializeComposerDoc\(editor\);[\s\S]*if \(currentText === resolvedValue\) \{[\s\S]*lastEditorPublishedTextRef\.current = null;[\s\S]*return;[\s\S]*\}[\s\S]*if \(lastEditorPublishedTextRef\.current === resolvedValue\) \{[\s\S]*return;[\s\S]*\}[\s\S]*syncVisualTraceExternalValue\(editor, resolvedValue, currentText\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /syncVisualTraceExternalValue\(editor, resolvedValue, currentText\);/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /setComposerPlainText\(activeEditor, resolvedValue\);/u);
});

test("composer plain Enter submits before Tiptap can split the paragraph", () => {
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /Plain Enter[\s\S]*submits the host form/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /Shift\+Enter inserts a hard break/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /priority: 125,/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /plain Enter and arrow keys remain reserved for the prompt input/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /event\.key !== "Enter"/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /event\.shiftKey \|\| event\.isComposing/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /isSuggestionMenuOpen\(view\)/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /return onEnter \? onEnter\(view\) : false;/u);
	assert.doesNotMatch(COMPOSER_EXTENSIONS_SOURCE, /event\.key === "Enter" && controller\.hasVisibleList\(\)/u);
	assert.doesNotMatch(COMPOSER_EXTENSIONS_SOURCE, /insertParagraph[\s\S]*controller\.acceptActive/u);
	assert.doesNotMatch(COMPOSER_EXTENSIONS_SOURCE, /event\.key === "ArrowDown"[\s\S]*controller\.moveActive/u);
	assert.doesNotMatch(COMPOSER_EXTENSIONS_SOURCE, /event\.key === "ArrowUp"[\s\S]*controller\.moveActive/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /\^\[1-9\]\$[\s\S]*controller\.hasAcceptableList\(\)/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /\(event\.key === "Tab" \|\| event\.key === "ArrowRight"\) &&[\s\S]*!controller\.hasVisibleList\(\)/u);
	assert.match(PROMPT_INPUT_SOURCE, /acceptGhost: \(\) => !isAutoTaggingBusyRef\.current\(\) && acceptDirectoryAutocompleteIndexRef\.current\(0, true\)/u);
	assert.match(PROMPT_INPUT_SOURCE, /hasVisibleList: \(\) =>[\s\S]*directoryAutocompleteListVisibleRef\.current &&[\s\S]*\(directoryAutocompleteStateRef\.current\?\.matches\.length \?\? 0\) > 0/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /"Shift-Enter": insertHardBreak/u);
	assert.match(PROMPT_INPUT_SOURCE, /const submitButton = form\.querySelector\([\s\S]*button\[type="submit"\][\s\S]*if \(submitButton\?\.disabled\)/u);
	assert.match(SEND_CONTROLS_SOURCE, /key="dictation-active"[\s\S]*aria-hidden="true"[\s\S]*disabled[\s\S]*type="submit"/u);
});

test("visual trace auto-tagging uses mention nodes and hides autocomplete while tracing", () => {
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /\.\.\.getMentionNodeAttrs\(pendingMatch\.match\.mention\),[\s\S]*sourceText: pendingMatch\.expectedText,/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /mentionType\.create\(mentionAttrs\)/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const shouldInsertTrailingSpace = textAfter === undefined;/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const conversionOrder = \[\.\.\.pendingMatches\]\.sort\(\(a, b\) => b\.from - a\.from\);/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /editor\.state\.doc\.forEach\(\(block, blockOffset, blockIndex\) => \{[\s\S]*text \+= "\\n";/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /traceText: string;/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /traceText: block\.text\.slice\(match\.from, match\.to\),/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const from = getVisualTraceDocPosition\(block, match\.from\);[\s\S]*const to = getVisualTraceDocPosition\(block, match\.to\);/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /label: pendingMatch\.traceText/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /label: match\.traceText/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /interface VisualTraceAutoTagUndoSnapshot/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const undoSnapshotRef = useRef<VisualTraceAutoTagUndoSnapshot \| null>\(null\);/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const restoreUndoSnapshot = useCallback/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /event\.key\.toLowerCase\(\) !== "z"/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /restoreUndoSnapshot\(activeEditor, snapshot\)/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /activeEditor\.commands\.setContent\(snapshot\.beforeJSON, \{[\s\S]*emitUpdate: false/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /currentText\.includes\(RICH_TEXT_OBJECT_REPLACEMENT\)/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /currentText\.toLowerCase\(\) !== expectedText\.toLowerCase\(\)/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /pendingRef\.current \|\|[\s\S]*applyingRef\.current[\s\S]*setDirectoryAutocompleteState\(null\);/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /immediateUpdateRef\.current = true;/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /flushAutoTagging[\s\S]*publishText\(serializeComposerDoc\(activeEditor\), activeEditor\.view\.dom, true\);/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.prompt-input-composer\.ProseMirror \{[\s\S]*width: calc\(100% \+ 1\.5rem\);[\s\S]*margin-block: -0\.0625rem;[\s\S]*margin-inline: -0\.75rem;[\s\S]*padding-block: 0\.0625rem;[\s\S]*padding-inline: 0\.75rem;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.prompt-input-composer \.react-renderer\.node-mention \{[\s\S]*display: inline-flex;[\s\S]*height: 1\.5rem;[\s\S]*overflow: visible;[\s\S]*line-height: 1\.5rem;[\s\S]*vertical-align: bottom;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.prompt-input-composer \.rich-text-mention-node \{[\s\S]*height: 1\.5rem;[\s\S]*overflow: visible;[\s\S]*line-height: 1\.5rem;[\s\S]*vertical-align: bottom;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.prompt-input-composer \.rich-text-mention-trigger-wrapper \{[\s\S]*height: 1\.5rem;[\s\S]*overflow: visible;[\s\S]*line-height: 0;[\s\S]*vertical-align: top;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\.prompt-input-composer \.rich-text-mention-chip \{[\s\S]*align-self: center;[\s\S]*vertical-align: middle;/u);
});

test("composer trace auto-tagging keeps native undo history available", () => {
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /import \{ history, redo, undo \} from "@tiptap\/pm\/history";/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /import \{ keymap \} from "@tiptap\/pm\/keymap";/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /function createComposerHistoryExtension\(\)/u);
	// Trace-decoration validation/mapping reuse the shared range helpers.
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /return rangeTextMatches\(state\.doc, decoration\.from, decoration\.to, decoration\.label\);/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /mapRangeThroughTransaction\(transaction\.mapping, decoration\.from, decoration\.to\)/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /history\(\)/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /"Mod-z": undo/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /"Shift-Mod-z": redo/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /createComposerHistoryExtension\(\),[\s\S]*createRichTextMentionExtension/u);
});

test("auto-tagged tokens carry sourceText and a restore command on the mention node", () => {
	// The exact typed text is stored on the node so a revert restores it precisely,
	// and its presence is what scopes the revert affordances to auto-tagged tokens.
	assert.match(MENTION_EXTENSIONS_SOURCE, /sourceText: \{[\s\S]*parseHTML:[\s\S]*data-source-text[\s\S]*renderHTML:[\s\S]*data-source-text/u);
	// Reverted spots are tracked by position via a plugin (not by text), so a
	// revert is local and a later retype re-tags.
	assert.match(MENTION_EXTENSIONS_SOURCE, /function createDismissedAutoTagPlugin\(\)/u);
	assert.match(MENTION_EXTENSIONS_SOURCE, /const dismissedAutoTagPluginKey = new PluginKey/u);
	// Mapped through edits (inward bias via the shared helper) and dropped once
	// the text at that spot changes.
	assert.match(MENTION_EXTENSIONS_SOURCE, /map\(from, 1\)[\s\S]*map\(to, -1\)/u);
	assert.match(MENTION_EXTENSIONS_SOURCE, /mapRangeThroughTransaction\(tr\.mapping, range\.from, range\.to\)/u);
	// Shared restore command: replace node with sourceText and record the spot.
	assert.match(MENTION_EXTENSIONS_SOURCE, /restoreAutoTaggedMention:[\s\S]*\(pos: number\) =>/u);
	assert.match(MENTION_EXTENSIONS_SOURCE, /node\.type\.name !== "mention"/u);
	assert.match(MENTION_EXTENSIONS_SOURCE, /typeof sourceText !== "string" \|\| !sourceText/u);
	assert.match(MENTION_EXTENSIONS_SOURCE, /tr\.replaceWith\(from, to, state\.schema\.text\(sourceText\)\)/u);
	// The revert + recording the spot are gated behind the dispatch guard so a
	// dry-run (editor.can()) stays side-effect-free.
	assert.match(MENTION_EXTENSIONS_SOURCE, /if \(dispatch\) \{[\s\S]*tr\.setMeta\(dismissedAutoTagPluginKey, \{[\s\S]*type: "add"[\s\S]*\}\);[\s\S]*\}/u);
	assert.match(MENTION_EXTENSIONS_SOURCE, /restoreAutoTaggedMention: \(pos: number\) => ReturnType;/u);
	// The plugin ships as a standalone extension (not bolted onto the mention node)
	// and is registered ONLY by the composer, never the full document editor.
	assert.match(MENTION_EXTENSIONS_SOURCE, /export const DismissedAutoTagTracker = Extension\.create\(\{[\s\S]*createDismissedAutoTagPlugin\(\)/u);
	assert.doesNotMatch(MENTION_EXTENSIONS_SOURCE, /addNodeView\(\)[\s\S]*addProseMirrorPlugins\(\)[\s\S]*createDismissedAutoTagPlugin/u);
	assert.match(COMPOSER_EXTENSIONS_SOURCE, /DismissedAutoTagTracker,/u);
	// Empty-ranges early-out: no per-keystroke map/filter when nothing is tracked.
	assert.match(MENTION_EXTENSIONS_SOURCE, /if \(tr\.docChanged && ranges\.length > 0\)/u);
	// Shared object-replacement sentinel (one source for matcher/trace/prune).
	assert.match(MENTION_EXTENSIONS_SOURCE, /export const RICH_TEXT_OBJECT_REPLACEMENT/u);
	// Shared range helpers (used by both the plugin and the trace-decoration mapper).
	assert.match(MENTION_EXTENSIONS_SOURCE, /export function mapRangeThroughTransaction\(/u);
	assert.match(MENTION_EXTENSIONS_SOURCE, /export function rangeTextMatches\(/u);
	assert.match(MENTION_EXTENSIONS_SOURCE, /rangeTextMatches\(newState\.doc, range\.from, range\.to, range\.text\)/u);
});

test("Backspace restores auto-tagged tokens but deletes deliberate mentions atomically", () => {
	// Scoped to auto-tagged nodes (sourceText present); deliberate mentions from
	// the directory or menu delete as an atomic chip without becoming text.
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /event\.key === "Backspace"/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /import \{ NodeSelection, TextSelection \} from "@tiptap\/pm\/state";/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /function getBackspaceRevertPos\(editor: Editor\): number \| null/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /function isAutoTaggedMention\(/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /selection instanceof NodeSelection && isAutoTaggedMention\(selection\.node\)[\s\S]*return selection\.from;/u);
	// Caret directly after the chip.
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /if \(isAutoTaggedMention\(before\)\) \{[\s\S]*return \$from\.pos - before!\.nodeSize;/u);
	// Caret after the conversion-inserted trailing space (treat lone space as adjacency).
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /before\?\.isText && before\.text === " "/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /activeEditor\.commands\.restoreAutoTaggedMention\(backspaceRevertPos\)/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /function getBackspaceMentionDeleteRange\(editor: Editor\): \{ from: number; to: number \} \| null/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /selection instanceof NodeSelection[\s\S]*nodeAfter = editor\.state\.doc\.resolve\(selection\.to\)\.nodeAfter[\s\S]*to: selection\.to \+ \(nodeAfter\?\.isText && nodeAfter\.text\?\.startsWith\(" "\) \? 1 : 0\)/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /if \(isMentionNode\(before\) && !isAutoTaggedMention\(before\)\) \{[\s\S]*from: \$from\.pos - before\.nodeSize,[\s\S]*to: \$from\.pos,/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /if \(isMentionNode\(beforeSpace\) && !isAutoTaggedMention\(beforeSpace\)\) \{[\s\S]*from: spaceStart - beforeSpace\.nodeSize,[\s\S]*to: \$from\.pos,/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const transaction = activeEditor\.state\.tr\.delete\(backspaceDeleteRange\.from, backspaceDeleteRange\.to\);/u);
	// Backspace is installed for every prompt input, not only visual-trace
	// surfaces, so directory/menu-inserted chips delete the same way everywhere.
	assert.match(PROMPT_INPUT_SOURCE, /editor\.view\.dom\.addEventListener\("keydown", handleKeyDown, \{ capture: true \}\);[\s\S]*\}, \[editor, handleVisualTraceKeyDown\]\);/u);
	assert.match(PROMPT_INPUT_SOURCE, /if \(!editor \|\| !enableVisualTraceAutoTagging\) \{[\s\S]*editor\.view\.dom\.addEventListener\("paste", handlePaste, \{ capture: true \}\);/u);
});

test("auto-tagger skips reverted spots by position and clears them on draft reset", () => {
	// Candidate matches whose document range overlaps a reverted spot are skipped.
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /function overlapsDismissedAutoTag\(/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /const dismissedRanges = getDismissedAutoTagRanges\(activeEditor\.state\);/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /if \(overlapsDismissedAutoTag\(dismissedRanges, range\.from, range\.to\)\) \{[\s\S]*return \[\];/u);
	// Cleared wherever the draft resets so a fresh draft starts clean.
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /clearDismissedAutoTags\(activeEditor\);/u);
	// Also cleared when the auto-tag conversion is undone (whole-doc restore).
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /clearComposerTraceDecorations\(activeEditor\.view\);[\s\S]*clearDismissedAutoTags\(activeEditor\);/u);
	// Object-replacement sentinel is the shared constant, not a re-declared literal.
	// The sentinel is the imported shared constant used directly — no local alias.
	assert.doesNotMatch(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /VISUAL_TRACE_OBJECT_REPLACEMENT/u);
	assert.match(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /textBetween\([\s\S]*RICH_TEXT_OBJECT_REPLACEMENT/u);
	// The duplicate trace-range helper was collapsed into getVisualTraceDocRange.
	assert.doesNotMatch(VISUAL_TRACE_AUTO_TAGGING_SOURCE, /getVisualTraceDocTraceRange/u);
});

test("auto-tagged chips do not expose the swap-back-to-text overlay action", () => {
	assert.doesNotMatch(MENTION_NODE_VIEW_SOURCE, /SwapIcon/u);
	assert.doesNotMatch(MENTION_NODE_VIEW_SOURCE, /Switch back to text/u);
	assert.doesNotMatch(MENTION_NODE_VIEW_SOURCE, /const isAutoTagged = Boolean\(attrs\.sourceText\);/u);
	assert.doesNotMatch(MENTION_NODE_VIEW_SOURCE, /const overlayAction/u);
	assert.doesNotMatch(MENTION_NODE_VIEW_SOURCE, /restoreAutoTaggedMention\(pos\)/u);
	assert.doesNotMatch(MENTION_NODE_VIEW_SOURCE, /overlayAction=\{overlayAction\}/u);
});

test("skill mention chips expose the skewed focus state for tab and node selection", () => {
	assert.match(SKILL_TAG_SOURCE, /focused\?: boolean;/u);
	assert.match(SKILL_TAG_SOURCE, /focusable\?: boolean;/u);
	assert.match(SKILL_TAG_SOURCE, /tabIndex=\{focusable \? \(tabIndex \?\? 0\) : tabIndex\}/u);
	assert.match(SKILL_TAG_SOURCE, /-skew-x-12[\s\S]*border border-transparent[\s\S]*focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring\/50/u);
	assert.match(SKILL_TAG_SOURCE, /focused && "border-ring ring-3 ring-ring\/50"/u);
	assert.doesNotMatch(SKILL_TAG_SOURCE, /ring-inset/u);
	assert.match(SKILL_TAG_SOURCE, /data-focused=\{focused \? "true" : undefined\}/u);
	assert.match(MENTION_NODE_VIEW_SOURCE, /RichTextMentionNodeView\(\{ node, selected \}: Readonly<ReactNodeViewProps>\)/u);
	assert.match(MENTION_NODE_VIEW_SOURCE, /<SkillTag[\s\S]*focused=\{selected\}[\s\S]*focusable[\s\S]*icon=\{skillTagProps\.icon\}/u);
	assert.match(MENTION_EXTENSIONS_SOURCE, /export const RichTextMention = Mention\.extend\(\{[\s\S]*selectable: true,/u);
});

test("Tag and SkillTag expose a distinct overlayAction (separate from remove semantics)", () => {
	for (const source of [TAG_SOURCE, SKILL_TAG_SOURCE]) {
		assert.match(source, /overlayAction\?: TagOverlayAction;/u);
		// Reuses the shared tooltip wrapper instead of re-implementing it.
		assert.match(source, /withTooltip\(/u);
		// The action gets its own data-slot so "remove" selectors never match it.
		assert.match(source, /overlay-action/u);
	}
	// The shared helper lives in the tooltip primitive module.
	assert.match(TAG_SOURCE, /import \{ withTooltip \} from "@\/components\/ui\/tooltip";/u);
	assert.match(TAG_SOURCE, /interface TagOverlayAction/u);
});

test("RovoAppComposer threads dictation controls and text snapshots through both composer bodies", () => {
	assert.match(COMPOSER_SOURCE, /dictationState\?: RovoComposerDictationState;/u);
	assert.match(COMPOSER_SOURCE, /dictationTranscriptPreview\?: string \| null;/u);
	assert.match(COMPOSER_SOURCE, /realtimeVoiceState\?: "idle" \| "connecting" \| "listening" \| "speaking";/u);
	assert.match(COMPOSER_SOURCE, /onStartDictation\?: \(\) => void;/u);
	assert.match(COMPOSER_SOURCE, /onStopDictation\?: \(\) => void;/u);
	assert.match(COMPOSER_SOURCE, /onTextChange\?: \(value: string\) => void;/u);
	assert.match(COMPOSER_SOURCE, /onTextChange\?\.\(controller\.textInput\.value\);/u);
	for (const source of [CARD_BODY_SOURCE, FLOATING_BODY_SOURCE]) {
		assert.match(source, /dictationState/u);
		assert.match(source, /dictationTranscriptPreview/u);
		assert.match(source, /realtimeVoiceState/u);
		assert.match(source, /onStartDictation/u);
		assert.match(source, /onStopDictation/u);
	}
});
