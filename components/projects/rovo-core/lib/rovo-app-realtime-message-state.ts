"use client";

import { getMessageTimestamp } from "@/components/projects/rovo-core/lib/rovo-app-message-artifacts";
import type { RovoAppThread } from "@/lib/rovo-app-types";
import type { RovoMessageMetadata, RovoUIMessage } from "@/lib/rovo-ui-messages";

type RealtimeTextState = "done" | "streaming";
type RovoAppRealtimeMessagesMutator = (
	updater: (currentMessages: RovoUIMessage[]) => RovoUIMessage[],
) => RovoUIMessage[];
type RovoAppRealtimeMessagePersistor = (
	input: Readonly<{
		message: RovoUIMessage;
		threadId: string;
	}>,
) => Promise<unknown>;
type RovoAppThreadsUpdater = (
	updater: (previousThreads: RovoAppThread[]) => RovoAppThread[],
) => void;

export interface CreateRealtimeTextMessageOptions {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: string;
	state?: RealtimeTextState;
	metadata?: Partial<RovoMessageMetadata>;
}

export interface CreateRovoAppRealtimeAppendMessageOptions {
	content: string;
	createdAt: string;
	messageId: string;
	metadata?: Partial<RovoMessageMetadata>;
	parts?: RovoUIMessage["parts"];
	role: "user" | "assistant";
	state?: RealtimeTextState;
}

export interface AppendRovoAppRealtimeMessageOptions {
	createdAt?: string;
	messageId?: string;
	metadata?: RovoUIMessage["metadata"];
	parts?: RovoUIMessage["parts"];
	state?: RealtimeTextState;
}

export interface AppendRovoAppRealtimeMessageInput {
	content: string;
	createMessageId?: () => string;
	ensureThread: (fallbackText: string) => Promise<string>;
	getNow?: () => string;
	logWarning?: (message: string, error: unknown) => void;
	mutateRealtimeMessagesState: RovoAppRealtimeMessagesMutator;
	options?: AppendRovoAppRealtimeMessageOptions;
	persistRealtimeMessage: RovoAppRealtimeMessagePersistor;
	role: "user" | "assistant";
	setThreads: RovoAppThreadsUpdater;
}

export interface MutateRovoAppRealtimeMessageContentInput {
	activeThreadId: string | null;
	content: string;
	getNow?: () => string;
	logWarning?: (message: string, error: unknown) => void;
	messageId: string;
	mutateRealtimeMessagesState: RovoAppRealtimeMessagesMutator;
	options: {
		append: boolean;
		state: RealtimeTextState;
	};
	persistRealtimeMessage: RovoAppRealtimeMessagePersistor;
}

export interface NormalizeDelegatedRealtimeMessageOptions {
	delegatedFromId: string;
	effectiveId: string;
	existingMessage?: RovoUIMessage | null;
	now?: string;
	streamedMessage: RovoUIMessage;
}

export interface UpdateRealtimeTextMessageOptions {
	append?: boolean;
	metadata?: Partial<RovoMessageMetadata>;
	state?: RealtimeTextState;
}

export interface ReplaceRealtimeMessageOptions {
	message: RovoUIMessage;
	messageId: string;
	metadata?: Partial<RovoMessageMetadata>;
}

interface MergeRovoAppMessagesOptions {
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	rovoMessages: ReadonlyArray<RovoUIMessage>;
}

interface RovoAppMessageEntry {
	index: number;
	message: RovoUIMessage;
	timestamp: number | null;
	type: "realtime" | "rovo";
}

function applyMetadataPatch(
	currentMetadata: RovoMessageMetadata | undefined,
	metadataPatch: Partial<RovoMessageMetadata> | undefined,
): RovoMessageMetadata | undefined {
	if (!currentMetadata && !metadataPatch) {
		return undefined;
	}

	return {
		...(currentMetadata ?? {}),
		...(metadataPatch ?? {}),
	};
}

function buildRealtimeMessageParts({
	currentParts,
	nextText,
	state,
}: {
	currentParts: ReadonlyArray<RovoUIMessage["parts"][number]>;
	nextText: string;
	state?: RealtimeTextState;
}): RovoUIMessage["parts"] {
	let didUpdateTextPart = false;
	const nextParts = currentParts.map((part) => {
		if (!didUpdateTextPart && part.type === "text") {
			didUpdateTextPart = true;
			return {
				...part,
				state: state ?? part.state,
				text: nextText,
			};
		}

		return part;
	});

	if (didUpdateTextPart) {
		return nextParts;
	}

	return [
		{
			type: "text",
			text: nextText,
			state: state ?? "done",
		},
		...nextParts,
	];
}

export function createRealtimeTextMessage({
	id,
	role,
	content,
	createdAt,
	state = "done",
	metadata,
}: CreateRealtimeTextMessageOptions): RovoUIMessage {
	return {
		id,
		role,
		metadata: {
			createdAt,
			updatedAt: createdAt,
			origin: "realtime",
			...(metadata ?? {}),
		},
		parts: [
			{
				type: "text",
				text: content,
				state,
			},
		],
	};
}

export function createRovoAppRealtimeAppendMessage({
	content,
	createdAt,
	messageId,
	metadata,
	parts,
	role,
	state = "done",
}: CreateRovoAppRealtimeAppendMessageOptions): RovoUIMessage {
	const normalizedMetadata: RovoMessageMetadata = {
		createdAt,
		updatedAt: metadata?.updatedAt ?? createdAt,
		origin: "realtime",
		...(metadata ?? {}),
		realtimeMessageId: messageId,
	};

	if (parts) {
		return {
			id: messageId,
			role,
			metadata: normalizedMetadata,
			parts,
		};
	}

	return createRealtimeTextMessage({
		id: messageId,
		role,
		content,
		createdAt,
		state,
		metadata: normalizedMetadata,
	});
}

export function normalizeDelegatedRealtimeMessage({
	delegatedFromId,
	effectiveId,
	existingMessage,
	now = new Date().toISOString(),
	streamedMessage,
}: NormalizeDelegatedRealtimeMessageOptions): RovoUIMessage {
	return {
		...streamedMessage,
		id: effectiveId,
		metadata: {
			...(streamedMessage.metadata ?? {}),
			createdAt:
				existingMessage?.metadata?.createdAt ??
				streamedMessage.metadata?.createdAt ??
				now,
			delegatedFromId,
			origin: "rovo",
			realtimeMessageId:
				streamedMessage.metadata?.realtimeMessageId ??
				existingMessage?.metadata?.realtimeMessageId ??
				streamedMessage.id,
			updatedAt: now,
		},
	};
}

export function updateRealtimeTextMessage(
	messages: ReadonlyArray<RovoUIMessage>,
	messageId: string,
	content: string,
	{
		append = true,
		metadata,
		state,
	}: UpdateRealtimeTextMessageOptions = {},
): RovoUIMessage[] {
	return messages.map((message) => {
		if (message.id !== messageId) {
			return message;
		}

		const previousTextPart = message.parts.find((part) => part.type === "text");
		const nextText = append
			? `${previousTextPart?.type === "text" ? previousTextPart.text : ""}${content}`
			: content;

		return {
			...message,
			metadata: applyMetadataPatch(message.metadata, metadata),
			parts: buildRealtimeMessageParts({
				currentParts: message.parts,
				nextText,
				state: state ?? (previousTextPart?.type === "text" ? previousTextPart.state : "done"),
			}),
		};
	});
}

export function replaceRealtimeMessage(
	messages: ReadonlyArray<RovoUIMessage>,
	{ message, messageId, metadata }: ReplaceRealtimeMessageOptions,
): RovoUIMessage[] {
	return messages.map((currentMessage) => {
		if (currentMessage.id !== messageId) {
			return currentMessage;
		}

		return {
			...message,
			id: messageId,
			metadata: applyMetadataPatch(message.metadata, metadata),
		};
	});
}

export function upsertRealtimeMessage(
	messages: ReadonlyArray<RovoUIMessage>,
	message: RovoUIMessage,
): RovoUIMessage[] {
	const existingIndex = messages.findIndex((currentMessage) => currentMessage.id === message.id);
	if (existingIndex === -1) {
		return [...messages, message];
	}

	return messages.map((currentMessage) =>
		currentMessage.id === message.id ? message : currentMessage,
	);
}

export async function appendRovoAppRealtimeMessage({
	content,
	createMessageId,
	ensureThread,
	getNow = () => new Date().toISOString(),
	logWarning = console.warn,
	mutateRealtimeMessagesState,
	options,
	persistRealtimeMessage,
	role,
	setThreads,
}: AppendRovoAppRealtimeMessageInput): Promise<string> {
	const createdAt = options?.createdAt ?? getNow();
	const messageId = options?.messageId ?? createMessageId?.() ?? `rovo-app-realtime-${createdAt}`;
	const threadId = await ensureThread(content || `${role} message`);
	const message = createRovoAppRealtimeAppendMessage({
		content,
		createdAt,
		messageId,
		metadata: options?.metadata,
		parts: options?.parts,
		role,
		state: options?.state ?? "done",
	});

	const nextRealtimeMessages = mutateRealtimeMessagesState((previousMessages) =>
		upsertRealtimeMessage(previousMessages, message),
	);
	const updatedAt = getNow();
	setThreads((previousThreads) =>
		previousThreads.map((thread) => {
			if (thread.id !== threadId) {
				return thread;
			}

			return {
				...thread,
				realtimeMessages: upsertRealtimeMessage(
					thread.realtimeMessages ?? [],
					message,
				),
				updatedAt,
			};
		}),
	);
	void persistRealtimeMessage({
		threadId,
		message:
			nextRealtimeMessages.find((existingMessage) => existingMessage.id === messageId)
			?? message,
	}).catch((error) => {
		logWarning("[RovoApp] Failed to persist realtime message:", error);
	});

	return messageId;
}

export function mutateRovoAppRealtimeMessageContent({
	activeThreadId,
	content,
	getNow = () => new Date().toISOString(),
	logWarning = console.warn,
	messageId,
	mutateRealtimeMessagesState,
	options,
	persistRealtimeMessage,
}: MutateRovoAppRealtimeMessageContentInput): void {
	if (!messageId || (!content && options.append)) {
		return;
	}

	const updatedAt = getNow();
	const nextRealtimeMessages = mutateRealtimeMessagesState((previousMessages) =>
		updateRealtimeTextMessage(previousMessages, messageId, content, {
			append: options.append,
			metadata: { updatedAt },
			state: options.state,
		}),
	);
	if (!activeThreadId) {
		return;
	}

	const nextMessage = nextRealtimeMessages.find((message) => message.id === messageId);
	if (!nextMessage) {
		return;
	}

	void persistRealtimeMessage({
		threadId: activeThreadId,
		message: nextMessage,
	}).catch((error) => {
		logWarning("[RovoApp] Failed to persist realtime message:", error);
	});
}

function isStreamingRovoAppMessage(message: RovoUIMessage): boolean {
	return message.parts.some((part) => part.type === "text" && part.state === "streaming");
}

function shouldReplaceRovoAppMessageEntry(
	existingEntry: RovoAppMessageEntry,
	candidateEntry: RovoAppMessageEntry,
): boolean {
	const existingIsStreaming = isStreamingRovoAppMessage(existingEntry.message);
	const candidateIsStreaming = isStreamingRovoAppMessage(candidateEntry.message);
	if (existingIsStreaming !== candidateIsStreaming) {
		return candidateIsStreaming;
	}

	if (existingEntry.type !== candidateEntry.type) {
		return candidateEntry.type === "rovo";
	}

	return true;
}

export function mergeRovoAppMessages({
	realtimeMessages,
	rovoMessages,
}: MergeRovoAppMessagesOptions): RovoUIMessage[] {
	const entries: RovoAppMessageEntry[] = [
		...rovoMessages.map((message, index) => ({
			index,
			message,
			timestamp: getMessageTimestamp(message),
			type: "rovo" as const,
		})),
		...realtimeMessages.map((message, index) => ({
			index,
			message,
			timestamp: getMessageTimestamp(message),
			type: "realtime" as const,
		})),
	];

	entries.sort((left, right) => {
		if (left.timestamp !== null && right.timestamp !== null && left.timestamp !== right.timestamp) {
			return left.timestamp - right.timestamp;
		}
		if (left.timestamp !== null && right.timestamp === null) {
			return -1;
		}
		if (left.timestamp === null && right.timestamp !== null) {
			return 1;
		}
		if (left.type !== right.type) {
			return left.type === "rovo" ? -1 : 1;
		}
		return left.index - right.index;
	});

	const dedupedEntries: RovoAppMessageEntry[] = [];
	const dedupedEntriesById = new Map<string, number>();
	for (const entry of entries) {
		const existingEntryIndex = dedupedEntriesById.get(entry.message.id);
		if (existingEntryIndex === undefined) {
			dedupedEntriesById.set(entry.message.id, dedupedEntries.length);
			dedupedEntries.push(entry);
			continue;
		}

		const existingEntry = dedupedEntries[existingEntryIndex];
		if (!existingEntry) {
			dedupedEntriesById.set(entry.message.id, dedupedEntries.length);
			dedupedEntries.push(entry);
			continue;
		}

		if (shouldReplaceRovoAppMessageEntry(existingEntry, entry)) {
			dedupedEntries[existingEntryIndex] = entry;
		}
	}

	return dedupedEntries.map((entry) => entry.message);
}
