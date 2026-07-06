import {
	getMessageText,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import type {
	RovoAppActiveArtifact,
	RovoAppCreationMode,
	RovoAppDocument,
	RovoAppDocumentKind,
	RovoAppRecentHistoryEntry,
	RovoAppVisibility,
} from "@/lib/rovo-app-types";
import type { RovoAppStreamingArtifact } from "@/components/projects/rovo-core/lib/rovo-app-streaming-artifact";
import {
	classifyRovoAppTurnMode,
	getLatestVisibleRovoAppUserPrompt,
	hasPendingRovoAppStructuredContinuation,
} from "@/components/projects/rovo-core/lib/rovo-app-turn-mode";

export interface RovoAppArtifactContextPayload {
	content: string;
	id: string;
	kind: RovoAppDocumentKind;
	title: string;
}

export const ROVO_APP_PLAN_MODE_CONTEXT = [
	"Plan mode is enabled.",
	"If the request is missing essential build details, ask clarifying questions with ask_user_questions before proposing a plan.",
	"If you ask clarifying questions first, the next answer turn must end by calling exit_plan_mode unless a hard blocker still makes planning impossible.",
	"For build-oriented requests, finish the planning turn by calling exit_plan_mode with a concise markdown plan.",
	"Do not use free-form text, suggestion chips, invoke_subagents, or update_todo as a substitute for the exit_plan_mode handoff.",
].join(" ");

export const ROVO_APP_VOICE_MODE_CONTEXT = [
	"The user is in voice mode — they are speaking to you and hearing your response read aloud.",
	"Keep responses concise and conversational, suitable for text-to-speech.",
	"Avoid heavy markdown formatting, bullet lists, and code blocks unless the user explicitly asks for them.",
	"You have access to browser automation tools. When the user asks you to browse a website, use the available browser tools to navigate, take snapshots, interact with elements, and describe what you see.",
].join(" ");

export interface RovoAppChatRequestBodyInput {
	[key: string]: unknown;
	artifactContext?: unknown;
	contextDescription?: unknown;
	creationMode?: unknown;
	id?: unknown;
	isPlanMode?: unknown;
	origin?: unknown;
}

export interface BuildRovoAppChatRequestBodyInput {
	activeDocument: RovoAppDocument | null;
	activeDocumentContent: string;
	activeDocumentId: string | null;
	artifactDraftContent: string;
	body?: RovoAppChatRequestBodyInput | null;
	chatSdkSource?: "studio";
	includeCreationMode?: boolean;
	isPlanModeActive: boolean;
	isVoiceModeActive: boolean;
	messages: ReadonlyArray<RovoUIMessage>;
	pendingArtifactCreationRetry: boolean;
	runtimeThreadId: string;
	smartGenerationRequest?: unknown;
	streamingArtifact: RovoAppStreamingArtifact | null;
	threadVisibility: RovoAppVisibility;
}

export interface RovoAppChatRequestBody extends Record<string, unknown> {
	activeArtifact?: RovoAppActiveArtifact;
	activeDocumentId: string | null;
	artifactContext?: RovoAppArtifactContextPayload;
	artifactCreationRetry?: true;
	chatSdkSource?: "studio";
	contextDescription?: string;
	creationMode?: unknown;
	id: string;
	isPlanMode: boolean;
	messages: ReadonlyArray<RovoUIMessage>;
	origin: "text" | "voice";
	recentHistory: RovoAppRecentHistoryEntry[];
	smartGeneration?: unknown;
	visibility: RovoAppVisibility;
}

export function buildArtifactContextPayload(
	document: Pick<RovoAppDocument, "id" | "title" | "kind">,
	content: string,
): RovoAppArtifactContextPayload {
	return {
		content,
		id: document.id,
		kind: document.kind,
		title: document.title,
	};
}

function buildStreamingArtifactContextPayload(
	artifact: RovoAppStreamingArtifact,
): RovoAppArtifactContextPayload | null {
	if (!artifact.documentId || !artifact.content.trim()) {
		return null;
	}

	return {
		content: artifact.content,
		id: artifact.documentId,
		kind: artifact.kind,
		title: artifact.title,
	};
}

export function resolveActiveArtifactContext(
	activeDocument: RovoAppDocument | null,
	artifactDraftContent: string,
	activeDocumentContent: string,
	streamingArtifact: RovoAppStreamingArtifact | null,
): RovoAppArtifactContextPayload | null {
	if (activeDocument && artifactDraftContent.trim()) {
		return buildArtifactContextPayload(activeDocument, artifactDraftContent);
	}
	if (activeDocument) {
		return buildArtifactContextPayload(activeDocument, activeDocumentContent);
	}
	if (streamingArtifact) {
		return buildStreamingArtifactContextPayload(streamingArtifact);
	}
	return null;
}

function getRovoAppArtifactContextFromBody(
	body: RovoAppChatRequestBodyInput | null | undefined,
): RovoAppArtifactContextPayload | null {
	if (
		body?.artifactContext &&
		typeof body.artifactContext === "object" &&
		"id" in body.artifactContext &&
		"title" in body.artifactContext &&
		"kind" in body.artifactContext &&
		"content" in body.artifactContext
	) {
		return body.artifactContext as RovoAppArtifactContextPayload;
	}

	return null;
}

function getRovoAppRequestedCreationMode(
	body: RovoAppChatRequestBodyInput | null | undefined,
	includeCreationMode: boolean,
): RovoAppCreationMode | undefined {
	if (!includeCreationMode) {
		return undefined;
	}

	return body?.creationMode === "agent" || body?.creationMode === "skill"
		? body.creationMode
		: undefined;
}

export function buildActiveArtifactMetadata(
	activeDocument: RovoAppDocument | null,
): RovoAppActiveArtifact | undefined {
	if (!activeDocument) {
		return undefined;
	}
	return {
		id: activeDocument.id,
		title: activeDocument.title,
		kind: activeDocument.kind,
	};
}

export function buildRecentHistory(
	messages: ReadonlyArray<RovoUIMessage>,
	limit = 5,
): RovoAppRecentHistoryEntry[] {
	const history: RovoAppRecentHistoryEntry[] = [];
	for (let i = messages.length - 1; i >= 0 && history.length < limit; i--) {
		const message = messages[i];
		if (message.role !== "user" && message.role !== "assistant") {
			continue;
		}
		const text = getMessageText(message);
		if (!text.trim()) {
			continue;
		}
		history.unshift({
			role: message.role,
			content: text.slice(0, 500),
		});
	}
	return history;
}

export function buildRovoAppChatRequestBody({
	activeDocument,
	activeDocumentContent,
	activeDocumentId,
	artifactDraftContent,
	body,
	chatSdkSource,
	includeCreationMode = false,
	isPlanModeActive,
	isVoiceModeActive,
	messages,
	pendingArtifactCreationRetry,
	runtimeThreadId,
	smartGenerationRequest,
	streamingArtifact,
	threadVisibility,
}: BuildRovoAppChatRequestBodyInput): RovoAppChatRequestBody {
	const bodyWithoutCreationMode: Record<string, unknown> = { ...(body ?? {}) };
	delete bodyWithoutCreationMode.creationMode;
	const requestedPlanMode =
		typeof body?.isPlanMode === "boolean"
			? body.isPlanMode
			: isPlanModeActive;
	const requestedCreationMode = getRovoAppRequestedCreationMode(body, includeCreationMode);
	const existingContextDescription =
		typeof body?.contextDescription === "string" &&
		body.contextDescription.trim()
			? body.contextDescription.trim()
			: null;
	const resolvedContextDescription =
		existingContextDescription
		?? (requestedPlanMode ? ROVO_APP_PLAN_MODE_CONTEXT : undefined)
		?? (isVoiceModeActive ? ROVO_APP_VOICE_MODE_CONTEXT : undefined);
	const artifactContextFromBody = getRovoAppArtifactContextFromBody(body);
	const activeArtifactContext = resolveActiveArtifactContext(
		activeDocument,
		artifactDraftContent,
		activeDocumentContent,
		streamingArtifact,
	);
	const explicitThreadId =
		typeof body?.id === "string" && body.id.trim()
			? body.id.trim()
			: null;
	const latestVisibleUserPrompt = getLatestVisibleRovoAppUserPrompt(messages);
	const hasPendingStructuredContinuation =
		hasPendingRovoAppStructuredContinuation(messages);
	const isVoiceTurn = body?.origin === "voice" || isVoiceModeActive;
	const hasStructuredTurnBody = Boolean(
		body?.clarification ||
		body?.deferredToolResponse ||
		body?.approval,
	);
	const turnMode = classifyRovoAppTurnMode({
		prompt: latestVisibleUserPrompt?.text ?? "",
		hasActiveArtifact: Boolean(
			activeArtifactContext?.id ||
			artifactContextFromBody?.id ||
			activeDocumentId,
		),
		hasAttachments: latestVisibleUserPrompt?.hasAttachments ?? false,
		hasPendingStructuredContinuation,
		hasStreamingArtifact: Boolean(streamingArtifact?.documentId),
		hasStructuredTurnBody,
		isPlanMode: requestedPlanMode,
		isVoiceTurn,
	});
	const resolvedSmartGenerationRequest =
		turnMode === "plain_chat"
			? undefined
			: smartGenerationRequest;

	return {
		...bodyWithoutCreationMode,
		activeDocumentId:
			artifactContextFromBody?.id ??
			activeArtifactContext?.id ??
			activeDocumentId ??
			null,
		id: explicitThreadId ?? runtimeThreadId,
		messages,
		contextDescription: resolvedContextDescription,
		visibility: threadVisibility,
		artifactContext:
			artifactContextFromBody ??
			activeArtifactContext ??
			undefined,
		smartGeneration: resolvedSmartGenerationRequest,
		activeArtifact: buildActiveArtifactMetadata(activeDocument),
		artifactCreationRetry: pendingArtifactCreationRetry || undefined,
		...(chatSdkSource ? { chatSdkSource } : {}),
		origin: body?.origin === "voice" ? "voice" : "text",
		recentHistory: buildRecentHistory(messages),
		isPlanMode: requestedPlanMode,
		...(requestedCreationMode ? { creationMode: requestedCreationMode } : {}),
	};
}
