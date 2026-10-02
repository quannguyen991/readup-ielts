import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { speakLines, stopPronounce } from '@/services/audio/pronounce';
import type { TranscriptLine } from '@/services/listening/types';

/**
 * Phát âm thanh của MỘT section.
 *
 * Hai chế độ, tự chọn:
 *   - 'file': tệp MP3 thật (`audio`). Chạy bằng HTMLAudioElement (web).
 *   - 'tts':  tệp thiếu / lỗi / không phải web -> đọc bản chữ bằng giọng máy
 *     (`speakLines`), từng câu một để biết đang đọc câu nào. Không tua được.
 *
 * `activeLine` = chỉ số câu đang đọc: theo mốc `start/end` nếu bản chữ có, theo
 * câu đang đọc nếu là TTS, ngược lại là -1 (không đồng bộ).
 */

export type AudioStatus = 'idle' | 'playing' | 'paused' | 'ended';
export type AudioMode = 'file' | 'tts';

const WORDS_PER_SEC = 2.6;

const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Thời điểm bắt đầu ước lượng của từng câu khi đọc bằng giọng máy. */
export function estimateLineStarts(lines: readonly TranscriptLine[], speed: number): { starts: number[]; total: number } {
  let t = 0;
  const starts = lines.map((l) => {
    const at = t;
    t += wordCount(l.text) / (WORDS_PER_SEC * speed) + 0.35;
    return at;
  });
  return { starts, total: t };
}

export function useSectionAudio(opts: { src: string; transcript: readonly TranscriptLine[]; speed: number }) {
  const { src, transcript, speed } = opts;
  const noAudio = typeof Audio === 'undefined';
  const [mode, setMode] = useState<AudioMode>(noAudio ? 'tts' : 'file');
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [current, setCurrent] = useState(0);
  const [fileDuration, setFileDuration] = useState(0);
  const [ttsLine, setTtsLine] = useState(0);
  const [blocked, setBlocked] = useState(false);
  /** Đã từng phát (thi thật: chỉ được nghe một lần). */
  const [started, setStarted] = useState(false);

  const el = useRef<HTMLAudioElement | null>(null);
  const stopTts = useRef<(() => void) | null>(null);
  const ttsAlive = useRef(false);
  const ttsIndex = useRef(0);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Đổi section: đặt lại trạng thái NGAY khi vẽ (không qua effect).
  const [prevSrc, setPrevSrc] = useState(src);
  if (prevSrc !== src) {
    setPrevSrc(src);
    setStatus('idle');
    setCurrent(0);
    setFileDuration(0);
    setTtsLine(0);
    setBlocked(false);
    setStarted(false);
    setMode(noAudio ? 'tts' : 'file');
  }

  const tts = useMemo(() => estimateLineStarts(transcript, speed), [transcript, speed]);
  const duration = mode === 'file' ? fileDuration : tts.total;

  // Nạp tệp khi đổi section. Lỗi -> chuyển sang giọng máy.
  useEffect(() => {
    ttsIndex.current = 0;
    if (typeof Audio === 'undefined') return;
    const a = new Audio();
    a.preload = 'metadata';
    el.current = a;
    const onMeta = () => setFileDuration(Number.isFinite(a.duration) ? a.duration : 0);
    const onTime = () => setCurrent(a.currentTime);
    const onEnd = () => setStatus('ended');
    const onErr = () => {
      // Tệp thiếu (máy chủ trả trang HTML) hoặc không giải mã được.
      if (a.src) setMode('tts');
    };
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    a.addEventListener('error', onErr);
    a.src = src;
    return () => {
      a.pause();
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnd);
      a.removeEventListener('error', onErr);
      a.removeAttribute('src');
      a.load();
      el.current = null;
      ttsAlive.current = false;
      stopTts.current?.();
      stopPronounce();
    };
  }, [src]);

  useEffect(() => {
    if (el.current) el.current.playbackRate = speed;
  }, [speed, mode]);

  const speakFrom = useCallback(
    (index: number) => {
      ttsAlive.current = true;
      const step = (i: number) => {
        if (!ttsAlive.current) return;
        if (i >= transcript.length) {
          ttsAlive.current = false;
          setStatus('ended');
          return;
        }
        ttsIndex.current = i;
        setTtsLine(i);
        setCurrent(estimateLineStarts(transcript, speedRef.current).starts[i] ?? 0);
        stopTts.current = speakLines([{ text: transcript[i]?.text ?? '', rate: speedRef.current }], {
          onEnd: (completed) => {
            if (completed && ttsAlive.current) step(i + 1);
          },
        });
      };
      step(index);
    },
    [transcript],
  );

  const play = useCallback(() => {
    setStarted(true);
    setBlocked(false);
    if (mode === 'tts') {
      setStatus('playing');
      speakFrom(status === 'ended' ? 0 : ttsIndex.current);
      return;
    }
    const a = el.current;
    if (!a) return;
    if (status === 'ended') a.currentTime = 0;
    a.playbackRate = speedRef.current;
    const p = a.play();
    setStatus('playing');
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // Trình duyệt chặn tự phát: để người dùng bấm Phát.
        setStatus('paused');
        setBlocked(true);
      });
    }
  }, [mode, speakFrom, status]);

  const pause = useCallback(() => {
    if (mode === 'tts') {
      ttsAlive.current = false;
      stopTts.current?.();
      stopPronounce();
    } else el.current?.pause();
    setStatus((s) => (s === 'playing' ? 'paused' : s));
  }, [mode]);

  const seek = useCallback(
    (sec: number) => {
      if (mode === 'tts') {
        const idx = Math.max(0, tts.starts.filter((s) => s <= sec).length - 1);
        ttsIndex.current = idx;
        setTtsLine(idx);
        setCurrent(tts.starts[idx] ?? 0);
        if (status === 'playing') {
          ttsAlive.current = false;
          stopPronounce();
          speakFrom(idx);
        }
        return;
      }
      const a = el.current;
      if (!a) return;
      a.currentTime = Math.max(0, Math.min(sec, Number.isFinite(a.duration) ? a.duration : sec));
      setCurrent(a.currentTime);
    },
    [mode, speakFrom, status, tts.starts],
  );

  const seekLine = useCallback(
    (i: number) => {
      const l = transcript[i];
      if (mode === 'file' && l && typeof l.start === 'number') {
        seek(l.start);
        if (status !== 'playing') play();
      } else if (mode === 'tts') {
        ttsIndex.current = i;
        setTtsLine(i);
        ttsAlive.current = false;
        stopPronounce();
        setStatus('playing');
        speakFrom(i);
      }
    },
    [mode, play, seek, speakFrom, status, transcript],
  );

  const activeLine = useMemo(() => {
    if (mode === 'tts') return status === 'idle' ? -1 : ttsLine;
    if (status === 'idle' && current === 0) return -1;
    let idx = -1;
    transcript.forEach((l, i) => {
      if (typeof l.start === 'number' && l.start <= current + 0.05) idx = i;
    });
    return idx;
  }, [current, mode, status, transcript, ttsLine]);

  const synced = mode === 'tts' || transcript.some((l) => typeof l.start === 'number');

  return { mode, status, current, duration, activeLine, synced, blocked, started, play, pause, seek, seekLine };
}

export type SectionAudio = ReturnType<typeof useSectionAudio>;
