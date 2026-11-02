/**
 * Audio encoding and decoding utilities for Gemini Live API.
 * Gemini Live API expects 16-bit Linear PCM, 16kHz mono audio input.
 * Gemini Live API outputs 16-bit Linear PCM, 24kHz mono audio output.
 */

/**
 * Converts Float32 audio samples (-1.0 to 1.0) to 16-bit signed integer Linear PCM (ArrayBuffer).
 * Clamps values outside [-1.0, 1.0] to prevent overflow/distortion.
 */
export function float32ToInt16PCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp sample between -1 and 1
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to signed 16-bit int: -32768 to 32767 (little endian)
    const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(i * 2, int16, true);
  }
  return buffer;
}

/**
 * Converts 16-bit signed integer Linear PCM (ArrayBuffer or Uint8Array) into Float32Array (-1.0 to 1.0).
 */
export function int16PCMToFloat32(int16Buffer: ArrayBuffer | Uint8Array): Float32Array {
  const bytes = int16Buffer instanceof Uint8Array ? int16Buffer : new Uint8Array(int16Buffer);
  const sampleCount = Math.floor(bytes.length / 2);
  const float32 = new Float32Array(sampleCount);
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (let i = 0; i < sampleCount; i++) {
    const int16 = dataView.getInt16(i * 2, true);
    // Normalize to -1.0 to 1.0
    float32[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
  }

  return float32;
}

/**
 * Decodes a base64 encoded string into an ArrayBuffer of binary bytes.
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (typeof atob === 'function') {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } else {
    // Node.js fallback
    const buf = Buffer.from(base64, 'base64');
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
}

/**
 * Encodes an ArrayBuffer or Uint8Array of binary bytes into a base64 string.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (typeof btoa === 'function') {
    let binary = '';
    const len = bytes.byteLength;
    // Chunking to avoid stack limit for large buffers
    const chunkSize = 8192;
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
  } else {
    // Node.js fallback
    return Buffer.from(bytes).toString('base64');
  }
}

/**
 * Simple linear downsampling / resampler from fromRate to toRate.
 */
export function resampleAudio(
  inputData: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  if (fromRate === toRate || inputData.length === 0) {
    return inputData;
  }
  const ratio = fromRate / toRate;
  const newLength = Math.round(inputData.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const position = i * ratio;
    const index = Math.floor(position);
    const fraction = position - index;

    if (index + 1 < inputData.length) {
      result[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
    } else {
      result[i] = inputData[index] || 0;
    }
  }

  return result;
}
