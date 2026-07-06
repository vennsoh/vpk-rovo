const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));
const test = require("node:test");
const esbuild = require("esbuild");

const ROVO_SHELL_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/rovo/components/rovo-app-shell.tsx"),
	"utf8",
);
const STUDIO_SHELL_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/studio/components/rovo-app-shell.tsx"),
	"utf8",
);

async function loadRovoAppShellPaneLayoutCoreHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToString } from "react-dom/server";
				import { RovoAppShellPaneLayoutCore } from "./components/projects/rovo-core/components/rovo-app-shell-pane-layout.tsx";

				function renderLayout(options = {}) {
					return renderToString(
						React.createElement(RovoAppShellPaneLayoutCore, {
							artifactOrigin: { left: 16, top: 24, width: 320, height: 96 },
							artifactPane: React.createElement("aside", { id: "artifact-pane" }, "artifact"),
							artifactPanelId: "artifact-pane-panel",
							chatPane: React.createElement("section", { id: "chat-pane" }, "chat"),
							chatPanelId: "chat-pane-panel",
							minArtifactPaneWidth: 320,
							minChatPaneWidth: 440,
							onArtifactSplitLayoutChanged: () => {},
							shouldSplitArtifactPane: Boolean(options.shouldSplitArtifactPane),
							shellSize: { width: 1280, height: 720 },
							splitArtifactPaneDefaultSize: 480,
							splitChatPaneDefaultSize: 800,
							splitChatPaneMaxSize: 800,
							priorityPane: options.priorityPane ?? undefined,
						}),
					);
				}

				export function renderPriorityLayout() {
					return renderLayout({
						priorityPane: React.createElement("div", { id: "priority-pane" }, "priority"),
						shouldSplitArtifactPane: true,
					});
				}

				export function renderStackedLayout() {
					return renderLayout({ shouldSplitArtifactPane: false });
				}

				export function renderSplitLayout() {
					return renderLayout({ shouldSplitArtifactPane: true });
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "rovo-app-shell-pane-layout-core-harness.tsx",
		},
		bundle: true,
		format: "cjs",
		loader: {
			".css": "empty",
		},
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("RovoAppShellPaneLayoutCore renders priority pane before split or overlay panes", async () => {
	const harness = await loadRovoAppShellPaneLayoutCoreHarness();
	const markup = harness.renderPriorityLayout();

	assert.match(markup, /<div class="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background"><div id="priority-pane">priority<\/div><\/div>/);
	assert.doesNotMatch(markup, /data-slot="resizable-panel-group"/);
	assert.doesNotMatch(markup, /id="artifact-pane-panel"/);
	assert.doesNotMatch(markup, /id="chat-pane-panel"/);
});

test("RovoAppShellPaneLayoutCore keeps the chat pane inside a stable resizable group in stacked mode", async () => {
	const harness = await loadRovoAppShellPaneLayoutCoreHarness();
	const markup = harness.renderStackedLayout();

	assert.match(markup, /data-slot="resizable-panel-group"/);
	assert.match(markup, /id="chat-pane-panel"/);
	assert.match(markup, /<section id="chat-pane">chat<\/section>/);
	assert.match(markup, /id="artifact-pane"/);
	assert.doesNotMatch(markup, /data-slot="resizable-handle"/);
});

test("RovoAppShellPaneLayoutCore renders the split artifact panel alongside the stable chat pane", async () => {
	const harness = await loadRovoAppShellPaneLayoutCoreHarness();
	const markup = harness.renderSplitLayout();
	const artifactPanelIndex = markup.indexOf('id="artifact-pane-panel"');
	const chatPanelIndex = markup.indexOf('id="chat-pane-panel"');

	assert.match(markup, /data-slot="resizable-panel-group"/);
	assert.match(markup, /id="chat-pane-panel"/);
	assert.match(markup, /id="chat-pane-panel"[\s\S]*<div class="min-h-0"/);
	assert.match(markup, /<section id="chat-pane">chat<\/section>/);
	assert.match(markup, /data-slot="resizable-handle"/);
	assert.match(markup, /id="artifact-pane-panel"/);
	assert.match(markup, /id="artifact-pane-panel"[\s\S]*<div class="min-h-0"/);
	assert.match(markup, /<aside id="artifact-pane">artifact<\/aside>/);
	assert.ok(artifactPanelIndex >= 0);
	assert.ok(chatPanelIndex >= 0);
	assert.ok(artifactPanelIndex < chatPanelIndex);
});

test("Rovo and Studio shells import the pane layout core directly", () => {
	for (const source of [ROVO_SHELL_SOURCE, STUDIO_SHELL_SOURCE]) {
		assert.match(
			source,
			/import \{ RovoAppShellPaneLayoutCore as RovoAppShellPaneLayout \} from "@\/components\/projects\/rovo-core\/components\/rovo-app-shell-pane-layout";/u,
		);
		assert.doesNotMatch(
			source,
			/components\/projects\/(?:rovo|studio)\/components\/rovo-app-shell-pane-layout/u,
		);
	}

	assert.match(
		STUDIO_SHELL_SOURCE,
		/priorityPane=\{shouldShowAgentConfigPane \? agentConfigPane : undefined\}/u,
	);
	assert.doesNotMatch(STUDIO_SHELL_SOURCE, /shouldShowAgentConfigPane=\{shouldShowAgentConfigPane\}/u);
});
