"use strict";

const { getNonEmptyString, isPlainObject } = require("../lib/shared-utils");

function resolveRovoRouteToolsDetected({
	hasObservedActionableToolCall = false,
	hasObservedRelevantActionableToolCall = false,
	hasRelevantToolObservation = false,
	hasToolObservationEntries = false,
	isStrictToolFirstTurn = false,
} = {}) {
	if (!isStrictToolFirstTurn) {
		return Boolean(hasObservedActionableToolCall || hasToolObservationEntries);
	}

	return Boolean(
		hasObservedRelevantActionableToolCall || hasRelevantToolObservation
	);
}

function createRovoRouteWidgetPayloadDecorator({
	getNonEmptyStringFn = getNonEmptyString,
	isPlainObjectFn = isPlainObject,
	latestUserMessage,
	resolveToolFirstWidgetContentType,
	resolveToolFirstWidgetSource,
	toolFirstExecutionState = {},
	toolFirstPolicy = {},
} = {}) {
	const resolveRouteWidgetContentType = () =>
		typeof resolveToolFirstWidgetContentType === "function"
			? resolveToolFirstWidgetContentType({
				primaryDomains: toolFirstPolicy?.domains,
				relevanceDomains: toolFirstPolicy?.relevanceDomains,
				lastRelevantToolName: toolFirstExecutionState?.lastRelevantToolName,
				prompt: latestUserMessage,
			})
			: null;

	const resolveRouteWidgetSource = () =>
		typeof resolveToolFirstWidgetSource === "function"
			? resolveToolFirstWidgetSource({
				primaryDomains: toolFirstPolicy?.domains,
				relevanceDomains: toolFirstPolicy?.relevanceDomains,
				lastRelevantToolName: toolFirstExecutionState?.lastRelevantToolName,
				prompt: latestUserMessage,
			})
			: null;

	return (payload) => {
		const widgetContentType = resolveRouteWidgetContentType();
		const widgetSource = resolveRouteWidgetSource();
		if (!widgetContentType && !widgetSource) {
			return payload;
		}

		const nextPayload = { ...payload };
		if (widgetContentType) {
			nextPayload.widgetContentType = widgetContentType;
		}

		if (widgetSource) {
			const currentSource = isPlainObjectFn(payload?.source)
				? payload.source
				: null;
			const currentName = getNonEmptyStringFn(currentSource?.name);
			const currentLogoSrc = getNonEmptyStringFn(currentSource?.logoSrc);

			nextPayload.source = {
				name: currentName || widgetSource.name,
				...(currentLogoSrc || widgetSource.logoSrc
					? { logoSrc: currentLogoSrc || widgetSource.logoSrc }
					: {}),
			};
		}

		return {
			...nextPayload,
		};
	};
}

module.exports = {
	createRovoRouteWidgetPayloadDecorator,
	resolveRovoRouteToolsDetected,
};
