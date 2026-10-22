import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Icon } from '@/components/ui';
import { IELTS_DRILL_QUESTIONS } from '@/data/ielts-drill-bank';
import { IELTS_QUESTION_TYPES, type IeltsQuestionTypeMeta, type IeltsSkill } from '@/data/ielts-question-types';
import { useL } from '@/i18n/useL';

/** Mỗi kỹ năng một màu, lấy từ bảng màu chung của web. */
const SKILL_TONE: Record<IeltsSkill, { label: string; bg: string; fg: string }> = {
  reading: { label: 'Reading', bg: '#F1ECFF', fg: '#6A4BD9' },
  listening: { label: 'Listening', bg: '#EAF2FF', fg: '#2F6FD6' },
  writing: { label: 'Writing', bg: '#FFF1EE', fg: '#D9503E' },
  speaking: { label: 'Speaking', bg: '#FDEFF5', fg: '#C2437A' },
};

const SKILLS: IeltsSkill[] = ['reading', 'listening', 'writing', 'speaking'];

export default function IeltsSkillsIndexScreen() {
  const { L } = useL();
  const [selectedSkill, setSelectedSkill] = useState<'all' | IeltsSkill>('all');
  const [query, setQuery] = useState('');

  const questionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of IELTS_DRILL_QUESTIONS) map[q.typeId] = (map[q.typeId] || 0) + 1;
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

  return (
    <Screen>
      <Appear index={0}>
        <LightHero
          badge="IELTS"
          art="home"
          line1={L('Luyện theo dạng bài', 'Practise by question type')}
          line2={L(`${IELTS_QUESTION_TYPES.length} dạng · ${IELTS_DRILL_QUESTIONS.length} câu`, `${IELTS_QUESTION_TYPES.length} types · ${IELTS_DRILL_QUESTIONS.length} questions`)}
        />
      </Appear>

      <Appear index={1}>
        <View className="mb-4 mt-6 flex-row flex-wrap gap-2">
          {filters.map((f) => {
            const active = selectedSkill === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setSelectedSkill(f.id)}
                className="rounded-pill px-4 py-2"
                style={{ backgroundColor: active ? '#6A4BD9' : '#FFFFFF', borderWidth: 1, borderColor: active ? '#6A4BD9' : '#E6E1F3' }}
              >
                <Text className="font-strong text-label" style={{ color: active ? '#FFFFFF' : '#2B2350' }}>
                  {f.label} · {typeCounts[f.id]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mb-6 flex-row items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
          <Icon name="search" size={18} color="#7A72A0" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={L('Tìm dạng bài', 'Search')}
            placeholderTextColor="#A59CC4"
            className="flex-1 font-sans text-body text-ink outline-none"
          />
        </View>
      </Appear>

      <Grid columns={2} tabletColumns={2} mobileColumns={1} gap={12}>
        {filtered.map((item: IeltsQuestionTypeMeta, index: number) => {
          const tone = SKILL_TONE[item.skill];
          const count = questionCounts[item.id] || 0;
          return (
            <Appear key={item.id} index={index + 2}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/ielts/skills/${item.id}` as never)}
                className="gap-2 rounded-2xl border border-border bg-surface p-5"
              >
                <View className="flex-row items-center justify-between">
                  <View className="rounded-pill px-2.5 py-0.5" style={{ backgroundColor: tone.bg }}>
                    <Text className="font-strong text-[11px]" style={{ color: tone.fg }}>
                      {tone.label}
                    </Text>
                  </View>
                  <Text className="font-sans text-label text-muted">
                    {count} {L('câu', 'questions')}
                  </Text>
                </View>

                <Text className="font-heavy text-cardTitle text-ink">{item.titleVi}</Text>
                <Text className="font-sans text-label text-muted" numberOfLines={2}>
                  {item.descriptionVi}
                </Text>

                <View className="mt-1 flex-row items-center gap-1">
                  <Text className="font-strong text-label" style={{ color: '#6A4BD9' }}>
                    {L('Luyện', 'Practise')}
                  </Text>
                  <Icon name="arrow-right" size={14} color="#6A4BD9" strokeWidth={2.2} />
                </View>
              </Pressable>
            </Appear>
          );
        })}
      </Grid>
    </Screen>
  );
}
