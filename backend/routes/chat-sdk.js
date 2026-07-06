"use strict";

const express = require("express");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createChatSdkRouter requires ${name}`);
	}
}

function createChatSdkRouter({
	handleChatSdkRequest,
} = {}) {
	requireFunction("handleChatSdkRequest", handleChatSdkRequest);

	const router = express.Router();
	router.post("/chat-sdk", handleChatSdkRequest);
	return router;
}

function registerChatSdkRoutes(app, dependencies) {
	app.use("/api", createChatSdkRouter(dependencies));
}

module.exports = {
	createChatSdkRouter,
	registerChatSdkRoutes,
};
