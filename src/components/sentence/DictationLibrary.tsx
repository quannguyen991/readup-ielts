import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';

import { Grid } from '@/components/layout/Grid';
import { Card, Icon } from '@/components/ui';
import {
  DICTATION_SET_LEVELS,
  DICTATION_SET_TOPICS,
  dictationSetStats,
  filterDictationSets,
  paletteFor,
  positionOf,
  type DictationSet,
} from '@/data/dictation-sets';
import { useSentenceStore } from '@/store/useSentenceStore';
import { color } from '@/theme/tokens';

/**
 * Thư viện bộ đề chép chính tả — phần thân, không kèm khung trang.
 *
 * Tách khỏi route để màn Chép chính tả nhúng thẳng vào được: người dùng vào
 * `/sentence/dictation` là thấy ngay danh sách bài, không phải qua một màn chọn
 * độ khó rồi mới tới chỗ có bài.
 *
 * Vì sao thẻ to và có hoa văn thay vì một danh sách dòng: 50 bài trong một danh
 * sách chữ thì mọi bài trông y hệt nhau và người học chọn bừa bài đầu tiên. Thẻ
 * có màu riêng theo số thứ tự và tên bài in lớn cho phép nhớ "bài cam về đồ ăn"
 * — tức là chọn được bài mình muốn quay lại, chứ không chỉ bài kế tiếp.
 *
 * `heading=false` cho chỗ nào đã có tiêu đề trang riêng (trang thư viện hai tab):
 * hai tiêu đề chồng nhau đọc như lỗi bố cục chứ không như hai tầng thông tin.
 */
export function DictationLibrary({ heading = true }: { heading?: boolean }) {
  const [level, setLevel] = useState('all');
  const [topic, setTopic] = useState('all');

  const stats = useMemo(() => dictationSetStats(), []);
  const sets = useMemo(() => filterDictationSets({ level, topic }), [level, topic]);

  return (
    <View>
      {heading ? (
        <>
          <View className="self-start rounded-pill border border-border bg-surface px-3 py-1.5">
            <Text className="font-semi uppercase tracking-wide text-muted" style={{ fontSize: 10 }}>
              Listening dictation library
            </Text>
          </View>

          <Text className="mt-3 font-heavy text-pageTitle text-ink">Bộ đề chép chính tả</Text>
          <Text className="mt-1.5 max-w-[640px] font-sans text-bodyLg text-muted">
            {stats.sets} bài, mỗi bài {Math.round(stats.sentences / stats.sets)} câu nối tiếp nhau
            theo một chủ đề — nghe hết một bài là theo được cả mạch, không phải nghe{' '}
            {stats.sentences} câu rời rạc.
          </Text>
        </>
      ) : null}

      <Card className={heading ? 'mt-5' : ''}>
        <FilterRow label="Trình độ">
          <Chip label="Tất cả" active={level === 'all'} onPress={() => setLevel('all')} />
          {DICTATION_SET_LEVELS.map((l) => (
            <Chip
              key={l}
              label={l}
              active={level === l}
              onPress={() => setLevel(level === l ? 'all' : l)}
            />
          ))}
        </FilterRow>
        <FilterRow label="Chủ đề">
          <Chip label="Tất cả" active={topic === 'all'} onPress={() => setTopic('all')} />
          {DICTATION_SET_TOPICS.map((t) => (
            <Chip
              key={t}
              label={t}
              active={topic === t}
              onPress={() => setTopic(topic === t ? 'all' : t)}
            />
          ))}
        </FilterRow>
      </Card>

      <Text className="mt-5 font-strong text-cardTitle text-ink">
        {sets.length} bài{level !== 'all' || topic !== 'all' ? ' khớp bộ lọc' : ''}
      </Text>

      <View className="mt-3">
        {sets.length > 0 ? (
          <Grid columns={4} tabletColumns={2} mobileColumns={1} gap={16}>
            {sets.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </Grid>
        ) : (
          <Card className="items-center py-10">
            <Icon name="search" size={26} color={color.subtle} />
            <Text className="mt-2 text-center font-sans text-body text-muted">
              Không có bài nào khớp. Thử bỏ bớt bộ lọc.
            </Text>
          </Card>
        )}
      </View>
    </View>
  );
}

function SetCard({ set }: { set: DictationSet }) {
  const position = positionOf(set);
  const colors = paletteFor(position);
  const sessions = useSentenceStore((s) => s.sessions);

  // Đã luyện bài này chưa — đọc từ lịch sử phiên đã lưu trên máy.
  const doneCount = useMemo(
    () => sessions.filter((s) => s.mode === 'dictation' && s.setId === set.id).length,
    [sessions, set.id],
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/sentence/dictation?set=${set.id}` as never)}
      className="h-full overflow-hidden rounded-card"
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
    >
      <LinearGradient colors={[...colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={{ height: 128 }}>
          <CardPattern order={position} />
          <View className="absolute inset-0 justify-between p-3.5">
            <View className="flex-row items-center justify-between">
              <Text className="font-semi uppercase tracking-wide text-white/80" style={{ fontSize: 9 }}>
                Bài {position}
              </Text>
              <View className="rounded-pill bg-white/25 px-2 py-0.5">
                <Text className="font-strong text-white" style={{ fontSize: 10 }}>
                  {set.level}
                </Text>
              </View>
            </View>
            <Text className="font-heavy text-white" style={{ fontSize: 19, lineHeight: 24 }} numberOfLines={2}>
              {set.title}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="flex-1 border-x border-b border-border bg-surface p-3.5">
        <Text className="font-sans text-label text-muted" numberOfLines={3}>
          {set.blurb}
        </Text>
        <View className="mt-2.5 flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <Meta icon="list" label={`${set.sentences.length} câu`} />
          <Meta icon="volume" label={set.accentHint} />
          {doneCount > 0 ? <Meta icon="check" label={`đã luyện ${doneCount} lần`} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Hoa văn nền của thẻ — ba kiểu, chọn theo số bài.
 *
 * Vẽ bằng SVG chứ không dùng ảnh: hoa văn phải co giãn theo bề ngang thẻ ở mọi
 * khổ màn, và ba kiểu sóng/gạch/chấm đủ để hai thẻ cạnh nhau không giống nhau.
 */
function CardPattern({ order }: { order: number }) {
  const kind = order % 3;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.18 }}>
      <Svg width="100%" height="100%" viewBox="0 0 200 128" preserveAspectRatio="none">
        {kind === 0
          ? [0, 1, 2, 3].map((i) => (
              <Path
                key={i}
                d={`M -20 ${18 + i * 34} Q 40 ${2 + i * 34}, 100 ${18 + i * 34} T 220 ${18 + i * 34}`}
                stroke="#FFFFFF"
                strokeWidth={9}
                fill="none"
              />
            ))
          : kind === 1
            ? Array.from({ length: 12 }, (_, i) => (
                <Path
                  key={i}
                  d={`M ${-30 + i * 22} 140 L ${10 + i * 22} -12`}
                  stroke="#FFFFFF"
                  strokeWidth={7}
                  fill="none"
                />
              ))
            : Array.from({ length: 24 }, (_, i) => (
                <Circle
                  key={i}
                  cx={14 + (i % 6) * 34}
                  cy={16 + Math.floor(i / 6) * 32}
                  r={6}
                  fill="#FFFFFF"
                />
              ))}
      </Svg>
    </View>
  );
}

function Meta({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-1">
      <Icon name={icon} size={12} color={color.subtle} />
      <Text className="font-mid text-label text-muted">{label}</Text>
    </View>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-3 last:mb-0">
      <Text className="mb-1.5 font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 10 }}>
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-1.5 py-0.5">{children}</View>
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={[
        'rounded-pill border px-3 py-1.5',
        active ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface',
      ].join(' ')}
    >
      <Text className={['font-semi text-label', active ? 'text-white' : 'text-muted'].join(' ')}>
        {label}
      </Text>
    </Pressable>
  );
}
