"use client";

import { DefaultChatTransport } from "ai";
import { useMemo } from "react";
import { API_ENDPOINTS } from "@/lib/api-config";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import type {
	RovoAppDocument,
	RovoAppVisibility,
} from "@/lib/rovo-app-types";
import type { RovoAppStreamingArtifact } from "@/components/projects/rovo-core/lib/rovo-app-streaming-artifact";
import type { RovoAppRouteAdapter } from "@/components/projects/rovo-core/lib/rovo-app-route-adapter";
import { buildRovoAppChatRequestBody } from "@/components/projects/rovo-core/lib/rovo-app-chat-request-body";

interface RovoAppBooleanRef {
	current: boolean;
}

export interface UseRovoAppChatTransportOptions {
	activeDocument: RovoAppDocument | null;
	activeDocumentContent: string;
	activeDocumentId: string | null;
	artifactDraftContent: string;
	isPlanModeRef: RovoAppBooleanRef;
	isVoiceModeRef: RovoAppBooleanRef;
	pendingArtifactCreationRetryRef: RovoAppBooleanRef;
	routeAdapter: RovoAppRouteAdapter;
	runtimeThreadId: string;
	smartGenerationRequest?: unknown;
	streamingArtifact: RovoAppStreamingArtifact | null;
	threadVisibility: RovoAppVisibility;
}

export function useRovoAppChatTransport({
	activeDocument,
	activeDocumentContent,
	activeDocumentId,
	artifactDraftContent,
	isPlanModeRef,
	isVoiceModeRef,
	pendingArtifactCreationRetryRef,
	routeAdapter,
	runtimeThreadId,
	smartGenerationRequest,
	streamingArtifact,
	threadVisibility,
}: UseRovoAppChatTransportOptions) {
	return useMemo(
		() =>
			new DefaultChatTransport<RovoUIMessage>({
				api: API_ENDPOINTS.ROVO_APP_CHAT,
				prepareSendMessagesRequest: ({ messages, body }) => {
					return {
						body: buildRovoAppChatRequestBody({
							activeDocument,
							activeDocumentContent,
							activeDocumentId,
							artifactDraftContent,
							body,
							...routeAdapter.chatRequestBodyOptions,
							isPlanModeActive: isPlanModeRef.current,
							isVoiceModeActive: isVoiceModeRef.current,
							messages,
							pendingArtifactCreationRetry: pendingArtifactCreationRetryRef.current,
							runtimeThreadId,
							smartGenerationRequest,
							streamingArtifact,
							threadVisibility,
						}),
					};
				},
			}),
		[
			activeDocument,
			activeDocumentContent,
			activeDocumentId,
			artifactDraftContent,
			isPlanModeRef,
			isVoiceModeRef,
			pendingArtifactCreationRetryRef,
			routeAdapter,
			runtimeThreadId,
			smartGenerationRequest,
			streamingArtifact,
			threadVisibility,
		],
	);
}
