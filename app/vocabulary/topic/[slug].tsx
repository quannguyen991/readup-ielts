import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Badge, Button, Card, Icon } from '@/components/ui';
import { getVocabTopic, groupByBand, type VocabTopicWord } from '@/data/vocab-topics';
import { useVocabStore } from '@/store/useVocabStore';
import { lemmatize } from '@/services/dictionary/lookup';
import { color } from '@/theme/tokens';

/**
 * Một bộ từ vựng: 50 từ, xếp theo mức band từ dễ tới khó.
 *
 * XẾP THEO BAND CHỨ KHÔNG THEO BẢNG CHỮ CÁI. Người học band 5.5 mở bộ Môi
 * trường ra mà gặp ngay "anthropogenic" thì đóng lại luôn; xếp theo độ khó thì
 * họ học được mười lăm từ đầu rồi mới gặp phần khó, và mười lăm từ đó dùng được
 * ngay ở bài viết tối nay.
 *
 * Lưu vào sổ từ đi qua đúng `saveWord` của store, nên từ lưu ở đây và từ lưu
 * lúc đọc bài nằm chung một chỗ, chung một lịch ôn FSRS. Hai kho riêng là hai
 * lịch ôn riêng, và người học sẽ ôn cùng một từ hai lần.
 */
export default function VocabTopicScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const topic = typeof slug === 'string' ? getVocabTopic(slug) : undefined;

  const entries = useVocabStore((s) => s.entries);
  const saveWord = useVocabStore((s) => s.saveWord);
  const [justSaved, setJustSaved] = useState(0);

  const savedLemmas = useMemo(
    () => new Set(Object.values(entries).map((e) => e.lemma.toLowerCase())),
    [entries],
  );

  if (!topic) {
    return (
      <Screen>
        <Card>
          <Text className="font-strong text-cardTitle text-ink">Không có bộ từ này</Text>
          <Button
            className="mt-3 self-start"
            label="Về danh sách chủ đề"
            onPress={() => router.replace('/vocabulary/topics' as never)}
          />
        </Card>
      </Screen>
    );
  }

  const save = (word: VocabTopicWord) => {
    saveWord({
      word: word.word,
      lemma: lemmatize(word.word),
      phonetic: word.ipa,
      partOfSpeech: word.pos,
      definitionContext: word.collocation,
      definitionGeneral: word.definitionEn,
      definitionVi: word.meaningVi,
      exampleSentence: word.example,
      // Câu nguồn là chính câu ví dụ: FSRS và thẻ ôn đều cần một câu để đặt từ
      // vào ngữ cảnh, và ở đây ví dụ chính là ngữ cảnh duy nhất ta có.
      sourceSentence: word.example,
      articleId: null,
      articleTitle: `Chủ đề: ${topic.nameVi}`,
      paragraphIndex: null,
      isCollocation: false,
    });
  };

  const remaining = topic.words.filter((w) => !savedLemmas.has(w.word.toLowerCase()));

  const saveAll = () => {
    remaining.forEach(save);
    setJustSaved(remaining.length);
  };

  const learned = topic.words.length - remaining.length;
  const groups = groupByBand(topic.words);

  return (
    <Screen>
      <Appear>
        <View className="flex-row flex-wrap items-start justify-between gap-3">
          <View className="flex-1" style={{ minWidth: 220 }}>
            <Button
              className="mb-2 self-start"
              label="Chủ đề khác"
              variant="ghost"
              size="sm"
              iconLeft="chevron-left"
              onPress={() => router.push('/vocabulary/topics' as never)}
            />
            <Text className="font-heavy text-pageTitle text-ink">{topic.nameVi}</Text>
            <Text className="mt-1 font-sans text-body text-muted">
              {topic.name} · {topic.blurb}
            </Text>
          </View>
          <View className="items-end">
            <Text className="font-heavy text-stat text-ink">
              {learned}
              <Text className="font-sans text-body text-muted">/{topic.words.length}</Text>
            </Text>
            <Text className="font-sans text-label text-muted">đã lưu vào sổ từ</Text>
          </View>
        </View>
      </Appear>

      {justSaved > 0 ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-card bg-success-soft p-3">
          <Icon name="check" size={16} color={color.success} />
          <Text className="flex-1 font-sans text-body text-ink">
            Đã thêm {justSaved} từ vào sổ. Chúng vào chung lịch ôn FSRS với những từ bạn lưu lúc
            đọc bài, nên không bị ôn trùng.
          </Text>
        </View>
      ) : null}

      {remaining.length > 0 ? (
        <Appear index={1}>
          <Button
            className="mt-3 self-start"
            label={`Thêm cả ${remaining.length} từ chưa lưu vào sổ`}
            iconRight="plus"
            onPress={saveAll}
          />
        </Appear>
      ) : (
        <View className="mt-3 flex-row items-center gap-2">
          <Icon name="trophy" size={16} color={color.success} />
          <Text className="font-strong text-body text-ink">
            Đã lưu hết cả bộ này vào sổ từ.
          </Text>
        </View>
      )}

      {groups.map((group, gi) => (
        <Appear key={group.band} index={gi + 2}>
          <View className="mt-5">
            <View className="flex-row items-center gap-2">
              <Text className="font-heavy text-sectionTitle text-ink">Band {group.band}</Text>
              <Text className="font-sans text-label text-muted">{group.words.length} từ</Text>
            </View>

            <View className="mt-2 gap-2">
              {group.words.map((word) => (
                <WordRow
                  key={word.word}
                  word={word}
                  saved={savedLemmas.has(word.word.toLowerCase())}
                  onSave={() => save(word)}
                />
              ))}
            </View>
          </View>
        </Appear>
      ))}

      <View className="h-6" />
    </Screen>
  );
}

function WordRow({
  word,
  saved,
  onSave,
}: {
  word: VocabTopicWord;
  saved: boolean;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <View className="flex-row flex-wrap items-start justify-between gap-2">
        <View className="min-w-0 flex-1" style={{ minWidth: 200 }}>
          <View className="flex-row flex-wrap items-baseline gap-2">
            <Text className="font-heavy text-cardTitle text-ink">{word.word}</Text>
            <Text className="font-sans text-label text-subtle">{word.ipa}</Text>
            <Badge label={word.pos} tone="neutral" shape="tag" />
          </View>
          <Text className="mt-0.5 font-strong text-body text-ink">{word.meaningVi}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Button
            label={open ? 'Thu gọn' : 'Ví dụ'}
            variant="ghost"
            size="sm"
            onPress={() => setOpen((v) => !v)}
          />
          {saved ? (
            <View className="flex-row items-center gap-1 rounded-pill bg-success-soft px-2.5 py-1.5">
              <Icon name="check" size={13} color={color.success} />
              <Text className="font-strong text-label" style={{ color: color.success }}>
                Đã lưu
              </Text>
            </View>
          ) : (
            <Button label="Lưu" size="sm" iconRight="plus" onPress={onSave} />
          )}
        </View>
      </View>

      {open ? (
        <View className="mt-3 gap-2 border-t border-border pt-3">
          <Detail label="Nghĩa tiếng Anh" value={word.definitionEn} />
          <Detail label="Ví dụ" value={word.example} italic />
          <Detail label="Cụm hay đi kèm" value={word.collocation} />
        </View>
      ) : null}
    </Card>
  );
}

function Detail({ label, value, italic }: { label: string; value: string; italic?: boolean }) {
  return (
    <View>
      <Text className="font-mid text-label text-muted">{label}</Text>
      <Text
        className="mt-0.5 font-sans text-body text-ink"
        style={italic ? { fontStyle: 'italic' } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}
