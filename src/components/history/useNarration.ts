import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import {
  classifyMediaError,
  clampSeek,
  narrationLangs,
  neighbour,
  paragraphAt,
  SEEK_STEP,
  sentenceAt,
  ttsLooksFailed,
  trackOf,
  type AudioFail,
} from '@/services/history/audio-core';
import type { NarrationLang, Scene, Topic } from '@/services/history/types';
import { speakLines, stopPronounce } from '@/services/audio/pronounce';

const WEB = Platform.OS === 'web' && typeof window !== 'undefined' && typeof Audio !== 'undefined';

export type Narration = {
  /** Ngôn ngữ thực sự đang dùng (có thể khác lựa chọn nếu cảnh không có audio ngôn ngữ đó). */
  lang: NarrationLang;
  langs: NarrationLang[];
  hasAudio: boolean;
  playing: boolean;
  loading: boolean;
  /** Đã có ít nhất một lần người dùng bấm phát trong phiên (để biết có nên tự phát khi chọn cảnh khác). */
  armed: boolean;
  time: number;
  duration: number;
  error: AudioFail | null;
  /** Đang đọc bằng giọng thiết bị thay cho audio. */
  tts: boolean;
  sentenceIndex: number;
  sentenceText: string | null;
  /** Đoạn đang đọc — CHỈ khi audio có mốc câu thật. */
  paragraphId: string | null;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (sec: number) => void;
  skip: (delta: number) => void;
  replay: () => void;
  /** Phát cảnh `id` từ giây `from` (do người dùng bấm — không bao giờ gọi lúc mở trang). */
  playScene: (id: string, from?: number) => void;
  startTts: () => void;
  stopAll: () => void;
};

type Opts = {
  topic: Topic;
  scenes: Scene[];
  sceneId: string;
  lang: NarrationLang;
  speed: number;
  onSceneChange: (id: string) => void;
  /** Cảnh phát hết (audio `ended` hoặc giọng thiết bị đọc xong). */
  onEnded: (id: string) => void;
};

/**
 * Bộ phát thuyết minh theo cảnh. MỘT phần tử `<audio>` dùng chung cho cả trang; đổi cảnh thì đổi nguồn.
 * Không bao giờ tự phát khi mở trang: mọi đường tới `play()` đều xuất phát từ một thao tác của người dùng.
 */
export function useNarration(opts: Opts): Narration {
  const { topic, scenes, sceneId, speed } = opts;
  const scene = useMemo(() => scenes.find((s) => s.id === sceneId), [scenes, sceneId]);
  const langs = useMemo(() => narrationLangs(scene), [scene]);
  const lang: NarrationLang = langs.includes(opts.lang) ? opts.lang : (langs[0] ?? 'en');
  const track = trackOf(scene, lang);
  const key = `${sceneId}:${lang}`;

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [armed, setArmed] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(track?.durationSec ?? 0);
  const [error, setError] = useState<AudioFail | null>(null);
  const [tts, setTts] = useState(false);

  const el = useRef<HTMLAudioElement | null>(null);
  const loadedKey = useRef('');
  const pending = useRef<{ from: number } | null>(null);
  const seekOnLoad = useRef<number | null>(null);
  const stopTts = useRef<(() => void) | null>(null);
  const latest = useRef({ opts, scene, track, key, speed, scenes });
  // Khai báo ĐẦU TIÊN trong các effect: mọi effect / callback phía sau luôn thấy giá trị mới nhất.
  useEffect(() => {
    latest.current = { opts, scene, track, key, speed, scenes };
  });

  // Đổi cảnh / ngôn ngữ: đưa trạng thái hiển thị về 0 ngay trong lượt vẽ (không qua effect).
  const [prevKey, setPrevKey] = useState(key);
  if (prevKey !== key) {
    setPrevKey(key);
    setPlaying(false);
    setLoading(false);
    setTime(0);
    setError(null);
    setTts(false);
    setDuration(track?.durationSec ?? 0);
  }

  const killTts = useCallback(() => {
    stopTts.current?.();
    stopTts.current = null;
    setTts(false);
  }, []);

  const audioEl = useCallback((): HTMLAudioElement | null => {
    if (!WEB) return null;
    if (el.current) return el.current;
    const a = new Audio();
    a.preload = 'none';
    a.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(a.duration) && a.duration > 0) setDuration(a.duration);
      if (seekOnLoad.current != null) {
        a.currentTime = clampSeek(seekOnLoad.current, a.duration);
        seekOnLoad.current = null;
      }
    });
    a.addEventListener('timeupdate', () => setTime(a.currentTime));
    a.addEventListener('waiting', () => setLoading(true));
    a.addEventListener('canplay', () => setLoading(false));
    a.addEventListener('playing', () => {
      setLoading(false);
      setPlaying(true);
      setError(null);
    });
    a.addEventListener('pause', () => setPlaying(false));
    a.addEventListener('ended', () => {
      setPlaying(false);
      setTime(a.duration || 0);
      latest.current.opts.onEnded(latest.current.opts.sceneId);
    });
    a.addEventListener('error', () => {
      setLoading(false);
      setPlaying(false);
      setError(classifyMediaError(a.error?.code, navigator.onLine !== false));
    });
    el.current = a;
    return a;
  }, []);

  /** Gắn nguồn của cảnh hiện tại nếu chưa gắn. */
  const ensureLoaded = useCallback((): HTMLAudioElement | null => {
    const a = audioEl();
    const { track: t, key: k } = latest.current;
    if (!a || !t) return null;
    if (loadedKey.current !== k) {
      a.src = t.file;
      loadedKey.current = k;
      setTime(0);
      setDuration(t.durationSec);
      setError(null);
      a.load();
    }
    return a;
  }, [audioEl]);

  const startPlay = useCallback(
    (from = 0) => {
      killTts();
      stopPronounce();
      setArmed(true);
      const a = ensureLoaded();
      if (!a) return; // không có audio: để UI đưa lựa chọn đọc bằng giọng thiết bị
      setError(null);
      setLoading(true);
      a.playbackRate = latest.current.speed;
      if (from > 0) {
        if (a.readyState >= 1) a.currentTime = clampSeek(from, a.duration);
        else seekOnLoad.current = from;
      } else if (a.readyState >= 1) a.currentTime = 0;
      void a.play().catch((e: unknown) => {
        setLoading(false);
        if ((e as { name?: string })?.name === 'NotAllowedError') setError('blocked');
        // Lỗi nguồn đã được sự kiện `error` xử lý.
      });
    },
    [ensureLoaded, killTts],
  );

  const pause = useCallback(() => {
    el.current?.pause();
    if (stopTts.current) {
      killTts();
      stopPronounce();
      setPlaying(false);
    }
  }, [killTts]);

  const play = useCallback(() => {
    const a = el.current;
    if (a && loadedKey.current === latest.current.key && !a.ended && a.currentTime > 0) {
      killTts();
      setArmed(true);
      a.playbackRate = latest.current.speed;
      void a.play().catch(() => undefined);
    } else startPlay(a && loadedKey.current === latest.current.key && !a.ended ? a.currentTime : 0);
  }, [killTts, startPlay]);

  const toggle = useCallback(() => {
    if (playing || tts) pause();
    else play();
  }, [playing, tts, pause, play]);

  const seek = useCallback(
    (sec: number) => {
      const a = ensureLoaded();
      const dur = a && Number.isFinite(a.duration) && a.duration > 0 ? a.duration : latest.current.track?.durationSec ?? 0;
      const t = clampSeek(sec, dur);
      setTime(t);
      if (a && a.readyState >= 1) a.currentTime = t;
      else seekOnLoad.current = t;
    },
    [ensureLoaded],
  );

  const skip = useCallback(
    (delta: number) => {
      const a = el.current;
      const cur = a && loadedKey.current === latest.current.key ? a.currentTime : 0;
      seek(cur + delta);
    },
    [seek],
  );

  const replay = useCallback(() => startPlay(0), [startPlay]);

  const playScene = useCallback(
    (id: string, from = 0) => {
      setArmed(true);
      if (id === latest.current.opts.sceneId) startPlay(from);
      else {
        pending.current = { from };
        latest.current.opts.onSceneChange(id);
      }
    },
    [startPlay],
  );

  const startTts = useCallback(() => {
    const sc = latest.current.scene;
    if (!sc) return;
    el.current?.pause();
    setArmed(true);
    setError(null);
    const rate = Math.min(1.5, Math.max(0.5, 0.88 * latest.current.speed));
    const id = sc.id;
    const t0 = Date.now();
    const words = sc.paragraphs.reduce((n, p) => n + p.en.split(/\s+/).length, 0);
    stopTts.current = speakLines(
      sc.paragraphs.map((p) => ({ text: p.en, rate, pauseMs: 300 })),
      {
        onStart: () => {
          setTts(true);
          setPlaying(true);
        },
        onEnd: (completed) => {
          stopTts.current = null;
          setTts(false);
          setPlaying(false);
          if (!completed) return;
          if (ttsLooksFailed(Date.now() - t0, words)) setError('tts');
          else latest.current.opts.onEnded(id);
        },
      },
    );
  }, []);

  const stopAll = useCallback(() => {
    el.current?.pause();
    killTts();
    stopPronounce();
    setPlaying(false);
  }, [killTts]);

  // Đổi cảnh / ngôn ngữ: dừng tiếng cũ, rồi phát cảnh mới nếu đó là do người dùng bấm "phát cảnh này".
  useEffect(() => {
    const a = el.current;
    if (a && loadedKey.current && loadedKey.current !== key) {
      a.pause();
      a.removeAttribute('src');
      a.load();
      loadedKey.current = '';
    }
    stopTts.current?.();
    stopTts.current = null;
    stopPronounce();
    if (pending.current) {
      const p = pending.current;
      pending.current = null;
      queueMicrotask(() => startPlay(p.from));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (el.current) el.current.playbackRate = speed;
  }, [speed]);

  // Dọn khi rời trang.
  useEffect(
    () => () => {
      el.current?.pause();
      el.current?.removeAttribute('src');
      stopTts.current?.();
      stopPronounce();
    },
    [],
  );

  // MediaSession: tiêu đề + ảnh bìa + nút điều khiển của hệ điều hành.
  useEffect(() => {
    if (!WEB || !armed || !scene || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    try {
      ms.metadata = new MediaMetadata({
        title: `${scene.n}. ${scene.titleEn}`,
        artist: 'Band 9 · Vietnamese history',
        album: topic.titleEn,
        artwork: scene.image && !scene.image.file.startsWith('data:') ? [{ src: scene.image.file, sizes: '512x288' }] : [],
      });
      ms.setActionHandler('play', () => play());
      ms.setActionHandler('pause', () => pause());
      ms.setActionHandler('seekbackward', () => skip(-SEEK_STEP));
      ms.setActionHandler('seekforward', () => skip(SEEK_STEP));
      const ids = latest.current.scenes.map((s) => s.id);
      const prev = neighbour(ids, scene.id, -1);
      const next = neighbour(ids, scene.id, 1);
      ms.setActionHandler('previoustrack', prev ? () => playScene(prev) : null);
      ms.setActionHandler('nexttrack', next ? () => playScene(next) : null);
    } catch {
      /* trình duyệt không hỗ trợ đủ — bỏ qua */
    }
  }, [armed, scene, topic.titleEn, play, pause, skip, playScene]);
  useEffect(() => {
    if (WEB && 'mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }, [playing]);

  // Bàn phím: Space phát/dừng, ←/→ lùi/tiến 10 giây (bỏ qua khi đang gõ hoặc đang đứng trên một nút).
  useEffect(() => {
    if (!WEB) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest('[role="button"],button,a,[role="radio"],[role="tab"]'))) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (armed && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        skip(e.key === 'ArrowLeft' ? -SEEK_STEP : SEEK_STEP);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, skip, armed]);

  const sentences = track?.sentences;
  const si = playing || time > 0 ? sentenceAt(sentences, time) : -1;

  return {
    lang,
    langs,
    hasAudio: !!track,
    playing,
    loading,
    armed,
    time,
    duration,
    error,
    tts,
    sentenceIndex: si,
    sentenceText: si >= 0 ? (sentences![si]!.text ?? null) : null,
    paragraphId: playing && !tts ? paragraphAt(sentences, time) : null,
    play,
    pause,
    toggle,
    seek,
    skip,
    replay,
    playScene,
    startTts,
    stopAll,
  };
}
