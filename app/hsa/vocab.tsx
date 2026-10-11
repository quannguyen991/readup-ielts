import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Badge, Card } from '@/components/ui';
import { HSA_TOPICS } from '@/data/hsa';
import { bi, useL } from '@/i18n/useL';
import { isKnown, useIntlStore } from '@/store/useIntlStore';

export default function HsaVocabularyScreen() {
  const { L, locale } = useL();
  const [active, setActive] = useState('all');
  const known = useIntlStore((s) => s.known);
  const setKnown = useIntlStore((s) => s.setKnown);
  const words = useMemo(() => HSA_TOPICS.flatMap((topic) => topic.vocabulary.map((item) => ({ ...item, topic: topic.title.vi, topicId: topic.id }))).filter((item) => active === 'all' || item.topicId === active), [active]);
  const knownCount = words.filter((item) => isKnown(known, 'hsa', item.word)).length;
  return <Screen>
    <Text className="font-heavy text-pageTitle text-ink">{L('Từ vựng HSA', 'HSA vocabulary')}</Text>
    <Text className="mt-1 font-sans text-body text-muted">{L(`${knownCount}/${words.length} từ đã đánh dấu thuộc. Học qua ví dụ học thuật, không chỉ dịch từ đơn.`, `${knownCount}/${words.length} marked known. Learn through academic examples, not translation alone.`)}</Text>
    <View className="mt-4 flex-row flex-wrap gap-2">
      {[{ id: 'all', title: L('Tất cả', 'All topics') }, ...HSA_TOPICS.map((topic) => ({ id: topic.id, title: bi(topic.title, locale) }))].map((item) => {
        const selected = active === item.id;
        return <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setActive(item.id)} className="rounded-pill border px-3 py-2" style={{ borderColor: selected ? '#6954C8' : '#E4E4E7', backgroundColor: selected ? '#F2F0FF' : '#FFFFFF' }}><Text className="font-semi text-label text-ink">{item.title}</Text></Pressable>;
      })}
    </View>
    <View className="mt-4 gap-2">{words.map((item) => {
      const mastered = isKnown(known, 'hsa', item.word);
      return <Pressable key={`${item.topicId}-${item.word}`} accessibilityRole="button" accessibilityState={{ selected: mastered }} onPress={() => setKnown('hsa', item.word, !mastered)}>
        <Card className="gap-1" style={mastered ? { borderColor: '#16835D', backgroundColor: '#F4FBF7' } : undefined}>
          <View className="flex-row flex-wrap items-center justify-between gap-2"><Text className="font-strong text-body text-ink">{item.word}</Text><Badge label={item.level} tone={item.level === 'C1' ? 'danger' : item.level === 'B2' ? 'warning' : 'neutral'} /></View>
          <Text className="font-sans text-label text-muted">{item.pos} · {item.vi}</Text>
          <Text className="font-sans text-label text-ink">{item.example}</Text>
          <Text className="font-semi text-label text-primary-600">{mastered ? L('Đã thuộc · chạm để bỏ đánh dấu', 'Known · tap to unmark') : L('Chạm để đánh dấu đã thuộc', 'Tap to mark as known')}</Text>
        </Card>
      </Pressable>;
    })}</View>
  </Screen>;
}
