"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");

const {
	createAiUtilitiesRouter,
	normalizeConversationHistory,
	registerAiUtilitiesRoutes,
} = require("./ai-utilities");

async function withServer(dependencies, run) {
	const app = express();
	app.use(express.json());
	registerAiUtilitiesRoutes(app, {
		generateSuggestedQuestions: async () => [],
		generateTextViaGateway: async () => "Generated title",
		sendGatewayErrorResponse: (res, error, fallbackMessage) =>
			res.status(error?.statusCode || 500).json({
				error: fallbackMessage,
				details: error instanceof Error ? error.message : String(error),
			}),
		logger: {
			error: () => {},
			warn: () => {},
		},
		...dependencies,
	});

	const server = http.createServer(app);
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	const baseUrl = `http://127.0.0.1:${address.port}`;

	try {
		await run(baseUrl);
	} finally {
		await new Promise((resolve, reject) => {
			server.close((error) => {
				if (error) {
					reject(error);
					return;
				}
				resolve();
			});
		});
	}
}

async function postJson(baseUrl, path, body) {
	const response = await fetch(`${baseUrl}${path}`, {
		body: JSON.stringify(body),
		headers: { "content-type": "application/json" },
		method: "POST",
	});
	return {
		body: await response.json(),
		status: response.status,
	};
}

test("ai utilities router validates required dependencies", () => {
	assert.throws(() => createAiUtilitiesRouter(), /generateSuggestedQuestions/u);
	assert.throws(
		() => createAiUtilitiesRouter({ generateSuggestedQuestions: async () => [] }),
		/generateTextViaGateway/u,
	);
	assert.throws(
		() =>
			createAiUtilitiesRouter({
				generateSuggestedQuestions: async () => [],
				generateTextViaGateway: async () => "",
			}),
		/sendGatewayErrorResponse/u,
	);
});

test("normalizeConversationHistory keeps only supported non-empty messages", () => {
	assert.deepEqual(
		normalizeConversationHistory(
			[
				{ type: "user", content: " Ask this " },
				{ type: "assistant", content: "Answer" },
				{ type: "tool", content: "skip" },
				{ type: "user", content: "" },
				null,
			],
			(value) => (typeof value === "string" && value.trim() ? value.trim() : null),
		),
		[
			{ type: "user", content: "Ask this" },
			{ type: "assistant", content: "Answer" },
		],
	);
});

test("suggestions route normalizes request shape and returns questions", async () => {
	const calls = [];
	await withServer({
		generateSuggestedQuestions: async (input) => {
			calls.push(input);
			return ["What happens next?"];
		},
	}, async (baseUrl) => {
		const result = await postJson(baseUrl, "/api/rovo/suggestions", {
			message: "  Build it  ",
			assistantResponse: "Done.",
			conversationHistory: [
				{ type: "user", content: "Hello" },
				{ type: "tool", content: "ignore" },
			],
		});

		assert.equal(result.status, 200);
		assert.deepEqual(result.body, { questions: ["What happens next?"] });
		assert.equal(calls[0].message, "Build it");
		assert.equal(calls[0].assistantResponse, "Done.");
		assert.deepEqual(calls[0].conversationHistory, [
			{ type: "user", content: "Hello" },
		]);
		assert.ok(calls[0].signal);
	});
});

test("agent data-flow route falls back to baseline Mermaid on refinement failure", async () => {
	await withServer({
		buildAgentDataFlowMermaidFn: () => "flowchart LR\nA-->B",
		generateAgentDataFlowText: async () => "unused",
		normalizeAgentDataFlowConfigFn: (value) => ({ name: value?.name || "Draft" }),
		refineAgentDataFlowMermaidFn: async () => {
			throw new Error("gateway unavailable");
		},
	}, async (baseUrl) => {
		const result = await postJson(baseUrl, "/api/studio/agent-data-flow", {
			config: { name: "Launch agent" },
		});

		assert.equal(result.status, 200);
		assert.deepEqual(result.body, { mermaid: "flowchart LR\nA-->B" });
	});
});

test("metadata routes preserve title, plan, and description response shapes", async () => {
	const gatewayCalls = [];
	await withServer({
		generateDescriptionSummaryFn: async ({ title, description, generateText }) => {
			const text = await generateText({
				prompt: `${title}:${description}`,
			});
			return { shortDescription: text };
		},
		generatePlanMetadataFn: async ({ title, generateText }) => {
			const text = await generateText({ prompt: title });
			return {
				title: text,
				shortDescription: "Plan summary",
			};
		},
		generateTextViaGateway: async (options) => {
			gatewayCalls.push(options);
			return options.prompt === "Release plan"
				? "Release Plan"
				: "  \"Launch Calendar\"  ";
		},
	}, async (baseUrl) => {
		const chatTitle = await postJson(baseUrl, "/api/chat-title", {
			message: "Schedule a launch calendar",
		});
		const planTitle = await postJson(baseUrl, "/api/plan-title", {
			title: "Release plan",
			tasks: [],
		});
		const description = await postJson(baseUrl, "/api/genui-description-summary", {
			title: "Card",
			description: "Long enough description for summary",
		});

		assert.deepEqual(chatTitle, {
			status: 200,
			body: { title: "Launch Calendar" },
		});
		assert.deepEqual(planTitle, {
			status: 200,
			body: { title: "Release Plan", shortDescription: "Plan summary" },
		});
		assert.deepEqual(description, {
			status: 200,
			body: { shortDescription: "  \"Launch Calendar\"  " },
		});
		assert.ok(gatewayCalls.every((call) => call.backendPreference === "ai-gateway"));
	});
});

test("plan title route delegates gateway failures to shared error mapping", async () => {
	await withServer({
		generatePlanMetadataFn: async () => {
			const error = new Error("gateway down");
			error.statusCode = 503;
			throw error;
		},
	}, async (baseUrl) => {
		const result = await postJson(baseUrl, "/api/plan-title", {
			title: "Release plan",
		});

		assert.equal(result.status, 503);
		assert.deepEqual(result.body, {
			error: "Failed to generate plan title",
			details: "gateway down",
		});
	});
});
