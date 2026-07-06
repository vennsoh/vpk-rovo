import type { ComponentDetail } from "@/app/data/component-detail-types";

export const VISUAL_WAVEFORM_DETAIL: ComponentDetail = {
		description: "Standalone Rovo live-voice demo using the exact composer, gradient waveform, and GPT Realtime hook without the thread-persistence backend dependency.",
		importStatement: `import VisualWaveform from "@/components/blocks/visual-waveform/page";`,
		usage: `import VisualWaveform from "@/components/blocks/visual-waveform/page";

<VisualWaveform />`,
		demoLayout: { previewHeight: "default" },
	};
