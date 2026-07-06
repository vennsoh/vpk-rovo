"use strict";

const {
	createUIMessageStream: defaultCreateUIMessageStream,
	createUIMessageStreamResponse: defaultCreateUIMessageStreamResponse,
} = require("ai");
const {
	inferRovoAppArtifactKindFromContent,
} = require("./rovo-app-artifact-kind");
const {
	deriveRovoAppArtifactDeltaType,
	shouldUseWorkItemVpkHtmlReportGenerator,
} = require("./rovo-app-artifact-generation");
const {
	generateAndPersistRovoAppArtifact: defaultGenerateAndPersistRovoAppArtifact,
} = require("./rovo-app-artifact-runner");
const {
	generateWorkItemVpkHtmlReport: defaultGenerateWorkItemVpkHtmlReport,
} = require("./work-item-vpk-html-report-generator");
const { createRouteDecisionPart } = require("./route-decision");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createRovoAppArtifactToolResponseStreamer requires ${name}`);
	}
	return value;
}

function createRovoAppArtifactToolResponseStreamer({
	createUIMessageStream = defaultCreateUIMessageStream,
	createUIMessageStreamResponse = defaultCreateUIMessageStreamResponse,
	generateAndPersistRovoAppArtifact = defaultGenerateAndPersistRovoAppArtifact,
	generateRovoAppArtifactText,
	generateRovoAppArtifactTitleFromContent,
	generateSuggestedQuestions,
	generateTextViaGateway,
	generateWorkItemVpkHtmlReport = defaultGenerateWorkItemVpkHtmlReport,
	inferArtifactKindFromContent = inferRovoAppArtifactKindFromContent,
	logger = console,
	rovoAppDocumentManager,
	rovoAppThreadManager,
} = {}) {
	requireFunction("createUIMessageStream", createUIMessageStream);
	requireFunction("createUIMessageStreamResponse", createUIMessageStreamResponse);
	requireFunction("generateAndPersistRovoAppArtifact", generateAndPersistRovoAppArtifact);
	requireFunction("generateRovoAppArtifactText", generateRovoAppArtifactText);
	requireFunction("generateRovoAppArtifactTitleFromContent", generateRovoAppArtifactTitleFromContent);
	requireFunction("generateSuggestedQuestions", generateSuggestedQuestions);
	requireFunction("generateTextViaGateway", generateTextViaGateway);
	requireFunction("generateWorkItemVpkHtmlReport", generateWorkItemVpkHtmlReport);
	requireFunction("inferArtifactKindFromContent", inferArtifactKindFromContent);
	requireFunction("logger.warn", logger?.warn);
	requireFunction("rovoAppDocumentManager.appendDocumentVersion", rovoAppDocumentManager?.appendDocumentVersion);
	requireFunction("rovoAppDocumentManager.deleteDocument", rovoAppDocumentManager?.deleteDocument);
	requireFunction("rovoAppDocumentManager.finalizeDocumentShell", rovoAppDocumentManager?.finalizeDocumentShell);
	requireFunction("rovoAppThreadManager.updateThread", rovoAppThreadManager?.updateThread);

	function streamRovoAppArtifactToolResponse({
		artifactAction,
		artifactDocument,
		artifactBackendPreference,
		cancelStreaming,
		changeLabel,
		contextDescription,
		conversationHistory,
		deterministicArtifactContent,
		latestUserMessage,
		requestOrigin,
		artifactThreadId,
		previousActiveDocumentId,
		provider,
		signal,
		suggestedQuestions,
	}) {
		const stream = createUIMessageStream({
			execute: async ({ writer }) => {
				// Emit cancel-streaming signal before artifact data so the frontend
				// can abort the old stream before the new one starts.
				if (cancelStreaming === true) {
					writer.write({
						type: "data-cancel-streaming",
						data: null,
						transient: true,
					});
				}

				writer.write({
					type: "data-thinking-status",
					data: {
						label: artifactAction === "updateDocument" ? "Updating artifact" : "Generating artifact",
						activity: "results",
						source: "backend",
					},
					transient: true,
				});

				writer.write({
					type: "data-kind",
					data: artifactDocument.kind,
					transient: true,
				});
				writer.write({
					type: "data-id",
					data: artifactDocument.id,
					transient: true,
				});
				writer.write({
					type: "data-title",
					data: artifactDocument.title,
					transient: true,
				});
				writer.write({
					type: "data-clear",
					data: null,
					transient: true,
				});

				const deltaType = deriveRovoAppArtifactDeltaType(artifactDocument.kind);
				const {
					contentToPersist,
					persistedArtifactDocument,
					titleChanged,
					kindChanged,
				} = await generateAndPersistRovoAppArtifact({
					artifactAction,
					artifactDocument,
					changeLabel,
					fallbackTitle: artifactDocument.title,
					latestUserMessage,
					generateArtifactText: async ({ onTextDelta }) => {
						if (typeof deterministicArtifactContent === "string") {
							writer.write({
								type: deltaType,
								data: deterministicArtifactContent,
								transient: true,
							});
							if (typeof onTextDelta === "function") {
								onTextDelta(deterministicArtifactContent);
							}
							return deterministicArtifactContent;
						}

						const shouldUseWorkItemVpkHtmlSkill = shouldUseWorkItemVpkHtmlReportGenerator({
							artifactKind: artifactDocument.kind,
							contextDescription,
							latestUserMessage,
						});
						if (shouldUseWorkItemVpkHtmlSkill) {
							const report = await generateWorkItemVpkHtmlReport({
								contextDescription,
								generateText: (options) =>
									generateTextViaGateway({
										...options,
										backendPreference: "ai-gateway",
										provider: options?.provider || provider,
										signal: options?.signal || signal,
									}),
								provider,
								signal,
							});
							writer.write({
								type: deltaType,
								data: report.html,
								transient: true,
							});
							if (typeof onTextDelta === "function") {
								onTextDelta(report.html);
							}
							return report.html;
						}

						return generateRovoAppArtifactText({
							mode: artifactAction === "updateDocument" ? "update" : "create",
							title: artifactDocument.title,
							kind: artifactDocument.kind,
							latestUserMessage,
							conversationHistory,
							contextDescription,
							provider,
							backendPreference: artifactBackendPreference,
							signal,
							onTextDelta: (delta) => {
								writer.write({
									type: deltaType,
									data: delta,
									transient: true,
								});
								if (typeof onTextDelta === "function") {
									onTextDelta(delta);
								}
							},
						});
					},
					inferArtifactKindFromContent,
					rovoAppDocumentManager,
					onCreateFailure: async () => {
						const cleanupTasks = [
							rovoAppDocumentManager.deleteDocument(artifactDocument.id),
						];
						if (artifactThreadId) {
							cleanupTasks.push(
								rovoAppThreadManager.updateThread(artifactThreadId, {
									activeDocumentId: previousActiveDocumentId,
								}),
							);
						}

						const cleanupResults = await Promise.allSettled(cleanupTasks);
						for (const cleanupResult of cleanupResults) {
							if (cleanupResult.status === "rejected") {
								logger.warn(
									"[FUTURE-CHAT] Failed to clean up after artifact create failure:",
									cleanupResult.reason instanceof Error
										? cleanupResult.reason.message
										: cleanupResult.reason,
								);
							}
						}
					},
					resolveGeneratedTitle: ({ content }) =>
						generateRovoAppArtifactTitleFromContent({
							content,
							provider,
							signal,
						}),
				});

				if (titleChanged) {
					writer.write({
						type: "data-title",
						data: persistedArtifactDocument.title,
						transient: true,
					});
				}
				if (kindChanged) {
					writer.write({
						type: "data-kind",
						data: persistedArtifactDocument.kind,
						transient: true,
					});
				}

				writer.write({
					type: "data-finish",
					data: null,
					transient: true,
				});
				writer.write({
					type: "data-artifact-result",
					data: {
						documentId: persistedArtifactDocument.id,
						threadId: persistedArtifactDocument.threadId,
						title: persistedArtifactDocument.title,
						kind: persistedArtifactDocument.kind,
						action:
							artifactAction === "updateDocument"
								? "update"
								: "create",
					},
				});

				const textId = `rovo-app-artifact-summary-${Date.now()}`;
				const summaryText =
					persistedArtifactDocument.kind === "html" && artifactAction !== "updateDocument"
						? `Created report: ${persistedArtifactDocument.title}.`
						: artifactAction === "updateDocument"
							? `Updated artifact "${persistedArtifactDocument.title}".`
							: `Created artifact "${persistedArtifactDocument.title}".`;
				writer.write({ type: "text-start", id: textId });
				writer.write({
					type: "text-delta",
					id: textId,
					delta: summaryText,
				});
				writer.write({ type: "text-end", id: textId });

				writer.write(createRouteDecisionPart({
					intent:
						artifactAction === "updateDocument"
							? "artifact_update"
							: "artifact_create",
					origin: requestOrigin,
					reason: "intent_task_toolable",
				}, { transient: true }));
				writer.write({
					type: "data-turn-complete",
					data: { timestamp: new Date().toISOString() },
				});

				let resolvedSuggestedQuestions = suggestedQuestions;
				if (!Array.isArray(resolvedSuggestedQuestions)) {
					resolvedSuggestedQuestions = await generateSuggestedQuestions({
						message: latestUserMessage,
						conversationHistory,
						assistantResponse: contentToPersist,
						signal,
					}).catch(() => []);
				}

				if (Array.isArray(resolvedSuggestedQuestions) && resolvedSuggestedQuestions.length > 0) {
					writer.write({
						type: "data-suggested-questions",
						data: {
							questions: resolvedSuggestedQuestions,
						},
					});
				}
			},
			onError: (error) =>
				error instanceof Error ? error.message : "Failed to stream Rovo artifact",
		});

		return createUIMessageStreamResponse({ stream });
	}

	return {
		streamRovoAppArtifactToolResponse,
	};
}

module.exports = {
	createRovoAppArtifactToolResponseStreamer,
};
