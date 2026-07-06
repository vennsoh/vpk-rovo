"use strict";

function createRovoStreamTextDeltaHandler({
	creationMode,
	emitLazyThinkingStatus,
	rovoMarkerStream,
	stageTrace,
} = {}) {
	let hasMarkedFirstRovoTextDelta = false;
	let rawAgentCreationAssistantText = "";

	const handleStreamTextDelta = (delta) => {
		if (typeof delta !== "string" || delta.length === 0) {
			return false;
		}
		if (!hasMarkedFirstRovoTextDelta) {
			hasMarkedFirstRovoTextDelta = true;
			stageTrace.mark("first_rovo_text_delta", {
				chars: delta.length,
			});
		}

		emitLazyThinkingStatus();
		if (creationMode === "agent") {
			rawAgentCreationAssistantText += delta;
		}
		rovoMarkerStream.push(delta);
		return true;
	};

	return {
		getRawAgentCreationAssistantText: () =>
			rawAgentCreationAssistantText,
		handleStreamTextDelta,
	};
}

module.exports = {
	createRovoStreamTextDeltaHandler,
};
