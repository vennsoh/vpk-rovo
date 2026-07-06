import type { RovoAgentProfile } from "@/app/data/directory/agents";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import type { StudioAgentChangeSummary } from "./agent-versioning";

export type StudioAgentPublishStatus = "testing" | "published";

export interface StudioAgentVersionRecord {
	id: string;
	label: string;
	version: number;
	kind: "publish" | "update" | "rollback";
	createdAt: number;
	createdBy: string;
	snapshot: RovoDataParts["agent-result"];
	changeSummary: StudioAgentChangeSummary;
}

export interface StudioSessionAgentEntry {
	profile: RovoAgentProfile;
	resultKey: string;
	sourceResult: RovoDataParts["agent-result"];
	draftResult: RovoDataParts["agent-result"];
	lastTouchedAt: number;
	publishReadyResult: RovoDataParts["agent-result"];
	publishedResult: RovoDataParts["agent-result"] | null;
	publishStatus: StudioAgentPublishStatus;
	publishedVersion: number;
	lastPublishedAt: number | null;
	lastPublishedBy: string | null;
	versionHistory: readonly StudioAgentVersionRecord[];
}
