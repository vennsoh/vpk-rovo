"use strict";

const express = require("express");

function createWikiRouter({
	requireRuntimeAdmin,
	wikiRouteHandlers,
} = {}) {
	if (typeof requireRuntimeAdmin !== "function") {
		throw new Error("createWikiRouter requires requireRuntimeAdmin");
	}

	if (!wikiRouteHandlers || typeof wikiRouteHandlers !== "object") {
		throw new Error("createWikiRouter requires wikiRouteHandlers");
	}

	const router = express.Router();

	router.get("/status", wikiRouteHandlers.handleWikiStatus);
	router.post("/captures", requireRuntimeAdmin, wikiRouteHandlers.handleWikiCapture);
	router.get("/search", wikiRouteHandlers.handleWikiSearch);
	router.post("/synthesis", requireRuntimeAdmin, wikiRouteHandlers.handleWikiSynthesisSave);
	router.get("/memories", wikiRouteHandlers.handleWikiMemories);
	router.get("/memory-explorer", wikiRouteHandlers.handleWikiMemoryExplorer);
	router.get("/memory-explorer/export", wikiRouteHandlers.handleWikiMemoryExplorerExport);
	router.post("/memory-explorer/brief", wikiRouteHandlers.handleWikiMemoryBrief);
	router.post("/memory-explorer/deck", wikiRouteHandlers.handleWikiMemoryDeck);
	router.delete("/memories/:scope/blocks/:blockId", requireRuntimeAdmin, wikiRouteHandlers.handleWikiMemoryBlockDelete);
	router.delete("/memories/proposals/:proposalId", requireRuntimeAdmin, wikiRouteHandlers.handleWikiMemoryProposalDelete);
	router.post("/memories/reset", requireRuntimeAdmin, wikiRouteHandlers.handleWikiMemoryReset);
	router.post("/sync", requireRuntimeAdmin, wikiRouteHandlers.handleWikiSync);

	return router;
}

function registerWikiRoutes(app, dependencies) {
	app.use("/api/wiki", createWikiRouter(dependencies));
}

module.exports = {
	createWikiRouter,
	registerWikiRoutes,
};
