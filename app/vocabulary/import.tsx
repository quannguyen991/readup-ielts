import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { ExampleLine } from '@/components/vocab/study/StudyKit';
import { candidateToStudyWord, extractCandidates, type ImportCandidate } from '@/services/vocab/import';
import { CUSTOM_PREFIX, useCustomDeckStore } from '@/store/useCustomDeckStore';
import { color } from '@/theme/tokens';

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 12px 30px rgba(30,41,99,0.08)' } as object;

/** Bài mẫu tự soạn (không chép báo) để thử ngay khi chưa có bài của mình. */
const SAMPLE = `The club unveiled a sustainable new stadium on Friday. Its roof collects rainwater, and solar panels generate enough electricity to power every floodlight. Critics were skeptical at first, arguing that the project was an expensive gamble. However, attendance has surged, and the stadium has become a model for other clubs.
Meanwhile, the team's young goalkeeper made several remarkable saves. Analysts attribute his consistency to a meticulous training routine and an unusually resilient mindset. He admits that anxiety still affects him before important matches, but he has learned to channel it into concentration.`;

/**
 * HỌC TỪ BÀI BẠN THÍCH — dán một bài tiếng Anh bất kỳ, app lọc ra những từ đáng
 * học (bỏ từ thông dụng, tên riêng), tra nghĩa trong kho có sẵn, lấy chính câu
 * trong bài làm câu ví dụ, rồi tạo thành một bộ học đầy đủ chế độ
 * (`services/vocab/import.ts`). Không gọi AI, không cần mạng.
 */
export default function ImportDeckScreen() {
  const decks = useCustomDeckStore((s) => s.decks);
  const addDeck = useCustomDeckStore((s) => s.addDeck);
  const removeDeck = useCustomDeckStore((s) => s.removeDeck);

  const [text, setText] = useState('');
  const [candidates, setCandidates] = useState<ImportCandidate[] | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [meanings, setMeanings] = useState<Record<string, string>>({});
  const [name, setName] = useState('');

  const scan = (source: string) => {
    const list = extractCandidates(source, 40);
    setCandidates(list);
    // Chọn sẵn tối đa 20 từ ĐÃ CÓ NGHĨA; từ chưa có nghĩa để người học tự quyết.
    setChosen(new Set(list.filter((c) => c.meaningVi).slice(0, 20).map((c) => c.word)));
    setMeanings({});
    if (!name) {
      const d = new Date();
      setName(`Bài của tôi · ${d.getDate()}/${d.getMonth() + 1}`);
    }
  };

  const ready = useMemo(() => {
    if (!candidates) return [];
    return candidates
      .filter((c) => chosen.has(c.word))
      .map((c) => candidateToStudyWord(c, meanings[c.word]))
      .filter((w) => w.meaningVi.length > 0);
  }, [candidates, chosen, meanings]);
  const missing = candidates ? candidates.filter((c) => chosen.has(c.word) && !(meanings[c.word]?.trim() || c.meaningVi)).length : 0;

  const create = () => {
    if (ready.length < 4) return;
    const id = addDeck(name, ready);
    router.push(`/vocabulary/topic/${CUSTOM_PREFIX}${id}` as never);
  };

  const toggle = (word: string) =>
    setChosen((s) => {
      const next = new Set(s);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });

  const existing = Object.values(decks).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen>
      <Appear>
        <LightHero
          scene="vocab"
          badge="BỘ TỪ CỦA BẠN"
          line1="Học từ bài bạn thích"
          line2="tin bóng đá, K-pop, game…"
          subtitle="Dán một bài tiếng Anh bất kỳ. App lọc ra những từ đáng học, lấy chính câu trong bài làm ví dụ, và tạo thành một bộ học đủ chế độ: lật thẻ, Học, Điền vào câu, Kiểm tra, Bóng bay."
        />
      </Appear>

      <Appear index={1}>
        <View className="mt-5 rounded-[22px] bg-white p-5" style={CARD}>
          <Text className="font-heavy text-sectionTitle text-ink">1. Dán bài</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder="Dán một bài tiếng Anh vào đây…"
            placeholderTextColor="#94A3B8"
            className="mt-3 rounded-2xl px-4 py-3 font-sans text-body text-ink"
            style={{ minHeight: 170, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', textAlignVertical: 'top' }}
          />
          <View className="mt-3 flex-row flex-wrap items-center gap-2">
            <Button label="Tìm từ đáng học" iconRight="arrow-right" disabled={text.trim().length < 40} onPress={() => scan(text)} />
            <Button
              variant="outline"
              label="Dùng bài mẫu"
              onPress={() => {
                setText(SAMPLE);
                scan(SAMPLE);
              }}
            />
            <Text className="font-sans text-label text-muted">{text.trim().split(/\s+/).filter(Boolean).length} từ</Text>
          </View>
        </View>
      </Appear>

      {candidates ? (
        <Appear index={2}>
          <View className="mt-5 rounded-[22px] bg-white p-5" style={CARD}>
            <Text className="font-heavy text-sectionTitle text-ink">2. Chọn từ muốn học</Text>
            {candidates.length === 0 ? (
              <Text className="mt-2 font-sans text-body text-muted">
                Bài này toàn từ thông dụng — thử một bài dài hơn hoặc học thuật hơn.
              </Text>
            ) : (
              <>
                <Text className="mt-1 font-sans text-body text-muted">
                  Tìm thấy {candidates.length} từ. Đã chọn sẵn những từ có nghĩa trong kho; từ chưa có nghĩa thì bạn tự điền.
                </Text>
                <View className="mt-3 gap-2">
                  {candidates.map((c) => {
                    const on = chosen.has(c.word);
                    return (
                      <View
                        key={c.word}
                        className="rounded-2xl px-4 py-3"
                        style={{ borderWidth: 1.5, borderColor: on ? '#93C5FD' : '#E2E8F0', backgroundColor: on ? '#F3F8FF' : '#FFFFFF' }}
                      >
                        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => toggle(c.word)} className="flex-row items-center gap-3">
                          <View
                            className="h-6 w-6 items-center justify-center rounded-lg"
                            style={{ backgroundColor: on ? color.primary : '#FFFFFF', borderWidth: on ? 0 : 1.5, borderColor: '#CBD5E1' }}
                          >
                            {on ? <Icon name="check" size={15} color="#FFFFFF" strokeWidth={2.6} /> : null}
                          </View>
                          <Text className="font-heavy text-bodyLg text-ink">{c.word}</Text>
                          {c.pos ? <Text className="font-sans text-label text-muted">{c.pos}</Text> : null}
                          {c.count > 1 ? <Text className="font-semi text-label text-primary-700">×{c.count}</Text> : null}
                          <Text className="min-w-0 flex-1 font-semi text-body text-ink" numberOfLines={1}>
                            {c.meaningVi ?? ''}
                          </Text>
                        </Pressable>
                        {on && !c.meaningVi ? (
                          <TextInput
                            value={meanings[c.word] ?? ''}
                            onChangeText={(v) => setMeanings((m) => ({ ...m, [c.word]: v }))}
                            placeholder="Nghĩa tiếng Việt (bạn tự điền)…"
                            placeholderTextColor="#94A3B8"
                            className="mt-2 rounded-xl px-3 py-2 font-sans text-body text-ink"
                            style={{ borderWidth: 1, borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }}
                          />
                        ) : null}
                        <View className="mt-1.5">
                          <ExampleLine example={c.example} word={c.word} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        </Appear>
      ) : null}

      {candidates && candidates.length > 0 ? (
        <Appear index={3}>
          <View className="mt-5 rounded-[22px] bg-white p-5" style={CARD}>
            <Text className="font-heavy text-sectionTitle text-ink">3. Đặt tên và tạo bộ</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Tên bộ từ"
              placeholderTextColor="#94A3B8"
              className="mt-3 rounded-2xl px-4 py-3 font-semi text-bodyLg text-ink"
              style={{ borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}
            />
            <Text className="mt-2 font-sans text-body text-muted">
              {ready.length} từ sẵn sàng{missing > 0 ? ` · ${missing} từ đã chọn còn thiếu nghĩa (sẽ bị bỏ qua)` : ''}. Cần ít nhất 4 từ.
            </Text>
            <Button className="mt-3 self-start" label={`Tạo bộ học (${ready.length} từ)`} iconRight="arrow-right" disabled={ready.length < 4} onPress={create} />
          </View>
        </Appear>
      ) : null}

      {existing.length > 0 ? (
        <Appear index={4}>
          <View className="mt-5 rounded-[22px] bg-white p-5" style={CARD}>
            <Text className="font-heavy text-sectionTitle text-ink">Bộ bạn đã tạo</Text>
            <View className="mt-3 gap-2">
              {existing.map((d) => (
                <View key={d.id} className="flex-row items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: '#F8FAFC' }}>
                  <Pressable className="min-w-0 flex-1" onPress={() => router.push(`/vocabulary/topic/${CUSTOM_PREFIX}${d.id}` as never)}>
                    <Text className="font-strong text-body text-ink" numberOfLines={1}>
                      {d.name}
                    </Text>
                    <Text className="font-sans text-label text-muted">
                      {d.words.length} từ · {d.words.slice(0, 4).map((w) => w.word).join(', ')}
                    </Text>
                  </Pressable>
                  <Button size="sm" variant="ghost" label="Xoá" onPress={() => removeDeck(d.id)} />
                </View>
              ))}
            </View>
          </View>
        </Appear>
      ) : null}
      <View className="h-8" />
    </Screen>
  );
}
