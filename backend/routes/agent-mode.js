"use strict";

const express = require("express");

const VALID_AGENT_MODES = ["default", "ask", "plan"];

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createAgentModeRouter requires ${name}`);
	}
}

function isRovoConnectionFailure(error) {
	const message = error instanceof Error ? error.message : String(error ?? "");
	return /Rovo connection failed|ECONNREFUSED|EHOSTUNREACH|Request timed out/iu.test(message);
}

function createDefaultAgentModeResponse(message) {
	return {
		mode: "default",
		message,
	};
}

function createAgentModeRouter({
	createRovoUnavailableError,
	getAgentMode,
	isConnectionFailure = isRovoConnectionFailure,
	isRovoAvailable,
	logger = console,
	setAgentMode,
	validModes = VALID_AGENT_MODES,
} = {}) {
	requireFunction("createRovoUnavailableError", createRovoUnavailableError);
	requireFunction("getAgentMode", getAgentMode);
	requireFunction("isConnectionFailure", isConnectionFailure);
	requireFunction("isRovoAvailable", isRovoAvailable);
	requireFunction("setAgentMode", setAgentMode);

	const router = express.Router();

	router.post("/agent-mode", async (req, res) => {
		try {
			const { mode } = req.body || {};
			if (!mode || typeof mode !== "string") {
				return res.status(400).json({ error: "mode is required (default, ask, or plan)" });
			}
			if (!validModes.includes(mode)) {
				return res.status(400).json({ error: `Invalid mode: ${mode}. Must be one of: ${validModes.join(", ")}` });
			}

			const rovoAvailable = await isRovoAvailable();
			if (!rovoAvailable) {
				const unavailableError = createRovoUnavailableError();
				return res.status(503).json({
					error: "Rovo Serve is required but not available",
					details: unavailableError.message,
				});
			}

			const result = await setAgentMode(undefined, mode);
			logger.info?.("[AGENT-MODE] Mode set", { mode });
			return res.status(200).json(result);
		} catch (error) {
			logger.error?.("[AGENT-MODE] Error:", error.message || error);
			return res.status(500).json({ error: error.message || "Failed to set agent mode" });
		}
	});

	router.get("/agent-mode", async (_req, res) => {
		try {
			const rovoAvailable = await isRovoAvailable();
			if (!rovoAvailable) {
				return res.status(200).json(createDefaultAgentModeResponse(
					"Rovo Serve is not available; default agent mode assumed",
				));
			}

			try {
				const result = await getAgentMode();
				return res.status(200).json(result);
			} catch (agentModeError) {
				const msg = agentModeError instanceof Error
					? agentModeError.message
					: String(agentModeError);
				if (msg.includes("status 404")) {
					logger.info?.("[AGENT-MODE] Agent mode not supported by this Rovo version, returning default");
					return res.status(200).json(createDefaultAgentModeResponse(
						"Agent mode not supported by this Rovo version",
					));
				}
				if (isConnectionFailure(agentModeError)) {
					logger.info?.("[AGENT-MODE] Rovo unavailable while reading agent mode, returning default");
					return res.status(200).json(createDefaultAgentModeResponse(
						"Rovo Serve is not available; default agent mode assumed",
					));
				}
				throw agentModeError;
			}
		} catch (error) {
			logger.error?.("[AGENT-MODE] Error:", error.message || error);
			return res.status(500).json({ error: error.message || "Failed to get agent mode" });
		}
	});

	return router;
}

function registerAgentModeRoutes(app, dependencies) {
	app.use("/api", createAgentModeRouter(dependencies));
}

module.exports = {
	VALID_AGENT_MODES,
	createAgentModeRouter,
	isRovoConnectionFailure,
	registerAgentModeRoutes,
};
