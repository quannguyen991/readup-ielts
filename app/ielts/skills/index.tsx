import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Icon } from '@/components/ui';
import { IELTS_DRILL_QUESTIONS } from '@/data/ielts-drill-bank';
import { IELTS_QUESTION_TYPES, type IeltsQuestionTypeMeta, type IeltsSkill } from '@/data/ielts-question-types';
import { useL } from '@/i18n/useL';

const SKILL_THEME: Record<IeltsSkill, { labelVi: string; labelEn: string; bg: string; text: string; border: string }> = {
  reading: { labelVi: 'Reading', labelEn: 'Reading', bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  listening: { labelVi: 'Listening', labelEn: 'Listening', bg: '#ECFEFF', text: '#0891B2', border: '#A5F3FC' },
  writing: { labelVi: 'Writing', labelEn: 'Writing', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  speaking: { labelVi: 'Speaking', labelEn: 'Speaking', bg: '#FAF5FF', text: '#7C3AED', border: '#E9D5FF' },
};

const DIFFICULTY_COLOR: Record<string, { bg: string; text: string }> = {
  'Dễ': { bg: '#F0FDF4', text: '#16A34A' },
  'Trung bình': { bg: '#FEFCE8', text: '#CA8A04' },
  'Khó': { bg: '#FFF7ED', text: '#EA580C' },
  'Rất khó': { bg: '#FEF2F2', text: '#DC2626' },
};

export default function IeltsSkillsIndexScreen() {
  const { L } = useL();
  const [selectedSkill, setSelectedSkill] = useState<'all' | IeltsSkill>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const questionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of IELTS_DRILL_QUESTIONS) {
      map[q.typeId] = (map[q.typeId] || 0) + 1;
    }
    return map;
  }, []);

  const filteredTypes = useMemo(() => {
    return IELTS_QUESTION_TYPES.filter((item) => {
      if (selectedSkill !== 'all' && item.skill !== selectedSkill) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.titleVi.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q) ||
        item.descriptionVi.toLowerCase().includes(q)
      );
    });
  }, [selectedSkill, searchQuery]);

  return (
    <Screen cat="write">
      <Appear index={0}>
        <LightHero
          badge="CHUYÊN SÂU DẠNG BÀI"
          art="home"
          line1={L('Luyện Dạng Bài & Kỹ Năng IELTS', 'IELTS Question Type Mastery')}
          line2={L('Yếu dạng nào · Cày sâu dạng đó', 'Target Weaknesses · Master Strategies')}
          subtitle={L(
            'Học trọn bộ chiến thuật, nhận diện bẫy giám khảo và cày 135+ câu hỏi kèm trích dẫn chứng cứ trực tiếp.',
            'Learn strategies, identify traps, and drill 135+ questions with direct evidence quotes and explanations.',
          )}
        />
      </Appear>

      {/* Bộ lọc kỹ năng */}
      <Appear index={1}>
        <View className="mb-4 mt-6 flex-row flex-wrap gap-2">
          {(
            [
              { id: 'all', label: L('Tất cả (13 dạng)', 'All (13 types)') },
              { id: 'reading', label: L('Reading (5 dạng)', 'Reading (5 types)') },
              { id: 'listening', label: L('Listening (3 dạng)', 'Listening (3 types)') },
              { id: 'writing', label: L('Writing (3 dạng)', 'Writing (3 types)') },
              { id: 'speaking', label: L('Speaking (2 dạng)', 'Speaking (2 types)') },
            ] as const
          ).map((filter) => {
            const active = selectedSkill === filter.id;
            return (
              <Pressable
                key={filter.id}
                onPress={() => setSelectedSkill(filter.id)}
                className={`rounded-full px-4 py-2 border ${
                  active ? 'bg-primary border-primary' : 'bg-surface border-border hover:bg-canvas'
                }`}
              >
                <Text className={`font-mid text-label ${active ? 'text-white' : 'text-ink'}`}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Ô tìm kiếm */}
        <View className="mb-6 flex-row items-center rounded-2xl border border-border bg-surface px-4 py-2.5">
          <Icon name="search" size={18} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={L('Tìm dạng bài (ví dụ: True/False, Map, Heading, Task 1, Part 2...)', 'Search question type...')}
            placeholderTextColor="#94A3B8"
            className="ml-3 flex-1 font-sans text-body text-ink outline-none"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Icon name="close" size={18} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>
      </Appear>

      {/* Danh sách thẻ dạng bài */}
      <View className="gap-4">
        {filteredTypes.map((typeMeta: IeltsQuestionTypeMeta, index: number) => {
          const theme = SKILL_THEME[typeMeta.skill];
          const diff = DIFFICULTY_COLOR[typeMeta.difficultyLevel] || { bg: '#F3F4F6', text: '#4B5563' };
          const count = questionCounts[typeMeta.id] || 0;

          return (
            <Appear key={typeMeta.id} index={index + 2}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/ielts/skills/${typeMeta.id}` as never)}
                className="rounded-2xl border border-border bg-surface p-5 transition-transform active:scale-[0.99] hover:border-primary/50"
                style={{
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                }}
              >
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="rounded-lg px-2.5 py-1 border"
                      style={{ backgroundColor: theme.bg, borderColor: theme.border }}
                    >
                      <Text className="font-strong text-label" style={{ color: theme.text }}>
                        {theme.labelVi.toUpperCase()}
                      </Text>
                    </View>
                    <View
                      className="rounded-lg px-2.5 py-1"
                      style={{ backgroundColor: diff.bg }}
                    >
                      <Text className="font-strong text-label" style={{ color: diff.text }}>
                        {typeMeta.difficultyLevel}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-1.5 rounded-full bg-canvas px-3 py-1 border border-border">
                    <Icon name="target" size={14} color="#8F6E36" />
                    <Text className="font-mid text-label text-muted">
                      {count} {L('câu thực chiến', 'drill questions')}
                    </Text>
                  </View>
                </View>

                {/* Tiêu đề */}
                <Text className="mt-3 font-heavy text-cardTitle text-ink">
                  {typeMeta.titleVi}
                </Text>
                <Text className="font-sans text-label text-muted">
                  {typeMeta.titleEn}
                </Text>

                {/* Tóm tắt */}
                <Text className="mt-2.5 font-sans text-body text-body leading-relaxed">
                  {typeMeta.descriptionVi}
                </Text>

                {/* Bẫy và mẹo tóm tắt */}
                {typeMeta.traps.length > 0 && (
                  <View className="mt-3 rounded-xl bg-amber-500/10 p-3 border border-amber-500/20">
                    <Text className="font-strong text-label text-amber-800">
                      ⚠️ {L('Bẫy giám khảo hay gài:', 'Common trap:')}
                    </Text>
                    <Text className="mt-0.5 font-sans text-label text-amber-900 leading-relaxed">
                      {typeMeta.traps[0]}
                    </Text>
                  </View>
                )}

                {/* Nút vào luyện */}
                <View className="mt-4 flex-row items-center justify-between border-t border-border pt-3">
                  <Text className="font-mid text-label text-primary">
                    Tần suất: {typeMeta.frequency}
                  </Text>
                  <View className="flex-row items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2">
                    <Text className="font-strong text-label text-white">
                      {L('Học & Luyện tập', 'Learn & Practice')}
                    </Text>
                    <Icon name="arrow-right" size={14} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                </View>
              </Pressable>
            </Appear>
          );
        })}
      </View>
    </Screen>
  );
}
