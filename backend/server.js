// Initialize console early for startup debugging
console.log("[STARTUP] Server process starting...");
console.error("[STARTUP] Startup initiated", new Date().toISOString());

// Try to load .env.local if it exists, but don't fail if it doesn't
try {
	require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });
	console.log("[STARTUP] .env.local loaded");
} catch {
	console.log("[STARTUP] .env.local not found, using environment variables only");
}

const {
	ensureBrowserRuntimeEnvDefaults,
} = require("./lib/browser-runtime-config");

const browserRuntimeDefaults = ensureBrowserRuntimeEnvDefaults();
if (browserRuntimeDefaults.changed) {
	console.log(
		`[STARTUP] Defaulted ROVO_BROWSER_MODE=${browserRuntimeDefaults.browserMode} (${browserRuntimeDefaults.reason})`
	);
}

const express = require("express");
const path = require("path");
const {
	createBackendRuntimeComposition,
} = require("./server-runtime-composition");
const {
	logBackendServerReady,
} = require("./server-startup");
const {
	registerStaticExportServing,
} = require("./lib/static-export-serving");
const {
	registerBackendWebSocketRelays,
} = require("./realtime/ws-relay");

console.log("[STARTUP] Dependencies loaded");

const {
	app,
	port,
	serverReadyDependencies,
	shutdownRuntime,
	webSocketRelayDependencies,
} = createBackendRuntimeComposition();

const publicPath = path.join(__dirname, "public");
registerStaticExportServing(app, {
	expressImpl: express,
	publicPath,
});

console.log("[STARTUP] All routes registered, starting HTTP server...");

const server = app.listen(port, "0.0.0.0", async () => {
	await logBackendServerReady(serverReadyDependencies);
});

// Handle any startup errors
server.on("error", (err) => {
	console.error("Server error:", err);
	process.exit(1);
});

registerBackendWebSocketRelays(server, webSocketRelayDependencies);

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
	console.error("Uncaught exception:", err);
	process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled rejection at:", promise, "reason:", reason);
	process.exit(1);
});

// Graceful shutdown — clean up Rovo pool
process.on("SIGINT", () => {
	shutdownRuntime();
	process.exit(0);
});
process.on("SIGTERM", () => {
	shutdownRuntime();
	process.exit(0);
});
