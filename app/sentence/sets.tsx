import React, { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { DictationLibrary } from '@/components/sentence/DictationLibrary';
import { TranslationLibrary } from '@/components/sentence/TranslationLibrary';
import { CrossFade } from '@/components/motion/Motion';
import { Button } from '@/components/ui';
import { DICTATION_SENTENCES, TRANSLATION_SENTENCES } from '@/data/sentence-drills';
import { dictationSetStats } from '@/data/dictation-sets';
import { translationSetStats } from '@/data/translation-sets';
import { useL } from '@/i18n/useL';

/**
 * Thư viện bài của cả hai kiểu luyện câu.
 *
 * Hai kho đứng sau HAI TAB chứ không xếp nối đuôi nhau: chúng dài gần bằng nhau
 * và người vào đây đã biết mình muốn nghe hay muốn dịch. Xếp nối thì kho thứ
 * hai luôn nằm dưới hai màn cuộn, và trên thực tế là không ai thấy.
 *
 * Cùng thư viện với thứ nhúng trong hai màn luyện — giữ route riêng để gửi link
 * thẳng cho nhau được và để nó có mặt trong danh sách "Khám phá".
 */
type Tab = 'dictation' | 'translation';

const TABS: readonly { key: Tab; label: string; labelEn: string }[] = [
  { key: 'dictation', label: 'Chép chính tả', labelEn: 'Dictation' },
  { key: 'translation', label: 'Dịch câu', labelEn: 'Sentence translation' },
];

export default function SentenceSetsScreen() {
  const { L } = useL();
  const [tab, setTab] = useState<Tab>('dictation');

  return (
    <Screen>
      <LightHero
        badge="SENTENCE PRACTICE LIBRARY" art="listening"
        line1={L('Thư viện bộ đề', 'Practice sets')}
        line2={L('luyện câu theo chủ đề', 'sentence practice by topic')}
        subtitle={L('Bài có chủ đề, các câu trong một bài nối tiếp nhau. Chọn bài thay vì bốc câu ngẫu nhiên.', 'Each set has a topic and its sentences follow on from each other. Pick a set instead of random sentences.')}
        footer={
          <>
            <HeroStat value={String(dictationSetStats().sets)} label={L('bài chép chính tả', 'dictation sets')} />
            <HeroStat value={String(translationSetStats().sets)} label={L('bài dịch câu', 'translation sets')} />
            <HeroStat value={String(DICTATION_SENTENCES.length + TRANSLATION_SENTENCES.length)} label={L('câu lẻ', 'single sentences')} />
          </>
        }
      >
        {TABS.map((t) => (
          <Button
            key={t.key}
            label={L(t.label, t.labelEn)}
            variant={tab === t.key ? 'brand' : 'outline'}
            size="lg"
            onPress={() => setTab(t.key)}
          />
        ))}
      </LightHero>

      <View className="mt-5">
        <CrossFade swapKey={tab}>
          {tab === 'dictation' ? <DictationLibrary heading={false} /> : <TranslationLibrary />}
        </CrossFade>
      </View>
    </Screen>
  );
}
