import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { CatalogHub, type CatalogItem } from '@/components/catalog/CatalogHub';
import { groupOfTopic, normalizeLevel } from '@/components/catalog/catalog-model';
import { DictationCover } from '@/components/sentence/DictationCover';
import { LessonCard } from '@/components/sentence/LessonCard';
import { DICTATION_SETS, dictationSetStats, positionOf, type DictationSet } from '@/data/dictation-sets';
import { useLearnStats, useSentenceStore } from '@/store/useSentenceStore';
import { setProgress, type SetProgress } from '@/services/sentence/learn-status';
import { useL } from '@/i18n/useL';

/**
 * Thư viện bộ đề chép chính tả — phần thân, không kèm khung trang.
 *
 * Tách khỏi route để màn Chép chính tả nhúng thẳng vào được: người dùng vào
 * `/sentence/dictation` là thấy ngay danh sách bài, không phải qua một màn chọn
 * độ khó rồi mới tới chỗ có bài.
 *
 * Vì sao là thẻ chứ không phải danh sách dòng: 50 bài trong một danh sách chữ
 * thì mọi bài trông y hệt nhau và người học chọn bừa bài đầu tiên. Mỗi thẻ có
 * dải sóng âm vẽ từ chính các câu của bài (`LessonCard`) và màu theo trình độ —
 * đủ để nhận ra bài mình muốn quay lại, chứ không chỉ bài kế tiếp.
 *
 * `heading=false` cho chỗ nào đã có tiêu đề trang riêng (trang thư viện hai tab):
 * hai tiêu đề chồng nhau đọc như lỗi bố cục chứ không như hai tầng thông tin.
 */
export function DictationLibrary({ heading = true, express = false }: { heading?: boolean; express?: boolean }) {
  const { L } = useL();
  const stats = useMemo(() => dictationSetStats(), []);
  const sessions = useSentenceStore((s) => s.sessions);

  // Một lần duyệt lịch sử: setId → số lượt đã luyện (thay vì mỗi thẻ tự lọc cả lịch sử).
  const doneBySet = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sessions) if (s.mode === 'dictation' && s.setId) m.set(s.setId, (m.get(s.setId) ?? 0) + 1);
    return m;
  }, [sessions]);

  const learnStats = useLearnStats();
  const statusBySet = useMemo(() => {
    const m = new Map<string, SetProgress>();
    for (const set of DICTATION_SETS) {
      m.set(set.id, setProgress(learnStats, express ? 'express' : 'dictation', set.sentences.map((_, i) => `${set.id}-${String(i + 1).padStart(2, '0')}`)));
    }
    return m;
  }, [learnStats, express]);

  const items = useMemo<CatalogItem[]>(
    () =>
      DICTATION_SETS.map((set) => ({
        id: set.id,
        level: normalizeLevel(set.level),
        topic: set.topic,
        group: groupOfTopic(set.topic, set.level),
        title: set.title,
        done: statusBySet.get(set.id)?.state === 'learned',
        state: statusBySet.get(set.id)?.state,
        node: <SetCard set={set} doneCount={doneBySet.get(set.id) ?? 0} status={statusBySet.get(set.id)} express={express} />,
      })),
    [doneBySet, statusBySet, express],
  );

  return (
    <View>
      {heading ? (
        <View style={{ marginBottom: 18 }}>
          <Text className="font-heavy text-pageTitle text-ink">{L('Bộ đề chép chính tả', 'Dictation sets')}</Text>
          <Text className="mt-1.5 max-w-[640px] font-sans text-bodyLg text-muted">
            {L(
              `${stats.sets} bài, mỗi bài ${Math.round(stats.sentences / stats.sets)} câu nối tiếp theo một chủ đề — nghe hết một bài là theo được cả mạch.`,
              `${stats.sets} sets, each with ${Math.round(stats.sentences / stats.sets)} connected sentences on one topic — finish a set and you follow a whole thread.`,
            )}
          </Text>
        </View>
      ) : null}
      <CatalogHub items={items} onStart={(it) => router.push(`/sentence/${express ? 'express' : 'dictation'}?set=${it.id}` as never)} />
    </View>
  );
}

const LEVEL_NAME: Record<string, { vi: string; en: string }> = {
  A2: { vi: 'A2 · Sơ cấp', en: 'A2 · Elementary' },
  B1: { vi: 'B1 · Trung cấp', en: 'B1 · Intermediate' },
  B2: { vi: 'B2 · Trên trung cấp', en: 'B2 · Upper-intermediate' },
  C1: { vi: 'C1 · Nâng cao', en: 'C1 · Advanced' },
};

const ACCENT_EN: Record<string, string> = { 'Anh – Mỹ': 'US English', 'Anh – Anh': 'UK English' };

const SetCard = React.memo(function SetCard({ set, doneCount, status, express }: { set: DictationSet; doneCount: number; status?: SetProgress; express: boolean }) {
  const lines = useMemo(() => set.sentences.map((s) => s.en), [set]);
  const { L, locale } = useL();
  const levelName = LEVEL_NAME[set.level];

  return (
    <LessonCard
      number={positionOf(set)}
      level={set.level}
      levelLabel={levelName ? (locale === 'en' ? levelName.en : levelName.vi) : set.level}
      icon="volume"
      title={set.title}
      blurb={set.blurb}
      meta={[
        { icon: 'list', label: L(`${set.sentences.length} câu`, `${set.sentences.length} sentences`) },
        { icon: 'volume', label: L(set.accentHint, ACCENT_EN[set.accentHint] ?? set.accentHint) },
      ]}
      done={doneCount}
      status={status}
      visualHeight={112}
      bleed
      visual={(tone) => <DictationCover tone={tone} topic={set.topic} sentences={lines} level={set.level} seed={set.order} />}
      onPress={() => router.push(`/sentence/${express ? 'express' : 'dictation'}?set=${set.id}` as never)}
    />
  );
});

