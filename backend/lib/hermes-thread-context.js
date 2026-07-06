"use strict";

function normalizeHermesContextIds(value) {
	return Array.isArray(value)
		? Array.from(
			new Set(
				value.filter((item) => typeof item === "string" && item.trim().length > 0),
			),
		)
		: [];
}

function buildNextHermesThreadContext({
	currentHermesContext,
	autoSelectedSkillIds,
	pendingDraftIds,
	recentMemoryProposalIds,
	selectedSkillIds,
}) {
	const nextContext = {
		selectedSkillIds: normalizeHermesContextIds(
			selectedSkillIds ?? currentHermesContext?.selectedSkillIds,
		),
		autoSelectedSkillIds: normalizeHermesContextIds(
			autoSelectedSkillIds ?? currentHermesContext?.autoSelectedSkillIds,
		),
		pendingDraftIds: normalizeHermesContextIds(
			pendingDraftIds ?? currentHermesContext?.pendingDraftIds,
		),
	};

	const resolvedRecentMemoryProposalIds = normalizeHermesContextIds(
		recentMemoryProposalIds ?? currentHermesContext?.recentMemoryProposalIds,
	);
	if (resolvedRecentMemoryProposalIds.length > 0) {
		nextContext.recentMemoryProposalIds = resolvedRecentMemoryProposalIds;
	}

	return nextContext;
}

function createSyncThreadPendingSkillDraftIds({
	hermesSkillDraftManager,
	rovoAppThreadManager,
}) {
	return async function syncThreadPendingSkillDraftIds(threadId) {
		if (!threadId) {
			return null;
		}

		const currentThread = await rovoAppThreadManager.getThread(threadId);
		if (!currentThread) {
			return null;
		}

		return rovoAppThreadManager.updateThread(threadId, {
			hermesContext: buildNextHermesThreadContext({
				currentHermesContext: currentThread.hermesContext,
				pendingDraftIds: await hermesSkillDraftManager.listPendingDraftIdsForThread(threadId),
			}),
		});
	};
}

module.exports = {
	buildNextHermesThreadContext,
	createSyncThreadPendingSkillDraftIds,
	normalizeHermesContextIds,
};
