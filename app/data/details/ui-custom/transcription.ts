import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TRANSCRIPTION_DETAIL: ComponentDetail = {
	description:
		"A synchronized transcript display that highlights words in time with audio playback. Supports controlled and uncontrolled current-time state, click-to-seek navigation, and automatic filtering of empty segments. Designed for use with AI SDK transcription results.",
	usage: `import { Transcription, TranscriptionSegment } from "@/components/ui-custom/transcription";

<Transcription
  segments={transcriptionResult.segments}
  currentTime={currentTime}
  onSeek={(time) => setCurrentTime(time)}
>
  {(segment, index) => (
    <TranscriptionSegment key={index} segment={segment} index={index} />
  )}
</Transcription>`,
	props: [
		{
			name: "segments",
			type: "TranscriptionSegment[]",
			required: true,
			description: "Array of transcription segments from AI SDK transcribe(). Each segment has text, startSecond, and endSecond fields.",
		},
		{
			name: "currentTime",
			type: "number",
			default: "0",
			description: "Current playback position in seconds. Enables controlled mode when provided.",
		},
		{
			name: "onSeek",
			type: "(time: number) => void",
			description: "Callback fired when a segment is clicked with the segment's start time. Also fires on controlled time changes.",
		},
		{
			name: "children",
			type: "(segment: TranscriptionSegment, index: number) => ReactNode",
			required: true,
			description: "Render function that receives each non-empty segment and its index.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the root container.",
		},
	],
	subComponents: [
		{ name: "Transcription", description: "Root container and context provider. Wraps segments in a flex-wrap layout and filters out empty/whitespace-only segments." },
		{ name: "TranscriptionSegment", description: "Individual word button with automatic state styling. Active segments show primary color, past segments use muted foreground, future segments are dimmed. Clickable when onSeek is provided." },
	],
	examples: [
		{ title: "Static", description: "Transcript without playback — all segments rendered in dimmed state.", demoSlug: "transcription-demo-static" },
		{ title: "With seek", description: "Click-to-seek navigation with controlled current time.", demoSlug: "transcription-demo-with-seek" },
	],
};
