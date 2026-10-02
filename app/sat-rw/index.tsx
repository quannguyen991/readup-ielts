import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScorePredictionCard } from '@/components/prediction/ScorePrediction';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { DifficultyFilter, DomainSection, Segmented, SkillCard, type DifficultyFilterValue } from '@/components/practice/SkillBank';
import { HubLinkRow, HubTitle, HubToolbar } from '@/components/sat-hub/SatHub';
import { DifficultyTag } from '@/components/ui/DifficultyTag';
import { RW_HUB_LINKS } from '@/navigation/sat-hub';
import { rwSetForTier } from '@/services/sat-rw/skill-sets';
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
import { Badge, Card, Icon, IconCircle } from '@/components/ui';
import { SAT_RW_DOMAINS, SAT_RW_QUESTIONS } from '@/data/sat-rw-repository';
import { summarizeRwBySkill } from '@/services/sat-rw/progress';
import { useSatRwStore } from '@/store/useSatRwStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

/**
 * Tên College Board (to) và tên tiếng Việt (dòng phụ) của 12 kỹ năng trong kho.
 * Tên tiếng Anh là tên người học gặp trong mọi tài liệu SAT; tên tiếng Việt để
 * nhìn là hiểu kỹ năng đó hỏi gì.
 */
const SKILL_NAME: Record<string, { en: string; vi: string; descEn: string }> = {
  boundaries: { en: 'Boundaries', vi: 'Ranh giới câu, dấu câu', descEn: 'Sentence boundaries & punctuation' },
  form: { en: 'Form, Structure & Sense', vi: 'Dạng từ và hoà hợp', descEn: 'Word forms & agreement' },
  pronoun: { en: 'Pronouns', vi: 'Đại từ', descEn: 'Pronoun agreement & reference' },
  tense: { en: 'Verb Tense', vi: 'Thì động từ', descEn: 'Verb tenses & forms' },
  possessive: { en: 'Possessives', vi: 'Sở hữu cách', descEn: 'Possessives & plurals' },
  transition: { en: 'Transitions', vi: 'Từ nối', descEn: 'Linking words' },
  words: { en: 'Words in Context', vi: 'Nghĩa từ trong ngữ cảnh', descEn: 'Word meaning in context' },
  structure: { en: 'Text Structure & Purpose', vi: 'Cấu trúc và mục đích', descEn: 'Structure & purpose' },
  crosstext: { en: 'Cross-Text Connections', vi: 'Liên hệ hai văn bản', descEn: 'Linking two texts' },
  central: { en: 'Central Ideas & Details', vi: 'Ý chính và chi tiết', descEn: 'Main ideas & details' },
  evidence: { en: 'Command of Evidence', vi: 'Bằng chứng văn bản và số liệu', descEn: 'Textual & quantitative evidence' },
  inference: { en: 'Inferences', vi: 'Suy luận', descEn: 'Drawing inferences' },
};

/**
 * Rhetorical Synthesis không nằm trong kho câu soạn tay mà có bộ SINH MỚI riêng (bài 16).
 * Thẻ trỏ thẳng vào bộ ấy để mảng Expression of Ideas đủ hai kỹ năng như đề thật.
 */
const SYNTHESIS_SET = SAT_RW_STAGES.flatMap((st) => st.units)
  .find((u) => u.number === 16)
  ?.sets.find((x) => x.kind === 'generated');

/** Kỹ năng → mảng đề, suy từ chính kho câu hỏi. */
const SKILL_DOMAIN: Record<string, string> = Object.fromEntries(SAT_RW_QUESTIONS.map((q) => [q.skill, q.domain]));
const SKILLS_IN_ORDER = Object.keys(SKILL_NAME).filter((k) => SKILL_DOMAIN[k]);

type Tab = 'skills' | 'mix' | 'units' | 'score';

/**
 * Hub SAT Reading & Writing — cùng bố cục với trang SAT Math (01/10/2026): tên
 * trang, một hàng liên kết nhỏ, MỘT thanh công cụ mảnh (chế độ xem + độ khó),
 * rồi vào thẳng ngân hàng câu. Bốn bước đầy đủ nằm ở `/sat`.
 *
 * Mặc định là tab KỸ NĂNG (bố cục "ngân hàng câu"): bốn mảng của đề thật, mỗi
 * kỹ năng một thẻ kèm độ chính xác và số câu đã làm; bộ lọc Dễ / Vừa / Khó
 * quyết định nút Luyện mở bộ nào. Đề trộn và lộ trình theo bài ở tab bên cạnh.
 *
 * Tỷ trọng ghi trên mỗi mảng là tỷ trọng CỦA ĐỀ THẬT, không phải tỷ lệ câu
 * trong kho này — hai con số khác nhau và nói hai chuyện khác nhau.
 */
export default function SatRwHubScreen() {
  const [tab, setTab] = useState<Tab>('skills');
  const { L, en } = useL();
  const attempts = useSatRwStore((s) => s.attempts);
  const progress = useMemo(() => summarizeRwBySkill(SAT_RW_QUESTIONS, attempts), [attempts]);
  const mixStats = useMemo(() => mixedSetStats(), []);
  const [level, setLevel] = useState<DifficultyFilterValue>('all');

  const hrefFor = (skill: string) => {
    if (level === 'all') return `/sat-rw/skill/${skill}`;
    const i = rwSetForTier(skill, level, (id) => !!attempts[id]);
    return i === null ? `/sat-rw/skill/${skill}` : `/sat-rw/skill/${skill}?set=${i}`;
  };

  return (
    <Screen>
      <HubTitle eyebrow="DIGITAL SAT" title="SAT Verbal" line={L('Reading & Writing, mỗi kỹ năng đi Dễ → Khó.', 'Reading & Writing, each skill Easy → Hard.')} />
      <HubLinkRow links={RW_HUB_LINKS} />

      <HubToolbar>
        <Segmented
          label={L('Chế độ', 'View')}
          value={tab}
          onChange={setTab}
          options={[
            { key: 'skills', label: L('Kỹ năng', 'Skills') },
            { key: 'mix', label: L(`Đề trộn · ${mixStats.sets}`, `Mixed · ${mixStats.sets}`) },
            { key: 'units', label: L('Theo bài', 'By unit') },
            { key: 'score', label: L('Dự đoán', 'Estimate') },
          ]}
        />
        {tab === 'skills' ? <DifficultyFilter value={level} onChange={setLevel} /> : null}
      </HubToolbar>

      <CrossFade swapKey={tab}>
        {tab === 'skills' ? (
          <View>
            {SAT_RW_DOMAINS.map((d) => {
              const skills = SKILLS_IN_ORDER.filter((k) => SKILL_DOMAIN[k] === d.key);
              const done = skills.reduce((sum, k) => sum + (progress[k]?.answered ?? 0), 0);
              const total = skills.reduce((sum, k) => sum + (progress[k]?.bank ?? 0), 0);
              const pct = d.percent.replace('~', '');
              return (
                <DomainSection key={d.key} title={en ? d.key : d.labelVi} subtitle={L(`${pct} đề Verbal`, `${pct} of Verbal`)} done={done} total={total}>
                  {skills.map((k) => {
                    const p = progress[k]!;
                    const share = total > 0 ? Math.round((p.bank / total) * 100) : 0;
                    return (
                      <SkillCard
                        key={k}
                        title={SKILL_NAME[k]!.en}
                        subtitle={en ? SKILL_NAME[k]!.descEn : SKILL_NAME[k]!.vi}
                        share={skills.length > 1 ? L(`${share}% ${d.labelVi}`, `${share}% of ${d.key}`) : null}
                        bank={p.bank}
                        answered={p.answered}
                        correct={p.correct}
                        wrong={p.wrong}
                        accuracy={p.accuracy}
                        totalMs={p.totalMs}
                        href={hrefFor(k)}
                      />
                    );
                  })}
                  {d.key === 'Expression of Ideas' ? (
                    <SkillCard
                      key="synthesis"
                      title="Rhetorical Synthesis"
                      subtitle={L('Gộp ghi chú thành câu đúng mục đích', 'Turn notes into a purposeful sentence')}
                      share={null}
                      bank={SYNTHESIS_SET?.count ?? 0}
                      answered={0}
                      correct={0}
                      wrong={0}
                      accuracy={null}
                      totalMs={0}
                      href={SYNTHESIS_SET ? `/sat-rw/set/${SYNTHESIS_SET.id}` : '/sat-rw'}
                    />
                  ) : null}
                </DomainSection>
              );
            })}
          </View>
        ) : null}

        {tab === 'score' ? (
          <View className="mt-4">
            <ScorePredictionCard section="verbal" />
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
              {L(
                `Mỗi đề ${QUESTIONS_PER_SET} câu lấy từ cả bốn mảng, xếp xen kẽ — bạn phải tự nhận ra câu đang hỏi luật gì, giống lúc thi thật.`,
                `Each set has ${QUESTIONS_PER_SET} questions drawn from all four domains, interleaved — you have to spot which rule each one tests, just like the real exam.`,
              )}
            </Text>
            <View className="mt-4">
              <View className="mb-3 flex-row flex-wrap gap-x-4 gap-y-1">
                {SAT_RW_DOMAINS.map((d) => (
                  <View key={d.key} className="flex-row items-center gap-1.5">
                    <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: DOMAIN_TONE[d.key] ?? color.primary }} />
                    <Text className="font-mid text-label text-muted">{en ? d.key : d.labelVi}</Text>
                  </View>
                ))}
              </View>
              <Grid columns={4} tabletColumns={3} mobileColumns={2} gap={12}>
                {SAT_RW_MIXED_SETS.map((set) => (
                  <MixTile key={set.id} set={set} attempts={attempts} />
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
                  <Text className="font-heavy text-sectionTitle text-ink">
                    {en ? `Stage ${stageIndex + 1} · ${stage.domain}` : stage.title}
                  </Text>
                  <Badge label={L(`${stage.units.length} bài`, `${stage.units.length} units`)} tone="primary" />
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

/** Màu từng mảng đề — dùng cho dải "dấu vân" trên thẻ đề trộn. */
const DOMAIN_TONE: Record<string, string> = {
  'Information and Ideas': '#B07A3A',
  'Craft and Structure': '#D6B57C',
  'Expression of Ideas': '#F59E0B',
  'Standard English Conventions': '#F43F5E',
};

/**
 * Thẻ một đề trộn.
 *
 * Bản cũ là ô vuông chỉ có SỐ ĐỀ to + "10 câu" — năm mươi ô giống hệt nhau, dáng
 * ô số của IELTS Dictionary (người dùng bắt bỏ ngày 25/09/2026). Giờ mỗi thẻ mang
 * dải vân vẽ từ chính đề: mỗi vạch là một câu theo đúng thứ tự, màu theo mảng;
 * câu đã làm thì đặc, câu sai có chấm đỏ. Nhìn là biết đề nào nặng ngữ pháp, đề
 * nào làm dở.
 */
function MixTile({
  set,
  attempts,
}: {
  set: (typeof SAT_RW_MIXED_SETS)[number];
  attempts: Record<string, { correct: boolean }>;
}) {
  const [hover, setHover] = useState(false);
  const { L, en } = useL();
  const title = en ? `Mixed set ${set.order}` : set.title;
  const answered = set.questions.filter((q) => attempts[q.id]).length;
  const correct = set.questions.filter((q) => attempts[q.id]?.correct).length;
  const finished = answered === set.questions.length;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={L(`${set.title}: ${answered}/${set.questions.length} câu đã làm`, `${title}: ${answered}/${set.questions.length} answered`)}
      onPress={() => router.push(`/sat-rw/mix/${set.id}` as never)}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      className="rounded-[18px] bg-white p-3.5"
      style={{
        borderWidth: 1,
        borderColor: hover ? '#E0D7C7' : '#F2EEE6',
        ...({
          boxShadow: hover ? '0 14px 30px rgba(94, 72, 35,0.12)' : '0 1px 2px rgba(15,23,42,0.05)',
          transform: hover ? 'translateY(-2px)' : 'none',
          transition: 'box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease',
        } as object),
      }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-semi text-label text-muted" style={{ letterSpacing: 0.6 }}>
          {L(`${set.questions.length} CÂU · XEN KẼ`, `${set.questions.length} QUESTIONS · MIXED`)}
        </Text>
        {finished ? (
          <View className="flex-row items-center gap-1 rounded-pill px-2 py-0.5" style={{ backgroundColor: '#ECFDF3' }}>
            <Icon name="check" size={11} color="#16A34A" strokeWidth={2.6} />
            <Text className="font-strong text-label" style={{ color: '#15803D' }}>
              {correct}/{set.questions.length}
            </Text>
          </View>
        ) : null}
      </View>
      <Text className="mt-0.5 font-heavy text-ink" style={{ fontSize: 17 }} numberOfLines={1}>
        {title}
      </Text>
      <View className="mt-3 flex-row items-end gap-[3px]" style={{ height: 30 }}>
        {set.questions.map((q) => {
          const a = attempts[q.id];
          const tone = DOMAIN_TONE[q.domain] ?? color.primary;
          return (
            <View key={q.id} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
              {a && !a.correct ? <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#EF4444' }} /> : null}
              <View
                style={{
                  width: '100%',
                  height: a ? 22 : 16,
                  borderRadius: 3,
                  backgroundColor: a ? tone : `${tone}4D`,
                }}
              />
            </View>
          );
        })}
      </View>
      <Text className="mt-2.5 font-mid text-label text-muted">
        {answered === 0
          ? L('Chưa làm', 'Not started')
          : finished
            ? L(`Xong · đúng ${correct}/${set.questions.length}`, `Done · ${correct}/${set.questions.length} correct`)
            : L(`Làm dở · ${answered}/${set.questions.length} câu`, `In progress · ${answered}/${set.questions.length}`)}
      </Text>
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
  const { L, en } = useL();

  return (
    <Card>
      <View className="flex-row items-start gap-3">
        <IconCircle name="book" tone={tone} size={40} />
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-strong text-cardTitle text-ink">
              {L('Bài', 'Unit')} {unit.number} · {unit.title}
            </Text>
            <Badge label={L(`${unit.questionCount} câu`, `${unit.questionCount} questions`)} tone="neutral" shape="tag" />
          </View>
          <Text className="mt-1.5 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
            {unit.trap}
          </Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {unit.sets.map((set) => (
              <Pressable
                key={set.id}
                accessibilityRole="button"
                accessibilityLabel={L(`${set.title} — ${set.count} câu`, `${setTitleEn(set, en)} — ${set.count} questions`)}
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
                <View className="flex-row items-center gap-1.5">
                  <Text className="font-strong text-label text-ink">{setTitleEn(set, en)}</Text>
                  {set.difficulty !== 'mixed' ? <DifficultyTag level={set.difficulty} /> : null}
                </View>
                <Text className="mt-0.5 font-sans text-label text-muted">
                  {L(`${set.count} câu · ${set.minutes} phút`, `${set.count} questions · ${set.minutes} min`)}
                  {set.instantSolution ? '' : L(' · không lời giải', ' · no explanations')}
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
              {L(`Hoặc làm trọn ${unit.questionCount} câu một lượt`, `Or do all ${unit.questionCount} questions in one go`)}
            </Text>
            <Icon name="chevron-right" size={14} color={color.primary} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

/** Tên bộ đề bằng tiếng Anh, suy từ loại bộ (tên tiếng Việt viết sẵn trong services/sat-rw/curriculum). */
const GENERATED_SET_EN: Record<number, string> = {
  11: 'Fresh set · words in context',
  15: 'Fresh set · data evidence',
  16: 'Fresh set · choosing the closing sentence',
};
function setTitleEn(set: SatRwCurriculumUnit['sets'][number], en: boolean): string {
  if (!en) return set.title;
  if (set.difficulty === 'hard') return 'Hard challenge';
  if (set.kind === 'learn') return 'Get familiar';
  if (set.kind === 'drill') return 'Drill';
  if (set.kind === 'checkpoint') return 'Skill checkpoint';
  return GENERATED_SET_EN[set.unitNumber] ?? set.title;
}

/** Mỗi chặng một tông icon — cuộn dọc trang thì màu báo đã sang chặng khác. */
const STAGE_TONES = ['primary', 'info', 'accent', 'warning'] as const;

