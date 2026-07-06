import type { RovoDataParts, RovoUIMessage } from "@/lib/rovo-ui-messages";
import type { DelegationRequest } from "@/components/projects/studio/hooks/use-realtime-voice";
import type {
	StudioScreenAssistantRegion,
	StudioScreenAssistantSnapshot,
	StudioScreenAssistantTarget,
} from "@/components/projects/rovo-core/lib/screen-assistant";

// ---------------------------------------------------------------------------
// Public types for the isolated screen-assistant (AI Cursor + Live chat) unit.
//
// This module bundles the two Studio experiences into one route-neutral,
// composable component:
//   - "AI Cursor" (Clicky): the on-screen cursor companion + pointing overlay.
//   - "Live chat": the OpenAI Realtime voice conversation + live transcript.
//
// The adapter below is the single integration seam. Every field is optional:
// the component ships sensible self-contained defaults so it can run in a
// sandbox with no external wiring, and the same props let a host (Studio,
// Rovo, a future surface) inject real handlers when re-integrating.
// ---------------------------------------------------------------------------

export type ScreenAssistantAgentDraftPatch = Partial<RovoDataParts["agent-result"]>;

/**
 * Integration seam between the screen assistant and a host surface. All handlers
 * are app-owned, whitelisted actions — never raw DOM click/type automation.
 */
export interface ScreenAssistantAdapter {
	/**
	 * Returns the structured screen snapshot for the `get_screen_state` tool.
	 * Defaults to a live DOM scan of the current page (visible targets, pointer
	 * context, composer state).
	 */
	getSnapshot?: () => StudioScreenAssistantSnapshot;
	/** Current composer text, read by `submit_composer`. */
	getComposerText?: () => string;
	/** `set_composer_text` — set the composer text (does not submit). */
	onSetComposerText?: (text: string) => void;
	/** `submit_composer` — submit the current composer text. */
	onSubmitComposer?: (text: string) => void;
	/** `apply_agent_draft_patch` — apply a safe agent-builder draft patch. Return whether it applied. */
	onApplyAgentDraftPatch?: (patch: ScreenAssistantAgentDraftPatch) => boolean;
	/** `delegate_to_rovo` — hand off a heavier task. */
	onDelegateToRovo?: (request: DelegationRequest) => void;
}

export type ScreenAssistantTranscriptRole = "user" | "assistant" | "system";

export interface ScreenAssistantTranscriptEntry {
	id: string;
	role: ScreenAssistantTranscriptRole;
	content: string;
}

export interface UseScreenAssistantOptions {
	/** Host integration handlers. Omit any field to use the built-in default. */
	adapter?: ScreenAssistantAdapter;
	/**
	 * Thread context messages used to seed the Realtime session summary.
	 * Defaults to an empty thread (sandbox has no prior conversation).
	 */
	chatMessages?: RovoUIMessage[];
	/** Activate the AI cursor automatically on mount. */
	defaultActive?: boolean;
	/** Notified whenever the AI cursor active state changes. */
	onActiveChange?: (active: boolean) => void;
}

export interface ScreenAssistantProps extends UseScreenAssistantOptions {
	/** Render the built-in floating control bar (cursor + voice toggles). Default: true. */
	showControls?: boolean;
	/** Render the built-in live-chat transcript panel. Default: true. */
	showTranscript?: boolean;
	/**
	 * Render offline harness buttons that drive the cursor state machine
	 * directly (listen / process / speak / point) so the visuals can be
	 * iterated on without a live Realtime backend. Default: false.
	 */
	showHarnessControls?: boolean;
	className?: string;
}

export type {
	StudioScreenAssistantRegion,
	StudioScreenAssistantSnapshot,
	StudioScreenAssistantTarget,
	DelegationRequest,
};
