export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  audioContext: AudioContext,
  audioData: Uint8Array
): Promise<AudioBuffer> {
  // Create a proper ArrayBuffer copy
  const buffer = new ArrayBuffer(audioData.byteLength);
  const view = new Uint8Array(buffer);
  view.set(audioData);
  return audioContext.decodeAudioData(buffer);
}

export function createPcmBlob(float32Array: Float32Array): Blob {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  // Create a proper ArrayBuffer copy
  const buffer = new ArrayBuffer(int16Array.byteLength);
  const view = new Uint8Array(buffer);
  view.set(new Uint8Array(int16Array.buffer));
  return new Blob([buffer], { type: 'audio/pcm' });
}

export function float32ToPcm16(float32Array: Float32Array): ArrayBuffer {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  // Create a proper ArrayBuffer copy
  const buffer = new ArrayBuffer(int16Array.byteLength);
  const view = new Uint8Array(buffer);
  view.set(new Uint8Array(int16Array.buffer));
  return buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
