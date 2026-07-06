"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createFallbackRovoConfigBuilders,
	loadRovoConfigBuilders,
	normalizeRovoConfigBuilders,
} = require("./rovo-config-loader");

function createLogger() {
	const entries = [];
	return {
		entries,
		log: (...args) => entries.push(["log", ...args]),
		warn: (...args) => entries.push(["warn", ...args]),
	};
}

test("loadRovoConfigBuilders prefers the Docker config path", () => {
	const logger = createLogger();
	const dockerConfig = {
		buildUserMessage: (message) => `docker:${message}`,
		buildQuestionCardSkipNotification: () => "docker-skip",
		buildAIGatewaySystemPrompt: () => "docker-system",
	};

	const builders = loadRovoConfigBuilders({
		loadDockerConfig: () => dockerConfig,
		loadLocalConfig: () => {
			throw new Error("local config should not load");
		},
		logger,
	});

	assert.equal(builders.buildUserMessage("hello"), "docker:hello");
	assert.equal(builders.buildQuestionCardSkipNotification(), "docker-skip");
	assert.equal(builders.buildAIGatewaySystemPrompt(), "docker-system");
	assert.deepEqual(logger.entries, [
		["log", "[STARTUP] config loaded from ./rovo (Docker path)"],
		["log", "[STARTUP] rovo config loaded successfully"],
	]);
});

test("loadRovoConfigBuilders falls back to the local dev config path", () => {
	const logger = createLogger();
	const localConfig = {
		buildUserMessage: (message) => `local:${message}`,
	};

	const builders = loadRovoConfigBuilders({
		loadDockerConfig: () => {
			throw new Error("docker missing");
		},
		loadLocalConfig: () => localConfig,
		logger,
	});

	assert.equal(builders.buildUserMessage("hello"), "local:hello");
	assert.equal(builders.buildQuestionCardSkipNotification(), "[Question Card Dismissed]\nThe user skipped the clarification questions.\n[End Question Card Dismissed]");
	assert.equal(builders.buildAIGatewaySystemPrompt({ runtimeContext: "context" }), "context");
	assert.deepEqual(logger.entries, [
		["log", "[STARTUP] config loaded from ../rovo (local dev path)"],
		["log", "[STARTUP] rovo config loaded successfully"],
	]);
});

test("loadRovoConfigBuilders returns fallback builders when both paths fail", () => {
	const logger = createLogger();

	const builders = loadRovoConfigBuilders({
		loadDockerConfig: () => {
			throw new Error("docker missing");
		},
		loadLocalConfig: () => {
			throw new Error("local missing");
		},
		logger,
	});

	assert.equal(builders.buildUserMessage("hello"), "hello");
	assert.equal(builders.buildAIGatewaySystemPrompt({ runtimeContext: "context" }), "context");
	assert.deepEqual(logger.entries, [
		["warn", "[STARTUP] rovo config failed to load:", "local missing"],
		["warn", "[STARTUP] Using fallback functions - config did not load!"],
	]);
});

test("normalizeRovoConfigBuilders fills missing optional builders", () => {
	const builders = normalizeRovoConfigBuilders({
		buildQuestionCardSkipNotification: () => "custom-skip",
	});

	assert.equal(builders.buildUserMessage("hello"), "hello");
	assert.equal(builders.buildQuestionCardSkipNotification(), "custom-skip");
	assert.equal(builders.buildAIGatewaySystemPrompt(), "");
});

test("fallback Rovo config builders preserve legacy copy", () => {
	const builders = createFallbackRovoConfigBuilders();

	assert.equal(builders.buildUserMessage("hello"), "hello");
	assert.equal(builders.buildQuestionCardSkipNotification(), "[Question Card Dismissed]\nThe user skipped the clarification questions.\n[End Question Card Dismissed]");
	assert.equal(builders.buildAIGatewaySystemPrompt({ runtimeContext: "context" }), "context");
});
