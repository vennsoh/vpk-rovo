"use strict";

function buildLocalModelErrorText(error) {
	return `Local model error: ${error instanceof Error ? error.message : String(error)}\n\nMake sure mlx_lm.server is running:\n\`\`\`\nmlx_lm.server --model mlx-community/Qwen3-0.6B-MLX-8bit --port 8800\n\`\`\``;
}

function createLocalModelStream({
	conversationHistory,
	createUIMessageStream,
	latestUserMessage,
	logger = console,
	now = Date.now,
	streamLocalModel,
} = {}) {
	return createUIMessageStream({
		execute: async ({ writer }) => {
			try {
				await streamLocalModel({
					userMessage: latestUserMessage,
					conversationHistory,
					writer,
				});
			} catch (error) {
				logger.error?.("[LOCAL-MODEL] Stream error:", error);
				const errorId = `local-error-${now()}`;
				writer.write({ type: "text-start", id: errorId });
				writer.write({
					type: "text-delta",
					id: errorId,
					delta: buildLocalModelErrorText(error),
				});
				writer.write({ type: "text-end", id: errorId });
				writer.write({
					type: "data-turn-complete",
					data: { timestamp: new Date(now()).toISOString() },
				});
			}
		},
		onError: (error) =>
			error instanceof Error ? error.message : "Local model request failed",
	});
}

function handleLocalModelTurn({
	conversationHistory,
	createUIMessageStream,
	isLocalModelRequest,
	latestUserMessage,
	logger = console,
	now = Date.now,
	pipeUIMessageStreamToResponse,
	provider,
	rawModel,
	res,
	streamLocalModel,
} = {}) {
	if (typeof isLocalModelRequest !== "function" || !isLocalModelRequest(provider, rawModel)) {
		return false;
	}

	logger.info?.("[CHAT-SDK] Routing through local MLX model", {
		provider,
		model: rawModel,
	});
	const stream = createLocalModelStream({
		conversationHistory,
		createUIMessageStream,
		latestUserMessage,
		logger,
		now,
		streamLocalModel,
	});
	pipeUIMessageStreamToResponse({ response: res, stream });
	return true;
}

module.exports = {
	buildLocalModelErrorText,
	createLocalModelStream,
	handleLocalModelTurn,
};
