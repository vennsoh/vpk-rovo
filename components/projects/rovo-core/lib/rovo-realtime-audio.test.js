const test = require("node:test");
const assert = require("node:assert/strict");
const { loadRovoCoreModule } = require("../test-utils/load-rovo-core-module.cjs");

const {
	buildOutputWaveformBars,
	decodeBase64Pcm16,
	encodeFloat32ToPcm16Base64,
	resampleLinear,
} = loadRovoCoreModule("lib/rovo-realtime-audio.ts");

function pcm16Base64(values) {
	return Buffer.from(new Int16Array(values).buffer).toString("base64");
}

test("decodes PCM16 samples and preserves the existing positive encode scaling", () => {
	const encoded = pcm16Base64([-32768, -16384, 0, 16384, 32767]);
	const decoded = decodeBase64Pcm16(encoded);

	assert.deepEqual(
		Array.from(decoded, (value) => Number(value.toFixed(6))),
		[-1, -0.5, 0, 0.5, 0.999969],
	);

	assert.equal(
		encodeFloat32ToPcm16Base64(decoded),
		pcm16Base64([-32768, -16384, 0, 16383, 32766]),
	);
});

test("clamps encoded Float32 audio into PCM16 range", () => {
	assert.equal(
		encodeFloat32ToPcm16Base64(new Float32Array([-2, -1, 0, 1, 2])),
		pcm16Base64([-32768, -32768, 0, 32767, 32767]),
	);
});

test("resamples with linear interpolation and preserves matching rates by reference", () => {
	const samples = new Float32Array([0, 1, 0, -1]);

	assert.equal(resampleLinear(samples, 24_000, 24_000), samples);
	assert.deepEqual(
		Array.from(resampleLinear(samples, 4, 8), (value) => Number(value.toFixed(3))),
		[0, 0.5, 1, 0.5, 0, -0.5, -1, -1],
	);
});

test("builds stable mirrored waveform bars from RMS chunks", () => {
	const bars = buildOutputWaveformBars({
		barCount: 5,
		samples: new Float32Array([0, 0, 0.5, 0.5, 1, 1]),
	});

	assert.equal(bars.length, 5);
	assert.deepEqual(
		bars.map((value) => Number(value.toFixed(3))),
		[0.78, 0.855, 0.056, 0.855, 0.78],
	);
});

test("returns no waveform bars when no output can be derived", () => {
	assert.deepEqual(
		buildOutputWaveformBars({ barCount: 0, samples: new Float32Array([1]) }),
		[],
	);
	assert.deepEqual(
		buildOutputWaveformBars({ barCount: 3, samples: new Float32Array([]) }),
		[],
	);
});
