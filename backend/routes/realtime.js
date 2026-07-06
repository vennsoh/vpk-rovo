"use strict";

const express = require("express");

const REALTIME_AUDIO_CONVERSATION_SCOPE = "realtime:audio-conversation";

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createRealtimeRouter requires ${name}`);
	}
}

function createRealtimeRouter({
	createRuntimeSocketToken,
	requireRuntimeSocketTokenRequester,
	runtimeSocketTokenTtlMs,
} = {}) {
	requireFunction("createRuntimeSocketToken", createRuntimeSocketToken);
	requireFunction("requireRuntimeSocketTokenRequester", requireRuntimeSocketTokenRequester);
	if (!Number.isFinite(runtimeSocketTokenTtlMs)) {
		throw new Error("createRealtimeRouter requires runtimeSocketTokenTtlMs");
	}

	const router = express.Router();

	router.get("/audio-conversation-token", requireRuntimeSocketTokenRequester, (_req, res) => {
		const token = createRuntimeSocketToken(REALTIME_AUDIO_CONVERSATION_SCOPE);
		return res.json({
			token: token || null,
			expiresInMs: token ? runtimeSocketTokenTtlMs : 0,
		});
	});

	return router;
}

function registerRealtimeRoutes(app, dependencies) {
	app.use("/api/realtime", createRealtimeRouter(dependencies));
}

module.exports = {
	REALTIME_AUDIO_CONVERSATION_SCOPE,
	createRealtimeRouter,
	registerRealtimeRoutes,
};
