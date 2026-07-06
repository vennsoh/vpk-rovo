const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ESLINT_CONFIG_SOURCE = readFileSync(
	path.join(process.cwd(), "eslint.config.mjs"),
	"utf8",
);

test("Rovo and Studio route internals cannot import each other", () => {
	assert.match(
		ESLINT_CONFIG_SOURCE,
		/files: \["components\/projects\/rovo\/\*\*\/\*\.\{js,jsx,ts,tsx\}"\][\s\S]*group: \["@\/components\/projects\/studio\/\*\*"\][\s\S]*Rovo project code must not import Studio internals/u,
	);
	assert.match(
		ESLINT_CONFIG_SOURCE,
		/files: \["components\/projects\/studio\/\*\*\/\*\.\{js,jsx,ts,tsx\}"\][\s\S]*group: \["@\/components\/projects\/rovo\/\*\*"\][\s\S]*Studio project code must not import Rovo route internals/u,
	);
});

test("shared app contexts and shared project code depend on rovo-core instead of route internals", () => {
	assert.match(
		ESLINT_CONFIG_SOURCE,
		/"app\/contexts\/\*\*\/\*\.\{js,jsx,ts,tsx\}",[\s\S]*"components\/projects\/shared\/\*\*\/\*\.\{js,jsx,ts,tsx\}",[\s\S]*"components\/projects\/sidebar-chat\/\*\*\/\*\.\{js,jsx,ts,tsx\}",/u,
	);
	assert.match(
		ESLINT_CONFIG_SOURCE,
		/group: \["@\/components\/projects\/rovo\/\*\*", "@\/components\/projects\/studio\/\*\*"\][\s\S]*Shared app context and shared project code must not depend on route internals/u,
	);
});

test("shared UI primitives cannot import app routes or project surfaces", () => {
	assert.match(
		ESLINT_CONFIG_SOURCE,
		/files: \["components\/ui\/\*\*\/\*\.\{js,jsx,ts,tsx\}"\][\s\S]*group: \["@\/app\/\*\*", "@\/components\/projects\/\*\*"\][\s\S]*Shared UI primitives must stay generic/u,
	);
});
