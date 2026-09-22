import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
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
  MATH_ERROR_LABEL,
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
        <TabButton label="Kỹ năng" icon="grid" active={tab === 'skills'} onPress={() => setTab('skills')} />
        <TabButton label="Lộ trình" icon="list" active={tab === 'path'} onPress={() => setTab('path')} />
        <TabButton
          label={`Bộ đề · ${CURRICULUM_TOTALS.sets}`}
          icon="clipboard"
          active={tab === 'library'}
          onPress={() => setTab('library')}
        />
        <TabButton
          label="Kết quả"
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

function nextSetLabel(setId: string): string {
  const set = ALL_SETS.find((s) => s.id === setId);
  const stage = getStageOfSet(setId);
  if (!set) return '';
  const unit = MATH_CURRICULUM.flatMap((s) => s.units).find((u) =>
    u.sets.some((x) => x.id === setId),
  );
  return `${unit?.title ?? stage?.title ?? ''} · ${set.title}`;
}

/**
 * Đầu trang: hàng lối tắt (học tiếp, chẩn đoán, thi thử, từ vựng) rồi hai thẻ
 * ngân hàng Math / Verbal. Thay cho khối hero lớn trước đây — khối đó chiếm cả
 * màn đầu để nói lại những con số mà thẻ ngân hàng nói gọn trong một dòng.
 */
function MathTop({ nextSetId, hasDiagnostic }: { nextSetId: string | null; hasDiagnostic: boolean }) {
  const bank = useMathBankProgress();
  const rwAttempts = useSatRwStore((s) => s.attempts);
  const mathDone = mathBankDone(bank);

  return (
    <View>
      <LightHero
        badge="DIGITAL SAT · MATH"
        line1="SAT Math"
        line2="học chắc từng kỹ năng"
        subtitle={`${CURRICULUM_TOTALS.units} bài học · ${CURRICULUM_TOTALS.sets} bộ đề · ${MATH_BANK_TOTAL} câu. Đề sinh mới mỗi lượt, đáp án tính bằng code.`}
        footer={
          <>
            <HeroStat value={String(mathDone)} label="câu đã làm" />
            <HeroStat value={String(CURRICULUM_TOTALS.units)} label="bài học" />
            <HeroStat value="19" label="kỹ năng" />
          </>
        }
      >
        {nextSetId ? (
          <Button
            label={hasDiagnostic ? 'Học tiếp lộ trình' : 'Bắt đầu lộ trình'}
            variant="brand"
            size="lg"
            iconRight="arrow-right"
            onPress={() => router.push(`/math/set/${nextSetId}` as never)}
          />
        ) : null}
        <Button
          label={hasDiagnostic ? 'Chẩn đoán lại' : `Chẩn đoán ${DIAGNOSTIC_LENGTH} câu`}
          variant="outline"
          size="lg"
          onPress={() => router.push('/math/diagnostic' as never)}
        />
        <Button label="Thi thử" variant="outline" size="lg" onPress={() => router.push('/math/mock' as never)} />
        <Button label="Từ vựng toán" variant="outline" size="lg" iconLeft="letters" onPress={() => router.push('/math/vocab' as never)} />
      </LightHero>

      <View className="mt-5" />
      <BankHeader
        current={{
          eyebrow: 'Math',
          title: 'Ngân hàng SAT Math',
          blurb: '19 kỹ năng của đề Digital SAT. Đề sinh mới mỗi lượt, đáp án tính bằng code.',
          done: mathDone,
          total: MATH_BANK_TOTAL,
          icon: 'grid',
        }}
        other={{
          eyebrow: 'Verbal',
          title: 'Ngân hàng SAT Verbal',
          blurb: 'Reading & Writing, bốn mảng đề.',
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
const DOMAIN_WEIGHT: Record<MathDomain, string> = {
  algebra: '~35% đề SAT Math',
  advanced_math: '~35% đề SAT Math',
  problem_solving_data: '~15% đề SAT Math',
  geometry_trig: '~15% đề SAT Math',
};

/**
 * Tab mặc định: mỗi mảng một khối, mỗi kỹ năng một thẻ. "Đã làm" là số câu
 * KHÁC NHAU của ngân hàng kỹ năng đã làm (theo lượt 10 câu, xem
 * `services/math/bank.ts`); đúng/sai và thời gian gộp mọi lần làm kỹ năng đó,
 * kể cả trong bộ đề lộ trình.
 */
function SkillsView() {
  const stats = useMathSkillStats();
  const bank = useMathBankProgress();
  return (
    <View className="mt-2">
      {DOMAINS.map((domain) => {
        const skills = SKILLS.filter((k) => MATH_SKILL_DOMAIN[k] === domain);
        const done = skills.reduce((sum, k) => sum + bank[k].answered, 0);
        const total = skills.reduce((sum, k) => sum + BANK_PER_SKILL[k], 0);
        return (
          <DomainSection key={domain} title={MATH_DOMAIN_LABEL[domain]} subtitle={DOMAIN_WEIGHT[domain]} done={done} total={total}>
            {skills.map((k, i) => {
              const st = stats[k];
              return (
                <SkillCard
                  key={k}
                  index={i}
                  title={MATH_SKILL_LABEL[k]}
                  subtitle={SKILL_UNIT_TITLE[k] ?? ''}
                  bank={BANK_PER_SKILL[k]}
                  answered={bank[k].answered}
                  correct={st.correct}
                  wrong={st.total - st.correct}
                  accuracy={st.accuracy}
                  totalMs={(st.avgTimeMs ?? 0) * st.total}
                  meta={`Lượt ${bank[k].nextRound + 1}/${roundsFor(k)} · ${ROUND_SIZE} câu`}
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
      accessibilityState={{ selected: active }}
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
                  <Text className="font-heavy text-cardTitle text-ink">{stage.title}</Text>
                  {locked ? (
                    <Badge label={`Cần gói ${PLANS[requiredPlanFor('math_all_stages')].name}`} tone="warning" shape="tag" />
                  ) : stage.id === activeStageId ? (
                    <Badge label="Đang học" tone="primary" shape="tag" />
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
                      Xong chặng này thì bước cuối là bài thi thử đủ hai module ({MOCK_MODULE_LENGTH}{' '}
                      câu × {MOCK_MODULE_MINUTES} phút mỗi module) — chỗ duy nhất có điều hướng độ khó
                      và điểm ước lượng 200–800.
                    </Text>
                    <Button
                      className="mt-3 self-start"
                      label="Vào thi thử"
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
        <Text className="font-strong text-label text-muted">Mảng kiến thức</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          <FilterChip label="Tất cả" active={domain === 'all'} onPress={() => setDomain('all')} />
          {DOMAINS.map((d) => (
            <FilterChip
              key={d}
              label={MATH_DOMAIN_STYLE[d].short}
              tint={MATH_DOMAIN_STYLE[d].solid}
              active={domain === d}
              onPress={() => setDomain(d)}
            />
          ))}
        </View>

        <Text className="mt-4 font-strong text-label text-muted">Kiểu bài</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          <FilterChip label="Tất cả" active={kind === 'all'} onPress={() => setKind('all')} />
          {KIND_ORDER.map((k) => (
            <FilterChip
              key={k}
              label={MATH_SET_KIND_STYLE[k].label}
              tint={MATH_SET_KIND_STYLE[k].solid}
              active={kind === k}
              onPress={() => setKind(k)}
            />
          ))}
        </View>

        <Text className="mt-4 font-strong text-label text-muted">Trạng thái</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          <FilterChip label="Tất cả" active={status === 'all'} onPress={() => setStatus('all')} />
          <FilterChip label="Chưa làm" active={status === 'todo'} onPress={() => setStatus('todo')} />
          <FilterChip label="Đã làm" active={status === 'done'} onPress={() => setStatus('done')} />
        </View>
      </Card>

      <Text className="mt-4 font-mid text-label text-muted">
        {filtered.length} bộ đề khớp bộ lọc
      </Text>

      {filtered.length === 0 ? (
        <Card className="mt-3">
          <Text className="font-sans text-body text-muted">
            Không có bộ đề nào khớp. Bỏ bớt một bộ lọc là ra.
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
  const diagnostic = useLatestDiagnostic();
  const totals = useMathTotals();
  const skillStats = useMathSkillStats();
  const domainStats = useMathDomainStats();
  const errorTags = useMathErrorTags();
  const sessions = useMathStore((s) => s.sessions);

  if (totals.questions === 0) {
    return (
      <Card className="mt-4">
        <Text className="font-strong text-cardTitle text-ink">Chưa có số liệu</Text>
        <Text className="mt-1 font-sans text-body text-muted">
          Làm bài chẩn đoán {DIAGNOSTIC_LENGTH} câu (khoảng {DIAGNOSTIC_MINUTES} phút) là có ngay bản
          đồ điểm mạnh điểm yếu của cả 19 kỹ năng.
        </Text>
        <Button
          className="mt-3 self-start"
          label="Làm bài chẩn đoán"
          onPress={() => router.push('/math/diagnostic' as never)}
        />
      </Card>
    );
  }

  return (
    <View className="mt-4 gap-4">
      {diagnostic ? (
        <Card>
          <Text className="font-strong text-cardTitle text-ink">Bản đồ hiện tại</Text>
          <Text className="mt-1 font-sans text-body text-muted">
            {diagnosticHeadline(diagnostic.reading)}
          </Text>
        </Card>
      ) : null}

      <Card>
        <Text className="font-strong text-cardTitle text-ink">Theo mảng kiến thức</Text>
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
            title="Bạn hay hỏng kiểu gì"
            subtitle="Gộp qua mọi kỹ năng — sai dấu ở đại số và sai dấu ở hình học là cùng một thói quen."
            icon="info"
          />
          <View className="mt-3 gap-2">
            {errorTags.slice(0, 6).map(({ tag, count }) => (
              <View key={tag} className="flex-row items-start gap-3 rounded-panel bg-surfaceAlt p-2.5">
                <Badge label={`${count}×`} tone="danger" />
                <Text className="flex-1 font-sans text-body text-ink">{MATH_ERROR_LABEL[tag]}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Card>
        <Text className="font-strong text-cardTitle text-ink">Từng kỹ năng</Text>
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
                  label="Luyện nhanh"
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
          <Text className="font-strong text-cardTitle text-ink">Lượt gần đây</Text>
          <View className="mt-3 gap-2">
            {sessions.slice(0, 8).map((session) => (
              <Pressable
                key={session.id}
                onPress={() => router.push(`/math/review/${session.id}` as never)}
                className="flex-row items-center justify-between gap-3 rounded-panel border border-border p-2.5"
              >
                <View className="flex-1">
                  <Text className="font-strong text-body text-ink">
                    {sessionLabel(session.mode, session.setId, session.skill)}
                  </Text>
                  <Text className="mt-0.5 font-sans text-label text-muted">
                    Đúng {session.rawScore}/{session.total}
                    {session.estimatedScore !== null ? ` · ước lượng ${session.estimatedScore}` : ''} ·{' '}
                    {new Date(session.finishedAt).toLocaleDateString('vi-VN')}
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

function sessionLabel(mode: string, setId: string | null, skill: string | null): string {
  if (mode === 'diagnostic') return 'Bài chẩn đoán';
  if (mode === 'mock') return 'Thi thử hai module';
  if (setId) return nextSetLabel(setId) || 'Bộ đề trong lộ trình';
  if (skill) return `Luyện nhanh · ${MATH_SKILL_LABEL[skill as keyof typeof MATH_SKILL_LABEL]}`;
  return 'Lượt làm bài';
}
