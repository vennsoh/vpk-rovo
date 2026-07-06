"use strict";

const {
	deleteWikiMemoryProposal: defaultDeleteWikiMemoryProposal,
	getCanonicalWikiMemoryDocuments: defaultGetCanonicalWikiMemoryDocuments,
	pruneCanonicalWikiMemoryBlock: defaultPruneCanonicalWikiMemoryBlock,
	resetWikiMemory: defaultResetWikiMemory,
	syncWikiBackedMemory: defaultSyncWikiBackedMemory,
} = require("../lib/wiki-memory-provider");
const {
	buildWikiMemoryBrief: defaultBuildWikiMemoryBrief,
	buildWikiMemoryDeck: defaultBuildWikiMemoryDeck,
	buildWikiMemoryExplorer: defaultBuildWikiMemoryExplorer,
	buildWikiMemoryExplorerCsv: defaultBuildWikiMemoryExplorerCsv,
} = require("../lib/wiki-memory-explorer");
const {
	captureUrl: defaultCaptureUrl,
	getWikiStatus: defaultGetWikiStatus,
	lintWiki: defaultLintWiki,
	queryWiki: defaultQueryWiki,
	saveSynthesisPage: defaultSaveSynthesisPage,
} = require("../lib/wiki-clipper");
const {
	ensureFreshWikiQmdIndex: defaultEnsureFreshWikiQmdIndex,
	getQmdSyncSummary: defaultGetQmdSyncSummary,
	normalizeNaiveWikiSearchResults: defaultNormalizeNaiveWikiSearchResults,
	searchWikiWithQmd: defaultSearchWikiWithQmd,
	syncWikiQmdIndex: defaultSyncWikiQmdIndex,
} = require("../lib/qmd");
const {
	createWikiRouteHandlers: defaultCreateWikiRouteHandlers,
} = require("../lib/wiki-route-handlers");
const {
	createWikiMemoryCollectionSync: defaultCreateWikiMemoryCollectionSync,
} = require("../lib/wiki-memory-collection-sync");

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createWikiRouteHandlerComposition requires ${name}`);
	}
	return value;
}

function createWikiRouteHandlerComposition({
	buildWikiMemoryBrief = defaultBuildWikiMemoryBrief,
	buildWikiMemoryDeck = defaultBuildWikiMemoryDeck,
	buildWikiMemoryExplorer = defaultBuildWikiMemoryExplorer,
	buildWikiMemoryExplorerCsv = defaultBuildWikiMemoryExplorerCsv,
	captureUrl = defaultCaptureUrl,
	createWikiMemoryCollectionSync = defaultCreateWikiMemoryCollectionSync,
	createWikiRouteHandlers = defaultCreateWikiRouteHandlers,
	deleteWikiMemoryProposal = defaultDeleteWikiMemoryProposal,
	ensureFreshWikiQmdIndex = defaultEnsureFreshWikiQmdIndex,
	getCanonicalWikiMemoryDocuments = defaultGetCanonicalWikiMemoryDocuments,
	getQmdSyncSummary = defaultGetQmdSyncSummary,
	getWikiStatus = defaultGetWikiStatus,
	lintWiki = defaultLintWiki,
	logger = console,
	normalizeNaiveWikiSearchResults = defaultNormalizeNaiveWikiSearchResults,
	pruneCanonicalWikiMemoryBlock = defaultPruneCanonicalWikiMemoryBlock,
	queryWiki = defaultQueryWiki,
	resetWikiMemory = defaultResetWikiMemory,
	saveSynthesisPage = defaultSaveSynthesisPage,
	searchWikiWithQmd = defaultSearchWikiWithQmd,
	syncWikiBackedMemory = defaultSyncWikiBackedMemory,
	syncWikiQmdIndex = defaultSyncWikiQmdIndex,
} = {}) {
	requireFunction("buildWikiMemoryBrief", buildWikiMemoryBrief);
	requireFunction("buildWikiMemoryDeck", buildWikiMemoryDeck);
	requireFunction("buildWikiMemoryExplorer", buildWikiMemoryExplorer);
	requireFunction("buildWikiMemoryExplorerCsv", buildWikiMemoryExplorerCsv);
	requireFunction("captureUrl", captureUrl);
	requireFunction("createWikiMemoryCollectionSync", createWikiMemoryCollectionSync);
	requireFunction("createWikiRouteHandlers", createWikiRouteHandlers);
	requireFunction("deleteWikiMemoryProposal", deleteWikiMemoryProposal);
	requireFunction("ensureFreshWikiQmdIndex", ensureFreshWikiQmdIndex);
	requireFunction("getCanonicalWikiMemoryDocuments", getCanonicalWikiMemoryDocuments);
	requireFunction("getQmdSyncSummary", getQmdSyncSummary);
	requireFunction("getWikiStatus", getWikiStatus);
	requireFunction("lintWiki", lintWiki);
	requireFunction("normalizeNaiveWikiSearchResults", normalizeNaiveWikiSearchResults);
	requireFunction("pruneCanonicalWikiMemoryBlock", pruneCanonicalWikiMemoryBlock);
	requireFunction("queryWiki", queryWiki);
	requireFunction("resetWikiMemory", resetWikiMemory);
	requireFunction("saveSynthesisPage", saveSynthesisPage);
	requireFunction("searchWikiWithQmd", searchWikiWithQmd);
	requireFunction("syncWikiBackedMemory", syncWikiBackedMemory);
	requireFunction("syncWikiQmdIndex", syncWikiQmdIndex);

	const syncWikiMemoryCollection = createWikiMemoryCollectionSync({
		logger,
		syncWikiQmdIndex,
	});

	return createWikiRouteHandlers({
		buildWikiMemoryBriefImpl: buildWikiMemoryBrief,
		buildWikiMemoryDeckImpl: buildWikiMemoryDeck,
		buildWikiMemoryExplorerCsvImpl: buildWikiMemoryExplorerCsv,
		buildWikiMemoryExplorerImpl: buildWikiMemoryExplorer,
		captureUrlImpl: captureUrl,
		deleteWikiMemoryBlockImpl: async ({ blockId, logger: requestLogger, revision, scope }) => {
			return pruneCanonicalWikiMemoryBlock({
				blockId,
				logger: requestLogger,
				qmdSyncImpl: syncWikiMemoryCollection,
				revision,
				scope,
			});
		},
		deleteWikiMemoryProposalImpl: async ({ logger: requestLogger, proposalId }) => {
			return deleteWikiMemoryProposal({
				logger: requestLogger,
				proposalId,
				qmdSyncImpl: syncWikiMemoryCollection,
			});
		},
		ensureFreshWikiQmdIndexImpl: ensureFreshWikiQmdIndex,
		getQmdSyncSummaryImpl: getQmdSyncSummary,
		getWikiMemoriesImpl: getCanonicalWikiMemoryDocuments,
		getWikiStatusImpl: getWikiStatus,
		lintWikiImpl: lintWiki,
		logger,
		normalizeNaiveWikiSearchResultsImpl: normalizeNaiveWikiSearchResults,
		queryWikiImpl: queryWiki,
		resetWikiMemoryImpl: async ({ logger: requestLogger }) => {
			return resetWikiMemory({
				logger: requestLogger,
				qmdSyncImpl: syncWikiMemoryCollection,
			});
		},
		saveSynthesisPageImpl: saveSynthesisPage,
		searchWikiWithQmdImpl: searchWikiWithQmd,
		syncWikiMemoryImpl: async ({ force, logger: requestLogger }) => {
			return syncWikiBackedMemory({
				forceContextRegeneration: force === true,
				logger: requestLogger,
			});
		},
	});
}

module.exports = {
	createWikiRouteHandlerComposition,
};
