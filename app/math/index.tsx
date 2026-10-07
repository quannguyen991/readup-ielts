import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScorePredictionCard } from '@/components/prediction/ScorePrediction';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { DifficultyFilter, DomainSection, Segmented, SkillCard, type DifficultyFilterValue } from '@/components/practice/SkillBank';
import { HubLinkRow, HubTitle, HubToolbar } from '@/components/sat-hub/SatHub';
import { Screen } from '@/components/layout/Screen';
import { MATH_HUB_LINKS } from '@/navigation/sat-hub';
import { MATH_LESSONS } from '@/data/lessons/math-lessons';
import {
  FilterChip,
  SetCard,
  UnitCard,
} from '@/components/math/CurriculumCards';
import { Badge, Button, Card, Icon, ProgressBar, SectionHeader } from '@/components/ui';
import { MATH_DOMAIN_STYLE, MATH_SET_KIND_STYLE, type MathSetKind } from '@/lib/math/theme';
import {
  MATH_DOMAIN_LABEL,
  MATH_SKILL_DOMAIN,
  MATH_SKILL_LABEL,
  type MathDomain,
  type MathSkill,
} from '@/lib/math/types';
import {
  ALL_SETS,
  MATH_CURRICULUM,
  findNextSet,
  getStageOfSet,
  stageIndexOfSet,
} from '@/services/math/curriculum';
import { getCourseAssessment, getCourseAssessmentsForUnit, isCourseAssessmentComplete, SAT_MATH_COURSE_UNITS, UNIT_TEST_PASS_THRESHOLD, type MathCourseUnit } from '@/services/math/course';
import { PlanNudge } from '@/components/billing/PlanUi';
import { isStageUnlocked, requiredPlanFor } from '@/lib/billing/entitlements';
import { PLANS } from '@/lib/billing/plans';
import { usePlan } from '@/store/useBillingStore';
import { DIAGNOSTIC_LENGTH, DIAGNOSTIC_MINUTES, diagnosticHeadline } from '@/services/math/diagnostic';
import { MOCK_MODULE_LENGTH, MOCK_MODULE_MINUTES } from '@/services/math/mock';
import { formatAccuracy } from '@/services/math/scoring';
import {
  useLatestDiagnostic,
  useMathDomainStats,
  useMathErrorTags,
  useMathSetProgress,
  useMathBankProgress,
  useMathSkillStats,
  useMathStore,
  useMathTotals,
} from '@/store/useMathStore';
import { color } from '@/theme/tokens';
import { BANK_PER_SKILL, MATH_SKILLS, roundForTier, roundTier, roundsFor } from '@/services/math/bank';
import { CrossFade } from '@/components/motion/Motion';
import { bi, useL, type Bi, type L as LFn } from '@/i18n/useL';
import { mathDomainShort, mathErrorLabel, mathSetKindLabel } from '@/components/math/math-labels-en';

/**
 * Trang chủ module SAT Math.
 *
 * Đầu trang chỉ có tên, một hàng liên kết nhỏ và MỘT thanh công cụ mảnh
 * (01/10/2026) — bốn bước đầy đủ nằm ở `/sat`. Bốn chế độ xem:
 *
 *   LỘ TRÌNH  — giáo trình 13 unit, mặc định mở
 *   KỸ NĂNG   — ngân hàng câu theo mảng, lọc Dễ / Vừa / Khó
 *   BỘ ĐỀ     — "tôi muốn tự chọn bài", lọc theo domain / kiểu / trạng thái
 *   KẾT QUẢ   — "tôi đang yếu chỗ nào", kèm điểm dự đoán
 *
 * Bản trước của trang này đổ thẳng 19 nút "Drill" giống hệt nhau ra màn hình.
 * Nó liệt kê đủ mọi thứ luyện được, nhưng không trả lời được câu hỏi duy nhất
 * người mới cần trả lời — bắt đầu từ đâu.
 */
type Tab = 'skills' | 'path' | 'library' | 'stats';

export default function MathScreen() {
  const { L } = useL();
  const [tab, setTab] = useState<Tab>('path');
  const [level, setLevel] = useState<DifficultyFilterValue>('all');

  const progressBySet = useMathSetProgress();

  const doneSetIds = useMemo(
    () => new Set(Object.keys(progressBySet).filter((id) => (progressBySet[id]?.rounds ?? 0) > 0)),
    [progressBySet],
  );
  const nextSet = useMemo(() => findNextSet(doneSetIds), [doneSetIds]);

  return (
    <Screen>
      <HubTitle eyebrow="DIGITAL SAT" title="SAT Math" line={L('13 unit theo lộ trình Nền tảng → Trung bình → Nâng cao.', '13 course units from Foundations → Medium → Advanced.')} />
      <HubLinkRow links={MATH_HUB_LINKS} />

      <HubToolbar>
        <Segmented
          label={L('Chế độ', 'View')}
          value={tab}
          onChange={setTab}
          options={[
            { key: 'skills', label: L('Kỹ năng', 'Skills') },
            { key: 'path', label: L('Lộ trình', 'Path') },
            { key: 'library', label: L('Bộ đề', 'Sets') },
            { key: 'stats', label: L('Kết quả', 'Results') },
          ]}
        />
        {tab === 'skills' ? <DifficultyFilter value={level} onChange={setLevel} /> : null}
      </HubToolbar>

      <CrossFade swapKey={tab}>
        {tab === 'skills' ? <SkillsView level={level} /> : null}
        {tab === 'path' ? (
          <View>
            <View className="mt-4">
              <PlanNudge />
            </View>
            <PathView progressBySet={progressBySet} nextSetId={nextSet?.id ?? null} />
          </View>
        ) : null}
        {tab === 'library' ? <LibraryView progressBySet={progressBySet} /> : null}
        {tab === 'stats' ? <StatsView /> : null}
      </CrossFade>
    </Screen>
  );
}

function nextSetLabel(setId: string, en = false): string {
  const set = ALL_SETS.find((s) => s.id === setId);
  const stage = getStageOfSet(setId);
  if (!set) return '';
  const unit = MATH_CURRICULUM.flatMap((s) => s.units).find((u) =>
    u.sets.some((x) => x.id === setId),
  );
  if (en) return `${unit?.englishName ?? (stage?.domain ? MATH_DOMAIN_LABEL[stage.domain] : '')} · ${mathSetKindLabel(set.kind, true)}`;
  return `${unit?.title ?? stage?.title ?? ''} · ${set.title}`;
}

// ------------------------------------------------------------------ kỹ năng

const SKILLS = MATH_SKILLS;

/** Tên bài học tiếng Việt của mỗi kỹ năng — dòng phụ dưới tên College Board. */
const SKILL_UNIT_TITLE = Object.fromEntries(
  // Chỉ bài học của RIÊNG một kỹ năng: bài tổng hợp chứa cả 19 kỹ năng, lấy nó thì thẻ nào cũng ghi "Đề khó thật".
  MATH_CURRICULUM.flatMap((stage) => stage.units)
    .filter((u) => u.skills.length === 1)
    .map((u) => [u.skills[0], u.title]),
) as Partial<Record<MathSkill, string>>;

/**
 * Tỉ trọng mỗi mảng trong đề Digital SAT Math — số của College Board. Không
 * chia tiếp xuống từng kỹ năng theo tỉ trọng đề thật: College Board không công
 * bố con số đó. Con số trên thẻ kỹ năng là tỉ lệ CÂU TRONG KHO của mảng.
 */
const DOMAIN_WEIGHT: Record<MathDomain, Bi> = {
  algebra: { vi: '35% đề Math', en: '35% of Math' },
  advanced_math: { vi: '35% đề Math', en: '35% of Math' },
  problem_solving_data: { vi: '15% đề Math', en: '15% of Math' },
  geometry_trig: { vi: '15% đề Math', en: '15% of Math' },
};

/**
 * Tab mặc định — bố cục "ngân hàng câu": mỗi mảng một khung, mỗi kỹ năng một
 * thẻ. "Đã làm" là số câu KHÁC NHAU của ngân hàng kỹ năng đã làm (lượt 10 câu,
 * `services/math/bank.ts`); đúng/sai và thời gian gộp mọi lần làm kỹ năng đó.
 * Bộ lọc độ khó quyết định nút Luyện mở lượt nào: lượt Dễ, Vừa hay Khó kế tiếp.
 */
function SkillsView({ level }: { level: DifficultyFilterValue }) {
  const { L, locale, en } = useL();
  const stats = useMathSkillStats();
  const bank = useMathBankProgress();
  const hrefFor = (k: MathSkill) => {
    if (level === 'all') return `/math/drill/${k}`;
    const r = roundForTier(k, level, bank[k].doneRounds);
    return r === null ? `/math/drill/${k}` : `/math/drill/${k}?round=${r}`;
  };
  return (
    <View>
      {DOMAINS.map((domain) => {
        const skills = SKILLS.filter((k) => MATH_SKILL_DOMAIN[k] === domain);
        const done = skills.reduce((sum, k) => sum + bank[k].answered, 0);
        const total = skills.reduce((sum, k) => sum + BANK_PER_SKILL[k], 0);
        return (
          <DomainSection key={domain} title={MATH_DOMAIN_LABEL[domain]} subtitle={bi(DOMAIN_WEIGHT[domain], locale)} done={done} total={total}>
            {skills.map((k) => {
              const st = stats[k];
              const share = Math.round((BANK_PER_SKILL[k] / total) * 100);
              return (
                <SkillCard
                  key={k}
                  title={MATH_SKILL_LABEL[k]}
                  subtitle={en ? '' : (SKILL_UNIT_TITLE[k] ?? '')}
                  share={L(`${share}% ${mathDomainShort(domain, false)}`, `${share}% of ${mathDomainShort(domain, true)}`)}
                  bank={BANK_PER_SKILL[k]}
                  answered={bank[k].answered}
                  correct={st.correct}
                  wrong={st.total - st.correct}
                  accuracy={st.accuracy}
                  totalMs={(st.avgTimeMs ?? 0) * st.total}
                  href={hrefFor(k)}
                />
              );
            })}
          </DomainSection>
        );
      })}
    </View>
  );
}

// ------------------------------------------------------------------ lộ trình

type PathMode = 'course' | 'sets';

function PathView({
  progressBySet,
  nextSetId,
}: {
  progressBySet: ReturnType<typeof useMathSetProgress>;
  nextSetId: string | null;
}) {
  const { L } = useL();
  const [mode, setMode] = useState<PathMode>('course');
  return (
    <View>
      <View className="mt-4 self-start">
        <Segmented
          label={L('Lộ trình', 'Path')}
          value={mode}
          onChange={setMode}
          options={[
            { key: 'course', label: L('Giáo trình 13 unit', '13-unit course') },
            { key: 'sets', label: L('Bộ luyện hiện có', 'Existing sets') },
          ]}
        />
      </View>
      <CrossFade swapKey={mode}>
        {mode === 'course' ? <MathCoursePath progressBySet={progressBySet} /> : null}
        {mode === 'sets' ? <ExistingPathView progressBySet={progressBySet} nextSetId={nextSetId} /> : null}
      </CrossFade>
    </View>
  );
}

function MathCoursePath({ progressBySet }: { progressBySet: ReturnType<typeof useMathSetProgress> }) {
  const { L, en } = useL();
  const bank = useMathBankProgress();
  const [open, setOpen] = useState('foundation-algebra');

  const firstIncomplete = SAT_MATH_COURSE_UNITS.find((unit) =>
    !!unit.level && !!unit.difficulty &&
    courseUnitCompletion(unit, bank, progressBySet).done < courseUnitCompletion(unit, bank, progressBySet).total,
  );
  const activeId = firstIncomplete?.id ?? '';

  return (
    <View className="mt-4 gap-3">
      <Card>
        <View className="flex-row flex-wrap items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="font-heavy text-cardTitle text-ink">{L('Lộ trình học SAT Math', 'SAT Math learning path')}</Text>
            <Text className="mt-1 font-sans text-body text-muted">
              {L(
                'Bắt đầu với hướng dẫn, rồi học bốn mảng qua ba mức. Tiến độ tính theo lượt đã nộp; điểm thấp sẽ chỉ bạn quay lại kỹ năng cần ôn.',
                'Start with the test guide, then work through four domains at three levels. Progress counts submitted attempts; lower scores point back to skills to review.',
              )}
            </Text>
          </View>
          <Badge label={L(`${SAT_MATH_COURSE_UNITS.length} unit`, `${SAT_MATH_COURSE_UNITS.length} units`)} tone="primary" shape="tag" />
        </View>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Button
            variant="outline"
            label={L('Chẩn đoán 19 câu', '19-question placement check')}
            onPress={() => router.push('/math/diagnostic' as never)}
          />
          <Button
            variant="outline"
            label={L('Thi thử Math', 'Math mock test')}
            onPress={() => router.push('/math/mock' as never)}
          />
        </View>
      </Card>

      {SAT_MATH_COURSE_UNITS.map((unit) => {
        const expanded = open === unit.id;
        const current = unit.level && unit.difficulty
          ? courseUnitCompletion(unit, bank, progressBySet)
          : { done: 0, total: 0 };
        const pct = current.total ? Math.round((current.done / current.total) * 100) : 0;
        const isActive = activeId === unit.id;
        const latestUnitTest = getCourseAssessment(`course-${unit.id}-unit-test`);
        const latestUnitTestProgress = latestUnitTest ? progressBySet[latestUnitTest.id] : undefined;
        const unitTestScore = latestUnitTestProgress?.lastRatio;
        const needsReview = (latestUnitTestProgress?.rounds ?? 0) > 0 && unitTestScore !== undefined && unitTestScore < UNIT_TEST_PASS_THRESHOLD;
        const unitLabel = en ? unit.title.en : unit.title.vi;
        return (
          <Card key={unit.id} padded={false}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => setOpen(expanded ? '' : unit.id)}
              className="flex-row items-start gap-3 p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-panel" style={{ backgroundColor: unit.level ? color.accentSoft : '#FEF3C7' }}>
                <Text className="font-heavy text-body" style={{ color: unit.level ? color.accent : '#A16207' }}>{unit.number}</Text>
              </View>
              <View className="min-w-0 flex-1">
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text className="font-heavy text-cardTitle text-ink">{unitLabel}</Text>
                  {isActive ? (
                    <Badge
                      label={needsReview ? L(`Ôn lại · ${Math.round((unitTestScore ?? 0) * 100)}%`, `Review · ${Math.round((unitTestScore ?? 0) * 100)}%`) : L('Học tiếp', 'Next up')}
                      tone={needsReview ? 'warning' : 'primary'}
                      shape="tag"
                    />
                  ) : null}
                </View>
                <Text className="mt-1 font-sans text-label text-muted">{en ? unit.blurb.en : unit.blurb.vi}</Text>
                {current.total > 0 ? (
                  <View className="mt-2 flex-row items-center gap-3">
                    <View className="flex-1"><ProgressBar value={pct} tone={pct === 100 ? 'success' : 'primary'} /></View>
                    <Text className="font-strong text-label text-muted">{current.done}/{current.total} {L('phần đã làm', 'steps done')}</Text>
                  </View>
                ) : null}
              </View>
              <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={18} color={color.subtle} />
            </Pressable>

            {expanded ? (
              <View className="gap-3 px-4 pb-4">
                {unit.number === 1 ? <CourseOrientation /> : null}
                {unit.level && unit.difficulty ? (
                  <>
                    <Grid columns={2} tabletColumns={2} mobileColumns={1} gap={10}>
                      {unit.skills.map((skill) => {
                        const lesson = MATH_LESSONS.find((candidate) => candidate.skill === skill);
                        const tierRounds = Array.from({ length: roundsFor(skill) }, (_, round) => round)
                          .filter((round) => roundTier(skill, round) === unit.difficulty!);
                        const doneRounds = bank[skill].doneRounds.filter((round) => tierRounds.includes(round)).length;
                        const nextRound = roundForTier(skill, unit.difficulty!, bank[skill].doneRounds);
                        return (
                          <Card key={skill} padded={false}>
                            <View className="p-3">
                              <Text className="font-heavy text-body text-ink">{lesson?.title ?? MATH_SKILL_LABEL[skill]}</Text>
                              <Text className="mt-0.5 font-sans text-label text-muted">{lesson?.englishName ?? MATH_SKILL_LABEL[skill]}</Text>
                              {lesson ? <Text className="mt-2 font-sans text-label text-muted" numberOfLines={2}>{lesson.goal}</Text> : null}
                              <View className="mt-2 flex-row flex-wrap items-center gap-2">
                                <Badge
                                  label={`${doneRounds}/${tierRounds.length} ${L('lượt đã nộp', 'rounds submitted')}`}
                                  tone={doneRounds === tierRounds.length ? 'success' : 'neutral'}
                                  shape="tag"
                                />
                              </View>
                              <View className="mt-3 flex-row flex-wrap gap-2">
                                {lesson ? (
                                  <Button size="sm" variant="outline" label={L('Học bài', 'Learn')} onPress={() => router.push(`/math/learn/${skill}` as never)} />
                                ) : null}
                                {nextRound !== null ? (
                                  <Button
                                    size="sm"
                                    label={L('Luyện', 'Practice')}
                                    onPress={() => router.push(`/math/drill/${skill}?round=${nextRound}` as never)}
                                  />
                                ) : null}
                              </View>
                            </View>
                          </Card>
                        );
                      })}
                    </Grid>
                    <CourseAssessments unit={unit} progressBySet={progressBySet} />
                  </>
                ) : null}
              </View>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}

function CourseOrientation() {
  const { L } = useL();
  return (
    <View className="rounded-card border border-border bg-canvas p-4">
      <Text className="font-heavy text-body text-ink">{L('Chuẩn bị trước khi học', 'Before you start')}</Text>
      <Text className="mt-1 font-sans text-label text-muted">
        {L('Unit mở đầu không có bài tập chấm điểm. Hãy xem cấu trúc đề, làm chẩn đoán nếu muốn tìm lỗ hổng, hoặc vào thử đề khi đã sẵn sàng.', 'This introductory unit is informational. Review the test format, take the placement check to spot gaps, or start a mock when ready.')}
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        <Button size="sm" variant="outline" label={L('Kiến thức SAT', 'SAT essentials')} onPress={() => router.push('/sat/kien-thuc' as never)} />
        <Button size="sm" label={L('Chẩn đoán đầu vào', 'Placement check')} onPress={() => router.push('/math/diagnostic' as never)} />
      </View>
    </View>
  );
}

function CourseAssessments({
  unit,
  progressBySet,
}: {
  unit: MathCourseUnit;
  progressBySet: ReturnType<typeof useMathSetProgress>;
}) {
  const { L } = useL();
  const plan = usePlan();
  const quizzes = getCourseAssessmentsForUnit(unit.id).filter((assessment) => assessment.assessment === 'quiz');
  const test = getCourseAssessment(`course-${unit.id}-unit-test`);
  if (quizzes.length === 0 || !test) return null;
  const locked = !isStageUnlocked(plan, stageIndexOfSet(test.id));
  return (
    <View className="rounded-card border border-border bg-canvas p-3">
      <Text className="font-heavy text-body text-ink">{L('Kiểm tra sau khi luyện', 'Check your learning')}</Text>
      <Text className="mt-1 font-sans text-label text-muted">
        {L('Các quiz 4 câu theo từng cụm kỹ năng; bài cuối unit rải đều câu hỏi qua những kỹ năng Band 9 đang có trong mảng này. Cần đúng ít nhất 3/4 (75%) để tính là qua unit; đây không phải nhãn mastery.', 'Take the four-question checkpoint quizzes by skill group. The unit test balances questions across the current Band 9 skills in this domain. Score at least 3/4 (75%) to pass the unit; this is not a mastery label.')}
      </Text>
      {(progressBySet[test.id]?.rounds ?? 0) > 0 && (progressBySet[test.id]?.lastRatio ?? 0) < UNIT_TEST_PASS_THRESHOLD ? (
        <Text className="mt-2 rounded-xl bg-amber-50 p-3 font-semi text-label text-amber-900">
          {L(
            `Lần kiểm tra gần nhất đạt ${Math.round((progressBySet[test.id]?.lastRatio ?? 0) * 100)}%. Hãy xem lại bài học và các câu sai trong unit này trước khi chuyển sang unit tiếp theo.`,
            `Your latest unit test was ${Math.round((progressBySet[test.id]?.lastRatio ?? 0) * 100)}%. Review the lessons and missed questions in this unit before moving on.`,
          )}
        </Text>
      ) : null}
      <View className="mt-3 flex-row flex-wrap gap-2">
        {[...quizzes, test].map((assessment) => {
          const attempted = (progressBySet[assessment.id]?.rounds ?? 0) > 0;
          const score = progressBySet[assessment.id]?.lastRatio;
          return (
            <Button
              key={assessment.id}
              size="sm"
              variant={assessment.assessment === 'quiz' ? 'outline' : 'secondary'}
              label={L(
                `${assessment.assessment === 'quiz' ? `Quiz ${assessment.quizNumber}` : 'Bài kiểm tra'} · ${assessment.count} câu${attempted && score !== undefined ? ` · ${Math.round(score * 100)}%` : ''}`,
                `${assessment.assessment === 'quiz' ? `Quiz ${assessment.quizNumber}` : 'Unit test'} · ${assessment.count} questions${attempted && score !== undefined ? ` · ${Math.round(score * 100)}%` : ''}`,
              )}
              onPress={() => router.push((locked ? '/upgrade' : `/math/set/${assessment.id}`) as never)}
            />
          );
        })}
      </View>
    </View>
  );
}

function courseUnitCompletion(
  unit: MathCourseUnit,
  bank: ReturnType<typeof useMathBankProgress>,
  progressBySet: ReturnType<typeof useMathSetProgress>,
) {
  if (!unit.difficulty) return { done: 0, total: 0 };
  let done = 0;
  const assessments = getCourseAssessmentsForUnit(unit.id);
  let total = assessments.length;
  for (const skill of unit.skills) {
    const rounds = Array.from({ length: roundsFor(skill) }, (_, round) => round)
      .filter((round) => roundTier(skill, round) === unit.difficulty);
    total += rounds.length;
    done += rounds.filter((round) => bank[skill].doneRounds.includes(round)).length;
  }
  for (const assessment of assessments) {
    const progress = progressBySet[assessment.id];
    if (isCourseAssessmentComplete(assessment, progress)) done += 1;
  }
  return { done, total };
}

function ExistingPathView({
  progressBySet,
  nextSetId,
}: {
  progressBySet: ReturnType<typeof useMathSetProgress>;
  nextSetId: string | null;
}) {
  return <LegacyPathView progressBySet={progressBySet} nextSetId={nextSetId} />;
}

function LegacyPathView({
  progressBySet,
  nextSetId,
}: {
  progressBySet: ReturnType<typeof useMathSetProgress>;
  nextSetId: string | null;
}) {
  const { L } = useL();
  // Mở sẵn đúng chặng đang học, gấp các chặng còn lại. Mở hết 20 bài học cùng
  // lúc thì trang dài tới mức không quét được, mà gấp hết thì không thấy việc.
  const activeStageId = useMemo(
    () => (nextSetId ? (getStageOfSet(nextSetId)?.id ?? null) : null),
    [nextSetId],
  );
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const plan = usePlan();

  const isOpen = (stageId: string) => open[stageId] ?? stageId === activeStageId;

  return (
    <View className="mt-4 gap-4">
      {MATH_CURRICULUM.map((stage, stageIndex) => {
        const sets = stage.units.flatMap((u) => u.sets);
        const done = sets.filter((s) => (progressBySet[s.id]?.rounds ?? 0) > 0).length;
        const style = stage.domain ? MATH_DOMAIN_STYLE[stage.domain] : null;
        const tint = style?.solid ?? color.accent;
        const expanded = isOpen(stage.id);
        const locked = !isStageUnlocked(plan, stageIndex);

        return (
          <Card key={stage.id} padded={false}>
            <Pressable
              onPress={() => setOpen((prev) => ({ ...prev, [stage.id]: !expanded }))}
              className="flex-row items-start gap-3 p-4"
            >
              <View
                className="h-11 w-11 items-center justify-center rounded-panel"
                style={{ backgroundColor: style?.soft ?? color.accentSoft }}
              >
                <Icon name={style?.icon ?? 'trophy'} size={20} color={tint} />
              </View>

              <View className="flex-1">
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text className="font-heavy text-cardTitle text-ink">{L(stage.title, `Stage ${stageIndex + 1} · ${stage.domain ? MATH_DOMAIN_LABEL[stage.domain] : 'Final review'}`)}</Text>
                  {locked ? (
                    <Badge
                      label={L(
                        `Cần gói ${PLANS[requiredPlanFor('math_all_stages')].name}`,
                        `Needs ${PLANS[requiredPlanFor('math_all_stages')].name}`,
                      )}
                      tone="warning"
                      shape="tag"
                    />
                  ) : stage.id === activeStageId ? (
                    <Badge label={L('Đang học', 'In progress')} tone="primary" shape="tag" />
                  ) : null}
                </View>
                <Text className="mt-1 font-sans text-label text-muted">{stage.blurb}</Text>
                <View className="mt-2 flex-row items-center gap-3">
                  <View className="flex-1">
                    <ProgressBar
                      value={Math.round((done / Math.max(1, sets.length)) * 100)}
                      tone={done === sets.length ? 'success' : 'primary'}
                    />
                  </View>
                  <Text className="font-strong text-label text-muted">
                    {done}/{sets.length}
                  </Text>
                </View>
              </View>

              <Icon
                name={expanded ? 'chevron-down' : 'chevron-right'}
                size={18}
                color={color.subtle}
              />
            </Pressable>

            {expanded ? (
              <View className="gap-3 px-4 pb-4">
                {stage.units.map((unit, unitIndex) => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    index={unitIndex + 1}
                    progressBySet={progressBySet}
                    locked={locked}
                  />
                ))}
                {stageIndex === MATH_CURRICULUM.length - 1 ? (
                  <View className="rounded-card border border-border bg-canvas p-3">
                    <Text className="font-sans text-label text-muted">
                      {L(
                        `Xong chặng này thì bước cuối là bài thi thử đủ hai module (${MOCK_MODULE_LENGTH} câu × ${MOCK_MODULE_MINUTES} phút mỗi module) — chỗ duy nhất có điều hướng độ khó và điểm ước lượng 200–800.`,
                        `After this stage, the final step is a full two-module mock test (${MOCK_MODULE_LENGTH} questions × ${MOCK_MODULE_MINUTES} minutes per module) — the only place with adaptive difficulty and a 200–800 score estimate.`,
                      )}
                    </Text>
                    <Button
                      className="mt-3 self-start"
                      label={L('Vào thi thử', 'Take the mock test')}
                      variant="outline"
                      size="sm"
                      onPress={() => router.push('/math/mock' as never)}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}

// ------------------------------------------------------------------ thư viện

const KIND_ORDER: MathSetKind[] = ['warmup', 'practice', 'speed', 'checkpoint', 'mixed', 'exam'];
const DOMAINS: MathDomain[] = ['algebra', 'advanced_math', 'problem_solving_data', 'geometry_trig'];

function LibraryView({ progressBySet }: { progressBySet: ReturnType<typeof useMathSetProgress> }) {
  const { L, en } = useL();
  const plan = usePlan();
  const [domain, setDomain] = useState<MathDomain | 'all'>('all');
  const [kind, setKind] = useState<MathSetKind | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'todo' | 'done'>('all');

  const filtered = useMemo(
    () =>
      ALL_SETS.filter((set) => {
        if (kind !== 'all' && set.kind !== kind) return false;
        // Đề tổng hợp có `domain: null` vì nó trải cả bốn mảng — nên nó khớp
        // MỌI bộ lọc mảng, chứ không phải không khớp cái nào.
        if (domain !== 'all' && set.domain !== null && set.domain !== domain) return false;
        const done = (progressBySet[set.id]?.rounds ?? 0) > 0;
        if (status === 'todo' && done) return false;
        if (status === 'done' && !done) return false;
        return true;
      }),
    [domain, kind, progressBySet, status],
  );

  return (
    <View className="mt-4">
      <Card>
        <Text className="font-strong text-label text-muted">{L('Mảng kiến thức', 'Domain')}</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          <FilterChip label={L('Tất cả', 'All')} active={domain === 'all'} onPress={() => setDomain('all')} />
          {DOMAINS.map((d) => (
            <FilterChip
              key={d}
              label={mathDomainShort(d, en)}
              tint={MATH_DOMAIN_STYLE[d].solid}
              active={domain === d}
              onPress={() => setDomain(d)}
            />
          ))}
        </View>

        <Text className="mt-4 font-strong text-label text-muted">{L('Kiểu bài', 'Type')}</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          <FilterChip label={L('Tất cả', 'All')} active={kind === 'all'} onPress={() => setKind('all')} />
          {KIND_ORDER.map((k) => (
            <FilterChip
              key={k}
              label={mathSetKindLabel(k, en)}
              tint={MATH_SET_KIND_STYLE[k].solid}
              active={kind === k}
              onPress={() => setKind(k)}
            />
          ))}
        </View>

        <Text className="mt-4 font-strong text-label text-muted">{L('Trạng thái', 'Status')}</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          <FilterChip label={L('Tất cả', 'All')} active={status === 'all'} onPress={() => setStatus('all')} />
          <FilterChip label={L('Chưa làm', 'Not done')} active={status === 'todo'} onPress={() => setStatus('todo')} />
          <FilterChip label={L('Đã làm', 'Done')} active={status === 'done'} onPress={() => setStatus('done')} />
        </View>
      </Card>

      <Text className="mt-4 font-mid text-label text-muted">
        {L(`${filtered.length} bộ đề khớp bộ lọc`, `${filtered.length} sets match the filters`)}
      </Text>

      {filtered.length === 0 ? (
        <Card className="mt-3">
          <Text className="font-sans text-body text-muted">
            {L('Không có bộ đề nào khớp. Bỏ bớt một bộ lọc là ra.', 'No sets match. Try removing a filter.')}
          </Text>
        </Card>
      ) : (
        <View className="mt-3">
          <Grid columns={3} tabletColumns={2} mobileColumns={1}>
            {filtered.map((set) => (
              <SetCard
                key={set.id}
                set={set}
                progress={progressBySet[set.id]}
                compact
                locked={!isStageUnlocked(plan, stageIndexOfSet(set.id))}
              />
            ))}
          </Grid>
        </View>
      )}
    </View>
  );
}

// ------------------------------------------------------------------ kết quả

function StatsView() {
  const { L, locale, en } = useL();
  const diagnostic = useLatestDiagnostic();
  const totals = useMathTotals();
  const skillStats = useMathSkillStats();
  const domainStats = useMathDomainStats();
  const errorTags = useMathErrorTags();
  const sessions = useMathStore((s) => s.sessions);

  if (totals.questions === 0) {
    return (
      <Card className="mt-4">
        <Text className="font-strong text-cardTitle text-ink">{L('Chưa có số liệu', 'No data yet')}</Text>
        <Text className="mt-1 font-sans text-body text-muted">
          {L(
            `Làm bài chẩn đoán ${DIAGNOSTIC_LENGTH} câu (khoảng ${DIAGNOSTIC_MINUTES} phút) là có ngay bản đồ điểm mạnh điểm yếu của cả 19 kỹ năng.`,
            `Take the ${DIAGNOSTIC_LENGTH}-question diagnostic (about ${DIAGNOSTIC_MINUTES} minutes) to get a map of your strengths and weaknesses across all 19 skills.`,
          )}
        </Text>
        <Button
          className="mt-3 self-start"
          label={L('Làm bài chẩn đoán', 'Take the diagnostic')}
          onPress={() => router.push('/math/diagnostic' as never)}
        />
      </Card>
    );
  }

  return (
    <View className="mt-4 gap-4">
      <ScorePredictionCard section="math" />
      {diagnostic ? (
        <Card>
          <Text className="font-strong text-cardTitle text-ink">{L('Bản đồ hiện tại', 'Current map')}</Text>
          <Text className="mt-1 font-sans text-body text-muted">
            {diagnosticHeadline(diagnostic.reading)}
          </Text>
        </Card>
      ) : null}

      <Card>
        <Text className="font-strong text-cardTitle text-ink">{L('Theo mảng kiến thức', 'By domain')}</Text>
        <View className="mt-3 gap-3">
          {DOMAINS.filter((d) => domainStats[d].total > 0).map((d) => (
            <View key={d}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2.5 w-2.5 rounded-pill"
                    style={{ backgroundColor: MATH_DOMAIN_STYLE[d].solid }}
                  />
                  <Text className="font-sans text-body text-ink">{MATH_DOMAIN_LABEL[d]}</Text>
                </View>
                <Text className="font-strong text-label text-muted">
                  {domainStats[d].correct}/{domainStats[d].total} ·{' '}
                  {formatAccuracy(domainStats[d].accuracy)}
                </Text>
              </View>
              <View className="mt-1">
                <ProgressBar
                  value={Math.round((domainStats[d].accuracy ?? 0) * 100)}
                  tone={(domainStats[d].accuracy ?? 0) >= 0.8 ? 'success' : 'primary'}
                />
              </View>
            </View>
          ))}
        </View>
      </Card>

      {errorTags.length > 0 ? (
        <Card>
          <SectionHeader
            title={L('Bạn hay hỏng kiểu gì', 'Your common mistakes')}
            subtitle={L(
              'Gộp qua mọi kỹ năng — sai dấu ở đại số và sai dấu ở hình học là cùng một thói quen.',
              'Combined across all skills — a sign error in algebra and one in geometry are the same habit.',
            )}
            icon="info"
          />
          <View className="mt-3 gap-2">
            {errorTags.slice(0, 6).map(({ tag, count }) => (
              <View key={tag} className="flex-row items-start gap-3 rounded-panel bg-surfaceAlt p-2.5">
                <Badge label={`${count}×`} tone="danger" />
                <Text className="flex-1 font-sans text-body text-ink">{mathErrorLabel(tag, en)}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Card>
        <Text className="font-strong text-cardTitle text-ink">{L('Từng kỹ năng', 'By skill')}</Text>
        <View className="mt-3 gap-2">
          {Object.values(skillStats)
            .filter((s) => s.total > 0)
            .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))
            .map((stat) => (
              <View
                key={stat.skill}
                className="flex-row flex-wrap items-center justify-between gap-2 rounded-panel border border-border p-2.5"
              >
                <View className="flex-1" style={{ minWidth: 190 }}>
                  <Text className="font-sans text-body text-ink">
                    {MATH_SKILL_LABEL[stat.skill]}
                  </Text>
                  <Text className="mt-0.5 font-mid text-label text-muted">
                    {stat.correct}/{stat.total} · {formatAccuracy(stat.accuracy)}
                  </Text>
                </View>
                <Button
                  label={L('Luyện nhanh', 'Quick drill')}
                  variant="outline"
                  size="sm"
                  onPress={() => router.push(`/math/drill/${stat.skill}` as never)}
                />
              </View>
            ))}
        </View>
      </Card>

      {sessions.length > 0 ? (
        <Card>
          <Text className="font-strong text-cardTitle text-ink">{L('Lượt gần đây', 'Recent sessions')}</Text>
          <View className="mt-3 gap-2">
            {sessions.slice(0, 8).map((session) => (
              <Pressable
                key={session.id}
                onPress={() => router.push(`/math/review/${session.id}` as never)}
                className="flex-row items-center justify-between gap-3 rounded-panel border border-border p-2.5"
              >
                <View className="flex-1">
                  <Text className="font-strong text-body text-ink">
                    {sessionLabel(session.mode, session.setId, session.skill, L, en)}
                  </Text>
                  <Text className="mt-0.5 font-sans text-label text-muted">
                    {L(`Đúng ${session.rawScore}/${session.total}`, `${session.rawScore}/${session.total} correct`)}
                    {session.estimatedScore !== null
                      ? L(` · ước lượng ${session.estimatedScore}`, ` · est. ${session.estimatedScore}`)
                      : ''}{' '}
                    ·{' '}
                    {new Date(session.finishedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN')}
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={color.subtle} />
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}
    </View>
  );
}

function sessionLabel(mode: string, setId: string | null, skill: string | null, L: LFn, en: boolean): string {
  if (mode === 'diagnostic') return L('Bài chẩn đoán', 'Diagnostic test');
  if (mode === 'mock') return L('Thi thử hai module', 'Two-module mock test');
  if (setId) return nextSetLabel(setId, en) || L('Bộ đề trong lộ trình', 'Path set');
  if (skill)
    return L(
      `Luyện nhanh · ${MATH_SKILL_LABEL[skill as keyof typeof MATH_SKILL_LABEL]}`,
      `Quick drill · ${MATH_SKILL_LABEL[skill as keyof typeof MATH_SKILL_LABEL]}`,
    );
  return L('Lượt làm bài', 'Practice session');
}
