import { REALTIME_AUDIO_SAMPLE_RATE } from "@/components/projects/rovo-core/lib/rovo-realtime-audio";

export interface PlaybackQueue {
	audioContext: AudioContext;
	outputAnalyser: AnalyserNode;
	nextStartTime: number;
	isPlaying: boolean;
}

function createPlaybackAnalyser(audioContext: AudioContext) {
	const outputAnalyser = audioContext.createAnalyser();
	outputAnalyser.fftSize = 256;
	outputAnalyser.smoothingTimeConstant = 0.92;
	outputAnalyser.connect(audioContext.destination);

	return {
		outputAnalyser,
	};
}

export function createPlaybackQueue(): PlaybackQueue {
	const audioContext = new AudioContext({ sampleRate: REALTIME_AUDIO_SAMPLE_RATE });
	const { outputAnalyser } = createPlaybackAnalyser(audioContext);
	return {
		audioContext,
		outputAnalyser,
		nextStartTime: 0,
		isPlaying: false,
	};
}

export function enqueueAudio(queue: PlaybackQueue, samples: Float32Array): void {
	const buffer = queue.audioContext.createBuffer(
		1,
		samples.length,
		REALTIME_AUDIO_SAMPLE_RATE,
	);
	buffer.getChannelData(0).set(samples);

	const source = queue.audioContext.createBufferSource();
	source.buffer = buffer;
	source.connect(queue.outputAnalyser);

	const now = queue.audioContext.currentTime;
	const startTime = Math.max(now, queue.nextStartTime);
	source.start(startTime);
	queue.nextStartTime = startTime + buffer.duration;
	queue.isPlaying = true;
}

export function flushPlayback(queue: PlaybackQueue): void {
	const currentContext = queue.audioContext;
	queue.nextStartTime = 0;
	queue.isPlaying = false;
	void currentContext.close().catch(() => {});
	queue.audioContext = new AudioContext({ sampleRate: REALTIME_AUDIO_SAMPLE_RATE });
	const { outputAnalyser } = createPlaybackAnalyser(queue.audioContext);
	queue.outputAnalyser = outputAnalyser;
}

export function destroyPlaybackQueue(queue: PlaybackQueue): void {
	queue.isPlaying = false;
	void queue.audioContext.close().catch(() => {});
}
