"use strict";

function finalizeRovoPlanWidgetPostStream({
	emitPlanWidgetLoading,
	emitWidgetError,
	hasEmittedPlanLoadingState = false,
	hasEmittedPlanWidget = false,
	hasExplicitPlanPayload = false,
	hasSeenPlanWidgetSignal = false,
} = {}) {
	const shouldEmitPlanWidgetError =
		hasSeenPlanWidgetSignal &&
		!hasEmittedPlanWidget;
	let closedLoading = false;
	let emittedError = false;

	if (shouldEmitPlanWidgetError) {
		if (hasEmittedPlanLoadingState) {
			emitPlanWidgetLoading(false);
			closedLoading = true;
		}

		emitWidgetError({
			type: "plan",
			message:
				"I couldn't finish building the plan card. Retry and I'll regenerate it.",
			canRetry: true,
		});
		emittedError = true;
	} else if (
		hasEmittedPlanWidget &&
		!hasExplicitPlanPayload &&
		hasEmittedPlanLoadingState
	) {
		emitPlanWidgetLoading(false);
		closedLoading = true;
	}

	return {
		closedLoading,
		emittedError,
	};
}

module.exports = {
	finalizeRovoPlanWidgetPostStream,
};
