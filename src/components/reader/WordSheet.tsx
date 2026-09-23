import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import { englishVoice } from '@/services/audio/voice';

import { Badge, Button, Icon, IconButton } from '@/components/ui';
import { useWordLookup } from '@/services/dictionary/lookup';
import { useVocabStore } from '@/store/useVocabStore';
import { color } from '@/theme/tokens';

export type WordSheetTarget = {
  word: string;
  sentence: string;
  paragraphIndex: number;
  mode: 'word' | 'phrase' | 'sentence';
};

/**
 * Bottom sheet tra từ: IPA, từ loại, nghĩa theo ngữ cảnh, nghĩa tiếng Việt,
 * ví dụ và nút Lưu. Lưu từ luôn kèm nguyên câu gốc nơi gặp.
 */
export function WordSheet({
  target,
  articleId,
  articleTitle,
  onClose,
}: {
  target: WordSheetTarget | null;
  articleId: string;
  articleTitle: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useWordLookup(
    target ? target.word : null,
    target?.sentence ?? '',
  );

  const saveWord = useVocabStore((s) => s.saveWord);
  const hasLemma = useVocabStore((s) => s.hasLemma);

  if (!target) return null;

  const saved = data ? hasLemma(data.lemma) : false;
  const isSentence = target.mode === 'sentence';

  const speak = () => {
    Speech.stop();
    Speech.speak(target.word, { language: 'en-US', rate: 0.9, voice: englishVoice() });
  };

  const save = () => {
    if (!data) return;
    saveWord({
      word: data.word,
      lemma: data.lemma,
      phonetic: data.phonetic,
      partOfSpeech: data.partOfSpeech,
      definitionContext: data.definitionContext,
      definitionGeneral: data.definitionGeneral,
      definitionVi: data.definitionVi,
      exampleSentence: data.examples[0] ?? null,
      sourceSentence: target.sentence,
      articleId,
      articleTitle,
      paragraphIndex: target.paragraphIndex,
      isCollocation: target.mode === 'phrase',
    });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/30" onPress={onClose} />

      <View className="max-h-[70%] rounded-t-[20px] border-t border-border bg-surface p-5">
        <View className="mb-3 flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="font-heavy text-sectionTitle text-ink" numberOfLines={2}>
                {target.word}
              </Text>
              {!isSentence ? (
                <IconButton name="volume" accessibilityLabel="Phát âm" onPress={speak} />
              ) : null}
            </View>

            {data?.phonetic ? (
              <Text className="mt-0.5 font-mid text-body text-muted">{data.phonetic}</Text>
            ) : null}

            <View className="mt-2 flex-row flex-wrap gap-2">
              {data?.partOfSpeech ? <Badge label={data.partOfSpeech} tone="primary" /> : null}
              {target.mode === 'phrase' ? <Badge label="Collocation" tone="accent" /> : null}
              {isSentence ? <Badge label="Giải thích câu" tone="info" /> : null}
            </View>
          </View>

          <IconButton name="close" accessibilityLabel="Đóng" onPress={onClose} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator color={color.primary} />
              <Text className="mt-2 font-sans text-label text-muted">Đang tra…</Text>
            </View>
          ) : null}

          {isError ? (
            <Text className="py-4 font-sans text-body text-danger-ink">
              Không tra được từ này. Kiểm tra kết nối mạng rồi thử lại.
            </Text>
          ) : null}

          {data ? (
            <View className="gap-3">
              {data.definitionContext ? (
                <Block
                  label="Nghĩa trong ngữ cảnh câu này"
                  value={data.definitionContext}
                  tone="primary"
                />
              ) : null}

              {data.definitionVi ? (
                <Block label="Nghĩa tiếng Việt" value={data.definitionVi} tone="accent" />
              ) : null}

              {data.definitionGeneral ? (
                <Block label="Nghĩa tổng quát" value={data.definitionGeneral} />
              ) : null}

              <View className="rounded-panel bg-surfaceAlt p-3">
                <Text className="font-mid text-label text-muted">Câu gốc trong bài</Text>
                <Text className="mt-1 font-sans text-body text-body">“{target.sentence}”</Text>
              </View>

              {data.examples.length > 0 ? (
                <View className="gap-2">
                  <Text className="font-mid text-label text-muted">Ví dụ</Text>
                  {data.examples.map((example, index) => (
                    <View key={index} className="flex-row gap-2">
                      <Icon name="chevron-right" size={14} color={color.subtle} />
                      <Text className="flex-1 font-sans text-body text-body">{example}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {!data.definitionContext ? (
                <Text className="font-sans text-label text-subtle">
                  Nghĩa theo đúng ngữ cảnh cần Claude API. Chưa cấu hình key nên đang hiện nghĩa
                  tổng quát.
                </Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        {!isSentence ? (
          <Button
            label={saved ? 'Đã có trong sổ từ' : 'Lưu vào sổ từ'}
            iconLeft={saved ? 'check' : 'plus'}
            variant={saved ? 'outline' : 'primary'}
            disabled={!data || saved}
            fullWidth
            className="mt-4"
            onPress={save}
          />
        ) : null}
      </View>
    </Modal>
  );
}

function Block({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'primary' | 'accent' | 'neutral';
}) {
  const bg =
    tone === 'primary' ? 'bg-primary-50' : tone === 'accent' ? 'bg-accent-50' : 'bg-surfaceAlt';

  return (
    <View className={`rounded-panel p-3 ${bg}`}>
      <Text className="font-mid text-label text-muted">{label}</Text>
      <Text className="mt-1 font-sans text-bodyLg text-ink">{value}</Text>
    </View>
  );
}
