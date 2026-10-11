/**
 * Đóng gói dữ liệu PCM 16-bit mono thành tệp WAV. Gemini TTS trả PCM thô; phần này
 * thêm tiêu đề RIFF để trình duyệt phát được trực tiếp.
 */
export function pcm16ToWav(pcm: Uint8Array, sampleRate = 24000): Uint8Array {
  const dataSize = pcm.length;
  const out = new Uint8Array(44 + dataSize);
  const view = new DataView(out.buffer);
  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) out[offset + i] = text.charCodeAt(i);
  };
  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);
  out.set(pcm, 44);
  return out;
}
