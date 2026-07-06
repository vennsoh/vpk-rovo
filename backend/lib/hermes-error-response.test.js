const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildHermesUnavailableResponse,
	createHermesUnavailableResponseSender,
} = require("./hermes-error-response");

test("buildHermesUnavailableResponse maps known Hermes errors", () => {
	assert.deepEqual(
		buildHermesUnavailableResponse({
			error: Object.assign(new Error("Missing skill"), { code: "ENOENT" }),
			fallbackErrorMessage: "Failed to load Hermes skill",
		}),
		{
			statusCode: 404,
			body: {
				error: "Missing skill",
				details: "Missing skill",
			},
		},
	);

	assert.deepEqual(
		buildHermesUnavailableResponse({
			error: Object.assign(new Error("Bad payload"), { code: "INVALID_INPUT" }),
			fallbackErrorMessage: "Failed to create Hermes job",
		}),
		{
			statusCode: 400,
			body: {
				error: "Bad payload",
				details: "Bad payload",
			},
		},
	);

	assert.deepEqual(
		buildHermesUnavailableResponse({
			error: Object.assign(new Error("offline"), {
				code: "HERMES_UNREACHABLE",
				details: "Socket closed",
			}),
			fallbackErrorMessage: "Failed to run Hermes job",
		}),
		{
			statusCode: 503,
			body: {
				error: "Failed to run Hermes job",
				details: "Socket closed",
			},
		},
	);
});

test("buildHermesUnavailableResponse preserves explicit statusCode and generic fallback", () => {
	assert.deepEqual(
		buildHermesUnavailableResponse({
			error: Object.assign(new Error("Rate limited"), { statusCode: 429 }),
			fallbackErrorMessage: "Failed to list Hermes jobs",
		}),
		{
			statusCode: 429,
			body: {
				error: "Rate limited",
				details: "Rate limited",
			},
		},
	);

	assert.deepEqual(
		buildHermesUnavailableResponse({
			error: "raw failure",
			fallbackErrorMessage: "Failed to list Hermes jobs",
		}),
		{
			statusCode: 500,
			body: {
				error: "Failed to list Hermes jobs",
				details: "raw failure",
			},
		},
	);
});

test("createHermesUnavailableResponseSender writes mapped status and body", () => {
	const calls = [];
	const res = {
		status: (statusCode) => {
			calls.push({ statusCode });
			return {
				json: (body) => {
					calls.push({ body });
					return { statusCode, body };
				},
			};
		},
	};
	const sendHermesUnavailableResponse = createHermesUnavailableResponseSender();

	assert.deepEqual(
		sendHermesUnavailableResponse(
			res,
			Object.assign(new Error("offline"), { code: "HERMES_UNREACHABLE" }),
			"Failed to resume Hermes job",
		),
		{
			statusCode: 503,
			body: {
				error: "Failed to resume Hermes job",
				details: "offline",
			},
		},
	);
	assert.deepEqual(calls.map((call) => Object.keys(call)[0]), ["statusCode", "body"]);
});
