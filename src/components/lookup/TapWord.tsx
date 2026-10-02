import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { lookupOffline, resolveWord, type ResolvedWord } from '@/services/dictionary/word-lookup';
import { pronounce } from '@/services/audio/pronounce';
import { addMyWord, findMyWord, undoMyWord } from '@/services/vocab/my-words';
import { useVocabStore } from '@/store/useVocabStore';
import { color } from '@/theme/tokens';
import { currentLocale, pick, useL } from '@/i18n/useL';

/**
 * Chạm vào BẤT KỲ từ nào trong câu ví dụ → thẻ nhỏ có nghĩa, không cần AI.
 * Nghĩa lấy từ `resolveWord` (bộ từ trong máy → từ điển → mạng); nút "Thêm vào từ
 * mới" ghi vào sổ từ chung (`useVocabStore`) nên từ vào luôn lịch ôn.
 */

const WORD_RE = /([A-Za-z][A-Za-z'’-]*)/;

export function TappableSentence({
  text,
  highlight,
  source,
  className = 'font-sans text-body text-muted',
}: {
  text: string;
  /** Từ đang học: in đậm. */
  highlight?: string;
  /** Nơi gặp từ, lưu cùng từ khi thêm. */
  source?: string;
  className?: string;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const stem = highlight ? highlight.toLowerCase().replace(/(e|y)$/, '') : '';
  const parts = useMemo(() => text.split(WORD_RE), [text]);

  return (
    <>
      <Text className={className}>
        {parts.map((p, i) => {
          if (i % 2 === 0) return p;
          const strong = stem && p.toLowerCase().startsWith(stem);
          return (
            <Text
              key={i}
              accessibilityRole="button"
              onPress={() => setPicked(p)}
              className={strong ? 'font-semi text-ink' : undefined}
              style={{ textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: '#CBD5E1' }}
            >
              {p}
            </Text>
          );
        })}
      </Text>
      {picked ? <WordInfoModal word={picked} sentence={text} source={source} onClose={() => setPicked(null)} /> : null}
    </>
  );
}

function WordInfoModal({ word, sentence, source, onClose }: { word: string; sentence: string; source?: string; onClose: () => void }) {
  const { L } = useL();
  const [data, setData] = useState<ResolvedWord | null>(() => lookupOffline(word));
  const [state, setState] = useState<'loading' | 'done' | 'failed'>(data ? 'done' : 'loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (lookupOffline(word)) return;
    let live = true;
    void resolveWord(word, sentence).then((r) => {
      if (!live) return;
      setData(r);
      setState(r ? 'done' : 'failed');
    });
    return () => {
      live = false;
    };
  }, [word, sentence, attempt]);

  const entries = useVocabStore((s) => s.entries);
  const saveWord = useVocabStore((s) => s.saveWord);
  const removeWord = useVocabStore((s) => s.removeWord);
  const lemma = (data?.lemma ?? word).toLowerCase();
  const saved = !!findMyWord(entries, lemma) || !!findMyWord(entries, word);

  const toggle = useCallback(() => {
    const api = { entries: useVocabStore.getState().entries, saveWord, removeWord };
    if (saved) {
      undoMyWord(api, lemma);
      undoMyWord(api, word);
      return;
    }
    addMyWord(
      api,
      {
        word: data?.word ?? word,
        lemma,
        phonetic: data?.phonetic ?? null,
        partOfSpeech: data?.partOfSpeech ?? null,
        definitionVi: data?.definitionVi ?? null,
        definitionGeneral: data?.definitionGeneral ?? null,
        definitionContext: data?.definitionContext ?? null,
      },
      { sentence, source: source ?? pick(currentLocale(), 'Từ mới của tôi', 'My new words') },
    );
  }, [saved, lemma, word, data, sentence, source, saveWord, removeWord]);

  const meta = [data?.partOfSpeech, data?.phonetic].filter(Boolean).join(' · ');

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityLabel={L('Đóng', 'Close')} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Pressable
          onPress={() => undefined}
          style={{ width: '100%', maxWidth: 360, borderRadius: 20, backgroundColor: '#FFFFFF', padding: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text className="font-heavy" numberOfLines={2} style={{ flex: 1, fontSize: 20, color: '#0F172A' }}>
              {word}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={L('Nghe phát âm', 'Play pronunciation')}
              onPress={() => void pronounce(word, { rate: 0.85 })}
              style={{ width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCF8F1' }}
            >
              <Icon name="volume" size={18} color={color.primary} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={L('Đóng', 'Close')} onPress={onClose} style={{ width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9F6F1' }}>
              <Icon name="close" size={16} color="#475569" />
            </Pressable>
          </View>

          {meta ? (
            <Text className="font-sans" style={{ marginTop: 2, fontSize: 13, color: '#64748B' }}>
              {meta}
            </Text>
          ) : null}

          {state === 'loading' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 }}>
              <ActivityIndicator color={color.primary} />
              <Text className="font-sans" style={{ fontSize: 13, color: '#64748B' }}>
                {L('Đang tra…', 'Looking up…')}
              </Text>
            </View>
          ) : null}

          {state === 'failed' ? (
            <View style={{ paddingVertical: 12, gap: 8 }}>
              <Text className="font-sans" style={{ fontSize: 14, color: '#475569' }}>
                {L('Chưa tra được từ này.', "Couldn't find that word.")}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => {
                  setState('loading');
                  setAttempt((n) => n + 1);
                }}>
                <Text className="font-strong" style={{ fontSize: 14, color: color.primary }}>
                  {L('Thử lại', 'Try again')}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {data ? (
            <View style={{ marginTop: 8, gap: 6 }}>
              {data.definitionVi ? (
                <Text className="font-strong" style={{ fontSize: 17, lineHeight: 24, color: '#0F172A' }}>
                  {data.definitionVi}
                </Text>
              ) : null}
              {data.definitionGeneral ? (
                <Text className="font-sans" style={{ fontSize: 14, lineHeight: 20, color: '#475569' }}>
                  {data.englishOnly ? 'EN · ' : ''}
                  {data.definitionGeneral}
                </Text>
              ) : null}
            </View>
          ) : null}

          {data ? (
            <Pressable
              accessibilityRole="button"
              onPress={toggle}
              style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 10, backgroundColor: saved ? '#DCFCE7' : color.primary }}
            >
              <Icon name={saved ? 'check' : 'bookmark'} size={16} color={saved ? '#15803D' : '#FFFFFF'} strokeWidth={2.2} />
              <Text className="font-strong" style={{ fontSize: 14, color: saved ? '#15803D' : '#FFFFFF' }}>
                {saved ? L('Đã thêm ✓ · Hoàn tác', 'Added ✓ · Undo') : L('Thêm vào từ mới', 'Add to my words')}
              </Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
