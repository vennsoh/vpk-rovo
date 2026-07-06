const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const CORE_HOOK_SOURCE = fs.readFileSync(
	path.join(__dirname, "use-realtime-voice.ts"),
	"utf8",
);
const PROTOCOL_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/rovo-core/lib/rovo-realtime-protocol.ts"),
	"utf8",
);
const PLAYBACK_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/rovo-core/lib/rovo-realtime-playback.ts"),
	"utf8",
);
const ROVO_WRAPPER_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/rovo/hooks/use-realtime-voice.ts"),
	"utf8",
);
const STUDIO_WRAPPER_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/studio/hooks/use-realtime-voice.ts"),
	"utf8",
);

test("Rovo and Studio realtime voice hooks are thin policy wrappers over core", () => {
	assert.match(
		ROVO_WRAPPER_SOURCE,
		/import \{ useRealtimeVoice as useRealtimeVoiceCore \} from "@\/components\/projects\/rovo-core\/hooks\/use-realtime-voice";/u,
	);
	assert.match(
		STUDIO_WRAPPER_SOURCE,
		/import \{ useRealtimeVoice as useRealtimeVoiceCore \} from "@\/components\/projects\/rovo-core\/hooks\/use-realtime-voice";/u,
	);

	for (const source of [ROVO_WRAPPER_SOURCE, STUDIO_WRAPPER_SOURCE]) {
		assert.match(
			source,
			/export type UseRealtimeVoiceOptions = Omit<[\s\S]*CoreUseRealtimeVoiceOptions,[\s\S]*"sessionPolicyMode"[\s\S]*>;/u,
		);
		assert.doesNotMatch(source, /rovo-app-voice-capture/u);
		assert.doesNotMatch(source, /rovo-app-realtime-assistant-state/u);
		assert.doesNotMatch(source, /resolveRovoRealtimeVoiceSessionPolicy/u);
	}

	assert.match(
		ROVO_WRAPPER_SOURCE,
		/useRealtimeVoiceCore\(\{[\s\S]*\.\.\.options,[\s\S]*sessionPolicyMode: "auto",[\s\S]*\}\)/u,
	);
	assert.match(
		STUDIO_WRAPPER_SOURCE,
		/useRealtimeVoiceCore\(\{[\s\S]*\.\.\.options,[\s\S]*sessionPolicyMode: "manual-turn-taking",[\s\S]*\}\)/u,
	);
});

test("realtime voice core owns session policy dispatch", () => {
	assert.match(
		CORE_HOOK_SOURCE,
		/case "session_ready":[\s\S]*resolveRovoRealtimeVoiceSessionPolicy\(\{[\s\S]*mode: sessionPolicyMode,[\s\S]*transcriptionOnly: transcriptionOnlyModeRef\.current,[\s\S]*\}\);/u,
	);
	assert.match(
		CORE_HOOK_SOURCE,
		/if \(sessionPolicy\.sessionUpdateConfig\) \{[\s\S]*sendWsMessage\(\{[\s\S]*type: "session_update",[\s\S]*config: sessionPolicy\.sessionUpdateConfig,[\s\S]*\}\);[\s\S]*\}/u,
	);
	assert.match(
		CORE_HOOK_SOURCE,
		/const connect = useCallback\(\(options\?: RealtimeVoiceConnectOptions\) => \{[\s\S]*resolveRovoRealtimeVoiceSessionPolicy\(\{[\s\S]*explicitResponseOnly: options\?\.explicitResponseOnly,[\s\S]*mode: sessionPolicyMode,[\s\S]*transcriptionOnly: options\?\.transcriptionOnly,[\s\S]*\}\);/u,
	);
	assert.match(
		CORE_HOOK_SOURCE,
		/export interface RealtimeVoiceConnectOptions \{[\s\S]*transcriptionOnly\?: boolean;[\s\S]*explicitResponseOnly\?: boolean;[\s\S]*\}/u,
	);
	assert.doesNotMatch(
		CORE_HOOK_SOURCE,
		/manualTurnTaking\?: boolean/u,
	);
});

test("realtime voice protocol and playback helpers stay outside the hook", () => {
	assert.match(
		CORE_HOOK_SOURCE,
		/from "@\/components\/projects\/rovo-core\/lib\/rovo-realtime-protocol";/u,
	);
	assert.match(
		CORE_HOOK_SOURCE,
		/from "@\/components\/projects\/rovo-core\/lib\/rovo-realtime-playback";/u,
	);
	assert.doesNotMatch(CORE_HOOK_SOURCE, /interface ClientAudioBufferAppend/u);
	assert.doesNotMatch(CORE_HOOK_SOURCE, /interface ServerSessionReady/u);
	assert.doesNotMatch(CORE_HOOK_SOURCE, /function createPlaybackQueue/u);
	assert.match(PROTOCOL_SOURCE, /export type ClientMessage/u);
	assert.match(PROTOCOL_SOURCE, /export type ServerMessage/u);
	assert.match(PLAYBACK_SOURCE, /export function createPlaybackQueue/u);
	assert.match(PLAYBACK_SOURCE, /export function enqueueAudio/u);
});
