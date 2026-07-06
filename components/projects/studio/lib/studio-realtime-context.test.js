const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

function loadStudioRealtimeContextModule() {
	const result = esbuild.buildSync({
		entryPoints: [path.join(process.cwd(), "components/projects/studio/lib/studio-realtime-context.ts")],
		bundle: true,
		format: "cjs",
		logLevel: "silent",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "studio-realtime-context.cjs");
}

const {
	STUDIO_REALTIME_RESULT_SUMMARY_MAX_CHARS,
	buildStudioRealtimeArtifactContextSummary,
	buildStudioRealtimeResultSummary,
	buildStudioRealtimeThreadSummary,
	resolveStudioRealtimeSessionIdentity,
	resolveStudioRealtimeStatusMessage,
} = loadStudioRealtimeContextModule();

function textPart(text) {
	return {
		type: "text",
		text,
		state: "done",
	};
}

function artifactResultPart(action, title) {
	return {
		type: "data-artifact-result",
		data: {
			action,
			artifactId: `${title.toLowerCase().replace(/\s+/gu, "-")}-artifact`,
			kind: "html",
			title,
		},
	};
}

function message(role, parts) {
	return { role, parts };
}

test("thread summary keeps Studio artifact context and role labels", () => {
	assert.equal(
		buildStudioRealtimeThreadSummary([
			message("system", [textPart("Ignore system setup")]),
			message("user", [textPart("Build a digest agent")]),
			message("assistant", [textPart("Done"), artifactResultPart("create", "Agent brief")]),
			message("assistant", [artifactResultPart("update", "Agent brief")]),
		]),
		[
			"user: Build a digest agent",
			"assistant: Done Created artifact \"Agent brief\".",
			"assistant: Updated artifact \"Agent brief\".",
		].join("\n"),
	);
});

test("result summary preserves artifact wording and truncates long output", () => {
	assert.equal(
		buildStudioRealtimeResultSummary(message("assistant", [
			textPart("Review the generated profile."),
			artifactResultPart("create", "Agent profile"),
		])),
		"Studio created artifact \"Agent profile\". Review the generated profile.",
	);

	assert.equal(
		buildStudioRealtimeResultSummary(message("assistant", [])),
		"Studio completed the task.",
	);

	assert.equal(
		buildStudioRealtimeResultSummary(message("assistant", [textPart("x".repeat(700))])).length,
		STUDIO_REALTIME_RESULT_SUMMARY_MAX_CHARS,
	);
});

test("artifact context summary includes document identity and annotations", () => {
	assert.equal(
		buildStudioRealtimeArtifactContextSummary({
			annotationContext: "Annotation: needs review",
			document: {
				id: "doc-1",
				kind: "html",
				title: "Agent profile",
			},
		}),
		[
			"Artifact open: Agent profile",
			"Document ID: doc-1",
			"Kind: html",
			"Annotation: needs review",
		].join("\n"),
	);
	assert.equal(buildStudioRealtimeArtifactContextSummary({ annotationContext: null, document: null }), null);
});

test("realtime status and session identity preserve shell fallback behavior", () => {
	assert.equal(resolveStudioRealtimeStatusMessage({ statusMessage: " Connecting ", voiceState: "connecting" }), "Connecting");
	assert.equal(resolveStudioRealtimeStatusMessage({ connectionState: "reconnecting", voiceState: "connecting" }), "Reconnecting voice...");
	assert.equal(resolveStudioRealtimeStatusMessage({ connectionStatus: "disconnected", voiceState: "idle" }), "Voice disconnected");
	assert.equal(resolveStudioRealtimeStatusMessage({ connectionStatus: "connected", voiceState: "connected" }), null);

	assert.equal(resolveStudioRealtimeSessionIdentity({ sessionId: "session-1", voiceState: "connected" }, "thread-1", "runtime-1"), "session-1");
	assert.equal(resolveStudioRealtimeSessionIdentity({ connectionState: "connected", voiceState: "connected" }, "thread-1", "runtime-1"), "connected");
	assert.equal(resolveStudioRealtimeSessionIdentity({ voiceState: "listening" }, null, "runtime-1"), "runtime-1:listening");
	assert.equal(resolveStudioRealtimeSessionIdentity({ voiceState: "idle" }, "thread-1", "runtime-1"), null);
});
