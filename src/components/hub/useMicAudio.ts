import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';

/**
 * Thu âm thô từ micro (PCM mono) để đo cao độ. Chạy song song với bộ nhận giọng: cùng
 * một micro nhưng hai luồng khác nhau. Nối qua gain bằng 0 nên không phát lại tiếng mình.
 */
export function useMicAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const procRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);

  /**
   * `onLevel` nhận mức âm lượng RMS (0–1 thực tế) của từng khung âm thanh, để vẽ sóng theo giọng
   * nói thật. Không truyền thì hook chỉ thu âm như trước.
   */
  const start = useCallback(async (onLevel?: (rms: number) => void): Promise<boolean> => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false;
    const stream = await navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
      .catch(() => null);
    if (!stream) return false;
    const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      stream.getTracks().forEach((t) => t.stop());
      return false;
    }
    const ctx = new Ctor();
    const src = ctx.createMediaStreamSource(stream);
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    const mute = ctx.createGain();
    mute.gain.value = 0;
    chunksRef.current = [];
    proc.onaudioprocess = (e) => {
      const frame = e.inputBuffer.getChannelData(0);
      chunksRef.current.push(new Float32Array(frame));
      if (onLevel) {
        let sum = 0;
        for (let i = 0; i < frame.length; i += 1) sum += (frame[i] ?? 0) * (frame[i] ?? 0);
        onLevel(Math.sqrt(sum / Math.max(1, frame.length)));
      }
    };
    src.connect(proc);
    proc.connect(mute);
    mute.connect(ctx.destination);
    ctxRef.current = ctx;
    streamRef.current = stream;
    procRef.current = proc;
    return true;
  }, []);

  /** Dừng và trả về toàn bộ âm thanh đã thu. */
  const stop = useCallback(async (): Promise<{ samples: Float32Array; sampleRate: number }> => {
    const ctx = ctxRef.current;
    const sampleRate = ctx?.sampleRate ?? 16000;
    procRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (ctx) await ctx.close().catch(() => undefined);
    ctxRef.current = null;
    streamRef.current = null;
    procRef.current = null;
    const total = chunksRef.current.reduce((n, c) => n + c.length, 0);
    const samples = new Float32Array(total);
    let off = 0;
    for (const c of chunksRef.current) {
      samples.set(c, off);
      off += c.length;
    }
    chunksRef.current = [];
    return { samples, sampleRate };
  }, []);

  return { start, stop };
}
