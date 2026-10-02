import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import { englishVoice } from '@/services/audio/voice';
import { pronounce, stopPronounce } from '@/services/audio/pronounce';
import { isSingleWord } from '@/services/audio/pronounce-core';

import { Badge, Button, Icon, IconButton } from '@/components/ui';
import { useWordLookup } from '@/services/dictionary/lookup';
import { useVocabStore } from '@/store/useVocabStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

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
  const { L } = useL();
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
    if (isSingleWord(target.word)) void pronounce(target.word);
    else {
      stopPronounce();
      Speech.speak(target.word, { language: 'en-US', rate: 0.9, voice: englishVoice() });
    }
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
                <IconButton name="volume" accessibilityLabel={L('Phát âm', 'Pronounce')} onPress={speak} />
              ) : null}
            </View>

            {data?.phonetic ? (
              <Text className="mt-0.5 font-mid text-body text-muted">{data.phonetic}</Text>
            ) : null}

            <View className="mt-2 flex-row flex-wrap gap-2">
              {data?.partOfSpeech ? <Badge label={data.partOfSpeech} tone="primary" /> : null}
              {target.mode === 'phrase' ? <Badge label="Collocation" tone="accent" /> : null}
              {isSentence ? <Badge label={L('Giải thích câu', 'Sentence explanation')} tone="info" /> : null}
            </View>
          </View>

          <IconButton name="close" accessibilityLabel={L('Đóng', 'Close')} onPress={onClose} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator color={color.primary} />
              <Text className="mt-2 font-sans text-label text-muted">{L('Đang tra…', 'Looking up…')}</Text>
            </View>
          ) : null}

          {isError ? (
            <Text className="py-4 font-sans text-body text-danger-ink">
              {L('Không tra được từ này. Kiểm tra kết nối mạng rồi thử lại.', "Couldn't look up this word. Check your connection and try again.")}
            </Text>
          ) : null}

          {data ? (
            <View className="gap-3">
              {data.definitionContext ? (
                <Block
                  label={L('Nghĩa trong ngữ cảnh câu này', 'Meaning in this sentence')}
                  value={data.definitionContext}
                  tone="primary"
                />
              ) : null}

              {data.definitionVi ? (
                <Block label={L('Nghĩa tiếng Việt', 'Vietnamese meaning')} value={data.definitionVi} tone="accent" />
              ) : null}

              {data.definitionGeneral ? (
                <Block label={L('Nghĩa tổng quát', 'General meaning')} value={data.definitionGeneral} />
              ) : null}

              <View className="rounded-panel bg-surfaceAlt p-3">
                <Text className="font-mid text-label text-muted">{L('Câu gốc trong bài', 'Original sentence in the passage')}</Text>
                <Text className="mt-1 font-sans text-body text-body">“{target.sentence}”</Text>
              </View>

              {data.examples.length > 0 ? (
                <View className="gap-2">
                  <Text className="font-mid text-label text-muted">{L('Ví dụ', 'Examples')}</Text>
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
                  {L(
                    'Nghĩa theo đúng ngữ cảnh cần Claude API. Chưa cấu hình key nên đang hiện nghĩa tổng quát.',
                    "In-context meanings need the Claude API. No key is configured, so the general meaning is shown.",
                  )}
                </Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        {!isSentence ? (
          <Button
            label={saved ? L('Đã có trong sổ từ', 'Already in notebook') : L('Lưu vào sổ từ', 'Save to notebook')}
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
