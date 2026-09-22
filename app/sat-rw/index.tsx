import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { BankHeader, DomainSection, SkillCard } from '@/components/practice/SkillBank';
import { CrossFade } from '@/components/motion/Motion';
import {
  SAT_RW_STAGES,
  type SatRwCurriculumUnit,
} from '@/services/sat-rw/curriculum';
import {
  QUESTIONS_PER_SET,
  SAT_RW_MIXED_SETS,
  mixedSetStats,
} from '@/services/sat-rw/mixed-sets';
import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, Icon, IconCircle } from '@/components/ui';
import { SAT_RW_DOMAINS, SAT_RW_QUESTIONS } from '@/data/sat-rw-repository';
import { MATH_BANK_TOTAL, mathBankDone } from '@/services/math/bank';
import { summarizeRwBySkill } from '@/services/sat-rw/progress';
import { useMathSkillStats } from '@/store/useMathStore';
import { useSatRwStore } from '@/store/useSatRwStore';
import { color } from '@/theme/tokens';

/**
 * Tên College Board (to) và tên tiếng Việt (dòng phụ) của 12 kỹ năng trong kho.
 * Tên tiếng Anh là tên người học gặp trong mọi tài liệu SAT; tên tiếng Việt để
 * nhìn là hiểu kỹ năng đó hỏi gì.
 */
const SKILL_NAME: Record<string, { en: string; vi: string }> = {
  boundaries: { en: 'Boundaries', vi: 'Ranh giới câu, dấu câu' },
  form: { en: 'Form, Structure & Sense', vi: 'Dạng từ và hoà hợp' },
  pronoun: { en: 'Pronouns', vi: 'Đại từ' },
  tense: { en: 'Verb Tense', vi: 'Thì động từ' },
  possessive: { en: 'Possessives', vi: 'Sở hữu cách' },
  transition: { en: 'Transitions', vi: 'Từ nối' },
  words: { en: 'Words in Context', vi: 'Nghĩa từ trong ngữ cảnh' },
  structure: { en: 'Text Structure & Purpose', vi: 'Cấu trúc và mục đích' },
  crosstext: { en: 'Cross-Text Connections', vi: 'Liên hệ hai văn bản' },
  central: { en: 'Central Ideas & Details', vi: 'Ý chính và chi tiết' },
  evidence: { en: 'Command of Evidence', vi: 'Dùng bằng chứng' },
  inference: { en: 'Inferences', vi: 'Suy luận' },
};

/** Kỹ năng → mảng đề, suy từ chính kho câu hỏi. */
const SKILL_DOMAIN: Record<string, string> = Object.fromEntries(SAT_RW_QUESTIONS.map((q) => [q.skill, q.domain]));
const SKILLS_IN_ORDER = Object.keys(SKILL_NAME).filter((k) => SKILL_DOMAIN[k]);

type Tab = 'skills' | 'mix' | 'units';

/**
 * Hub SAT Reading & Writing — cùng bố cục với trang SAT Math.
 *
 * Mặc định là tab KỸ NĂNG: bốn mảng của đề thật, mỗi kỹ năng một thẻ kèm độ
 * chính xác và số câu đã làm. Đề trộn và lộ trình theo unit vẫn còn nguyên, ở
 * hai tab bên cạnh.
 *
 * Tỷ trọng ghi trên mỗi mảng là tỷ trọng CỦA ĐỀ THẬT, không phải tỷ lệ câu
 * trong kho này — hai con số khác nhau và nói hai chuyện khác nhau.
 */
export default function SatRwHubScreen() {
  const [tab, setTab] = useState<Tab>('skills');
  const attempts = useSatRwStore((s) => s.attempts);
  const progress = useMemo(() => summarizeRwBySkill(SAT_RW_QUESTIONS, attempts), [attempts]);
  const mathStats = useMathSkillStats();
  const mixStats = useMemo(() => mixedSetStats(), []);

  return (
    <Screen>
      <View className="mb-5 flex-row flex-wrap justify-end gap-2">
        <Button
          label="Làm đề trộn"
          variant="brand"
          iconRight="arrow-right"
          onPress={() => router.push(`/sat-rw/mix/${SAT_RW_MIXED_SETS[0]!.id}` as never)}
        />
        <Button label="Bắt đầu unit 1" variant="outline" onPress={() => router.push('/sat-rw/1' as never)} />
      </View>

      <BankHeader
        current={{
          eyebrow: 'Verbal',
          title: 'Ngân hàng SAT Verbal',
          blurb: 'Reading & Writing của đề Digital SAT. Mỗi câu có lời giải tiếng Việt nói rõ vì sao ba phương án kia sai.',
          done: Object.keys(attempts).length,
          total: SAT_RW_QUESTIONS.length,
          icon: 'letters',
        }}
        other={{
          eyebrow: 'Math',
          title: 'Ngân hàng SAT Math',
          blurb: '19 kỹ năng, đề sinh mới mỗi lượt.',
          done: mathBankDone(mathStats),
          total: MATH_BANK_TOTAL,
          icon: 'grid',
          href: '/math',
        }}
      />

      <View className="mt-6 flex-row flex-wrap gap-2">
        <TabPill label="Kỹ năng" active={tab === 'skills'} onPress={() => setTab('skills')} />
        <TabPill label={`Đề trộn · ${mixStats.sets}`} active={tab === 'mix'} onPress={() => setTab('mix')} />
        <TabPill label="Học theo unit" active={tab === 'units'} onPress={() => setTab('units')} />
      </View>

      <CrossFade swapKey={tab}>
        {tab === 'skills' ? (
          <View>
            {SAT_RW_DOMAINS.map((d) => {
              const skills = SKILLS_IN_ORDER.filter((k) => SKILL_DOMAIN[k] === d.key);
              const done = skills.reduce((sum, k) => sum + (progress[k]?.answered ?? 0), 0);
              const total = skills.reduce((sum, k) => sum + (progress[k]?.bank ?? 0), 0);
              return (
                <DomainSection key={d.key} title={d.key} subtitle={`${d.percent} đề SAT Verbal · ${d.labelVi}`} done={done} total={total}>
                  {skills.map((k) => {
                    const p = progress[k]!;
                    return (
                      <SkillCard
                        key={k}
                        title={SKILL_NAME[k]!.en}
                        subtitle={SKILL_NAME[k]!.vi}
                        bank={p.bank}
                        answered={p.answered}
                        correct={p.correct}
                        wrong={p.wrong}
                        accuracy={p.accuracy}
                        totalMs={p.totalMs}
                        href={`/sat-rw/skill/${k}`}
                        icon="letters"
                      />
                    );
                  })}
                </DomainSection>
              );
            })}
          </View>
        ) : null}

        {tab === 'mix' ? (
          <View className="mt-6">
            {/*
              Unit là chỗ học từng luật một. Nhưng làm hết một unit thì tới câu
              thứ năm là đoán được đáp án mà không cần đọc — vì đã biết trước câu
              này hỏi luật gì. Đề trộn mới giống lúc thi.
            */}
            <Text className="max-w-[640px] font-sans text-body text-muted">
              Mỗi đề {QUESTIONS_PER_SET} câu lấy từ cả bốn mảng, xếp xen kẽ — bạn phải tự nhận ra câu đang hỏi luật gì, giống lúc thi thật.
            </Text>
            <View className="mt-4">
              <Grid columns={6} tabletColumns={4} mobileColumns={3} gap={12}>
                {SAT_RW_MIXED_SETS.map((set) => (
                  <Pressable
                    key={set.id}
                    accessibilityRole="link"
                    onPress={() => router.push(`/sat-rw/mix/${set.id}` as never)}
                    className="items-center rounded-card border border-border bg-surface px-2 py-4"
                  >
                    <Text className="font-heavy text-sectionTitle text-ink">{set.order}</Text>
                    <Text className="mt-0.5 font-semi text-label text-muted">{set.questions.length} câu</Text>
                  </Pressable>
                ))}
              </Grid>
            </View>
          </View>
        ) : null}

        {tab === 'units' ? (
          <View>
            {SAT_RW_STAGES.map((stage, stageIndex) => (
              <View key={stage.id} className="mt-8">
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text className="font-heavy text-sectionTitle text-ink">{stage.title}</Text>
                  <Badge label={`${stage.units.length} bài`} tone="primary" />
                </View>
                <Text className="mt-1 max-w-[760px] font-sans text-body text-muted">{stage.blurb}</Text>
                <View className="mt-3 gap-3">
                  {stage.units.map((unit) => (
                    <CurriculumUnitCard key={unit.number} unit={unit} stageIndex={stageIndex} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </CrossFade>
    </Screen>
  );
}

function TabPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={['rounded-pill border px-5 py-2.5', active ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface'].join(' ')}
    >
      <Text className={active ? 'font-strong text-body text-white' : 'font-semi text-body text-muted'}>{label}</Text>
    </Pressable>
  );
}

/**
 * Một bài học trong lộ trình: bẫy trung tâm ở trên, ba bốn bộ đề ở dưới.
 *
 * BẪY ĐỨNG TRƯỚC CÁC BỘ ĐỀ, không đứng sau. Nó là thứ quyết định người học canh
 * cái gì khi làm câu đầu tiên; để nó xuống dưới nút bấm thì không ai đọc.
 */
function CurriculumUnitCard({
  unit,
  stageIndex,
}: {
  unit: SatRwCurriculumUnit;
  stageIndex: number;
}) {
  const tone = STAGE_TONES[stageIndex % STAGE_TONES.length]!;

  return (
    <Card>
      <View className="flex-row items-start gap-3">
        <IconCircle name="book" tone={tone} size={40} />
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-strong text-cardTitle text-ink">
              Bài {unit.number} · {unit.title}
            </Text>
            <Badge label={`${unit.questionCount} câu`} tone="neutral" shape="tag" />
          </View>
          <Text className="mt-1.5 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
            {unit.trap}
          </Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {unit.sets.map((set) => (
              <Pressable
                key={set.id}
                accessibilityRole="button"
                accessibilityLabel={`${set.title} — ${set.count} câu`}
                onPress={() => router.push(`/sat-rw/set/${set.id}` as never)}
                className={`rounded-panel border px-3 py-2 ${
                  set.kind === 'checkpoint'
                    ? 'border-success bg-success-soft'
                    : set.kind === 'generated'
                      ? 'border-accent-200 bg-accent-50'
                      : 'border-border bg-surfaceAlt'
                }`}
                style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
              >
                <Text className="font-strong text-label text-ink">{set.title}</Text>
                <Text className="mt-0.5 font-sans text-label text-muted">
                  {set.count} câu · {set.minutes} phút
                  {set.instantSolution ? '' : ' · không lời giải'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/sat-rw/${unit.number}` as never)}
            className="mt-3 flex-row items-center gap-1.5 self-start"
          >
            <Text className="font-strong text-label text-primary-700">
              Hoặc làm trọn {unit.questionCount} câu một lượt
            </Text>
            <Icon name="chevron-right" size={14} color={color.primary} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

/** Mỗi chặng một tông icon — cuộn dọc trang thì màu báo đã sang chặng khác. */
const STAGE_TONES = ['primary', 'info', 'accent', 'warning'] as const;

