import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SPEECH_INPUT_DETAIL: ComponentDetail = {
	description:
		"A voice input button with animated pulse rings and automatic browser capability detection. Uses Web Speech API (Chrome/Edge) or MediaRecorder fallback (Firefox/Safari) with external transcription service support.",
	usage: `import { SpeechInput } from "@/components/ui-custom/speech-input";

<SpeechInput
  onTranscriptionChange={(text) => console.log(text)}
  onAudioRecorded={async (blob) => {
    // Send blob to transcription API, return text
    return "transcribed text";
  }}
  lang="en-US"
/>`,
	props: [
		{
			name: "onTranscriptionChange",
			type: "(text: string) => void",
			description: "Callback fired when final transcription is available. Does not fire for interim results.",
		},
		{
			name: "onAudioRecorded",
			type: "(audioBlob: Blob) => Promise<string>",
			description: "Required for Firefox/Safari. Receives audio Blob (audio/webm) and should return transcribed text from an external service.",
		},
		{
			name: "lang",
			type: "string",
			default: '"en-US"',
			description: "BCP 47 language tag for speech recognition.",
		},
		{
			name: "...props",
			type: "ComponentProps<typeof Button>",
			description: "All Button props (variant, size, disabled, className) are forwarded.",
		},
	],
	subComponents: [
		{ name: "SpeechInput", description: "Standalone button with mic/stop icon, animated pulse rings when listening, and spinner when processing audio." },
	],
	examples: [
		{ title: "With transcript", description: "Speech input that displays transcribed text below the button.", demoSlug: "speech-input-demo-with-transcript" },
		{ title: "Sizes", description: "Small, default, and large button sizes.", demoSlug: "speech-input-demo-sizes" },
		{ title: "Disabled", description: "Disabled state when speech input is unavailable.", demoSlug: "speech-input-demo-disabled" },
	],
};
