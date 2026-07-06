"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createWikiRouteHandlerComposition,
} = require("./wiki-route-handler-composition");

function createNamedFunction(name, calls) {
	return async (...args) => {
		calls.push([name, ...args]);
		return { name, args };
	};
}

function createHarness(overrides = {}) {
	const calls = [];
	const captured = {};
	const qmdSyncImpl = async (input) => {
		calls.push(["qmdSyncImpl", input]);
	};
	const routeHandlers = { handleWikiStatus: () => {} };
	const dependencies = {
		buildWikiMemoryBrief: createNamedFunction("buildWikiMemoryBrief", calls),
		buildWikiMemoryDeck: createNamedFunction("buildWikiMemoryDeck", calls),
		buildWikiMemoryExplorer: createNamedFunction("buildWikiMemoryExplorer", calls),
		buildWikiMemoryExplorerCsv: createNamedFunction("buildWikiMemoryExplorerCsv", calls),
		captureUrl: createNamedFunction("captureUrl", calls),
		createWikiMemoryCollectionSync: (input) => {
			captured.createWikiMemoryCollectionSync = input;
			return qmdSyncImpl;
		},
		createWikiRouteHandlers: (input) => {
			captured.createWikiRouteHandlers = input;
			return routeHandlers;
		},
		deleteWikiMemoryProposal: createNamedFunction("deleteWikiMemoryProposal", calls),
		ensureFreshWikiQmdIndex: createNamedFunction("ensureFreshWikiQmdIndex", calls),
		getCanonicalWikiMemoryDocuments: createNamedFunction("getCanonicalWikiMemoryDocuments", calls),
		getQmdSyncSummary: createNamedFunction("getQmdSyncSummary", calls),
		getWikiStatus: createNamedFunction("getWikiStatus", calls),
		lintWiki: createNamedFunction("lintWiki", calls),
		logger: {
			warn() {},
		},
		normalizeNaiveWikiSearchResults: createNamedFunction("normalizeNaiveWikiSearchResults", calls),
		pruneCanonicalWikiMemoryBlock: createNamedFunction("pruneCanonicalWikiMemoryBlock", calls),
		queryWiki: createNamedFunction("queryWiki", calls),
		resetWikiMemory: createNamedFunction("resetWikiMemory", calls),
		saveSynthesisPage: createNamedFunction("saveSynthesisPage", calls),
		searchWikiWithQmd: createNamedFunction("searchWikiWithQmd", calls),
		syncWikiBackedMemory: createNamedFunction("syncWikiBackedMemory", calls),
		syncWikiQmdIndex: createNamedFunction("syncWikiQmdIndex", calls),
		...overrides.dependencies,
	};
	const result = createWikiRouteHandlerComposition(dependencies);

	return {
		calls,
		captured,
		dependencies,
		qmdSyncImpl,
		result,
		routeHandlers,
	};
}

test("createWikiRouteHandlerComposition wires concrete wiki route handlers", () => {
	const {
		captured,
		dependencies,
		result,
		routeHandlers,
	} = createHarness();

	assert.equal(result, routeHandlers);
	assert.deepEqual(captured.createWikiMemoryCollectionSync, {
		logger: dependencies.logger,
		syncWikiQmdIndex: dependencies.syncWikiQmdIndex,
	});

	assert.equal(captured.createWikiRouteHandlers.buildWikiMemoryBriefImpl, dependencies.buildWikiMemoryBrief);
	assert.equal(captured.createWikiRouteHandlers.buildWikiMemoryDeckImpl, dependencies.buildWikiMemoryDeck);
	assert.equal(captured.createWikiRouteHandlers.buildWikiMemoryExplorerImpl, dependencies.buildWikiMemoryExplorer);
	assert.equal(
		captured.createWikiRouteHandlers.buildWikiMemoryExplorerCsvImpl,
		dependencies.buildWikiMemoryExplorerCsv
	);
	assert.equal(captured.createWikiRouteHandlers.captureUrlImpl, dependencies.captureUrl);
	assert.equal(captured.createWikiRouteHandlers.ensureFreshWikiQmdIndexImpl, dependencies.ensureFreshWikiQmdIndex);
	assert.equal(captured.createWikiRouteHandlers.getQmdSyncSummaryImpl, dependencies.getQmdSyncSummary);
	assert.equal(
		captured.createWikiRouteHandlers.getWikiMemoriesImpl,
		dependencies.getCanonicalWikiMemoryDocuments
	);
	assert.equal(captured.createWikiRouteHandlers.getWikiStatusImpl, dependencies.getWikiStatus);
	assert.equal(captured.createWikiRouteHandlers.lintWikiImpl, dependencies.lintWiki);
	assert.equal(captured.createWikiRouteHandlers.logger, dependencies.logger);
	assert.equal(
		captured.createWikiRouteHandlers.normalizeNaiveWikiSearchResultsImpl,
		dependencies.normalizeNaiveWikiSearchResults
	);
	assert.equal(captured.createWikiRouteHandlers.queryWikiImpl, dependencies.queryWiki);
	assert.equal(captured.createWikiRouteHandlers.saveSynthesisPageImpl, dependencies.saveSynthesisPage);
	assert.equal(captured.createWikiRouteHandlers.searchWikiWithQmdImpl, dependencies.searchWikiWithQmd);
});

test("wiki memory mutations share the QMD collection sync wrapper", async () => {
	const {
		calls,
		captured,
		dependencies,
		qmdSyncImpl,
	} = createHarness();
	const requestLogger = { warn() {} };

	await captured.createWikiRouteHandlers.deleteWikiMemoryBlockImpl({
		blockId: "block-1",
		logger: requestLogger,
		revision: "rev-1",
		scope: "work",
	});
	await captured.createWikiRouteHandlers.deleteWikiMemoryProposalImpl({
		logger: requestLogger,
		proposalId: "proposal-1",
	});
	await captured.createWikiRouteHandlers.resetWikiMemoryImpl({
		logger: requestLogger,
	});

	assert.deepEqual(calls, [
		[
			"pruneCanonicalWikiMemoryBlock",
			{
				blockId: "block-1",
				logger: requestLogger,
				qmdSyncImpl,
				revision: "rev-1",
				scope: "work",
			},
		],
		[
			"deleteWikiMemoryProposal",
			{
				logger: requestLogger,
				proposalId: "proposal-1",
				qmdSyncImpl,
			},
		],
		[
			"resetWikiMemory",
			{
				logger: requestLogger,
				qmdSyncImpl,
			},
		],
	]);
	assert.equal(captured.createWikiMemoryCollectionSync.logger, dependencies.logger);
});

test("wiki sync maps force to forceContextRegeneration exactly", async () => {
	const { calls, captured } = createHarness();
	const requestLogger = { warn() {} };

	await captured.createWikiRouteHandlers.syncWikiMemoryImpl({
		force: true,
		logger: requestLogger,
	});
	await captured.createWikiRouteHandlers.syncWikiMemoryImpl({
		force: false,
		logger: requestLogger,
	});
	await captured.createWikiRouteHandlers.syncWikiMemoryImpl({
		force: "true",
		logger: requestLogger,
	});

	assert.deepEqual(calls, [
		[
			"syncWikiBackedMemory",
			{
				forceContextRegeneration: true,
				logger: requestLogger,
			},
		],
		[
			"syncWikiBackedMemory",
			{
				forceContextRegeneration: false,
				logger: requestLogger,
			},
		],
		[
			"syncWikiBackedMemory",
			{
				forceContextRegeneration: false,
				logger: requestLogger,
			},
		],
	]);
});

test("createWikiRouteHandlerComposition validates required dependencies", () => {
	assert.throws(
		() =>
			createHarness({
				dependencies: {
					createWikiRouteHandlers: null,
				},
			}),
		/createWikiRouteHandlers/u,
	);
	assert.throws(
		() =>
			createHarness({
				dependencies: {
					syncWikiBackedMemory: null,
				},
			}),
		/syncWikiBackedMemory/u,
	);
});
