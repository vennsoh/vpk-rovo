const test = require("node:test");
const assert = require("node:assert/strict");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	appendRealtimeSocketToken,
	buildRealtimeWsUrl,
	fetchRealtimeSocketToken,
} = loadRovoCoreModule("lib/rovo-realtime-ws-url.ts");

function jsonResponse(body, ok = true) {
	return {
		ok,
		async json() {
			return body;
		},
	};
}

test("fetchRealtimeSocketToken returns trimmed token strings only", async () => {
	assert.equal(
		await fetchRealtimeSocketToken(async () => jsonResponse({ token: "  abc  " })),
		"abc",
	);
	assert.equal(
		await fetchRealtimeSocketToken(async () => jsonResponse({ token: "" })),
		null,
	);
	assert.equal(
		await fetchRealtimeSocketToken(async () => jsonResponse({ token: "abc" }, false)),
		null,
	);
	assert.equal(
		await fetchRealtimeSocketToken(async () => {
			throw new Error("network");
		}),
		null,
	);
});

test("appendRealtimeSocketToken preserves URLs without tokens and appends encoded tokens", () => {
	assert.equal(
		appendRealtimeSocketToken("wss://example.test/api/realtime/audio-conversation", null),
		"wss://example.test/api/realtime/audio-conversation",
	);
	assert.equal(
		appendRealtimeSocketToken(
			"wss://example.test/api/realtime/audio-conversation?mode=voice",
			"abc 123",
		),
		"wss://example.test/api/realtime/audio-conversation?mode=voice&realtimeToken=abc+123",
	);
});

test("buildRealtimeWsUrl falls back to same-origin ws URL and token endpoint", async () => {
	const calls = [];
	const url = await buildRealtimeWsUrl({
		location: { host: "local.test", protocol: "http:" },
		async fetcher(input, init) {
			calls.push({ input, init });
			if (input === "/api/realtime/audio-conversation-token") {
				return jsonResponse({ token: "token-a" });
			}
			return jsonResponse({}, false);
		},
	});

	assert.equal(
		url,
		"ws://local.test/api/realtime/audio-conversation?realtimeToken=token-a",
	);
	assert.deepEqual(calls, [
		{ input: "/api/realtime/ws-url", init: undefined },
		{
			input: "/api/realtime/audio-conversation-token",
			init: { cache: "no-store" },
		},
	]);
});

test("buildRealtimeWsUrl uses and caches discovered backend ws base URLs", async () => {
	const calls = [];
	const fetcher = async (input, init) => {
		calls.push({ input, init });
		if (input === "/api/realtime/ws-url") {
			return jsonResponse({ wsUrl: "wss://backend.test" });
		}
		return jsonResponse({ token: "token-b" });
	};

	assert.equal(
		await buildRealtimeWsUrl({
			location: { host: "ignored.test", protocol: "https:" },
			fetcher,
		}),
		"wss://backend.test/api/realtime/audio-conversation?realtimeToken=token-b",
	);
	assert.equal(
		await buildRealtimeWsUrl({
			location: { host: "ignored.test", protocol: "https:" },
			fetcher,
		}),
		"wss://backend.test/api/realtime/audio-conversation?realtimeToken=token-b",
	);
	assert.deepEqual(calls, [
		{ input: "/api/realtime/ws-url", init: undefined },
		{
			input: "/api/realtime/audio-conversation-token",
			init: { cache: "no-store" },
		},
		{
			input: "/api/realtime/audio-conversation-token",
			init: { cache: "no-store" },
		},
	]);
});
