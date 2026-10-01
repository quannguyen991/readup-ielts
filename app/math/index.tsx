import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScorePredictionCard } from '@/components/prediction/ScorePrediction';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { BankHeader, DomainSection, SkillCard } from '@/components/practice/SkillBank';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Screen } from '@/components/layout/Screen';
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
  CURRICULUM_TOTALS,
  MATH_CURRICULUM,
  findNextSet,
  getStageOfSet,
  stageIndexOfSet,
} from '@/services/math/curriculum';
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
import { SAT_RW_QUESTIONS } from '@/data/sat-rw-repository';
import { BANK_PER_SKILL, MATH_BANK_TOTAL, MATH_SKILLS, ROUND_SIZE, mathBankDone, roundsFor } from '@/services/math/bank';
import { useSatRwStore } from '@/store/useSatRwStore';
import { CrossFade } from '@/components/motion/Motion';
import { bi, useL, type Bi, type L as LFn } from '@/i18n/useL';
import { mathDomainShort, mathErrorLabel, mathSetKindLabel } from '@/components/math/math-labels-en';

/**
 * Trang chủ module SAT Math.
 *
 * Ba tab, và thứ tự của chúng là thứ tự người học cần:
 *
 *   LỘ TRÌNH  — "hôm nay làm bài nào", mặc định mở
 *   THƯ VIỆN  — "tôi muốn tự chọn bài", lọc theo domain / kiểu / trạng thái
 *   KẾT QUẢ   — "tôi đang yếu chỗ nào"
 *
 * Bản trước của trang này đổ thẳng 19 nút "Drill" giống hệt nhau ra màn hình.
 * Nó liệt kê đủ mọi thứ luyện được, nhưng không trả lời được câu hỏi duy nhất
 * người mới cần trả lời — bắt đầu từ đâu.
 */
type Tab = 'skills' | 'path' | 'library' | 'stats';

export default function MathScreen() {
  const { L } = useL();
  const [tab, setTab] = useState<Tab>('skills');

  const progressBySet = useMathSetProgress();
  const diagnostic = useLatestDiagnostic();

  const doneSetIds = useMemo(
    () => new Set(Object.keys(progressBySet).filter((id) => (progressBySet[id]?.rounds ?? 0) > 0)),
    [progressBySet],
  );
  const nextSet = useMemo(() => findNextSet(doneSetIds), [doneSetIds]);

  return (
    <Screen>
      <MathTop nextSetId={nextSet?.id ?? null} hasDiagnostic={!!diagnostic} />

      <PlanNudge />

      <View className="mt-4 flex-row flex-wrap gap-2">
        <TabButton label={L('Kỹ năng', 'Skills')} icon="grid" active={tab === 'skills'} onPress={() => setTab('skills')} />
        <TabButton label={L('Lộ trình', 'Path')} icon="list" active={tab === 'path'} onPress={() => setTab('path')} />
        <TabButton
          label={L(`Bộ đề · ${CURRICULUM_TOTALS.sets}`, `Sets · ${CURRICULUM_TOTALS.sets}`)}
          icon="clipboard"
          active={tab === 'library'}
          onPress={() => setTab('library')}
        />
        <TabButton
          label={L('Kết quả', 'Results')}
          icon="trending"
          active={tab === 'stats'}
          onPress={() => setTab('stats')}
        />
      </View>

      <CrossFade swapKey={tab}>
        {tab === 'skills' ? <SkillsView /> : null}
        {tab === 'path' ? (
          <PathView progressBySet={progressBySet} nextSetId={nextSet?.id ?? null} />
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

/**
 * Đầu trang: hàng lối tắt (học tiếp, chẩn đoán, thi thử, từ vựng) rồi hai thẻ
 * ngân hàng Math / Verbal. Thay cho khối hero lớn trước đây — khối đó chiếm cả
 * màn đầu để nói lại những con số mà thẻ ngân hàng nói gọn trong một dòng.
 */
function MathTop({ nextSetId, hasDiagnostic }: { nextSetId: string | null; hasDiagnostic: boolean }) {
  const { L } = useL();
  const bank = useMathBankProgress();
  const rwAttempts = useSatRwStore((s) => s.attempts);
  const mathDone = mathBankDone(bank);

  return (
    <View>
      <LightHero
        scene="math"
        badge="DIGITAL SAT · MATH"
        line1="SAT Math"
        line2={L('học chắc từng kỹ năng', 'master every skill')}
        subtitle={L(
          `${CURRICULUM_TOTALS.units} bài học · ${CURRICULUM_TOTALS.sets} bộ đề · ${MATH_BANK_TOTAL} câu. Đề sinh mới mỗi lượt, đáp án tính bằng code.`,
          `${CURRICULUM_TOTALS.units} lessons · ${CURRICULUM_TOTALS.sets} sets · ${MATH_BANK_TOTAL} questions. Fresh questions every round, answers computed by code.`,
        )}
        footer={
          <>
            <HeroStat value={String(mathDone)} label={L('câu đã làm', 'questions done')} />
            <HeroStat value={String(CURRICULUM_TOTALS.units)} label={L('bài học', 'lessons')} />
            <HeroStat value="19" label={L('kỹ năng', 'skills')} />
          </>
        }
      >
        {nextSetId ? (
          <Button
            label={hasDiagnostic ? L('Học tiếp lộ trình', 'Continue the path') : L('Bắt đầu lộ trình', 'Start the path')}
            variant="brand"
            size="lg"
            iconRight="arrow-right"
            onPress={() => router.push(`/math/set/${nextSetId}` as never)}
          />
        ) : null}
        <Button
          label={
            hasDiagnostic
              ? L('Chẩn đoán lại', 'Retake diagnostic')
              : L(`Chẩn đoán ${DIAGNOSTIC_LENGTH} câu`, `${DIAGNOSTIC_LENGTH}-question diagnostic`)
          }
          variant="outline"
          size="lg"
          onPress={() => router.push('/math/diagnostic' as never)}
        />
        <Button label={L('Thi thử', 'Mock test')} variant="outline" size="lg" onPress={() => router.push('/math/mock' as never)} />
        <Button label={L('Bài học lý thuyết', 'Theory lessons')} variant="outline" size="lg" iconLeft="book" onPress={() => router.push('/math/learn' as never)} />
        <Button label={L('Bài từ vựng', 'Vocabulary lessons')} variant="outline" size="lg" iconLeft="letters" onPress={() => router.push('/math/learn?tab=vocab' as never)} />
      </LightHero>

      <View className="mt-5">
        <ScorePredictionCard section="math" />
      </View>
      <View className="mt-5" />
      <BankHeader
        current={{
          eyebrow: 'Math',
          title: L('Ngân hàng SAT Math', 'SAT Math bank'),
          blurb: L(
            '19 kỹ năng của đề Digital SAT. Đề sinh mới mỗi lượt, đáp án tính bằng code.',
            'The 19 Digital SAT skills. Fresh questions every round, answers computed by code.',
          ),
          done: mathDone,
          total: MATH_BANK_TOTAL,
          icon: 'grid',
        }}
        other={{
          eyebrow: 'Verbal',
          title: L('Ngân hàng SAT Verbal', 'SAT Verbal bank'),
          blurb: L('Reading & Writing, bốn mảng đề.', 'Reading & Writing, four content domains.'),
          done: Object.keys(rwAttempts).length,
          total: SAT_RW_QUESTIONS.length,
          icon: 'letters',
          href: '/sat-rw',
        }}
      />
    </View>
  );
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
 * chia tiếp xuống từng kỹ năng: College Board không công bố con số đó, và bịa
 * ra một tỉ lệ trông chính xác còn tệ hơn không ghi gì.
 */
const DOMAIN_WEIGHT: Record<MathDomain, Bi> = {
  algebra: { vi: '~35% đề SAT Math', en: '~35% of SAT Math' },
  advanced_math: { vi: '~35% đề SAT Math', en: '~35% of SAT Math' },
  problem_solving_data: { vi: '~15% đề SAT Math', en: '~15% of SAT Math' },
  geometry_trig: { vi: '~15% đề SAT Math', en: '~15% of SAT Math' },
};

/**
 * Tab mặc định: mỗi mảng một khối, mỗi kỹ năng một thẻ. "Đã làm" là số câu
 * KHÁC NHAU của ngân hàng kỹ năng đã làm (theo lượt 10 câu, xem
 * `services/math/bank.ts`); đúng/sai và thời gian gộp mọi lần làm kỹ năng đó,
 * kể cả trong bộ đề lộ trình.
 */
function SkillsView() {
  const { L, locale, en } = useL();
  const stats = useMathSkillStats();
  const bank = useMathBankProgress();
  return (
    <View className="mt-2">
      {DOMAINS.map((domain) => {
        const skills = SKILLS.filter((k) => MATH_SKILL_DOMAIN[k] === domain);
        const done = skills.reduce((sum, k) => sum + bank[k].answered, 0);
        const total = skills.reduce((sum, k) => sum + BANK_PER_SKILL[k], 0);
        return (
          <DomainSection key={domain} title={MATH_DOMAIN_LABEL[domain]} subtitle={bi(DOMAIN_WEIGHT[domain], locale)} done={done} total={total}>
            {skills.map((k, i) => {
              const st = stats[k];
              return (
                <SkillCard
                  key={k}
                  index={i}
                  title={MATH_SKILL_LABEL[k]}
                  subtitle={en ? '' : (SKILL_UNIT_TITLE[k] ?? '')}
                  bank={BANK_PER_SKILL[k]}
                  answered={bank[k].answered}
                  correct={st.correct}
                  wrong={st.total - st.correct}
                  accuracy={st.accuracy}
                  totalMs={(st.avgTimeMs ?? 0) * st.total}
                  meta={L(
                    `Lượt ${bank[k].nextRound + 1}/${roundsFor(k)} · ${ROUND_SIZE} câu`,
                    `Round ${bank[k].nextRound + 1}/${roundsFor(k)} · ${ROUND_SIZE} questions`,
                  )}
                  href={`/math/drill/${k}`}
                  icon="grid"
                />
              );
            })}
          </DomainSection>
        );
      })}
    </View>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: 'list' | 'grid' | 'trending' | 'clipboard';
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={active}
      onPress={onPress}
      className={[
        'flex-row items-center gap-2 rounded-pill border px-4 py-2.5',
        active ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface',
      ].join(' ')}
    >
      <Icon name={icon} size={16} color={active ? color.white : color.muted} />
      <Text className={active ? 'font-strong text-body text-white' : 'font-mid text-body text-muted'}>
        {label}
      </Text>
    </Pressable>
  );
}

// ------------------------------------------------------------------ lộ trình

function PathView({
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
