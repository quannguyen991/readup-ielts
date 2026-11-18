import React, { useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { NeonWindow } from '@/components/neon/Neon';
import { Icon } from '@/components/ui';
import { IELTS_DRILL_QUESTIONS } from '@/data/ielts-drill-bank';
import { getDrillSets } from '@/data/drill-sets';
import { IELTS_QUESTION_TYPES, type IeltsQuestionTypeMeta, type IeltsSkill } from '@/data/ielts-question-types';
import { typeAccuracy, useDrillSetStore } from '@/store/useDrillSetStore';
import { useL } from '@/i18n/useL';

/** Mỗi kỹ năng một màu, lấy từ bảng màu chung của web. */
const SKILL_TONE: Record<IeltsSkill, { label: string; bg: string; fg: string }> = {
  reading: { label: 'Reading', bg: '#F1ECFF', fg: '#6A4BD9' },
  listening: { label: 'Listening', bg: '#EAF2FF', fg: '#2F6FD6' },
  writing: { label: 'Writing', bg: '#FFF1EE', fg: '#D9503E' },
  speaking: { label: 'Speaking', bg: '#FDEFF5', fg: '#C2437A' },
};

const SKILLS: IeltsSkill[] = ['reading', 'listening', 'writing', 'speaking'];

/** Bảng màu của trang Lộ trình học / Hôm nay (xem PathUi). */
const NAVY = '#2B2350';
const MUTED = '#6B6590';
const LINE = '#E6E1F3';
const WASH = '#F3F0FB';
const PURPLE = '#6A4BD9';

type Hover = { hovered?: boolean };

export default function IeltsSkillsIndexScreen() {
  const { L } = useL();
  const [selectedSkill, setSelectedSkill] = useState<'all' | IeltsSkill>('all');
  const [query, setQuery] = useState('');
  const typeStats = useDrillSetStore((s) => s.typeStats);
  const lastAttempts = useDrillSetStore((s) => s.attempts);

  const questionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of IELTS_DRILL_QUESTIONS) map[q.typeId] = (map[q.typeId] || 0) + 1;
    for (const t of IELTS_QUESTION_TYPES) {
      const inSets = getDrillSets(t.id).reduce((n, st) => n + st.questions.length, 0);
      if (inSets > 0) map[t.id] = inSets;
    }
    return map;
  }, []);

  const typeCounts = useMemo(() => {
    const map: Record<string, number> = { all: IELTS_QUESTION_TYPES.length };
    for (const s of SKILLS) map[s] = IELTS_QUESTION_TYPES.filter((t) => t.skill === s).length;
    return map;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return IELTS_QUESTION_TYPES.filter((item) => {
      if (selectedSkill !== 'all' && item.skill !== selectedSkill) return false;
      if (!q) return true;
      return item.titleVi.toLowerCase().includes(q) || item.titleEn.toLowerCase().includes(q);
    });
  }, [selectedSkill, query]);

  const filters: { id: 'all' | IeltsSkill; label: string }[] = [
    { id: 'all', label: L('Tất cả', 'All') },
    ...SKILLS.map((s) => ({ id: s, label: SKILL_TONE[s].label })),
  ];
  const totalQ = Object.values(questionCounts).reduce((n, v) => n + v, 0);
  const lift = (hovered: boolean | undefined, color: string, strong: boolean) =>
    (Platform.OS === 'web'
      ? ({ transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease', transform: [{ translateY: hovered ? -3 : 0 }], boxShadow: hovered ? `0 12px 24px ${color}33` : strong ? `0 4px 10px ${color}1F` : 'none' } as object)
      : null);

  return (
    <Screen>
      <View style={{ gap: 18, paddingBottom: 40 }}>
        <Appear index={0}>
          <NeonWindow title={L('Luyện theo dạng bài', 'Practise by question type')} icon="rocket" padded={false}>
            <View style={{ padding: 22, gap: 14 }}>
              <Text className="font-heavy" style={{ fontSize: 26, lineHeight: 32, color: NAVY }}>
                {L('Mỗi dạng một bài luyện riêng, chấm ra band.', 'A drill for every question type, marked to a band.')}
              </Text>
              <Text className="font-sans" style={{ fontSize: 15, lineHeight: 22, color: MUTED }}>
                {L(
                  'Làm trong phòng thi IELTS trên máy; nộp xong có giải thích 3 bước từng câu, phổ điểm và độ chính xác của từng dạng.',
                  'Take it in the on-screen IELTS room; after submitting you get a 3-step explanation per question, a score spectrum and accuracy per type.',
                )}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[`${IELTS_QUESTION_TYPES.length} ${L('dạng', 'types')}`, `${totalQ.toLocaleString('vi-VN')} ${L('câu', 'questions')}`, L('Giải thích 3 bước', '3-step explanations')].map((c) => (
                  <View key={c} style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: WASH, borderWidth: 1, borderColor: LINE }}>
                    <Text className="font-strong" style={{ fontSize: 13, color: PURPLE }}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          </NeonWindow>
        </Appear>

        {selectedSkill === 'all' || selectedSkill === 'reading' || selectedSkill === 'listening' ? (
          <Appear index={1}>
            <NeonWindow title={L('Bài thi thử 40 câu', '40-question mock tests')} icon="trophy" padded={false}>
              <View style={{ padding: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                {(['reading', 'listening'] as const)
                  .filter((sk) => selectedSkill === 'all' || selectedSkill === sk)
                  .map((sk) => {
                    const last = lastAttempts.find((a) => a.skill === sk && a.total >= 40);
                    const tone = SKILL_TONE[sk];
                    return (
                      <Pressable
                        key={sk}
                        accessibilityRole="button"
                        onPress={() => router.push(`/ielts/tong-hop?skill=${sk}` as never)}
                        style={({ hovered }) => ({ flex: 1, minWidth: 260, gap: 6, borderRadius: 18, padding: 18, backgroundColor: tone.bg, borderWidth: 2, borderColor: tone.fg, ...lift(hovered, tone.fg, true) }) as never}
                      >
                        <Text className="font-strong" style={{ fontSize: 13, letterSpacing: 0.8, color: tone.fg }}>{tone.label.toUpperCase()}</Text>
                        <Text className="font-heavy" style={{ fontSize: 20, lineHeight: 26, color: NAVY }}>{L('Tổng hợp 40 câu, chấm ra band', '40 questions, marked to a band')}</Text>
                        <Text className="font-sans" style={{ fontSize: 14, lineHeight: 20, color: MUTED }}>{L('Bốn phần, mỗi phần một dạng. Thi như thật, nộp mới biết đúng sai.', 'Four parts, one type each. Marked only on submit.')}</Text>
                        {last ? <Text className="font-strong" style={{ fontSize: 14, color: tone.fg }}>{L('Lần gần nhất', 'Last')}: {last.correct}/{last.total} · Band {last.band.toFixed(1)}</Text> : null}
                      </Pressable>
                    );
                  })}
              </View>
            </NeonWindow>
          </Appear>
        ) : null}

        <Appear index={2}>
          <NeonWindow title={L('Các dạng câu hỏi', 'Question types')} icon="book" padded={false}>
            <View style={{ padding: 18, gap: 16 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {filters.map((f) => {
                  const active = selectedSkill === f.id;
                  return (
                    <Pressable key={f.id} onPress={() => setSelectedSkill(f.id)} style={{ borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: active ? PURPLE : '#FFFFFF', borderWidth: 1.5, borderColor: active ? PURPLE : LINE }}>
                      <Text className="font-strong" style={{ fontSize: 14, color: active ? '#FFFFFF' : NAVY }}>{f.label} · {typeCounts[f.id]}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1.5, borderColor: LINE, backgroundColor: WASH, paddingHorizontal: 14, paddingVertical: 10 }}>
                <Icon name="search" size={18} color="#7A72A0" />
                <TextInput value={query} onChangeText={setQuery} placeholder={L('Tìm dạng bài', 'Search')} placeholderTextColor="#A59CC4" className="flex-1 font-sans text-body text-ink outline-none" />
              </View>
              <Grid columns={2} tabletColumns={2} mobileColumns={1} gap={12}>
                {filtered.map((item: IeltsQuestionTypeMeta) => {
                  const tone = SKILL_TONE[item.skill];
                  const count = questionCounts[item.id] || 0;
                  const acc = typeAccuracy(typeStats, item.id);
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() => router.push(`/ielts/skills/${item.id}` as never)}
                      style={({ hovered }) => ({ gap: 8, borderRadius: 18, padding: 18, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: hovered ? tone.fg : LINE, ...lift(hovered, tone.fg, false) }) as never}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: tone.bg }}>
                          <Text className="font-strong" style={{ fontSize: 13, color: tone.fg }}>{tone.label}</Text>
                        </View>
                        <Text className="font-semi" style={{ fontSize: 13, color: MUTED }}>
                          {count} {L('câu', 'questions')}
                          {acc !== null ? ` · ${L('chính xác', 'accuracy')} ${acc}%` : ''}
                        </Text>
                      </View>
                      <Text className="font-heavy" style={{ fontSize: 18, lineHeight: 24, color: NAVY }}>{item.titleVi}</Text>
                      <Text className="font-sans" numberOfLines={2} style={{ fontSize: 14, lineHeight: 20, color: MUTED }}>{item.descriptionVi}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Text className="font-strong" style={{ fontSize: 14, color: PURPLE }}>{L('Luyện', 'Practise')}</Text>
                        <Icon name="arrow-right" size={14} color={PURPLE} strokeWidth={2.2} />
                      </View>
                    </Pressable>
                  );
                })}
              </Grid>
            </View>
          </NeonWindow>
        </Appear>
      </View>
    </Screen>
  );
}
