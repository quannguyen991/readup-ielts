import { createClipLibrary } from '@/services/audio/pronounce-core';
import { stopPronounce } from '@/services/audio/pronounce';
import { useAuthStore } from '@/store/useAuthStore';
import { currentLocale, pick } from '@/i18n/useL';

const library = createClipLibrary({ sets: ['/audio/speaking/{voice}/', '/audio/lines/{voice}/', '/audio/words/{voice}/'] });
const cache = new Map<string, Blob>();
let cancelActive: (() => void) | null = null;

/** Dừng câu Aoede đang phát (nếu có). */
export function stopSpeakWithAoede(): void {
  cancelActive?.();
}

/** Aoede for both questions and AI model answers. Microphones wait for onDone. */
export function speakWithAoede(text: string, opts: { rate?: number; questionId?: string; onDone?: () => void; onError?: (message: string) => void } = {}): () => void {
  cancelActive?.(); stopPronounce();
  let stopped = false;
  let audio: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;
  let playbackTimer: ReturnType<typeof setTimeout> | undefined;
  const controller = new AbortController();
  const stop = () => {
    stopped = true; controller.abort(); clearTimeout(playbackTimer);
    audio?.pause();
    if (audio) { audio.onended = null; audio.onerror = null; }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    if (cancelActive === stop) cancelActive = null;
  };
  cancelActive = stop;
  const error = (message?: string) => {
    if (stopped) return;
    stop(); opts.onError?.(message ?? pick(currentLocale(), 'Chưa phát được Aoede. Bấm nghe lại, hoặc đọc câu hỏi và trả lời luôn.', 'Could not play Aoede. Replay it, or read the question and answer now.'));
  };
  void (async () => {
    if (typeof Audio === 'undefined') { error(); return; }
    try {
      let url = await library.find('aoede', text);
      if (stopped) return;
      if (!url) {
        let blob = cache.get(text);
        if (!blob) {
          const timeout = setTimeout(() => controller.abort(), 45_000);
          try {
            const token = useAuthStore.getState().session?.access_token;
            const res = await fetch('/api/speaking/voice', { method: 'POST', signal: controller.signal,
              headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
              body: JSON.stringify(opts.questionId ? { questionId: opts.questionId } : { text }) });
            if (!res.ok) { const body = await res.json().catch(() => ({})); error(typeof body.error === 'string' ? body.error : undefined); return; }
            if (!res.headers.get('content-type')?.startsWith('audio/')) throw new Error('Invalid audio');
            blob = await res.blob();
            if (!stopped) { while (cache.size >= 8) cache.delete(cache.keys().next().value!); cache.set(text, blob); }
          } finally { clearTimeout(timeout); }
        }
        if (stopped) return;
        objectUrl = URL.createObjectURL(blob); url = objectUrl;
      }
      audio = new Audio(url); audio.playbackRate = opts.rate ?? 1;
      audio.onended = () => { if (!stopped) { stop(); opts.onDone?.(); } };
      audio.onerror = () => error();
      playbackTimer = setTimeout(() => error(), 180_000);
      if (new URLSearchParams(window.location.search).has('audioDebug')) {
        for (const event of ['playing', 'ended']) audio.addEventListener(event, () => console.debug('[speaking-aoede] ' + JSON.stringify({ event, src: audio?.src, currentTime: audio?.currentTime, muted: audio?.muted, volume: audio?.volume, voice: 'Aoede' })), { once: true });
      }
      await audio.play();
      if (stopped) audio.pause();
    } catch { if (!stopped) error(); }
  })();
  return stop;
}
