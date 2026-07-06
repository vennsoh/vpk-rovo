import type { RovoAgentProfile } from "@/app/data/directory/agents";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import {
	areStudioAgentResultsEqual,
	createStudioAgentVersionRecord,
} from "./agent-versioning";
import {
	buildSessionAgentProfileFromResult,
	createSessionAgentEntriesFromRecords,
	createSessionAgentEntryFromResult,
	getStudioSessionAgentResultDisplayName,
	normalizeSessionAgentResult,
} from "./session-agent-entry";
import {
	readSessionAgentRecords,
	toPersistedRecord,
	writeSessionAgentRecords,
} from "./session-agent-storage";
import type { StudioAgentVersionRecord, StudioSessionAgentEntry } from "./types";

export type SessionAgentEntry = StudioSessionAgentEntry;
export type StudioSessionAgentSaveStatus = "idle" | "saving" | "saved" | "error";

export const STUDIO_SESSION_AGENT_SAVE_DEBOUNCE_MS = 900;

export interface SessionAgentEntriesResult {
	changed: boolean;
	entries: SessionAgentEntry[];
}

export interface SessionAgentEntryMutationResult extends SessionAgentEntriesResult {
	entry: SessionAgentEntry | null;
}

export interface RegisterSessionAgentResult extends SessionAgentEntryMutationResult {
	created: boolean;
}

export interface RemoveSessionAgentResult extends SessionAgentEntriesResult {
	removed: boolean;
}

export function createStudioAgentVersionId(kind: StudioAgentVersionRecord["kind"]): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}

	return `studio-agent-${kind}-${Date.now()}`;
}

export function rehydrateSessionAgentEntriesFromStorage(): SessionAgentEntry[] {
	return createSessionAgentEntriesFromRecords(readSessionAgentRecords());
}

export function persistSessionAgentEntries(entries: readonly SessionAgentEntry[]): boolean {
	return writeSessionAgentRecords(entries.map(toPersistedRecord));
}

export function mergeRehydratedSessionAgentEntries(
	currentEntries: readonly SessionAgentEntry[],
	rehydratedEntries: readonly SessionAgentEntry[],
): SessionAgentEntriesResult {
	const existingIds = new Set(currentEntries.map((entry) => entry.profile.id));
	const existingKeys = new Set(currentEntries.map((entry) => entry.resultKey));
	const filtered = rehydratedEntries.filter(
		(entry) =>
			!existingIds.has(entry.profile.id) &&
			!existingKeys.has(entry.resultKey)
	);
	if (filtered.length === 0) {
		return { changed: false, entries: [...currentEntries] };
	}

	return {
		changed: true,
		entries: [...currentEntries, ...filtered],
	};
}

export function getSessionAgentEntryByProfileId(
	entries: readonly SessionAgentEntry[],
	profileId: string,
): SessionAgentEntry | null {
	return entries.find((entry) => entry.profile.id === profileId) ?? null;
}

function replaceSessionAgentEntry(
	entries: readonly SessionAgentEntry[],
	index: number,
	entry: SessionAgentEntry,
): SessionAgentEntry[] {
	const nextEntries = [...entries];
	nextEntries[index] = entry;
	return nextEntries;
}

export function touchSessionAgentEntry(
	entries: readonly SessionAgentEntry[],
	profileId: string,
	lastTouchedAt = Date.now(),
): SessionAgentEntryMutationResult {
	const index = entries.findIndex((entry) => entry.profile.id === profileId);
	if (index === -1) {
		return { changed: false, entries: [...entries], entry: null };
	}

	const nextEntry: SessionAgentEntry = {
		...entries[index],
		lastTouchedAt,
	};
	return {
		changed: true,
		entries: replaceSessionAgentEntry(entries, index, nextEntry),
		entry: nextEntry,
	};
}

export function registerSessionAgentFromResult({
	agentResult,
	entries,
	lastTouchedAt = Date.now(),
	sourceKey,
	staticAgentProfiles,
}: {
	agentResult: RovoDataParts["agent-result"];
	entries: readonly SessionAgentEntry[];
	lastTouchedAt?: number;
	sourceKey?: string;
	staticAgentProfiles: readonly RovoAgentProfile[];
}): RegisterSessionAgentResult {
	const entry = createSessionAgentEntryFromResult({
		agentResult,
		lastTouchedAt,
		sessionAgentEntries: entries,
		sourceKey,
		staticAgentProfiles,
	});
	if (!entry) {
		return { changed: false, created: false, entries: [...entries], entry: null };
	}

	const existingEntry = entries.find((item) => item.resultKey === entry.resultKey);
	if (existingEntry) {
		const touched = touchSessionAgentEntry(entries, existingEntry.profile.id, lastTouchedAt);
		return {
			...touched,
			created: false,
			entry: touched.entry ?? existingEntry,
		};
	}

	return {
		changed: true,
		created: true,
		entries: [...entries, entry],
		entry,
	};
}

export function updateSessionAgentDraftEntry({
	entries,
	lastTouchedAt = Date.now(),
	patch,
	profileId,
}: {
	entries: readonly SessionAgentEntry[];
	lastTouchedAt?: number;
	patch: Partial<RovoDataParts["agent-result"]>;
	profileId: string;
}): SessionAgentEntryMutationResult {
	const index = entries.findIndex((entry) => entry.profile.id === profileId);
	if (index === -1) {
		return { changed: false, entries: [...entries], entry: null };
	}

	const existing = entries[index];
	const nextDraftResult = normalizeSessionAgentResult({
		...existing.draftResult,
		...patch,
	});
	const nextProfile = buildSessionAgentProfileFromResult({
		agentResult: nextDraftResult,
		profileId: existing.profile.id,
		profileName: getStudioSessionAgentResultDisplayName(nextDraftResult),
	});
	const nextPublishStatus =
		existing.publishStatus === "published" &&
		existing.publishedResult &&
		JSON.stringify(nextDraftResult) === JSON.stringify(existing.publishedResult)
			? "published"
			: "testing";

	const nextEntry: SessionAgentEntry = {
		...existing,
		profile: nextProfile,
		draftResult: nextDraftResult,
		lastTouchedAt,
		publishStatus: nextPublishStatus,
	};
	return {
		changed: true,
		entries: replaceSessionAgentEntry(entries, index, nextEntry),
		entry: nextEntry,
	};
}

export function commitSessionAgentPublishReadyEntry(
	entries: readonly SessionAgentEntry[],
	profileId: string,
	lastTouchedAt = Date.now(),
): SessionAgentEntryMutationResult {
	const index = entries.findIndex((entry) => entry.profile.id === profileId);
	if (index === -1) {
		return { changed: false, entries: [...entries], entry: null };
	}

	const existing = entries[index];
	if (
		JSON.stringify(existing.publishReadyResult) ===
		JSON.stringify(existing.draftResult)
	) {
		return { changed: false, entries: [...entries], entry: existing };
	}

	const nextEntry: SessionAgentEntry = {
		...existing,
		lastTouchedAt,
		publishReadyResult: existing.draftResult,
	};
	return {
		changed: true,
		entries: replaceSessionAgentEntry(entries, index, nextEntry),
		entry: nextEntry,
	};
}

export function publishSessionAgentEntry({
	createVersionId = createStudioAgentVersionId,
	entries,
	now = Date.now(),
	profileId,
}: {
	createVersionId?: (kind: StudioAgentVersionRecord["kind"]) => string;
	entries: readonly SessionAgentEntry[];
	now?: number;
	profileId: string;
}): SessionAgentEntryMutationResult {
	const index = entries.findIndex((entry) => entry.profile.id === profileId);
	if (index === -1) {
		return { changed: false, entries: [...entries], entry: null };
	}

	const existing = entries[index];
	const publishResult = existing.publishReadyResult;
	const versionKind: StudioAgentVersionRecord["kind"] = existing.publishedResult ? "update" : "publish";
	const nextPublishedVersion = existing.publishedResult
		? Math.max(existing.publishedVersion, 1) + 1
		: 1;
	const versionRecord = createStudioAgentVersionRecord({
		before: existing.publishedResult,
		createdAt: now,
		createdBy: existing.lastPublishedBy,
		id: createVersionId(versionKind),
		kind: versionKind,
		snapshot: publishResult,
		version: nextPublishedVersion,
	});
	const nextEntry: SessionAgentEntry = {
		...existing,
		lastTouchedAt: now,
		lastPublishedAt: now,
		lastPublishedBy: versionRecord.createdBy,
		publishedResult: publishResult,
		publishStatus: "published",
		publishedVersion: nextPublishedVersion,
		versionHistory: [versionRecord, ...existing.versionHistory],
	};
	return {
		changed: true,
		entries: replaceSessionAgentEntry(entries, index, nextEntry),
		entry: nextEntry,
	};
}

export function restoreSessionAgentVersionEntry({
	createVersionId = createStudioAgentVersionId,
	entries,
	now = Date.now(),
	profileId,
	versionId,
}: {
	createVersionId?: (kind: StudioAgentVersionRecord["kind"]) => string;
	entries: readonly SessionAgentEntry[];
	now?: number;
	profileId: string;
	versionId: string;
}): SessionAgentEntryMutationResult {
	const index = entries.findIndex((entry) => entry.profile.id === profileId);
	if (index === -1) {
		return { changed: false, entries: [...entries], entry: null };
	}

	const existing = entries[index];
	const version = existing.versionHistory.find((item) => item.id === versionId);
	if (!version) {
		return { changed: false, entries: [...entries], entry: null };
	}

	const restoredDraft = normalizeSessionAgentResult(version.snapshot);
	const nextProfile = buildSessionAgentProfileFromResult({
		agentResult: restoredDraft,
		profileId: existing.profile.id,
		profileName: getStudioSessionAgentResultDisplayName(restoredDraft),
	});
	const rollbackRecord = createStudioAgentVersionRecord({
		before: existing.draftResult,
		createdAt: now,
		createdBy: existing.lastPublishedBy,
		id: createVersionId("rollback"),
		kind: "rollback",
		snapshot: restoredDraft,
		version: Math.max(existing.publishedVersion, 1),
	});
	const nextEntry: SessionAgentEntry = {
		...existing,
		profile: nextProfile,
		draftResult: restoredDraft,
		lastTouchedAt: now,
		publishStatus: existing.publishedResult && areStudioAgentResultsEqual(restoredDraft, existing.publishedResult)
			? "published"
			: "testing",
		versionHistory: [rollbackRecord, ...existing.versionHistory],
	};
	return {
		changed: true,
		entries: replaceSessionAgentEntry(entries, index, nextEntry),
		entry: nextEntry,
	};
}

export function removeSessionAgentEntry(
	entries: readonly SessionAgentEntry[],
	profileId: string,
): RemoveSessionAgentResult {
	const nextEntries = entries.filter((entry) => entry.profile.id !== profileId);
	const removed = nextEntries.length !== entries.length;
	return {
		changed: removed,
		entries: removed ? nextEntries : [...entries],
		removed,
	};
}
