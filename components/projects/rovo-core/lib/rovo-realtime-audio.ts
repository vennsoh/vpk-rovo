export const REALTIME_AUDIO_SAMPLE_RATE = 24_000;

/** Decode a base64 string into a Float32Array of PCM16 samples. */
export function decodeBase64Pcm16(base64: string): Float32Array {
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	const int16 = new Int16Array(bytes.buffer);
	const float32 = new Float32Array(int16.length);
	for (let i = 0; i < int16.length; i++) {
		float32[i] = int16[i] / 32768;
	}
	return float32;
}

export function buildOutputWaveformBars({
	barCount,
	samples,
}: {
	barCount: number;
	samples: Float32Array;
}) {
	if (barCount <= 0 || samples.length === 0) {
		return [];
	}

	const sideCount = Math.max(1, Math.ceil(barCount / 2));
	const chunkSize = Math.max(1, Math.floor(samples.length / sideCount));
	const sideBars: number[] = [];

	for (let index = 0; index < sideCount; index += 1) {
		const start = index * chunkSize;
		const end =
			index === sideCount - 1
				? samples.length
				: Math.min(samples.length, start + chunkSize);
		let sumSquares = 0;

		for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
			const sample = samples[sampleIndex] ?? 0;
			sumSquares += sample * sample;
		}

		const sampleCount = Math.max(1, end - start);
		const rms = Math.sqrt(sumSquares / sampleCount);
		sideBars.push(Math.max(0.05, Math.min(1, rms * 1.8)));
	}

	const centerIndex = (barCount - 1) / 2;
	const bars: number[] = [];

	for (let index = 0; index < barCount; index += 1) {
		const mirroredIndex = Math.min(
			sideBars.length - 1,
			Math.floor(Math.abs(index - centerIndex)),
		);
		const normalizedDistance = Math.abs(index - centerIndex) / Math.max(1, centerIndex);
		const centerWeight = 0.78 + (1 - normalizedDistance) * 0.34;
		const value = (sideBars[mirroredIndex] ?? 0.05) * centerWeight;
		bars.push(Math.max(0.05, Math.min(1, value)));
	}

	return bars;
}

/** Encode a Float32Array of PCM samples to a base64 PCM16 string. */
export function encodeFloat32ToPcm16Base64(samples: Float32Array): string {
	const int16 = new Int16Array(samples.length);
	for (let i = 0; i < samples.length; i++) {
		const clamped = Math.max(-1, Math.min(1, samples[i]));
		int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
	}
	const bytes = new Uint8Array(int16.buffer);
	let binary = "";
	const chunkSize = 8192;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
	}
	return btoa(binary);
}

/**
 * Resample from source sample rate to target sample rate using linear interpolation.
 */
export function resampleLinear(
	samples: Float32Array,
	sourceSampleRate: number,
	targetSampleRate: number,
): Float32Array {
	if (sourceSampleRate === targetSampleRate) {
		return samples;
	}
	const ratio = sourceSampleRate / targetSampleRate;
	const outputLength = Math.ceil(samples.length / ratio);
	const output = new Float32Array(outputLength);
	for (let i = 0; i < outputLength; i++) {
		const srcIndex = i * ratio;
		const srcIndexFloor = Math.floor(srcIndex);
		const srcIndexCeil = Math.min(srcIndexFloor + 1, samples.length - 1);
		const fraction = srcIndex - srcIndexFloor;
		output[i] =
			samples[srcIndexFloor] * (1 - fraction) +
			samples[srcIndexCeil] * fraction;
	}
	return output;
}
