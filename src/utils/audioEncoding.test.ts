import test from 'node:test';
import assert from 'node:assert/strict';
import {
  float32ToInt16PCM,
  int16PCMToFloat32,
  base64ToArrayBuffer,
  arrayBufferToBase64,
  resampleAudio,
} from './audioEncoding.ts';

test('float32ToInt16PCM and int16PCMToFloat32 roundtrip', () => {
  const original = new Float32Array([0.0, 0.5, -0.5, 1.0, -1.0, 0.25]);
  const pcmBuffer = float32ToInt16PCM(original);
  assert.equal(pcmBuffer.byteLength, original.length * 2);

  const restored = int16PCMToFloat32(pcmBuffer);
  assert.equal(restored.length, original.length);

  for (let i = 0; i < original.length; i++) {
    // 16-bit precision tolerance: ~ 1 / 32768 approx 0.0001
    assert.ok(
      Math.abs(restored[i] - original[i]) < 0.001,
      `Sample ${i} mismatch: ${restored[i]} vs ${original[i]}`
    );
  }
});

test('float32ToInt16PCM clamps out-of-range values', () => {
  const extremeValues = new Float32Array([2.5, -3.0]);
  const pcmBuffer = float32ToInt16PCM(extremeValues);
  const view = new DataView(pcmBuffer);

  const maxVal = view.getInt16(0, true);
  const minVal = view.getInt16(2, true);

  assert.equal(maxVal, 32767);
  assert.equal(minVal, -32768);
});

test('base64 and arrayBuffer roundtrip', () => {
  const bytes = new Uint8Array([10, 20, 30, 40, 255, 0, 128, 64]);
  const b64 = arrayBufferToBase64(bytes.buffer);
  assert.equal(typeof b64, 'string');
  assert.ok(b64.length > 0);

  const decoded = base64ToArrayBuffer(b64);
  const decodedBytes = new Uint8Array(decoded);

  assert.equal(decodedBytes.length, bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    assert.equal(decodedBytes[i], bytes[i]);
  }
});

test('resampleAudio downsamples correctly', () => {
  const samples48k = new Float32Array(4800); // 0.1s at 48kHz
  for (let i = 0; i < samples48k.length; i++) {
    samples48k[i] = Math.sin((2 * Math.PI * 440 * i) / 48000);
  }
  const samples16k = resampleAudio(samples48k, 48000, 16000);
  assert.equal(samples16k.length, 1600);
});
