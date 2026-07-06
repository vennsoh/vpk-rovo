import type { ComponentDetail } from "@/app/data/component-detail-types";

export const AUDIO_PLAYER_DETAIL: ComponentDetail = {
	description:
		"A composable audio player built on media-chrome with play/pause, seek, time display, and volume controls. Supports remote URLs and AI SDK SpeechResult base64 audio.",
	usage: `import {
  AudioPlayer,
  AudioPlayerElement,
  AudioPlayerControlBar,
  AudioPlayerPlayButton,
  AudioPlayerTimeDisplay,
  AudioPlayerTimeRange,
  AudioPlayerDurationDisplay,
  AudioPlayerMuteButton,
  AudioPlayerVolumeRange,
  AudioPlayerSeekBackwardButton,
  AudioPlayerSeekForwardButton,
} from "@/components/ui-custom/audio-player";

<AudioPlayer>
  <AudioPlayerElement src="/audio/sample.mp3" />
  <AudioPlayerControlBar>
    <AudioPlayerPlayButton />
    <AudioPlayerTimeDisplay />
    <AudioPlayerTimeRange />
    <AudioPlayerDurationDisplay />
  </AudioPlayerControlBar>
</AudioPlayer>`,
	props: [
		{
			name: "src",
			type: "string",
			description: "Remote audio URL passed to AudioPlayerElement.",
		},
		{
			name: "data",
			type: "SpeechResult[\"audio\"]",
			description: "AI SDK SpeechResult audio object with base64 and mediaType fields, passed to AudioPlayerElement.",
		},
		{
			name: "seekOffset",
			type: "number",
			default: "10",
			description: "Seconds to skip on seek backward/forward buttons.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to any sub-component.",
		},
	],
	subComponents: [
		{ name: "AudioPlayer", description: "Root MediaController wrapper for audio playback with theme variables." },
		{ name: "AudioPlayerElement", description: "Audio source element supporting remote URLs (src) or AI SDK SpeechResult data (base64)." },
		{ name: "AudioPlayerControlBar", description: "Control bar container that wraps child controls in a ButtonGroup." },
		{ name: "AudioPlayerPlayButton", description: "Play/pause toggle button." },
		{ name: "AudioPlayerSeekBackwardButton", description: "Rewind button (default: 10 seconds)." },
		{ name: "AudioPlayerSeekForwardButton", description: "Fast-forward button (default: 10 seconds)." },
		{ name: "AudioPlayerTimeDisplay", description: "Current playback position display." },
		{ name: "AudioPlayerDurationDisplay", description: "Total audio duration display." },
		{ name: "AudioPlayerTimeRange", description: "Seek slider for position control." },
		{ name: "AudioPlayerMuteButton", description: "Mute/unmute toggle button." },
		{ name: "AudioPlayerVolumeRange", description: "Volume level slider." },
	],
	examples: [
		{ title: "Full controls", description: "Audio player with seek, play/pause, time, duration, mute, and volume.", demoSlug: "audio-player-demo-full" },
		{ title: "Compact", description: "Minimal player with play, seek slider, and time display.", demoSlug: "audio-player-demo-compact" },
		{ title: "With volume", description: "Player with time range, duration, and volume controls.", demoSlug: "audio-player-demo-with-volume" },
	],
};
