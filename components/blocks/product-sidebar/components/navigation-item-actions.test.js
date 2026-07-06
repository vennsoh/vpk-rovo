const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readComponent(name) {
	return fs.readFileSync(path.join(__dirname, name), "utf8");
}

function assertKeyboardActionRevealContract(source) {
	assert.match(source, /const \[isHovered, setIsHovered\] = useState\(false\);/u);
	assert.match(source, /const \[isFocusedWithin, setIsFocusedWithin\] = useState\(false\);/u);
	assert.match(source, /const isActionAreaVisible = isHovered \|\| isFocusedWithin;/u);
	assert.match(source, /onFocusCapture=\{\(\) => setIsFocusedWithin\(true\)\}/u);
	assert.match(source, /onBlurCapture=\{\(event\) => \{[\s\S]*event\.currentTarget\.contains\(nextTarget\)[\s\S]*setIsFocusedWithin\(false\);[\s\S]*\}\}/u);
	assert.match(source, /hasActions && isActionAreaVisible \? <NavigationItemActions label=\{label\} \/> : null/u);
}

test("navigation row actions stay reachable for keyboard focus", () => {
	assertKeyboardActionRevealContract(readComponent("navigation-item.tsx"));
	assertKeyboardActionRevealContract(readComponent("navigation-item-with-hover-chevron.tsx"));
});
