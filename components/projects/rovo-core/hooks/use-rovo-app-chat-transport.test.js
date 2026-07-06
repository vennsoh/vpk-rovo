const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const CORE_TRANSPORT_SOURCE = fs.readFileSync(
	path.join(__dirname, "use-rovo-app-chat-transport.ts"),
	"utf8",
);
const CORE_HOOK_SOURCE = fs.readFileSync(
	path.join(__dirname, "use-rovo-app-core.ts"),
	"utf8",
);
const ROVO_HOOK_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/rovo/hooks/use-rovo-app.ts"),
	"utf8",
);
const STUDIO_HOOK_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/studio/hooks/use-rovo-app.ts"),
	"utf8",
);

test("Rovo app chat transport construction is shared by rovo-core", () => {
	assert.match(CORE_TRANSPORT_SOURCE, /new DefaultChatTransport<RovoUIMessage>\(\{/u);
	assert.match(CORE_TRANSPORT_SOURCE, /api: API_ENDPOINTS\.ROVO_APP_CHAT/u);
	assert.match(CORE_TRANSPORT_SOURCE, /prepareSendMessagesRequest: \(\{ messages, body \}\) => \{/u);
	assert.match(CORE_TRANSPORT_SOURCE, /body: buildRovoAppChatRequestBody\(\{[\s\S]*\.\.\.routeAdapter\.chatRequestBodyOptions,[\s\S]*pendingArtifactCreationRetry: pendingArtifactCreationRetryRef\.current,[\s\S]*smartGenerationRequest,/u);

	assert.match(CORE_HOOK_SOURCE, /useRovoAppChatTransport\(\{[\s\S]*routeAdapter,[\s\S]*threadVisibility,[\s\S]*\}\);/u);
	assert.doesNotMatch(CORE_HOOK_SOURCE, /new DefaultChatTransport<RovoUIMessage>/u);
	assert.doesNotMatch(CORE_HOOK_SOURCE, /prepareSendMessagesRequest: \(\{ messages, body \}\)/u);

	assert.match(ROVO_HOOK_SOURCE, /routeAdapter: rovoAppAdapter,/u);
	assert.match(STUDIO_HOOK_SOURCE, /routeAdapter: studioAppAdapter,/u);
});
