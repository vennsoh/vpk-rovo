const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createClarificationResponseHelpers,
	getToolCallIdFromClarificationSubmission,
	normalizeClarificationAnswerValue,
	normalizeClarificationAnswers,
	normalizeClarificationSubmission,
} = require("./clarification-response");

function createStreamHarness(overrides = {}) {
	const piped = [];
	let timestamp = 10_000;
	const helpers = createClarificationResponseHelpers({
		clarificationWidgetType: "question-card",
		createUIMessageStream: (definition) => definition,
		pipeUIMessageStreamToResponse: ({ response, stream }) => {
			piped.push({ response, stream });
		},
		now: () => timestamp++,
		toIsoString: () => "2026-07-05T00:00:00.000Z",
		...overrides,
	});

	return {
		helpers,
		piped,
	};
}

async function collectStreamParts(stream) {
	const parts = [];
	await stream.execute({
		writer: {
			write: (part) => parts.push(part),
		},
	});
	return parts;
}

test("normalizes clarification answer values", () => {
	assert.equal(normalizeClarificationAnswerValue("  yes  "), "yes");
	assert.equal(normalizeClarificationAnswerValue("   "), null);
	assert.deepEqual(
		normalizeClarificationAnswerValue(["  a", "", "b  ", 2]),
		["a", "b"],
	);
	assert.equal(normalizeClarificationAnswerValue(123), null);
});

test("normalizes clarification submissions and aliases tool ids", () => {
	assert.equal(normalizeClarificationSubmission(null), null);
	assert.equal(normalizeClarificationSubmission({ sessionId: "s-1" }), null);

	assert.deepEqual(normalizeClarificationAnswers({
		" q-1 ": "  A ",
		"q-2": [" B ", "", "C"],
		"q-3": "",
	}), {
		"q-1": "A",
		"q-2": ["B", "C"],
	});

	assert.deepEqual(normalizeClarificationSubmission({
		sessionId: " session-1 ",
		round: "2",
		completed: 1,
		status: "answered",
		answers: {
			" q-1 ": "  A ",
		},
		deferredToolCallId: " tool-1 ",
	}), {
		sessionId: "session-1",
		round: 2,
		completed: true,
		status: "answered",
		answers: {
			"q-1": "A",
		},
		toolCallId: "tool-1",
		deferredToolCallId: "tool-1",
	});
});

test("gets clarification tool id from explicit fields or request-user-input sessions", () => {
	assert.equal(getToolCallIdFromClarificationSubmission({
		toolCallId: " explicit ",
		sessionId: "request-user-input-derived",
	}), "explicit");
	assert.equal(getToolCallIdFromClarificationSubmission({
		deferredToolCallId: " deferred ",
	}), "deferred");
	assert.equal(getToolCallIdFromClarificationSubmission({
		sessionId: "request-user-input-derived",
	}), "derived");
	assert.equal(getToolCallIdFromClarificationSubmission({
		sessionId: "ordinary-session",
	}), null);
});

test("adapts request-user-input answers using shared question metadata", () => {
	const requestUserInputQuestionMetaStore = new Map([
		["request-user-input-call-1", [{
			id: "q-1",
			label: "Which mode?",
			options: [{ id: "opt-a", label: "Fast" }],
		}]],
	]);
	const { helpers } = createStreamHarness({ requestUserInputQuestionMetaStore });

	assert.deepEqual(
		helpers.adaptClarificationAnswersForToolContract(
			"request-user-input-call-1",
			{ "q-1": "opt-a" },
		),
		{ "Which mode?": ["Fast"] },
	);
	assert.deepEqual(
		helpers.adaptClarificationAnswersForToolContract(
			"ordinary-session",
			{ "q-1": "opt-a" },
		),
		{ "q-1": "opt-a" },
	);
});

test("streams expired clarification response with widget error and turn completion", async () => {
	const response = {};
	const { helpers, piped } = createStreamHarness();

	helpers.streamExpiredClarificationResponse(response, "tool-call-1");

	assert.equal(piped.length, 1);
	assert.equal(piped[0].response, response);
	const parts = await collectStreamParts(piped[0].stream);
	assert.deepEqual(parts.map((part) => part.type), [
		"text-start",
		"text-delta",
		"text-end",
		"data-widget-error",
		"data-turn-complete",
	]);
	assert.equal(parts[1].delta.includes("expired"), true);
	assert.equal(parts[3].data.type, "question-card");
	assert.equal(parts[3].data.code, "deferred_tool_expired");
	assert.deepEqual(parts[4].data, {
		timestamp: "2026-07-05T00:00:00.000Z",
	});
});

test("streams standalone question-card widget with optional intro text", async () => {
	const response = {};
	const payload = {
		sessionId: "session-1",
		round: 1,
		questions: [],
	};
	const { helpers, piped } = createStreamHarness();

	helpers.streamQuestionCardWidget({
		res: response,
		payload,
		introText: "Answer this first.",
	});

	assert.equal(piped.length, 1);
	const parts = await collectStreamParts(piped[0].stream);
	assert.deepEqual(parts.map((part) => part.type), [
		"text-start",
		"text-delta",
		"text-end",
		"data-widget-loading",
		"data-widget-data",
		"data-widget-loading",
		"data-turn-complete",
	]);
	assert.equal(parts[1].delta, "Answer this first.");
	assert.equal(parts[3].id, parts[4].id);
	assert.equal(parts[3].data.loading, true);
	assert.equal(parts[4].data.type, "question-card");
	assert.equal(parts[4].data.payload, payload);
	assert.equal(parts[5].data.loading, false);
});
