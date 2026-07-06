export interface ClientAudioBufferAppend {
	type: "audio_buffer_append";
	audio: string;
}

export interface ClientAudioBufferCommit {
	type: "audio_buffer_commit";
}

export interface ClientSessionUpdate {
	type: "session_update";
	config: Record<string, unknown>;
}

export interface ClientContextInject {
	type: "context_inject";
	data: {
		type:
			| "initial_context"
			| "thread_context"
			| "artifact_complete"
			| "thread_message"
			| "artifact_annotations"
			| "artifact_context"
			| "delegation_error";
		summary?: string;
		role?: string;
		content?: string;
	};
}

export interface ClientTextMessageFromUser {
	type: "text_message_from_user";
	text: string;
}

export interface ClientResponseCreate {
	type: "response_create";
}

export interface ClientFunctionCallOutput {
	type: "function_call_output";
	callId: string;
	output: string;
	createResponse?: boolean;
}

export type ClientMessage =
	| ClientAudioBufferAppend
	| ClientAudioBufferCommit
	| ClientSessionUpdate
	| ClientContextInject
	| ClientTextMessageFromUser
	| ClientResponseCreate
	| ClientFunctionCallOutput;

export interface ServerSessionReady {
	type: "session_ready";
}

export interface ServerAudioDelta {
	type: "audio_delta";
	delta: string;
}

export interface ServerResponseCreated {
	type: "response_created";
	responseId?: string;
}

export interface ServerTextDelta {
	type: "text_delta";
	delta: string;
	itemId?: string;
	responseId?: string;
}

export interface ServerAudioTranscriptDelta {
	type: "audio_transcript_delta";
	delta: string;
	itemId?: string;
	responseId?: string;
}

export interface ServerAudioTranscriptDone {
	type: "audio_transcript_done";
	transcript: string;
	itemId?: string;
	responseId?: string;
}

export interface ServerTranscriptionDelta {
	type: "transcription_delta";
	delta: string;
}

export interface ServerTranscriptionCompleted {
	type: "transcription_completed";
	transcript: string;
}

export interface ServerSpeechStarted {
	type: "speech_started";
}

export interface ServerSpeechStopped {
	type: "speech_stopped";
}

export interface ServerError {
	type: "error";
	error: {
		message: string;
		code?: string;
	};
}

export interface ServerFunctionCall {
	type: "function_call";
	name: string;
	arguments: string;
	callId: string;
}

export interface ServerResponseDone {
	type: "response_done";
	responseId?: string;
}

export type ServerMessage =
	| ServerSessionReady
	| ServerAudioDelta
	| ServerResponseCreated
	| ServerTextDelta
	| ServerAudioTranscriptDelta
	| ServerAudioTranscriptDone
	| ServerTranscriptionDelta
	| ServerTranscriptionCompleted
	| ServerSpeechStarted
	| ServerSpeechStopped
	| ServerError
	| ServerFunctionCall
	| ServerResponseDone;
