"use strict";

function buildFreshRovoStreamOptions({
	activeAttemptMessage,
	approvalSubmission,
	approvalToolCallId,
	rovoCancelChat,
	rovoResumeToolCalls,
	rovoSessionId,
	streamCommonOptions = {},
} = {}) {
	return {
		message: activeAttemptMessage,
		sessionId: rovoSessionId || undefined,
		...streamCommonOptions,
		...(approvalSubmission && approvalToolCallId
			? {
					conflictPolicy: "cancel-and-retry",
					cancelConflictTurn: async (port) => {
						try {
							await rovoResumeToolCalls(port, {
								decisions: [{
									tool_call_id: approvalToolCallId,
									deny_message:
										"Plan approval superseded — starting fresh build turn.",
								}],
							});
						} catch {
							// Resume may fail if the tool call ID doesn't match; cancellation still clears the stale turn.
						}
						await rovoCancelChat(port, { timeoutMs: 5_000 });
					},
				}
			: {}),
	};
}

async function runFreshRovoStreamTurn({
	streamViaRovo,
	...options
} = {}) {
	await streamViaRovo(buildFreshRovoStreamOptions(options));
}

module.exports = {
	buildFreshRovoStreamOptions,
	runFreshRovoStreamTurn,
};
