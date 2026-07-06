import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const UI_AUDIO_DEMO: Record<string, ComponentType> = {
	"audio-player": dynamic(() => import("../demos/ui-audio/audio-player-demo"), {
		ssr: false,
	}),
	"bar-visualizer": dynamic(
		() => import("../demos/ui-audio/bar-visualizer-demo"),
		{ ssr: false },
	),
	conversation: dynamic(() => import("../demos/ui-audio/conversation-demo"), {
		ssr: false,
	}),
	"conversation-bar": dynamic(
		() => import("../demos/ui-audio/conversation-bar-demo"),
		{ ssr: false },
	),
	"live-waveform": dynamic(
		() => import("../demos/ui-audio/live-waveform-demo"),
		{ ssr: false },
	),
	matrix: dynamic(() => import("../demos/ui-audio/matrix-demo"), { ssr: false }),
	message: dynamic(() => import("../demos/ui-audio/message-demo"), {
		ssr: false,
	}),
	"mic-selector": dynamic(() => import("../demos/ui-audio/mic-selector-demo"), {
		ssr: false,
	}),
	orb: dynamic(() => import("../demos/ui-audio/orb-demo"), { ssr: false }),
	response: dynamic(() => import("../demos/ui-audio/response-demo"), {
		ssr: false,
	}),
	"scrub-bar": dynamic(() => import("../demos/ui-audio/scrub-bar-demo"), {
		ssr: false,
	}),
	"shimmering-text": dynamic(
		() => import("../demos/ui-audio/shimmering-text-demo"),
		{ ssr: false },
	),
	"speech-input": dynamic(() => import("../demos/ui-audio/speech-input-demo"), {
		ssr: false,
	}),
	"transcript-viewer": dynamic(
		() => import("../demos/ui-audio/transcript-viewer-demo"),
		{ ssr: false },
	),
	"voice-button": dynamic(() => import("../demos/ui-audio/voice-button-demo"), {
		ssr: false,
	}),
	"voice-picker": dynamic(() => import("../demos/ui-audio/voice-picker-demo"), {
		ssr: false,
	}),
	waveform: dynamic(() => import("../demos/ui-audio/waveform-demo"), {
		ssr: false,
	}),
};

export const UI_AUDIO_VARIANT_DEMOS: Record<string, ComponentType> = {
	"audio-player-demo-default": dynamic(
		() =>
			import("../demos/ui-audio/audio-player-demo").then((mod) => ({
				default: mod.AudioPlayerDemoDefault,
			})),
		{ ssr: false },
	),
	"audio-player-demo-compact": dynamic(
		() =>
			import("../demos/ui-audio/audio-player-demo").then((mod) => ({
				default: mod.AudioPlayerDemoCompact,
			})),
		{ ssr: false },
	),
	"bar-visualizer-demo-speaking": dynamic(
		() =>
			import("../demos/ui-audio/bar-visualizer-demo").then((mod) => ({
				default: mod.BarVisualizerDemoSpeaking,
			})),
		{ ssr: false },
	),
	"conversation-demo-transcript": dynamic(
		() =>
			import("../demos/ui-audio/conversation-demo").then((mod) => ({
				default: mod.ConversationDemoTranscript,
			})),
		{ ssr: false },
	),
	"conversation-demo-empty": dynamic(
		() =>
			import("../demos/ui-audio/conversation-demo").then((mod) => ({
				default: mod.ConversationDemoEmpty,
			})),
		{ ssr: false },
	),
	"conversation-bar-demo-default": dynamic(
		() =>
			import("../demos/ui-audio/conversation-bar-demo").then((mod) => ({
				default: mod.ConversationBarDemoDefault,
			})),
		{ ssr: false },
	),
	"live-waveform-demo-scrolling": dynamic(
		() =>
			import("../demos/ui-audio/live-waveform-demo").then((mod) => ({
				default: mod.LiveWaveformDemoScrolling,
			})),
		{ ssr: false },
	),
	"matrix-demo-digits": dynamic(
		() =>
			import("../demos/ui-audio/matrix-demo").then((mod) => ({
				default: mod.MatrixDemoDigits,
			})),
		{ ssr: false },
	),
	"message-demo-flat": dynamic(
		() =>
			import("../demos/ui-audio/message-demo").then((mod) => ({
				default: mod.MessageDemoFlat,
			})),
		{ ssr: false },
	),
	"mic-selector-demo-muted": dynamic(
		() =>
			import("../demos/ui-audio/mic-selector-demo").then((mod) => ({
				default: mod.MicSelectorDemoMuted,
			})),
		{ ssr: false },
	),
	"orb-demo-states": dynamic(
		() =>
			import("../demos/ui-audio/orb-demo").then((mod) => ({
				default: mod.OrbDemoStates,
			})),
		{ ssr: false },
	),
	"response-demo-checklist": dynamic(
		() =>
			import("../demos/ui-audio/response-demo").then((mod) => ({
				default: mod.ResponseDemoChecklist,
			})),
		{ ssr: false },
	),
	"scrub-bar-demo-default": dynamic(
		() =>
			import("../demos/ui-audio/scrub-bar-demo").then((mod) => ({
				default: mod.ScrubBarDemoDefault,
			})),
		{ ssr: false },
	),
	"shimmering-text-demo-accent": dynamic(
		() =>
			import("../demos/ui-audio/shimmering-text-demo").then((mod) => ({
				default: mod.ShimmeringTextDemoAccent,
			})),
		{ ssr: false },
	),
	"speech-input-demo-compact": dynamic(
		() =>
			import("../demos/ui-audio/speech-input-demo").then((mod) => ({
				default: mod.SpeechInputDemoCompact,
			})),
		{ ssr: false },
	),
	"transcript-viewer-demo-default": dynamic(
		() =>
			import("../demos/ui-audio/transcript-viewer-demo").then((mod) => ({
				default: mod.TranscriptViewerDemoDefault,
			})),
		{ ssr: false },
	),
	"voice-button-demo-recording": dynamic(
		() =>
			import("../demos/ui-audio/voice-button-demo").then((mod) => ({
				default: mod.VoiceButtonDemoRecording,
			})),
		{ ssr: false },
	),
	"voice-picker-demo-default": dynamic(
		() =>
			import("../demos/ui-audio/voice-picker-demo").then((mod) => ({
				default: mod.VoicePickerDemoDefault,
			})),
		{ ssr: false },
	),
	"waveform-demo-scrolling": dynamic(
		() =>
			import("../demos/ui-audio/waveform-demo").then((mod) => ({
				default: mod.WaveformDemoScrolling,
			})),
		{ ssr: false },
	),
	"waveform-demo-scrubber": dynamic(
		() =>
			import("../demos/ui-audio/waveform-demo").then((mod) => ({
				default: mod.WaveformDemoScrubber,
			})),
		{ ssr: false },
	),
};
