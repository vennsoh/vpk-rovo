const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const express = require("express");

const routePath = path.join(__dirname, "..", "routes", "skills.js");
const routeSource = fs.readFileSync(routePath, "utf8");

function extractRoutePath(method, prefix) {
	const routeStart = routeSource.indexOf(`router.${method}("${prefix}`);
	assert.notEqual(routeStart, -1, `Expected to find ${method.toUpperCase()} route starting with ${prefix}`);

	const pathStart = routeStart + `router.${method}("`.length;
	const pathEnd = routeSource.indexOf('"', pathStart);
	assert.notEqual(pathEnd, -1, `Expected to find route terminator for ${prefix}`);

	return routeSource.slice(pathStart, pathEnd);
}

function extractRouteHandler(method, routePath) {
	const marker = `router.${method}("${routePath}"`;
	const start = routeSource.indexOf(marker);
	assert.notEqual(start, -1, `Expected to find route handler for ${routePath}`);

	const arrowStart = routeSource.indexOf("=>", start + marker.length);
	assert.notEqual(arrowStart, -1, `Expected to find route arrow function for ${routePath}`);
	const braceStart = routeSource.indexOf("{", arrowStart);
	let depth = 0;
	for (let index = braceStart; index < routeSource.length; index += 1) {
		const char = routeSource[index];
		if (char === "{") depth += 1;
		if (char === "}") {
			depth -= 1;
			if (depth === 0) {
				return routeSource.slice(start, index + 1);
			}
		}
	}

	throw new Error(`Could not parse route handler for ${routePath}`);
}

test("skills hub wildcard routes register under Express 5", () => {
	const inspectRoute = extractRoutePath("get", "/hub/inspect/");
	const uninstallRoute = extractRoutePath("delete", "/hub/uninstall/");
	const tapsRoute = extractRoutePath("delete", "/hub/taps/");

	const app = express();
	assert.doesNotThrow(() => {
		app.get(`/api/skills${inspectRoute}`, (_req, res) => res.status(204).end());
		app.delete(`/api/skills${uninstallRoute}`, (_req, res) => res.status(204).end());
		app.delete(`/api/skills${tapsRoute}`, (_req, res) => res.status(204).end());
	});
});

test("skills hub wildcard handlers use named params instead of legacy positional params", () => {
	const inspectRoute = extractRoutePath("get", "/hub/inspect/");
	const uninstallRoute = extractRoutePath("delete", "/hub/uninstall/");
	const tapsRoute = extractRoutePath("delete", "/hub/taps/");

	const inspectHandler = extractRouteHandler("get", inspectRoute);
	const uninstallHandler = extractRouteHandler("delete", uninstallRoute);
	const tapsHandler = extractRouteHandler("delete", tapsRoute);

	assert.ok(inspectHandler.includes("req.params.identifier"));
	assert.ok(uninstallHandler.includes("req.params.name"));
	assert.ok(tapsHandler.includes("req.params.repo"));
	assert.ok(!inspectHandler.includes("req.params[0]"));
	assert.ok(!uninstallHandler.includes("req.params[0]"));
	assert.ok(!tapsHandler.includes("req.params[0]"));
});
