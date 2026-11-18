import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Mức âm lượng micro (0–1) khi `active`, để vẽ sóng âm theo đúng giọng người nói.
 * Chỉ chạy trên web (Web Audio). Mở một luồng micro riêng, tách khỏi bộ nhận giọng nói, và đóng ngay khi dừng.
 * Không có quyền micro hoặc không hỗ trợ thì trả 0 — hiệu ứng khác vẫn chạy.
 */
export function useMicLevel(active: boolean, bars = 24): number[] {
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: bars }, () => 0));

  useEffect(() => {
    if (!active) {
      setLevels(Array.from({ length: bars }, () => 0));
      return;
    }
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    let stopped = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        ctx = new Ctor();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);
        let last = 0;
        const tick = (now: number) => {
          if (stopped) return;
          raf = requestAnimationFrame(tick);
          if (now - last < 55) return; // khoảng 18 khung/giây là đủ mượt cho sóng
          last = now;
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i += 1) {
            const v = (buf[i]! - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          const level = Math.min(1, rms * 5);
          setLevels((prev) => [...prev.slice(1), level]);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        // Từ chối quyền hoặc không có micro: bỏ qua.
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close().catch(() => undefined);
    };
  }, [active, bars]);

  return levels;
}
