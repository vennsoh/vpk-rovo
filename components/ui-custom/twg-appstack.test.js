const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");

const ROOT = join(__dirname, "..", "..");
const SOURCE = readFileSync(join(__dirname, "twg-appstack.tsx"), "utf8");
const COMPONENTS_SOURCE = readFileSync(join(ROOT, "app/data/components.ts"), "utf8");
const MANIFEST_SOURCE = readFileSync(join(ROOT, "app/data/component-manifest.ts"), "utf8");
const DETAILS_SOURCE = readDetailCategorySource("ui-custom");
const REGISTRY_SOURCE = readWebsiteRegistrySource();
const DEMO_SOURCE = readFileSync(join(ROOT, "components/website/demos/ui-custom/twg-appstack-demo.tsx"), "utf8");

test("TWG Appstack fixes md source items to 24px wrappers", () => {
	assert.match(SOURCE, /export function TWGAppstack/u);
	assert.match(SOURCE, /size === "md" \? "size-6" : "size-4"/u);
	assert.match(SOURCE, /"relative flex shrink-0 items-center justify-center"/u);
	assert.match(SOURCE, /size=\{getSourceTileSize\(iconSize\)\}/u);
});

test("TWG Appstack uses a solid fill on stacked tiles", () => {
	assert.match(SOURCE, /const APPSTACK_TILE_FILL_CLASS = "bg-surface"/u);
	assert.match(SOURCE, /cn\("shrink-0", APPSTACK_TILE_FILL_CLASS, className\)/u);
	assert.match(SOURCE, /className="shrink-0 bg-surface text-text-subtlest"/u);
	assert.match(SOURCE, /<span className="text-xs font-medium leading-none">\+\{hiddenCount\}<\/span>/u);
});

test("TWG Appstack animation is optional and preserves source stack rotation", () => {
	assert.match(SOURCE, /animated = true/u);
	assert.match(SOURCE, /const shouldAnimate = animated && !shouldReduceMotion/u);
	assert.match(SOURCE, /if \(!shouldAnimate\)/u);
	assert.match(SOURCE, /const APPSTACK_ROTATIONS = \[\s*0,\s*6,\s*0,\s*-8,\s*\] as const/u);
	assert.match(SOURCE, /const APPSTACK_ENTER_ROTATION_OFFSET = 18/u);
	assert.match(SOURCE, /rotate: \{ type: "spring", stiffness: 260, damping: 30, mass: 0\.85/u);
	assert.match(SOURCE, /transform: `rotate\(\$\{rotation\}deg\)`/u);
	assert.match(SOURCE, /animate=\{\{ filter: "blur\(0px\)", opacity: 1, rotate: rotation, scale: 1, x: 0 \}\}/u);
});

test("TWG Appstack keeps the legacy TwgToolSourceStack adapter", () => {
	assert.match(SOURCE, /export function TwgToolSourceStack\(props: TWGAppstackProps\)/u);
	assert.match(SOURCE, /return <TWGAppstack \{\.\.\.props\} \/>/u);
});

test("TWG Appstack is wired into the ui-custom catalog", () => {
	assert.match(COMPONENTS_SOURCE, /customComponent\("twg-appstack", "TWG Appstack"\)/u);
	assert.match(MANIFEST_SOURCE, /customComponent\("twg-appstack", "TWG Appstack"\)/u);
	assert.match(DETAILS_SOURCE, /"twg-appstack": \{/u);
	assert.match(REGISTRY_SOURCE, /"twg-appstack": dynamic\(\(\) => import\("\.\/demos\/ui-custom\/twg-appstack-demo"\)/u);
	assert.match(DEMO_SOURCE, /export default function TWGAppstackDemo/u);
	assert.match(DEMO_SOURCE, /aria-label="Replay TWG app stack animation"/u);
	assert.match(DEMO_SOURCE, /setReplayKey\(\(currentKey\) => currentKey \+ 1\)/u);
	assert.match(DEMO_SOURCE, /<div key=\{replayKey\}/u);
});
