import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Icon } from '@/components/ui';
import { OXFORD_3000, OXFORD_ADVANCED, OXFORD_EXTRA, OXFORD_TOPICS, type OxfordEntry, type OxfordLevel } from '@/data/oxford';
import { isLearnedWord, useOxfordStore } from '@/store/useOxfordStore';

/**
 * TỪ VỰNG A1 → C1 theo cấp và chủ đề: chọn cấp, rồi chọn một chủ đề (hoặc tìm từ),
 * đọc nghĩa và câu ví dụ, đánh dấu từ đã thuộc. Dữ liệu là bộ Oxford 3000 + 5000 nâng cao.
 */

const LEVELS: OxfordLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
const PAGE = 40;

const INK = '#2B2118';
const ACCENT = '#8F6E36';
const NAVY = '#0F1D33';
const CREAM = '#FBF6EC';
const GREEN = '#15803D';

const ALL: OxfordEntry[] = [...OXFORD_3000, ...OXFORD_ADVANCED, ...OXFORD_EXTRA].filter((w) => LEVELS.includes(w.level));

export default function CefrVocab() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [level, setLevel] = useState<OxfordLevel>('A1');
  const [topic, setTopic] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  const learned = useOxfordStore((s) => s.learned);
  const toggle = useOxfordStore((s) => s.toggle);

  const inLevel = useMemo(() => ALL.filter((w) => w.level === level), [level]);
  const doneInLevel = inLevel.filter((w) => isLearnedWord(learned, w.word)).length;
  const levelCount = (lv: OxfordLevel) => ALL.filter((w) => w.level === lv).length;

  const topics = useMemo(
    () =>
      OXFORD_TOPICS.map((t) => {
        const ws = inLevel.filter((w) => w.topic === t);
        return { t, total: ws.length, done: ws.filter((w) => isLearnedWord(learned, w.word)).length };
      }).filter((x) => x.total > 0),
    [inLevel, learned],
  );

  const needle = query.trim().toLowerCase();
  const list = useMemo<OxfordEntry[] | null>(() => {
    if (needle) return inLevel.filter((w) => w.word.toLowerCase().includes(needle) || w.meaningVi.toLowerCase().includes(needle));
    if (topic) return inLevel.filter((w) => w.topic === topic);
    return null;
  }, [inLevel, needle, topic]);

  const pickLevel = (lv: OxfordLevel) => {
    setLevel(lv);
    setTopic(null);
    setShown(PAGE);
  };
  const pickTopic = (t: string | null) => {
    setTopic(t);
    setShown(PAGE);
  };

  const pct = inLevel.length ? Math.round((doneInLevel / inLevel.length) * 100) : 0;

  return (
    <Screen>
      <View style={{ backgroundColor: NAVY, backgroundImage: 'linear-gradient(120deg, #0F1D33, #22345A)', borderRadius: 26, borderWidth: 2, borderColor: INK, padding: 24, boxShadow: `0 5px 0 ${INK}` } as object}>
        <Text className="font-heavy" style={{ fontSize: 30, color: '#F3D9A0' }}>Từ vựng A1 → C1</Text>
        <Text className="font-sans" style={{ marginTop: 6, fontSize: 15, lineHeight: 22, color: '#E9DCC6' }}>
          Chọn cấp, chọn chủ đề, rồi đánh dấu những từ bạn đã thuộc.
        </Text>
        <View style={{ marginTop: 16, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
          <View style={{ width: `${pct}%`, height: 8, backgroundColor: '#F3D9A0' } as object} />
        </View>
        <Text className="font-sans" style={{ marginTop: 8, fontSize: 13, color: '#D7DCE8' }}>
          Cấp {level}: đã thuộc {doneInLevel} / {inLevel.length} từ
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        {LEVELS.map((lv) => {
          const on = lv === level;
          return (
            <Pressable
              key={lv}
              accessibilityRole="button"
              aria-selected={on}
              onPress={() => pickLevel(lv)}
              style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 2, borderColor: ACCENT, backgroundColor: on ? ACCENT : CREAM } as object}
            >
              <Text className="font-strong" style={{ color: on ? '#FFFFFF' : INK }}>
                {lv} · {levelCount(lv)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 12 }}>
        <TextInput
          value={query}
          onChangeText={(v) => {
            setQuery(v);
            setShown(PAGE);
          }}
          placeholder="Tìm từ hoặc nghĩa…"
          placeholderTextColor="#8A7F72"
          style={{ borderWidth: 2, borderColor: ACCENT, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, fontSize: 15, color: INK, backgroundColor: '#FFFFFF' } as object}
        />
      </View>

      {list === null ? (
        <View style={{ marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {topics.map((x, i) => (
            <Appear key={x.t} index={Math.min(i, 8)} style={{ width: wide ? '32%' : '100%' } as object}>
              <Pressable
                accessibilityRole="button"
                onPress={() => pickTopic(x.t)}
                style={{ backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 2, borderColor: INK, padding: 16, gap: 10, boxShadow: `0 4px 0 ${INK}` } as object}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text className="font-heavy" style={{ fontSize: 17, color: INK, flexShrink: 1 }}>{x.t}</Text>
                  <Icon name="chevron-right" size={18} color={ACCENT} strokeWidth={2.2} />
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: '#EFE6D6', overflow: 'hidden' }}>
                  <View style={{ width: `${x.total ? Math.round((x.done / x.total) * 100) : 0}%`, height: 6, backgroundColor: ACCENT } as object} />
                </View>
                <Text className="font-sans" style={{ fontSize: 13, color: '#6B5E4E' }}>Bài {OXFORD_TOPICS.indexOf(x.t as never) + 1} · {x.done} / {x.total} từ</Text>
              </Pressable>
            </Appear>
          ))}
        </View>
      ) : (
        <View style={{ marginTop: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Pressable accessibilityRole="button" onPress={() => pickTopic(null)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 2, borderColor: INK, backgroundColor: '#FFFFFF' } as object}>
              <Text className="font-strong" style={{ color: INK }}>‹ Tất cả chủ đề</Text>
            </Pressable>
            <Text className="font-strong" style={{ fontSize: 15, color: '#6B5E4E' }}>
              {needle ? `${list.length} kết quả` : `${topic} · ${list.length} từ`}
            </Text>
          </View>

          {topic && !needle ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Pressable accessibilityRole="button" onPress={() => router.push(`/tu-vung-cefr/quiz/${level}-${OXFORD_TOPICS.indexOf(topic as never)}?mode=mcq` as never)} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 2, borderColor: INK, backgroundColor: '#F2B84B' } as object}>
                <Text className="font-strong" style={{ color: INK }}>Trắc nghiệm ABCD · 50 câu ›</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push(`/tu-vung-cefr/quiz/${level}-${OXFORD_TOPICS.indexOf(topic as never)}?mode=fill` as never)} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 2, borderColor: INK, backgroundColor: '#FFFFFF' } as object}>
                <Text className="font-strong" style={{ color: INK }}>Điền từ vào ô trống ›</Text>
              </Pressable>
            </View>
          ) : null}
          {list.length === 0 ? <Text className="font-sans" style={{ fontSize: 15, color: '#6B5E4E' }}>Chưa có từ nào khớp.</Text> : null}

          {list.slice(0, shown).map((w) => {
            const done = isLearnedWord(learned, w.word);
            return (
              <View
                key={`${w.level}-${w.word}`}
                style={{ backgroundColor: done ? '#F4F9EE' : '#FFFFFF', borderRadius: 16, borderWidth: 2, borderColor: done ? GREEN : '#E7D2A8', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text className="font-heavy" style={{ fontSize: 18, color: INK }}>{w.word}</Text>
                    <Text className="font-strong" style={{ fontSize: 12, color: ACCENT }}>{w.pos} · {w.level}</Text>
                  </View>
                  <Text className="font-strong" style={{ fontSize: 15, color: '#4B4036' }}>{w.meaningVi}</Text>
                  <Text className="font-sans" style={{ fontSize: 14, lineHeight: 20, color: '#6B5E4E' }}>{w.example}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={done ? `Bỏ đánh dấu ${w.word}` : `Đánh dấu đã thuộc ${w.word}`}
                  onPress={() => toggle(w.word)}
                  style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 2, borderColor: done ? GREEN : ACCENT, backgroundColor: done ? '#DCFCE7' : CREAM } as object}
                >
                  <Text className="font-strong" style={{ fontSize: 13, color: done ? GREEN : ACCENT }}>{done ? '✓ Đã thuộc' : 'Đánh dấu'}</Text>
                </Pressable>
              </View>
            );
          })}

          {list.length > shown ? (
            <Pressable accessibilityRole="button" onPress={() => setShown((n) => n + PAGE)} style={{ alignSelf: 'center', marginTop: 4, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, borderWidth: 2, borderColor: ACCENT, backgroundColor: '#FFFFFF' } as object}>
              <Text className="font-strong" style={{ color: ACCENT }}>Xem thêm ({list.length - shown} từ) ›</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
