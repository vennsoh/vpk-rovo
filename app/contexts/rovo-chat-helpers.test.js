const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

function loadHelpers() {
	const result = esbuild.buildSync({
		entryPoints: [path.join(process.cwd(), "app/contexts/rovo-chat-helpers.ts")],
		bundle: true,
		format: "cjs",
		loader: {
			".css": "empty",
		},
		logLevel: "silent",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "rovo-chat-helpers.cjs");
}

const {
	buildCompactThreadPersistKey,
	buildSendMessageBody,
	deriveCompactThreadTitle,
	isPayloadTooLargeError,
	mergeSendPromptOptions,
	sanitizeMessagesForTransport,
} = loadHelpers();

test("mergeSendPromptOptions merges prompt context without dropping nested metadata", () => {
	const merged = mergeSendPromptOptions(
		{
			contextDescription: "Default context",
			hermesContext: {
				selectedSkillIds: ["vpk-html"],
				autoSelectedSkillIds: ["a"],
			},
			messageMetadata: {
				source: "default",
			},
			smartGeneration: {
				enabled: true,
				surface: "sidebar",
			},
		},
		{
			contextDescription: "Local context",
			hermesContext: {
				selectedSkillIds: ["vpk-html", "browser"],
				pendingDraftIds: ["draft-1"],
			},
			messageMetadata: {
				urgency: "high",
			},
			smartGeneration: {
				widthClass: "wide",
			},
		},
	);

	assert.deepEqual(merged.hermesContext.selectedSkillIds, ["vpk-html", "browser"]);
	assert.deepEqual(merged.hermesContext.autoSelectedSkillIds, ["a"]);
	assert.deepEqual(merged.hermesContext.pendingDraftIds, ["draft-1"]);
	assert.equal(merged.messageMetadata.source, "default");
	assert.equal(merged.messageMetadata.urgency, "high");
	assert.equal(merged.smartGeneration.enabled, true);
	assert.equal(merged.smartGeneration.widthClass, "wide");
	assert.match(merged.contextDescription, /Default context/u);
	assert.match(merged.contextDescription, /Local context/u);
});

test("sanitizeMessagesForTransport drops inline file payloads and masks nested data URLs", () => {
	const messages = [
		{
			id: "m1",
			role: "user",
			parts: [
				{ type: "text", text: "hello" },
				{
					type: "file",
					url: "data:image/png;base64,abc",
					mediaType: "image/png",
				},
				{
					type: "data-widget",
					data: {
						image: "data:image/png;base64,def",
						plain: "keep",
					},
				},
			],
		},
	];

	const sanitized = sanitizeMessagesForTransport(messages);

	assert.equal(sanitized[0].parts.length, 2);
	assert.equal(sanitized[0].parts[0].type, "text");
	assert.deepEqual(sanitized[0].parts[1].data, {
		image: "[inline data omitted]",
		plain: "keep",
	});
});

test("compact thread helpers preserve stable persistence and titles", () => {
	assert.equal(deriveCompactThreadTitle(""), "New chat");
	assert.equal(
		deriveCompactThreadTitle("   This is a very long request that should become a compact thread title with an ellipsis   "),
		"This is a very long request that should becom...",
	);
	assert.equal(
		buildCompactThreadPersistKey("thread-1", [{ id: "m1", role: "user", parts: [] }]),
		JSON.stringify({ threadId: "thread-1", messages: [{ id: "m1", role: "user", parts: [] }] }),
	);
});

test("chat request body and payload errors stay normalized", () => {
	assert.deepEqual(
		buildSendMessageBody(
			{
				backendPreference: "rovo",
				clientTimeZone: "  Australia/Sydney  ",
				creationMode: "agent",
			},
			true,
		),
		{
			approval: undefined,
			backendPreference: "rovo",
			clarification: undefined,
			clientTimeZone: "Australia/Sydney",
			contextDescription: undefined,
			creationMode: "agent",
			deferredToolResponse: undefined,
			hasQueuedPrompts: true,
			hermesContext: undefined,
			planRequestId: undefined,
			smartGeneration: undefined,
			userName: undefined,
		},
	);
	assert.equal(isPayloadTooLargeError(JSON.stringify({ error: { message: "PayloadTooLargeError" } })), true);
});
