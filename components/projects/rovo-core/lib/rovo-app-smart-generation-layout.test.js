const assert = require("node:assert/strict");
const test = require("node:test");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	buildRovoAppSmartGenerationRequest,
	getRovoAppSmartGenerationLayoutContext,
	getRovoAppSmartWidthClass,
} = loadRovoCoreModule("lib/rovo-app-smart-generation-layout.ts");

test("getRovoAppSmartWidthClass uses the shared smart-generation breakpoints", () => {
	assert.equal(getRovoAppSmartWidthClass(520), "compact");
	assert.equal(getRovoAppSmartWidthClass(521), "regular");
	assert.equal(getRovoAppSmartWidthClass(900), "regular");
	assert.equal(getRovoAppSmartWidthClass(901), "wide");
});

test("getRovoAppSmartGenerationLayoutContext prefers shell width for width class", () => {
	assert.deepEqual(
		getRovoAppSmartGenerationLayoutContext({
			shellWidth: 480,
			viewportWidth: 1440,
		}),
		{
			containerWidthPx: 480,
			viewportWidthPx: 1440,
			widthClass: "compact",
		},
	);
});

test("getRovoAppSmartGenerationLayoutContext falls back to viewport width", () => {
	assert.deepEqual(
		getRovoAppSmartGenerationLayoutContext({
			shellWidth: null,
			viewportWidth: 840,
		}),
		{
			containerWidthPx: undefined,
			viewportWidthPx: 840,
			widthClass: "regular",
		},
	);
});

test("getRovoAppSmartGenerationLayoutContext omits invalid dimensions", () => {
	assert.deepEqual(
		getRovoAppSmartGenerationLayoutContext({
			shellWidth: 0,
			viewportWidth: NaN,
		}),
		{
			containerWidthPx: undefined,
			viewportWidthPx: undefined,
			widthClass: undefined,
		},
	);
});

test("buildRovoAppSmartGenerationRequest preserves route hook payload shape", () => {
	assert.deepEqual(
		buildRovoAppSmartGenerationRequest({
			embedded: false,
			layout: {
				containerWidthPx: 720,
				viewportWidthPx: 1280,
				widthClass: "regular",
			},
		}),
		{
			enabled: true,
			surface: "rovo",
			containerWidthPx: 720,
			viewportWidthPx: 1280,
			widthClass: "regular",
		},
	);
	assert.deepEqual(
		buildRovoAppSmartGenerationRequest({
			embedded: true,
			layout: null,
		}),
		{
			enabled: true,
			surface: "rovo-preview",
			containerWidthPx: undefined,
			viewportWidthPx: undefined,
			widthClass: undefined,
		},
	);
});
