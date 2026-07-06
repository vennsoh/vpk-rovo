"use strict";

const {
	resolveRovoAppTurnBackendPreference: defaultResolveRovoAppTurnBackendPreference,
} = require("../chat/route-decision");
const {
	buildRovoAppArtifactContext: defaultBuildRovoAppArtifactContext,
} = require("./rovo-app-artifact-generation");
const { getNonEmptyString } = require("./shared-utils");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createRovoAppManagedRunChatDispatcher requires ${name}`);
	}
	return value;
}

function buildBrowserContextBlock(threadId) {
	return [
		"[BROWSER TOOLS]",
		"You have access to a thread-bound browser workspace runtime.",
		`For every browser tool call in this conversation, pass \`thread_id: \"${threadId}\"\`.`,
		"When you need to browse a web page, take a screenshot, or interact with a website, use these browser_* tools:",
		"- browser_navigate — navigate to a URL",
		"- browser_take_screenshot — capture a screenshot of the current page",
		"- browser_snapshot — get an accessibility tree snapshot of the page",
		"- browser_click — click an element by accessibility ref",
		"- browser_hover — hover an element by accessibility ref",
		"- browser_fill — replace the text in an element by accessibility ref",
		"- browser_type — type text into an element by accessibility ref",
		"- browser_select — select one or more values by accessibility ref",
		"- browser_press_key — press a keyboard key",
		"- browser_scroll — scroll the page",
		"- browser_navigate_back — go back in history",
		"- browser_navigate_forward — go forward in history",
		"- browser_reload — reload the current page",
		"- browser_tab_list — list browser tabs",
		"- browser_tab_new — open a new tab",
		"- browser_tab_select — switch to a tab by index",
		"- browser_tab_close — close a tab by index",
		"- browser_wait — wait a short time before continuing",
		"",
		"IMPORTANT: Do NOT use Playwright MCP, get_skill, browsing_get_web, get_url, or other built-in browsing tools for web browsing here.",
		"Always use browser_snapshot after navigation or significant DOM changes to refresh refs before interacting again.",
		"[END BROWSER TOOLS]",
	].join("\n");
}

function buildWikiCaptureContextBlock(threadId) {
	return [
		"[WIKI TOOLS]",
		"You can save durable webpage sources and reusable synthesis pages into the llm-wiki.",
		"For normal answering, you also receive a wiki query context block before each turn whenever relevant canonical pages match the user request.",
		"Use these wiki tools when the user wants a webpage saved, clipped, remembered, added to the wiki, or when a reusable answer should be saved back into the wiki:",
		"- wiki_capture_url — save a specific public URL into llm-wiki/raw",
		"- wiki_capture_active_page — save the current page from the thread-bound browser workspace",
		"- wiki_save_synthesis — save a reusable answer as a canonical llm-wiki/wiki/synthesis page",
		`For wiki_capture_active_page calls, pass \`thread_id: \"${threadId}\"\`.`,
		"Prefer wiki_capture_active_page for requests like 'save this page' after browsing in-thread.",
		"Prefer wiki_capture_url when the user pasted or mentioned a direct URL.",
		"When your answer seems broadly reusable, offer to save it to the wiki. If the user confirms, call wiki_save_synthesis with a clear title and markdown body.",
		"Do not capture search-result pages, localhost/private URLs, login walls, or obviously thin pages.",
		"After a successful wiki tool call, briefly confirm what was saved, where it went, or why it was skipped.",
		"[END WIKI TOOLS]",
	].join("\n");
}

function createRovoAppManagedRunChatDispatcher({
	buildRovoAppArtifactContext = defaultBuildRovoAppArtifactContext,
	dispatchChatSdkRequestInProcess,
	isRovoAvailable,
	now = () => Date.now(),
	persistRovoAppRunBackend,
	resolveRovoAppTurnBackendPreference = defaultResolveRovoAppTurnBackendPreference,
} = {}) {
	requireFunction("buildRovoAppArtifactContext", buildRovoAppArtifactContext);
	requireFunction("dispatchChatSdkRequestInProcess", dispatchChatSdkRequestInProcess);
	requireFunction("isRovoAvailable", isRovoAvailable);
	requireFunction("now", now);
	requireFunction("persistRovoAppRunBackend", persistRovoAppRunBackend);
	requireFunction("resolveRovoAppTurnBackendPreference", resolveRovoAppTurnBackendPreference);

	async function dispatchRovoAppManagedRunChat({
		activeArtifact,
		autoPlanTriggered,
		effectiveBaseContextDescription,
		requestBody,
		requestIsPlanMode,
		routingDecision,
		signal,
		stageTrace,
		threadId,
	}) {
		const artifactContextBlock = buildRovoAppArtifactContext(activeArtifact);
		const browserContextBlock = buildBrowserContextBlock(threadId);
		const wikiCaptureContextBlock = buildWikiCaptureContextBlock(threadId);

		const contextBlocks = [
			artifactContextBlock,
			browserContextBlock,
			wikiCaptureContextBlock,
			effectiveBaseContextDescription,
		].filter(Boolean);
		if (contextBlocks.length > 0) {
			requestBody.contextDescription = contextBlocks.join("\n\n");
		}
		if (routingDecision.intent === "genui") {
			requestBody.genuiHint = true;
		}
		requestBody.backendPreference = await resolveRovoAppTurnBackendPreference({
			isPlanModeActive: requestIsPlanMode || autoPlanTriggered,
			isRovoAvailable,
			requestBody,
			routingDecision,
		});
		await persistRovoAppRunBackend(threadId, requestBody.backendPreference);
		requestBody.resolvedPlanModeActive = requestIsPlanMode || autoPlanTriggered;
		requestBody.chatSdkSource = getNonEmptyString(requestBody.chatSdkSource) || "rovo";
		requestBody.threadId = threadId;

		const internalProxyStartedAtMs = now();
		const response = await dispatchChatSdkRequestInProcess({
			body: requestBody,
			headers: stageTrace.getHeaders(),
			signal,
		});
		stageTrace.mark("chat_sdk_response_headers", {
			stageMs: now() - internalProxyStartedAtMs,
			status: response.status,
			contentType: response.headers.get("content-type") || null,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(errorText || "Failed to stream Rovo response");
		}

		return response;
	}

	return {
		dispatchRovoAppManagedRunChat,
	};
}

module.exports = {
	buildBrowserContextBlock,
	buildWikiCaptureContextBlock,
	createRovoAppManagedRunChatDispatcher,
};
