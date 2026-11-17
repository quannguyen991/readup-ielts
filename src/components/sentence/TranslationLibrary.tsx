import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { CatalogHub, type CatalogItem } from '@/components/catalog/CatalogHub';
import { normalizeLevel, type GroupKey } from '@/components/catalog/catalog-model';
import { LessonCard } from '@/components/sentence/LessonCard';
import { TranslationCover } from '@/components/sentence/DictationCover';
import { SENTENCE_DIFFICULTY_LABEL, type SentenceTopic } from '@/data/sentence-drills';
import { TRANSLATION_SETS, type TranslationSet } from '@/data/translation-sets';
import { useLearnStats, useSentenceStore } from '@/store/useSentenceStore';
import { setProgress, type SetProgress } from '@/services/sentence/learn-status';
import { useL } from '@/i18n/useL';

/** Nhãn độ khó bằng tiếng Anh (bản tiếng Việt: `SENTENCE_DIFFICULTY_LABEL`). */
const DIFFICULTY_EN: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

/** Chủ đề câu → nhóm tình huống trên trang lộ trình. */
const TOPIC_GROUP: Record<SentenceTopic, GroupKey> = {
  education: 'academic',
  environment: 'ielts',
  technology: 'ielts',
  health: 'life',
  work: 'work',
  society: 'ielts',
  travel: 'life',
  media: 'ielts',
  family: 'life',
  economy: 'work',
};

/**
 * Thư viện bộ đề Dịch câu — cùng hình dáng với thư viện Chép chính tả.
 *
 * Cố ý giống nhau: hai bài luyện khác nhau về việc phải làm, nhưng bước CHỌN
 * BÀI thì giống hệt, nên dùng chung thẻ `LessonCard` — học một lần dùng được cả
 * hai chỗ. Khác ở dấu vân: bài nghe là sóng âm, bài dịch là cặp vạch Việt–Anh. Chỉ khác ở chỗ bài dịch gom theo CHỦ ĐỀ, vì đó là trục người học
 * nghĩ tới khi muốn ôn từ vựng của một mảng.
 */
export function TranslationLibrary({ express = false }: { express?: boolean }) {
  const sessions = useSentenceStore((s) => s.sessions);
  const doneBySet = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of sessions) if (x.mode === 'translation' && x.setId) m.set(x.setId, (m.get(x.setId) ?? 0) + 1);
    return m;
  }, [sessions]);

  const learnStats = useLearnStats();
  const statusBySet = useMemo(() => {
    const m = new Map<string, SetProgress>();
    for (const set of TRANSLATION_SETS) m.set(set.id, setProgress(learnStats, express ? 'express' : 'translation', set.items.map((it) => it.id)));
    return m;
  }, [learnStats, express]);

  const items = useMemo<CatalogItem[]>(
    () =>
      TRANSLATION_SETS.map((set) => ({
        id: set.id,
        level: normalizeLevel(set.level),
        topic: set.title,
        group: TOPIC_GROUP[set.topic] ?? 'life',
        title: set.title,
        done: statusBySet.get(set.id)?.state === 'learned',
        state: statusBySet.get(set.id)?.state,
        node: <SetCard set={set} doneCount={doneBySet.get(set.id) ?? 0} status={statusBySet.get(set.id)} express={express} />,
      })),
    [doneBySet, statusBySet, express],
  );

  return (
    <View>
      <CatalogHub items={items} searchHintVi="Tìm chủ đề dịch…" searchHintEn="Search a translation topic…" onStart={(it) => router.push(`/sentence/${express ? 'express' : 'translate'}?set=${it.id}` as never)} />
    </View>
  );
}

const SetCard = React.memo(function SetCard({ set, doneCount, status, express }: { set: TranslationSet; doneCount: number; status?: SetProgress; express: boolean }) {
  const { L, en } = useL();

  return (
    <LessonCard
      number={set.order}
      level={set.level}
      levelLabel={en ? (DIFFICULTY_EN[set.level] ?? SENTENCE_DIFFICULTY_LABEL[set.level]) : SENTENCE_DIFFICULTY_LABEL[set.level]}
      icon="languages"
      title={set.title}
      blurb={set.blurb}
      meta={[{ icon: 'list', label: L(`${set.items.length} câu`, `${set.items.length} sentences`) }]}
      done={doneCount}
      status={status}
      visualHeight={112}
      bleed
      visual={(tone) => <TranslationCover tone={tone} pairs={set.items} level={set.level} seed={set.order} />}
      onPress={() => router.push(`/sentence/${express ? 'express' : 'translate'}?set=${set.id}` as never)}
    />
  );
});
