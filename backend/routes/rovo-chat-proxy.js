"use strict";

const express = require("express");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createRovoChatProxyRouter requires ${name}`);
	}
}

function createRovoChatProxyRouter({
	logger = console,
	proxyRovoAppChatRequest,
	sendGatewayErrorResponse,
} = {}) {
	requireFunction("proxyRovoAppChatRequest", proxyRovoAppChatRequest);
	requireFunction("sendGatewayErrorResponse", sendGatewayErrorResponse);

	const router = express.Router();

	router.post("/rovo/chat", async (req, res) => {
		try {
			await proxyRovoAppChatRequest(req, res);
		} catch (error) {
			logger.error?.("[FUTURE-CHAT] Chat proxy failed:", error);
			return sendGatewayErrorResponse(
				res,
				error,
				"Failed to stream Rovo response"
			);
		}
	});

	return router;
}

function registerRovoChatProxyRoutes(app, dependencies) {
	app.use("/api", createRovoChatProxyRouter(dependencies));
}

module.exports = {
	createRovoChatProxyRouter,
	registerRovoChatProxyRoutes,
};
