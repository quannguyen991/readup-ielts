import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { LightHero } from '@/components/layout/LightHero';
import { Card, Icon } from '@/components/ui';
import { themedHex } from '@/theme/palette-state';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Báo nói — VOA Learning English được AI đọc thành tiếng, kèm lời đọc từng đoạn.
 *
 * Âm thanh và mốc thời gian sinh sẵn bằng `scripts/news-audio/make_news_audio.py`
 * (Gemini TTS, mỗi đoạn một lượt gọi). Màn này chỉ phát lại, không gọi AI nào,
 * nên không tốn lượt của người học.
 *
 * Chạy bằng HTMLAudioElement như màn nghe khác, nên chỉ phát được trên web.
 */

type NewsItem = {
  id: string;
  title: string;
  program: string;
  level: string;
  topic: string;
  duration: number;
  voice: string;
};

type NewsTrack = NewsItem & {
  audio: string;
  paragraphs: { text: string; start: number; end: number }[];
};

const SPEEDS = [0.75, 1, 1.25];

const fmtTime = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function NewsAudioScreen() {
  const { L } = useL();
  const [list, setList] = useState<NewsItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [track, setTrack] = useState<NewsTrack | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/audio/news/index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((rows: NewsItem[]) => alive && setList(rows))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!openId) {
      setTrack(null);
      return;
    }
    let alive = true;
    fetch(`/audio/news/${openId}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((t: NewsTrack) => alive && setTrack(t))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [openId]);

  return (
    <Screen>
      <LightHero
        badge="BÁO NÓI" art="listening"
        line1={L('Báo nói', 'Spoken news')}
        line2={L('AI đọc, bạn nghe theo từng đoạn', 'AI reads, you follow paragraph by paragraph')}
        subtitle={L(
          'Bài báo tiếng Anh từ VOA Learning English (phạm vi công cộng), được đọc thành tiếng. Bấm một đoạn để nghe từ đó.',
          'English articles from VOA Learning English (public domain), read aloud. Tap a paragraph to start from there.',
        )}
      />

      {failed ? (
        <Card className="mt-4">
          <Text className="font-sans text-body text-muted">
            {L('Chưa tải được danh sách báo nói. Thử tải lại trang.', 'Could not load the spoken news list. Reload the page.')}
          </Text>
        </Card>
      ) : null}

      {!failed && list === null ? (
        <Text className="mt-4 font-sans text-body text-muted">{L('Đang tải…', 'Loading…')}</Text>
      ) : null}

      {track ? (
        <Player key={track.id} track={track} onClose={() => setOpenId(null)} />
      ) : null}

      {list && !track ? (
        <View className="mt-4 gap-3">
          {list.map((n) => (
            <Pressable
              key={n.id}
              accessibilityRole="button"
              onPress={() => setOpenId(n.id)}
              className="rounded-panel border border-border bg-surface p-4"
            >
              <Text className="font-strong text-cardTitle text-ink">{n.title}</Text>
              <Text className="mt-1 font-sans text-label text-muted">
                {n.program} · {n.level} · {fmtTime(n.duration)}
              </Text>
            </Pressable>
          ))}
          {list.length === 0 ? (
            <Text className="font-sans text-body text-muted">{L('Chưa có bài báo nói nào.', 'No spoken news yet.')}</Text>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

function Player({ track, onClose }: { track: NewsTrack; onClose: () => void }) {
  const { L } = useL();
  const el = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(track.duration);
  const [speed, setSpeed] = useState(1);
  const canPlay = Platform.OS === 'web' && typeof Audio !== 'undefined';

  useEffect(() => {
    if (!canPlay) return;
    const a = new Audio(track.audio);
    el.current = a;
    a.preload = 'metadata';
    a.ontimeupdate = () => setCurrent(a.currentTime);
    a.onloadedmetadata = () => Number.isFinite(a.duration) && setDuration(a.duration);
    a.onplay = () => setPlaying(true);
    a.onpause = () => setPlaying(false);
    a.onended = () => setPlaying(false);
    return () => {
      a.pause();
      a.removeAttribute('src');
      el.current = null;
    };
  }, [track.audio, canPlay]);

  useEffect(() => {
    if (el.current) el.current.playbackRate = speed;
  }, [speed]);

  const active = useMemo(
    () => track.paragraphs.findIndex((p) => current >= p.start && current < p.end),
    [current, track.paragraphs],
  );

  const seek = (sec: number) => {
    if (!el.current) return;
    el.current.currentTime = sec;
    void el.current.play();
  };

  const toggle = () => {
    if (!el.current) return;
    if (playing) el.current.pause();
    else void el.current.play();
  };

  const pct = duration > 0 ? Math.min(1, current / duration) : 0;

  return (
    <Card className="mt-4">
      <View className="flex-row items-center justify-between">
        <Pressable accessibilityRole="button" onPress={onClose} className="flex-row items-center gap-1.5">
          <Icon name="chevron-left" size={16} color={color.subtle} />
          <Text className="font-sans text-label text-muted">{L('Danh sách', 'All stories')}</Text>
        </Pressable>
        <Text className="font-sans text-label text-muted">{track.voice}</Text>
      </View>

      <Text className="mt-3 font-strong text-cardTitle text-ink">{track.title}</Text>
      <Text className="mt-1 font-sans text-label text-muted">
        {track.program} · {track.level}
      </Text>

      {canPlay ? (
        <>
          <View className="mt-4 flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={playing ? L('Tạm dừng', 'Pause') : L('Phát', 'Play')}
              onPress={toggle}
              style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: themedHex('#B8955A') }}
            >
              {playing ? (
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: '#FFFFFF' }} />
                  <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: '#FFFFFF' }} />
                </View>
              ) : (
                <Icon name="play" size={20} color="#FFFFFF" strokeWidth={2.2} />
              )}
            </Pressable>
            <View className="min-w-0 flex-1">
              <View style={{ height: 6, borderRadius: 3, backgroundColor: '#EFE3C8', overflow: 'hidden' }}>
                <View style={{ width: `${pct * 100}%`, height: 6, borderRadius: 3, backgroundColor: themedHex('#B8955A') }} />
              </View>
              <Text className="mt-1.5 font-sans text-label text-muted">
                {fmtTime(current)} / {fmtTime(duration)}
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row gap-1.5">
            {SPEEDS.map((v) => (
              <Pressable
                key={v}
                accessibilityRole="button"
                onPress={() => setSpeed(v)}
                className={`rounded-full border px-3 py-1 ${speed === v ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface'}`}
              >
                <Text className={`font-sans text-label ${speed === v ? 'text-white' : 'text-muted'}`}>{v}×</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <Text className="mt-4 font-sans text-body text-muted">
          {L('Báo nói chỉ phát được trên trình duyệt web.', 'Spoken news plays in the web browser only.')}
        </Text>
      )}

      <ScrollView className="mt-5" style={{ maxHeight: 460 }}>
        <View className="gap-3">
          {track.paragraphs.map((p, i) => {
            const on = i === active;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                disabled={!canPlay}
                onPress={() => seek(p.start)}
                className={`rounded-panel border p-3 ${on ? 'border-primary-600 bg-primary-600/10' : 'border-transparent'}`}
              >
                <Text className={`font-sans text-body ${on ? 'font-strong text-ink' : 'text-ink'}`} style={{ lineHeight: 24 }}>
                  {p.text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Card>
  );
}
