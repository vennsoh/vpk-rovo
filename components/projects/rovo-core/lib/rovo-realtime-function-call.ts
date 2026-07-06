/**
 * App-owned screen-assistant tools the model can invoke. These are executed by
 * the browser (never raw DOM automation) and return a result via
 * `sendFunctionCallOutput`. Kept in sync with SESSION_TOOLS in
 * backend/lib/openai-realtime.js.
 */
export const SCREEN_ASSISTANT_TOOL_NAMES = new Set<string>([
	"get_screen_state",
	"point_at_target",
	"activate_screen_target",
	"set_composer_text",
	"submit_composer",
	"apply_agent_draft_patch",
]);

export interface RovoRealtimeDelegationRequest {
	prompt: string;
	intentType: string;
	conversationSummary?: string;
	urgency?: string;
	referencedFiles?: string[];
}

export type RovoRealtimeFunctionCallResolution =
	| {
		kind: "end_voice_session";
		callId: string;
	}
	| {
		kind: "delegate_to_rovo";
		callId: string;
		request: RovoRealtimeDelegationRequest;
	}
	| {
		kind: "invalid_delegate_to_rovo_arguments";
		callId: string;
		error: unknown;
	}
	| {
		kind: "screen_assistant_tool";
		args: Record<string, unknown>;
		callId: string;
		name: string;
		parseError?: unknown;
	}
	| {
		kind: "ignored";
		callId: string;
		name: string;
	};

export function resolveRovoRealtimeFunctionCall(message: {
	arguments: string;
	callId: string;
	name: string;
}): RovoRealtimeFunctionCallResolution {
	if (message.name === "end_voice_session") {
		return {
			kind: "end_voice_session",
			callId: message.callId,
		};
	}

	if (message.name === "delegate_to_rovo") {
		try {
			const args = JSON.parse(message.arguments) as {
				conversation_summary?: string;
				intent_type: string;
				prompt: string;
				referenced_files?: string[];
				urgency?: string;
			};

			return {
				kind: "delegate_to_rovo",
				callId: message.callId,
				request: {
					prompt: args.prompt,
					intentType: args.intent_type,
					conversationSummary: args.conversation_summary,
					urgency: args.urgency,
					referencedFiles: args.referenced_files,
				},
			};
		} catch (error) {
			return {
				kind: "invalid_delegate_to_rovo_arguments",
				callId: message.callId,
				error,
			};
		}
	}

	if (SCREEN_ASSISTANT_TOOL_NAMES.has(message.name)) {
		let args: Record<string, unknown> = {};
		let parseError: unknown;
		try {
			args = message.arguments ? JSON.parse(message.arguments) : {};
		} catch (error) {
			parseError = error;
		}

		return {
			kind: "screen_assistant_tool",
			args,
			callId: message.callId,
			name: message.name,
			parseError,
		};
	}

	return {
		kind: "ignored",
		callId: message.callId,
		name: message.name,
	};
}
