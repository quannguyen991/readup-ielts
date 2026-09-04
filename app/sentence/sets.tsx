import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { DictationLibrary } from '@/components/sentence/DictationLibrary';
import { TranslationLibrary } from '@/components/sentence/TranslationLibrary';

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

const TABS: readonly { key: Tab; label: string }[] = [
  { key: 'dictation', label: 'Chép chính tả' },
  { key: 'translation', label: 'Dịch câu' },
];

export default function SentenceSetsScreen() {
  const [tab, setTab] = useState<Tab>('dictation');

  return (
    <Screen>
      <View className="self-start rounded-pill border border-border bg-surface px-3 py-1.5">
        <Text className="font-semi uppercase tracking-wide text-muted" style={{ fontSize: 10 }}>
          Sentence practice library
        </Text>
      </View>

      <Text className="mt-3 font-heavy text-pageTitle text-ink">Thư viện bộ đề</Text>
      <Text className="mt-1.5 max-w-[640px] font-sans text-bodyLg text-muted">
        Bài có chủ đề, các câu trong một bài nối tiếp nhau. Chọn bài thay vì bốc câu ngẫu nhiên.
      </Text>

      <View className="mt-5 flex-row flex-wrap gap-1.5">
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.key }}
            onPress={() => setTab(t.key)}
            className={[
              'rounded-pill border px-4 py-2',
              tab === t.key ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface',
            ].join(' ')}
          >
            <Text
              className={['font-semi text-body', tab === t.key ? 'text-white' : 'text-muted'].join(' ')}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mt-5">
        {tab === 'dictation' ? <DictationLibrary heading={false} /> : <TranslationLibrary />}
      </View>
    </Screen>
  );
}
