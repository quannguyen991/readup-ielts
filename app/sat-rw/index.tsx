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
  getSatRwTierSet,
  SAT_RW_COURSE_TIERS,
  SAT_RW_STAGES,
  type SatRwCourseTier,
  type SatRwCurriculumUnit,
} from '@/services/sat-rw/curriculum';
import {
  QUESTIONS_PER_SET,
  SAT_RW_MIXED_SETS,
  mixedSetStats,
} from '@/services/sat-rw/mixed-sets';
import { Screen } from '@/components/layout/Screen';
import { Badge, Card, Icon, IconCircle } from '@/components/ui';
import { questionsForUnit, SAT_RW_DOMAINS, SAT_RW_QUESTIONS } from '@/data/sat-rw-repository';
import { summarizeRwBySkill } from '@/services/sat-rw/progress';
import { useSatRwStore } from '@/store/useSatRwStore';
import { color } from '@/theme/tokens';
import { useL } from '@/i18n/useL';
import { officialSkillPracticeHref, SAT_RW_OFFICIAL_SKILLS, type OfficialSatRwSkill } from '@/services/sat-rw/official-course';

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
 * Rhetorical Synthesis không nằm trong kho câu soạn tay mà có bộ SINH MỚI riêng (bài 10).
 * Thẻ trỏ thẳng vào bộ ấy để mảng Expression of Ideas đủ hai kỹ năng như đề thật.
 */
const SYNTHESIS_SET = SAT_RW_STAGES.flatMap((st) => st.units)
  .find((u) => u.number === 10)
  ?.sets.find((x) => x.kind === 'generated');

/** Kỹ năng → mảng đề, suy từ chính kho câu hỏi. */
const SKILL_DOMAIN: Record<string, string> = Object.fromEntries(SAT_RW_QUESTIONS.map((q) => [q.skill, q.domain]));
const SKILLS_IN_ORDER = Object.keys(SKILL_NAME).filter((k) => SKILL_DOMAIN[k]);

type Tab = 'path' | 'skills' | 'mix' | 'units' | 'score';

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
  const [tab, setTab] = useState<Tab>('path');
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
            { key: 'path', label: L('Lộ trình', 'Path') },
            { key: 'skills', label: L('Kỹ năng', 'Skills') },
            { key: 'mix', label: L(`Đề trộn · ${mixStats.sets}`, `Mixed · ${mixStats.sets}`) },
            { key: 'units', label: L('Theo bài', 'By unit') },
            { key: 'score', label: L('Dự đoán', 'Estimate') },
          ]}
        />
        {tab === 'skills' ? <DifficultyFilter value={level} onChange={setLevel} /> : null}
      </HubToolbar>

      <CrossFade swapKey={tab}>
        {tab === 'path' ? (
          <CoursePathView
            attempts={attempts}
            onShowMixed={() => setTab('mix')}
            onShowUnits={() => setTab('units')}
          />
        ) : null}

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

function CoursePathView({
  attempts,
  onShowMixed,
  onShowUnits,
}: {
  attempts: Record<string, { correct: boolean }>;
  onShowMixed: () => void;
  onShowUnits: () => void;
}) {
  const { L, en } = useL();
  const [expandedTier, setExpandedTier] = useState<SatRwCourseTier | null>('foundation');
  const [officialGroup, setOfficialGroup] = useState<'foundation' | 'medium' | 'advanced' | 'challenge' | 'grammar'>('foundation');

  return (
    <View className="mt-4 gap-3">
      <Card>
        <Text className="font-heavy text-cardTitle text-ink">
          {L('Học theo lộ trình SAT Reading & Writing', 'SAT Reading & Writing learning path')}
        </Text>
        <Text className="mt-2 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
          {L(
            'Đi từ Nền tảng đến Nâng cao. Mỗi mức dùng lại bộ câu hỏi hiện có theo từng kỹ năng; mở lời giải khi luyện và làm đề trộn sau khi đã ôn các mảng.',
            'Move from Foundation to Advanced. Each tier reuses the current skill-based question sets; study with explanations, then try mixed practice across domains.',
          )}
        </Text>
        <Text className="mt-2 font-mid text-label text-muted">
          {L(
            'Các unit bên dưới là chủ đề Band 9 hiện có, được xếp vào mức theo độ khó câu hỏi. Đây là lộ trình tương ứng gần nhất với cấu trúc Khan Academy; một số kỹ năng nhỏ vẫn đang gộp chung trong ngân hàng hiện tại.',
            'The units below are existing Band 9 topics grouped by question difficulty. This is the closest fit to Khan Academy’s tiered structure; some finer skills still share a Band 9 question-bank category.',
          )}
        </Text>
      </Card>

      {SAT_RW_COURSE_TIERS.map((tier, tierIndex) => {
        const expanded = expandedTier === tier.id;
        const availableSets = SAT_RW_STAGES.flatMap((stage) => stage.units)
          .map((unit) => getSatRwTierSet(unit, tier.id))
          .filter((set) => !!set);
        return (
          <Card key={tier.id}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => setExpandedTier(expanded ? null : tier.id)}
              className="flex-row items-center gap-3"
            >
              <IconCircle name={tierIndex === 0 ? 'book' : 'sparkle'} tone={STAGE_TONES[tierIndex]!} size={40} />
              <View className="min-w-0 flex-1">
                <Text className="font-strong text-cardTitle text-ink">
                  {en ? tier.titleEn : tier.titleVi}
                </Text>
                <Text className="mt-1 font-sans text-label text-muted">
                  {L(`${availableSets.length} bài luyện · chọn theo mảng SAT`, `${availableSets.length} practice units · grouped by SAT domain`)}
                </Text>
              </View>
              <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={color.muted} strokeWidth={2} />
            </Pressable>
            {expanded ? (
              <View className="mt-4 gap-5">
                <Text className="font-sans text-body text-muted" style={{ lineHeight: 22 }}>
                  {en ? tier.blurbEn : tier.blurbVi}
                </Text>
                {SAT_RW_STAGES.map((stage, stageIndex) => (
                  <View key={stage.id} className="gap-2">
                    <Text className="font-strong text-label text-muted">
                      {en ? stage.domain : stage.title.replace(/^Chặng \d+ · /, '')}
                    </Text>
                    <View className="gap-2">
                      {stage.units.map((unit) => (
                        <PathUnitLink
                          key={`${tier.id}-${unit.number}`}
                          unit={unit}
                          tier={tier.id}
                          stageIndex={stageIndex}
                          attempts={attempts}
                          en={en}
                          L={L}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        );
      })}

      <Card>
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="font-heavy text-cardTitle text-ink">
            {L('Đủ 47 kỹ năng theo khóa SAT R&W', 'All 47 SAT R&W course skills')}
          </Text>
          <Badge label={L('12 unit · 1:1', '12 units · mapped 1:1')} tone="primary" shape="tag" />
        </View>
        <Text className="mt-2 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
          {L(
            'Mỗi kỹ năng bên dưới có mục tiêu, chiến lược làm bài và bẫy cần tránh. Bộ luyện dùng câu hỏi cùng chủ đề trong Band 9; phần Reading đã bổ sung 12 đoạn văn và câu hỏi tự biên soạn mới.',
            'Each skill below includes a goal, a solving strategy, and a common trap. Practice links use matching Band 9 questions; the Reading bank now includes 12 newly written passages and questions.',
          )}
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {([
            ['foundation', L('Foundation', 'Foundation')],
            ['medium', L('Medium', 'Medium')],
            ['advanced', L('Advanced', 'Advanced')],
            ['challenge', L('Challenge', 'Challenge')],
            ['grammar', L('Ôn ngữ pháp', 'Grammar practice')],
          ] as const).map(([key, label]) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: officialGroup === key }}
              onPress={() => setOfficialGroup(key)}
              className={`rounded-pill border px-3 py-2 ${officialGroup === key ? 'border-primary-500 bg-primary-50' : 'border-border bg-surfaceAlt'}`}
            >
              <Text className="font-strong text-label text-ink">{label}</Text>
            </Pressable>
          ))}
        </View>
        <View className="mt-3 gap-2">
          {SAT_RW_OFFICIAL_SKILLS.filter((skill) =>
            officialGroup === 'challenge' ? skill.kind === 'challenge' :
            officialGroup === 'grammar' ? skill.kind === 'grammar' :
            skill.kind === 'tier' && skill.tier === officialGroup,
          ).map((skill) => <OfficialSkillCard key={skill.id} skill={skill} L={L} />)}
        </View>
        <Text className="mt-3 font-sans text-label text-muted">
          {L('Tham khảo cấu trúc khóa công khai của Khan Academy; toàn bộ đoạn đọc và câu hỏi mới của Band 9 được viết riêng.', 'Course structure is mapped from Khan Academy’s public course; all new Band 9 passages and questions are original.')}
        </Text>
      </Card>

      <Card>
        <Text className="font-strong text-cardTitle text-ink">
          {L('Sau ba mức luyện', 'After the three practice tiers')}
        </Text>
        <Text className="mt-1 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
          {L(
            'Ôn riêng 8 bài quy ước tiếng Anh khi cần củng cố ngữ pháp; sau đó thử bộ đề trộn để chuyển đổi giữa các dạng câu hỏi như trong bài thi.',
            'Review the eight Standard English Conventions units when you need a grammar refresher, then use mixed sets to switch between question types as in the exam.',
          )}
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Pressable
            accessibilityRole="button"
            onPress={onShowUnits}
            className="rounded-panel border border-border bg-surfaceAlt px-3 py-2"
          >
            <Text className="font-strong text-label text-ink">{L('Ôn ngữ pháp theo bài', 'Review grammar by unit')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onShowMixed}
            className="rounded-panel border border-success bg-success-soft px-3 py-2"
          >
            <Text className="font-strong text-label text-ink">{L('Luyện đề trộn', 'Try mixed practice')}</Text>
          </Pressable>
        </View>
      </Card>
    </View>
  );
}

function OfficialSkillCard({ skill, L }: { skill: OfficialSatRwSkill; L: (vi: string, english: string) => string }) {
  const { en } = useL();
  const newQuestions = SAT_RW_QUESTIONS.filter((q) => q.unit === skill.unit && q.skill === skill.legacySkill);
  const tierLabel = skill.tier === 'foundation' ? 'easy' : skill.tier === 'medium' ? 'medium' : 'hard';
  const count = skill.id.startsWith('rhetorical-synthesis')
    ? 12
    : skill.tier
      ? newQuestions.filter((q) => q.difficulty === tierLabel).length
      : newQuestions.length;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={L(`${skill.titleVi}: luyện ${count} câu`, `${skill.title}: practice ${count} questions`)}
      onPress={() => router.push(officialSkillPracticeHref(skill) as never)}
      className="rounded-panel border border-border bg-surfaceAlt px-3 py-3"
      style={({ pressed }) => pressed ? { opacity: 0.86 } : undefined}
    >
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text className="font-strong text-label text-ink">{en ? skill.title : skill.titleVi}</Text>
        <Badge label={L(`${count} câu · Bài ${skill.unit}`, `${count} questions · Unit ${skill.unit}`)} tone={count ? 'neutral' : 'warning'} shape="tag" />
      </View>
      <Text className="mt-1.5 font-sans text-label text-muted" style={{ lineHeight: 20 }}>
        {en ? skill.strategy : skill.strategy}
      </Text>
      <Text className="mt-1 font-mid text-label" style={{ color: '#936B31' }}>
        {L(`Cẩn thận: ${skill.trap}`, `Watch for: ${skill.trap}`)}
      </Text>
    </Pressable>
  );
}

function PathUnitLink({
  unit,
  tier,
  stageIndex,
  attempts,
  en,
  L,
}: {
  unit: SatRwCurriculumUnit;
  tier: SatRwCourseTier;
  stageIndex: number;
  attempts: Record<string, { correct: boolean }>;
  en: boolean;
  L: (vi: string, english: string) => string;
}) {
  const set = getSatRwTierSet(unit, tier);
  if (!set) return null;
  const setQuestions = set.slice ? questionsForUnit(unit.number).slice(set.slice.from, set.slice.to) : [];
  const answered = setQuestions.filter((question) => attempts[question.id]).length;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={L(`${unit.title}, ${set.count} câu`, `${unit.title}, ${set.count} questions`)}
      onPress={() => router.push(`/sat-rw/set/${set.id}` as never)}
      className="flex-row items-center gap-3 rounded-panel border border-border bg-surfaceAlt px-3 py-3"
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
    >
      <IconCircle name="book" tone={STAGE_TONES[stageIndex]!} size={34} />
      <View className="min-w-0 flex-1">
        <Text className="font-strong text-label text-ink">
          {L(`Bài ${unit.number} · ${unit.title}`, `Unit ${unit.number} · ${unit.title}`)}
        </Text>
        <Text className="mt-0.5 font-sans text-label text-muted">
          {L(`${set.count} câu · đã làm ${answered}/${set.count}`, `${set.count} questions · ${answered}/${set.count} answered`)}
        </Text>
      </View>
      <Badge label={en ? setTitleEn(set, true) : set.title} tone={tier === 'advanced' ? 'warning' : tier === 'medium' ? 'info' : 'primary'} shape="tag" />
      <Icon name="chevron-right" size={16} color={color.muted} strokeWidth={2} />
    </Pressable>
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
  10: 'Fresh set · rhetorical synthesis',
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

