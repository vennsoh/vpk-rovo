"use strict";

const express = require("express");

const {
	EXPORT_FORMATS,
	exportSpec,
} = require("../lib/genui-export");
const { genuiChatHandler } = require("../lib/genui-chat-handler");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createGenuiRouter requires ${name}`);
	}
}

function createGenuiRouter({
	exportFormats = EXPORT_FORMATS,
	exportSpecFn = exportSpec,
	genuiChatHandlerFn = genuiChatHandler,
	isRovoAvailable,
	logger = console,
} = {}) {
	if (!Array.isArray(exportFormats)) {
		throw new Error("createGenuiRouter requires exportFormats");
	}
	requireFunction("exportSpecFn", exportSpecFn);
	requireFunction("genuiChatHandlerFn", genuiChatHandlerFn);
	requireFunction("isRovoAvailable", isRovoAvailable);

	const router = express.Router();

	router.post("/genui-chat", (req, res) =>
		genuiChatHandlerFn(req, res, {
			isRovoAvailable,
		})
	);

	router.post("/genui-export", async (req, res) => {
		try {
			const { spec, format, title, state, componentName } = req.body ?? {};

			if (!spec || typeof spec !== "object" || !spec.root || !spec.elements) {
				return res.status(400).json({ error: "Missing or invalid spec (requires root + elements)" });
			}
			if (!format || !exportFormats.includes(format)) {
				return res.status(400).json({ error: `Invalid format. Supported: ${exportFormats.join(", ")}` });
			}

			const result = await exportSpecFn(spec, format, { title, state, componentName });

			res.set("Content-Type", result.contentType);
			res.set("Content-Disposition", `attachment; filename="${result.filename}"`);
			res.send(result.data);
		} catch (error) {
			logger.error?.("[genui-export] Export failed:", error);
			res.status(500).json({
				error: "Export failed",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	return router;
}

function registerGenuiRoutes(app, dependencies) {
	app.use("/api", createGenuiRouter(dependencies));
}

module.exports = {
	createGenuiRouter,
	registerGenuiRoutes,
};
