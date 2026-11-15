import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { CatalogHub, type CatalogItem } from '@/components/catalog/CatalogHub';
import { groupOfTopic, normalizeLevel, type GroupKey } from '@/components/catalog/catalog-model';
import { NightHero } from '@/components/catalog/NightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Icon } from '@/components/ui/Icon';
import { SpeakButton } from '@/components/vocab/study/StudyKit';
import { AUDIO_NGUON, estimateMinutes, filterAudio, formatLength, getLibraryAudio, LIBRARY_AUDIO, type LibraryAudio } from '@/data/audio-library';
import { useL } from '@/i18n/useL';
import { useShadowStore } from '@/store/useShadowStore';
import { color } from '@/theme/tokens';

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 12px 30px rgba(94, 72, 35,0.08)' } as object;

/** Chuyên mục VOA → nhóm tình huống (khai rõ vì tên chuyên mục không giống tên chủ đề ở các trang khác). */
const TOPIC_GROUP: Record<string, GroupKey> = {
  'Tiếng Anh hằng ngày': 'life',
  'Thời sự và xã hội': 'ielts',
  'Kiến thức phổ thông': 'academic',
  'Khoa học': 'academic',
  'Bài nói': 'work',
};

/** Màu nhận diện theo trình độ — để lưới bài không là một mảng trắng đều. */
const LEVEL_TONE: Record<string, { bg: string; fg: string }> = {
  A2: { bg: '#DCFCE7', fg: '#15803D' },
  B1: { bg: '#F3F0FB', fg: '#6A4BD9' },
  B2: { bg: '#F3F0FB', fg: '#D9503E' },
  C1: { bg: '#FFE4E6', fg: '#BE123C' },
};

/**
 * ĐỌC THEO (shadowing) — chọn một bài VOA rồi đọc theo từng câu.
 *
 * Luyện nói kiểu này (nghe một câu mẫu, nói lại ngay, so với mẫu) là cách các
 * lớp luyện phát âm vẫn làm; chỗ khác ở đây là máy tô từng từ nó nghe rõ, nên
 * người học thấy ngay âm nào mình nuốt mất.
 */
export default function ShadowHub() {
  const { L } = useL();
  const best = useShadowStore((s) => s.best);
  const missed = useShadowStore((s) => s.missed);
  const started = useMemo(
    () =>
      Object.entries(best)
        .map(([id, scores]) => {
          const meta = getLibraryAudio(id);
          const vals = Object.values(scores);
          return meta && vals.length ? { meta, read: vals.length, avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) } : null;
        })
        .filter((x): x is { meta: LibraryAudio; read: number; avg: number } => x !== null)
        .slice(0, 3),
    [best],
  );
  const hardWords = useMemo(
    () =>
      Object.entries(missed)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12),
    [missed],
  );
  const readTotal = Object.values(best).reduce((n, s) => n + Object.keys(s).length, 0);

  // Lộ trình: mức + nhóm tình huống của từng bài; "đã làm" = đã đọc theo ít nhất một câu.
  const catalog = useMemo<CatalogItem[]>(
    () =>
      LIBRARY_AUDIO.map((a) => {
        const read = Object.keys(best[a.id] ?? {}).length;
        return {
          id: a.id,
          level: normalizeLevel(a.level),
          topic: a.topic,
          group: TOPIC_GROUP[a.topic] ?? groupOfTopic(a.topic, a.level),
          title: `${a.title} ${a.program}`,
          done: read > 0,
          node: <LessonCard item={a} read={read} />,
        };
      }),
    [best],
  );

  return (
    <Screen>
      <Appear>
        <NightHero
          scene="today"
          title={L('Đọc theo · Shadowing', 'Shadowing')}
          sub={L(
            `${LIBRARY_AUDIO.length} bài VOA có sẵn lời. Nghe giọng mẫu, bấm micro đọc lại: từ nào máy nghe rõ thì xanh, từ nào hụt thì đỏ — thấy ngay âm nào mình hay nuốt.`,
            `${LIBRARY_AUDIO.length} VOA lessons with transcripts. Hear the model, tap the mic and read it back: words heard clearly turn green, missed ones turn red — so you spot the sounds you tend to swallow.`,
          )}
          pills={[
            { icon: 'speaker', label: L(`${LIBRARY_AUDIO.length} bài để đọc theo`, `${LIBRARY_AUDIO.length} lessons to shadow`) },
            { icon: 'check', label: L(`${readTotal} câu bạn đã đọc`, `${readTotal} sentences read`) },
          ]}
          primary={{
            label: started[0] ? L('Đọc tiếp bài dở', 'Continue your lesson') : L('Đọc thử một bài', 'Try a lesson'),
            onPress: () => router.push(`/shadow/${(started[0]?.meta ?? filterAudio({ level: 'A2' })[0] ?? LIBRARY_AUDIO[0]!).id}` as never),
          }}
        />
      </Appear>

      {started.length || hardWords.length ? (
        <View className="mt-5 flex-row flex-wrap gap-4">
          {started.length ? (
            <Appear index={1} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 320 }}>
              <View className="rounded-[22px] bg-white p-5" style={CARD}>
                <Text className="font-heavy text-sectionTitle text-ink">{L('Đang đọc dở', 'In progress')}</Text>
                <View className="mt-3 gap-2">
                  {started.map(({ meta, read, avg }) => (
                    <Pressable
                      key={meta.id}
                      onPress={() => router.push(`/shadow/${meta.id}` as never)}
                      className="flex-row items-center gap-3 rounded-2xl px-3 py-2.5"
                      style={{ backgroundColor: '#F3F0FB' }}
                    >
                      <View className="h-9 w-9 items-center justify-center rounded-pill" style={{ backgroundColor: color.primary }}>
                        <Icon name="mic" size={17} color="#FFFFFF" />
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text className="font-strong text-body text-ink" numberOfLines={1}>
                          {meta.title}
                        </Text>
                        <Text className="font-sans text-label text-muted">
                          {L(`${read} câu đã đọc · trung bình ${avg} điểm`, `${read} sentences read · average ${avg} points`)}
                        </Text>
                      </View>
                      <Icon name="chevron-right" size={18} color="#94A3B8" />
                    </Pressable>
                  ))}
                </View>
              </View>
            </Appear>
          ) : null}
          {hardWords.length ? (
            <Appear index={2} style={{ flexGrow: 1, flexShrink: 1, flexBasis: 320 }}>
              <View className="rounded-[22px] bg-white p-5" style={CARD}>
                <Text className="font-heavy text-sectionTitle text-ink">{L('Từ bạn hay đọc hụt', 'Words you often miss')}</Text>
                <Text className="mt-1 font-sans text-body text-muted">
                  {L(
                    'Nghe lại từng từ, để ý âm cuối — lỗi hay gặp nhất của người Việt.',
                    'Listen to each word again and watch the final sounds — the most common slip for Vietnamese speakers.',
                  )}
                </Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {hardWords.map(([w, n]) => (
                    <View key={w} className="flex-row items-center gap-1 rounded-pill py-1 pl-3 pr-1" style={{ backgroundColor: '#FFF1F2' }}>
                      <Text className="font-semi text-body" style={{ color: '#BE123C' }}>
                        {w} <Text style={{ color: '#FB7185' }}>×{n}</Text>
                      </Text>
                      <SpeakButton text={w} rate={0.7} size={16} />
                    </View>
                  ))}
                </View>
              </View>
            </Appear>
          ) : null}
        </View>
      ) : null}

      <View className="mt-6">
        <CatalogHub
          items={catalog}
          unitVi="bài"
          unitEn="lessons"
          searchHintVi="Tìm theo tên bài hoặc chuyên mục…"
          searchHintEn="Search by title or program…"
          onStart={(it) => router.push(`/shadow/${it.id}` as never)}
        />
      </View>

      <View className="mt-6 rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
        <Text className="font-sans text-label text-muted" style={{ lineHeight: 19 }}>
          {L(
            `Máy chấm dùng bộ nhận giọng có sẵn của trình duyệt (Chrome, Edge). Chrome gửi giọng tới dịch vụ nhận giọng của Google để đổi thành chữ; ReadUp chỉ nhận lại phần chữ, không ghi âm. Lời bài: ${AUDIO_NGUON.ten} (${AUDIO_NGUON.trang}), ${AUDIO_NGUON.giay_phep.toLowerCase()}.`,
            `Scoring uses your browser's built-in speech recognition (Chrome, Edge). Chrome sends your voice to Google's speech service to turn it into text; ReadUp only receives the text and records no audio. Transcripts: ${AUDIO_NGUON.ten} (${AUDIO_NGUON.trang}), public domain (a work of the U.S. federal government).`,
          )}
        </Text>
      </View>
      <View className="h-8" />
    </Screen>
  );
}

function LessonCard({ item, read }: { item: LibraryAudio; read: number }) {
  const { L, en } = useL();
  const tone = LEVEL_TONE[item.level] ?? { bg: '#F3F0FB', fg: '#475569' };
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(`/shadow/${item.id}` as never)}
      className="h-full rounded-[20px] bg-white p-4"
      style={({ pressed }) => [CARD, pressed ? { opacity: 0.92, transform: [{ scale: 0.99 }] } : null]}
    >
      <View className="flex-row items-center gap-2">
        <View className="rounded-pill px-2.5 py-1" style={{ backgroundColor: tone.bg }}>
          <Text className="font-strong text-label" style={{ color: tone.fg }}>
            {item.level}
          </Text>
        </View>
        <Text className="min-w-0 flex-1 font-sans text-label text-muted" numberOfLines={1}>
          {item.program}
        </Text>
      </View>
      <Text className="mt-3 font-strong text-bodyLg text-ink" numberOfLines={2}>
        {item.title}
      </Text>
      <View className="mt-auto flex-row items-center justify-between pt-3">
        <Text className="font-sans text-label text-muted">
          {en ? `~${estimateMinutes(item.words)} min` : formatLength(item.words)}
        </Text>
        {read ? (
          <Text className="font-semi text-label" style={{ color: '#16A34A' }}>
            {L(`đã đọc ${read} câu`, `${read} sentences read`)}
          </Text>
        ) : (
          <View className="flex-row items-center gap-1">
            <Icon name="mic" size={14} color={color.primary} />
            <Text className="font-semi text-label" style={{ color: color.primary }}>
              {L('Đọc theo', 'Shadow')}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
