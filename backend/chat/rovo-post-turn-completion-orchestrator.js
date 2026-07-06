"use strict";

const {
	completeRovoPostTurn: defaultCompleteRovoPostTurn,
} = require("./post-turn");

async function runRovoPostTurnCompletion({
	completeRovoPostTurn = defaultCompleteRovoPostTurn,
	finalizePlanExecutionArtifactPostStream,
	postStreamRoutingResult,
	requestUserInputQuestionCardEmitter,
	...postTurnOptions
} = {}) {
	return completeRovoPostTurn({
		...postTurnOptions,
		closePendingQuestionCardLoading: () =>
			requestUserInputQuestionCardEmitter.closePendingLoading(),
		finalizePlanExecutionArtifactPostStreamFn:
			finalizePlanExecutionArtifactPostStream,
		getRouteToolsDetected: postStreamRoutingResult.getRouteToolsDetected,
		hasEmittedGenuiWidget: postStreamRoutingResult.hasEmittedGenuiWidget,
	});
}

module.exports = {
	runRovoPostTurnCompletion,
};
