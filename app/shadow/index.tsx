import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { SpeakButton } from '@/components/vocab/study/StudyKit';
import { AUDIO_LEVELS, AUDIO_NGUON, filterAudio, formatLength, getLibraryAudio, LIBRARY_AUDIO, type LibraryAudio } from '@/data/audio-library';
import { useShadowStore } from '@/store/useShadowStore';
import { color } from '@/theme/tokens';

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 12px 30px rgba(30,41,99,0.08)' } as object;
const PAGE = 24;

/** Màu nhận diện theo trình độ — để lưới bài không là một mảng trắng đều. */
const LEVEL_TONE: Record<string, { bg: string; fg: string }> = {
  A2: { bg: '#DCFCE7', fg: '#15803D' },
  B1: { bg: '#E0F2FE', fg: '#0369A1' },
  B2: { bg: '#EDE9FE', fg: '#6D28D9' },
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
  const best = useShadowStore((s) => s.best);
  const missed = useShadowStore((s) => s.missed);
  const [level, setLevel] = useState('all');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const items = useMemo(() => filterAudio({ level, search }), [level, search]);
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

  return (
    <Screen>
      <Appear>
        <LightHero
          scene="verbal"
          badge="ĐỌC THEO · SHADOWING"
          line1="Nghe một câu, nói lại,"
          line2="máy tô từng từ bạn đọc rõ"
          subtitle={`${LIBRARY_AUDIO.length} bài VOA có sẵn lời. Nghe giọng mẫu, bấm micro đọc lại: từ nào máy nghe rõ thì xanh, từ nào hụt thì đỏ — thấy ngay âm nào mình hay nuốt.`}
          footer={
            <>
              <HeroStat value={String(LIBRARY_AUDIO.length)} label="bài để đọc theo" />
              <HeroStat value={String(readTotal)} label="câu bạn đã đọc" />
            </>
          }
        >
          <Button
            label={started[0] ? 'Đọc tiếp bài dở' : 'Đọc thử một bài'}
            variant="brand"
            size="lg"
            iconRight="arrow-right"
            onPress={() => router.push(`/shadow/${(started[0]?.meta ?? filterAudio({ level: 'A2' })[0] ?? LIBRARY_AUDIO[0]!).id}` as never)}
          />
        </LightHero>
      </Appear>

      {started.length || hardWords.length ? (
        <View className="mt-5 flex-row flex-wrap gap-4">
          {started.length ? (
            <Appear index={1} style={{ flexGrow: 1, flexBasis: 320 }}>
              <View className="rounded-[22px] bg-white p-5" style={CARD}>
                <Text className="font-heavy text-sectionTitle text-ink">Đang đọc dở</Text>
                <View className="mt-3 gap-2">
                  {started.map(({ meta, read, avg }) => (
                    <Pressable
                      key={meta.id}
                      onPress={() => router.push(`/shadow/${meta.id}` as never)}
                      className="flex-row items-center gap-3 rounded-2xl px-3 py-2.5"
                      style={{ backgroundColor: '#F8FAFC' }}
                    >
                      <View className="h-9 w-9 items-center justify-center rounded-pill" style={{ backgroundColor: color.primary }}>
                        <Icon name="mic" size={17} color="#FFFFFF" />
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text className="font-strong text-body text-ink" numberOfLines={1}>
                          {meta.title}
                        </Text>
                        <Text className="font-sans text-label text-muted">
                          {read} câu đã đọc · trung bình {avg} điểm
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
            <Appear index={2} style={{ flexGrow: 1, flexBasis: 320 }}>
              <View className="rounded-[22px] bg-white p-5" style={CARD}>
                <Text className="font-heavy text-sectionTitle text-ink">Từ bạn hay đọc hụt</Text>
                <Text className="mt-1 font-sans text-body text-muted">Nghe lại từng từ, để ý âm cuối — lỗi hay gặp nhất của người Việt.</Text>
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

      <View className="mt-6 rounded-[22px] bg-white p-4" style={CARD}>
        <View className="flex-row items-center gap-2 rounded-2xl px-3 py-2" style={{ backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0' }}>
          <Icon name="search" size={16} color="#94A3B8" />
          <TextInput
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              setLimit(PAGE);
            }}
            placeholder="Tìm theo tên bài hoặc chuyên mục…"
            placeholderTextColor="#94A3B8"
            className="min-w-0 flex-1 font-sans text-body text-ink"
          />
        </View>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {['all', ...AUDIO_LEVELS].map((l) => {
            const on = level === l;
            return (
              <Pressable
                key={l}
                onPress={() => {
                  setLevel(l);
                  setLimit(PAGE);
                }}
                className="rounded-pill px-3.5 py-1.5"
                style={{ backgroundColor: on ? color.primary : '#F1F5F9' }}
              >
                <Text className="font-semi text-label" style={{ color: on ? '#FFFFFF' : color.ink }}>
                  {l === 'all' ? 'Mọi trình độ' : l}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text className="mt-5 font-strong text-cardTitle text-ink">{items.length} bài</Text>
      <View className="mt-3">
        <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
          {items.slice(0, limit).map((a) => (
            <LessonCard key={a.id} item={a} read={Object.keys(best[a.id] ?? {}).length} />
          ))}
        </Grid>
      </View>
      {items.length > limit ? (
        <Button className="mt-4 self-center" variant="outline" label={`Xem thêm ${Math.min(PAGE, items.length - limit)} bài`} onPress={() => setLimit((n) => n + PAGE)} />
      ) : null}

      <View className="mt-6 rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
        <Text className="font-sans text-label text-muted" style={{ lineHeight: 19 }}>
          Máy chấm dùng bộ nhận giọng có sẵn của trình duyệt (Chrome, Edge). Chrome gửi giọng tới dịch vụ nhận giọng của Google để đổi thành chữ; ReadUp chỉ nhận lại phần chữ, không ghi âm. Lời bài: {AUDIO_NGUON.ten} ({AUDIO_NGUON.trang}), {AUDIO_NGUON.giay_phep.toLowerCase()}.
        </Text>
      </View>
      <View className="h-8" />
    </Screen>
  );
}

function LessonCard({ item, read }: { item: LibraryAudio; read: number }) {
  const tone = LEVEL_TONE[item.level] ?? { bg: '#F1F5F9', fg: '#475569' };
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
        <Text className="font-sans text-label text-muted">{formatLength(item.words)}</Text>
        {read ? (
          <Text className="font-semi text-label" style={{ color: '#16A34A' }}>
            đã đọc {read} câu
          </Text>
        ) : (
          <View className="flex-row items-center gap-1">
            <Icon name="mic" size={14} color={color.primary} />
            <Text className="font-semi text-label" style={{ color: color.primary }}>
              Đọc theo
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
