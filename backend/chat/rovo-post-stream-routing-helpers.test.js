"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createRovoRouteWidgetPayloadDecorator,
	resolveRovoRouteToolsDetected,
} = require("./rovo-post-stream-routing-helpers");

test("resolveRovoRouteToolsDetected preserves strict and non-strict detection rules", () => {
	assert.equal(
		resolveRovoRouteToolsDetected({
			hasObservedActionableToolCall: false,
			hasToolObservationEntries: true,
			isStrictToolFirstTurn: false,
		}),
		true,
	);
	assert.equal(
		resolveRovoRouteToolsDetected({
			hasObservedActionableToolCall: true,
			hasObservedRelevantActionableToolCall: false,
			hasRelevantToolObservation: false,
			hasToolObservationEntries: true,
			isStrictToolFirstTurn: true,
		}),
		false,
	);
	assert.equal(
		resolveRovoRouteToolsDetected({
			hasObservedRelevantActionableToolCall: false,
			hasRelevantToolObservation: true,
			isStrictToolFirstTurn: true,
		}),
		true,
	);
});

test("createRovoRouteWidgetPayloadDecorator adds content type and source metadata", () => {
	const decorator = createRovoRouteWidgetPayloadDecorator({
		latestUserMessage: "Send a Slack update",
		resolveToolFirstWidgetContentType: (input) => {
			assert.deepEqual(input, {
				primaryDomains: ["slack"],
				relevanceDomains: ["jira"],
				lastRelevantToolName: "slack_send_message",
				prompt: "Send a Slack update",
			});
			return "message";
		},
		resolveToolFirstWidgetSource: () => ({
			name: "Slack",
			logoSrc: "/3p/slack/16-borderless.svg",
		}),
		toolFirstExecutionState: {
			lastRelevantToolName: "slack_send_message",
		},
		toolFirstPolicy: {
			domains: ["slack"],
			relevanceDomains: ["jira"],
		},
	});

	assert.deepEqual(decorator({ spec: { type: "card" } }), {
		spec: { type: "card" },
		widgetContentType: "message",
		source: {
			name: "Slack",
			logoSrc: "/3p/slack/16-borderless.svg",
		},
	});
});

test("createRovoRouteWidgetPayloadDecorator preserves explicit source fields", () => {
	const payload = {
		spec: { type: "card" },
		source: {
			name: "Custom",
			logoSrc: "/custom.svg",
		},
	};
	const decorator = createRovoRouteWidgetPayloadDecorator({
		resolveToolFirstWidgetContentType: () => null,
		resolveToolFirstWidgetSource: () => ({
			name: "Slack",
			logoSrc: "/3p/slack/16-borderless.svg",
		}),
	});

	assert.deepEqual(decorator(payload), {
		spec: { type: "card" },
		source: {
			name: "Custom",
			logoSrc: "/custom.svg",
		},
	});
});

test("createRovoRouteWidgetPayloadDecorator returns the original payload when undecorated", () => {
	const payload = { spec: { type: "card" } };
	const decorator = createRovoRouteWidgetPayloadDecorator({
		resolveToolFirstWidgetContentType: () => null,
		resolveToolFirstWidgetSource: () => null,
	});

	assert.equal(decorator(payload), payload);
});
