"use strict";

const {
	formatRouteDecisionSSE: defaultFormatRouteDecisionSSE,
} = require("./route-decision");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createRovoAppManagedRunResponseCompleter requires ${name}`);
	}
	return value;
}

function createRovoAppManagedRunResponseCompleter({
	consumeRovoAppManagedResponse,
	formatRouteDecisionSSE = defaultFormatRouteDecisionSSE,
} = {}) {
	requireFunction("consumeRovoAppManagedResponse", consumeRovoAppManagedResponse);
	requireFunction("formatRouteDecisionSSE", formatRouteDecisionSSE);

	async function completeRovoAppManagedRunResponse({
		requestMessages,
		response,
		routingDecision,
		run,
		stageTrace,
		threadId,
	}) {
		await consumeRovoAppManagedResponse({
			initialMessages: requestMessages,
			prependChunk: formatRouteDecisionSSE(routingDecision),
			response,
			run,
			stageTrace,
			threadId,
		});
		stageTrace.mark("run_complete");
	}

	return {
		completeRovoAppManagedRunResponse,
	};
}

module.exports = {
	createRovoAppManagedRunResponseCompleter,
};
