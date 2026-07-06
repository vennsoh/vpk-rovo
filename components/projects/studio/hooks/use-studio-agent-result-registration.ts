"use client";

import { useEffect } from "react";
import { getStudioAutomationArtifactListAgents } from "@/components/projects/studio/lib/studio-automation-artifact-list";
import {
	getMessageAgentResult,
	hasTurnCompleteSignal,
	type RovoDataParts,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";

type MutableRef<T> = {
	current: T;
};

type StudioAgentResultMessage = Pick<RovoUIMessage, "id" | "parts">;

type StudioAgentResultSource = "artifact-list" | "message";

function isGeneratedAgentResult(
	agent: RovoDataParts["agent-result"] | null | undefined,
): agent is RovoDataParts["agent-result"] {
	return agent?.action === "create";
}

export interface StudioAgentResultKeyOptions {
	action: RovoDataParts["agent-result"]["action"];
	agentId: string;
	messageId: string;
	runtimeThreadId: string;
	source?: StudioAgentResultSource;
}

export interface StudioAgentResultSourceKeyOptions {
	activeThreadId?: string | null;
	agentId: string;
	messageId: string;
	runtimeThreadId: string;
}

export interface StudioAgentResultRegistry {
	registerCreatedAgentFromResult?: (
		agentResult: RovoDataParts["agent-result"],
		options?: { preserveCurrentThread?: boolean; select?: boolean; sourceKey?: string }
	) => unknown;
}

interface StudioAgentResultSelectionOptions {
	activeThreadId?: string | null;
	handledAgentResultKeys: Set<string>;
	messages: readonly StudioAgentResultMessage[];
	onAgentResultSelect: (agentResult: RovoDataParts["agent-result"], options?: { sourceMessageId?: string }) => boolean;
	runtimeThreadId: string;
	unmarkStudioAgentCreationThread: (threadId: string | null) => void;
}

interface StudioArtifactListRegistrationOptions {
	activeThreadId?: string | null;
	handledAgentResultKeys: Set<string>;
	messages: readonly StudioAgentResultMessage[];
	runtimeThreadId: string;
	studioAgentRegistry: StudioAgentResultRegistry;
	unmarkStudioAgentCreationThread: (threadId: string | null) => void;
}

interface UseStudioAgentResultRegistrationOptions {
	activeThreadId?: string | null;
	handledAgentResultKeysRef: MutableRef<Set<string>>;
	markStudioAgentCreationThread: (threadId: string | null) => void;
	messages: readonly StudioAgentResultMessage[];
	onAgentResultSelect: (agentResult: RovoDataParts["agent-result"], options?: { sourceMessageId?: string }) => boolean;
	runtimeThreadId: string;
	studioAgentCreationThreadKeysRef: MutableRef<Set<string>>;
	studioAgentRegistry: StudioAgentResultRegistry;
	unmarkStudioAgentCreationThread: (threadId: string | null) => void;
}

export function buildStudioAgentResultKey({
	action,
	agentId,
	messageId,
	runtimeThreadId,
	source = "message",
}: StudioAgentResultKeyOptions): string {
	const key = `${runtimeThreadId}:${messageId}:${agentId}:${action}`;
	return source === "artifact-list" ? `${key}:artifact-list` : key;
}

export function buildStudioAgentResultSourceKey({
	activeThreadId,
	agentId,
	messageId,
	runtimeThreadId,
}: StudioAgentResultSourceKeyOptions): string {
	return `studio-agent-result:${activeThreadId ?? runtimeThreadId}:${messageId}:${agentId}`;
}

export function selectCompletedStudioAgentResult({
	activeThreadId,
	handledAgentResultKeys,
	messages,
	onAgentResultSelect,
	runtimeThreadId,
	unmarkStudioAgentCreationThread,
}: StudioAgentResultSelectionOptions): boolean {
	for (const message of messages.toReversed()) {
		const agentResult = getMessageAgentResult(message);
		if (!isGeneratedAgentResult(agentResult) || !hasTurnCompleteSignal(message)) {
			continue;
		}

		const agentResultKey = buildStudioAgentResultKey({
			action: agentResult.action,
			agentId: agentResult.agentId,
			messageId: message.id,
			runtimeThreadId,
		});
		if (handledAgentResultKeys.has(agentResultKey)) {
			continue;
		}

		if (onAgentResultSelect(agentResult, { sourceMessageId: message.id })) {
			handledAgentResultKeys.add(agentResultKey);
			unmarkStudioAgentCreationThread(runtimeThreadId);
			unmarkStudioAgentCreationThread(activeThreadId ?? null);
			return true;
		}
	}

	return false;
}

export function registerStudioAutomationArtifactListAgents({
	activeThreadId,
	handledAgentResultKeys,
	messages,
	runtimeThreadId,
	studioAgentRegistry,
	unmarkStudioAgentCreationThread,
}: StudioArtifactListRegistrationOptions): boolean {
	if (typeof studioAgentRegistry.registerCreatedAgentFromResult !== "function") {
		return false;
	}

	for (const message of messages.toReversed()) {
		if (!hasTurnCompleteSignal(message)) {
			continue;
		}

		const artifactListAgentResults = getStudioAutomationArtifactListAgents(message);
		if (artifactListAgentResults.length === 0) {
			continue;
		}

		let didRegisterAgent = false;
		for (const agentResult of artifactListAgentResults) {
			if (!isGeneratedAgentResult(agentResult)) {
				continue;
			}

			const agentResultKey = buildStudioAgentResultKey({
				action: agentResult.action,
				agentId: agentResult.agentId,
				messageId: message.id,
				runtimeThreadId,
				source: "artifact-list",
			});
			if (handledAgentResultKeys.has(agentResultKey)) {
				continue;
			}

			const sourceKey = buildStudioAgentResultSourceKey({
				activeThreadId,
				agentId: agentResult.agentId,
				messageId: message.id,
				runtimeThreadId,
			});
			const registered = studioAgentRegistry.registerCreatedAgentFromResult(agentResult, {
				preserveCurrentThread: true,
				select: false,
				sourceKey,
			});
			if (!registered) {
				continue;
			}

			handledAgentResultKeys.add(agentResultKey);
			didRegisterAgent = true;
		}

		if (didRegisterAgent) {
			unmarkStudioAgentCreationThread(runtimeThreadId);
			unmarkStudioAgentCreationThread(activeThreadId ?? null);
			return true;
		}
	}

	return false;
}

export function useStudioAgentResultRegistration({
	activeThreadId,
	handledAgentResultKeysRef,
	markStudioAgentCreationThread,
	messages,
	onAgentResultSelect,
	runtimeThreadId,
	studioAgentCreationThreadKeysRef,
	studioAgentRegistry,
	unmarkStudioAgentCreationThread,
}: UseStudioAgentResultRegistrationOptions): void {
	useEffect(() => {
		if (studioAgentCreationThreadKeysRef.current.has(runtimeThreadId) && activeThreadId) {
			markStudioAgentCreationThread(activeThreadId);
		}
	}, [activeThreadId, runtimeThreadId, markStudioAgentCreationThread, studioAgentCreationThreadKeysRef]);

	useEffect(() => {
		selectCompletedStudioAgentResult({
			activeThreadId,
			handledAgentResultKeys: handledAgentResultKeysRef.current,
			messages,
			onAgentResultSelect,
			runtimeThreadId,
			unmarkStudioAgentCreationThread,
		});
	}, [activeThreadId, handledAgentResultKeysRef, messages, onAgentResultSelect, runtimeThreadId, unmarkStudioAgentCreationThread]);

	useEffect(() => {
		registerStudioAutomationArtifactListAgents({
			activeThreadId,
			handledAgentResultKeys: handledAgentResultKeysRef.current,
			messages,
			runtimeThreadId,
			studioAgentRegistry,
			unmarkStudioAgentCreationThread,
		});
	}, [activeThreadId, handledAgentResultKeysRef, messages, runtimeThreadId, studioAgentRegistry, unmarkStudioAgentCreationThread]);
}
