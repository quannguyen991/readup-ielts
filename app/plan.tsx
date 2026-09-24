import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Badge, Button, Card, Icon, ProgressBar, SectionHeader } from '@/components/ui';
import {
  PLAN_TOTAL_WEEKS,
  SAT_EXAM_ISO,
  daysUntil,
  nextCheckpoint,
  planWeek,
  routeFor,
  stageOf,
  todaySlots,
  weekNumber,
  type PlanSlot,
} from '@/services/plan/roadmap';
import { PLAN_STAGES, PLAN_WEEKS, type PlanStage, type PlanWeek } from '@/services/plan/weeks';
import { color, gradient } from '@/theme/tokens';

/**
 * Lộ trình 60 tuần — trang trả lời đúng một câu: HÔM NAY HỌC GÌ.
 *
 * Trước đây lộ trình sống ngoài app, trong một file HTML. Mở app lên thì không
 * có gì nối giữa "tuần 14 học chương nào" và các màn luyện — người học tự phải
 * nhớ, mà nhớ sai thì học lệch cả tuần.
 *
 * TUẦN SUY TỪ NGÀY, không có nút "đánh dấu đã xong tuần này". App không biết
 * người học có thật sự làm hay không, nên nó không giả vờ biết: nó nói hôm nay
 * là tuần mấy theo lịch, và mở sẵn đúng màn cho từng việc.
 *
 * VIỆC NÀO APP KHÔNG LÀM ĐƯỢC THÌ NÓI THẲNG. Speaking và các đề Kaplan nằm
 * ngoài app; những ô ấy không có nút bấm, chỉ ghi học ở đâu.
 */
export default function PlanScreen() {
  const today = useMemo(() => new Date(), []);
  const rawWeek = weekNumber(today);
  const week = Math.min(Math.max(rawWeek, 1), PLAN_TOTAL_WEEKS);

  const plan = planWeek(week);
  const stage = stageOf(week);
  const slots = todaySlots(today, week);
  const checkpoint = nextCheckpoint(week);
  const daysToSat = daysUntil(SAT_EXAM_ISO, today);

  const [openStage, setOpenStage] = useState<string | null>(stage?.id ?? null);

  return (
    <Screen>
      <Appear>
        <LinearGradient
          colors={[...gradient.hero]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 20 }}
        >
          <View className="flex-row flex-wrap items-end justify-between gap-4">
            <View className="min-w-0 flex-1" style={{ minWidth: 240 }}>
              <Text className="font-strong text-label uppercase text-white/75">
                {rawWeek === 0 ? 'Lộ trình bắt đầu 07/09/2026' : `Chặng ${stage?.id ?? '—'} · ${stage?.name ?? ''}`}
              </Text>
              <Text className="mt-1 font-heavy text-white" style={{ fontSize: 40, lineHeight: 46 }}>
                Tuần {week}
                <Text className="font-sans text-bodyLg text-white/70"> / {PLAN_TOTAL_WEEKS}</Text>
              </Text>
              <Text className="mt-2 font-sans text-body text-white/85" style={{ maxWidth: 560 }}>
                {stage?.summary ?? ''}
              </Text>
            </View>

            <View className="items-end gap-2">
              <Badge label={`Còn ${daysToSat} ngày tới SAT`} tone="warning" shape="tag" />
              {plan?.milestone ? <Badge label={plan.milestone.label} tone="info" shape="tag" /> : null}
            </View>
          </View>

          <View className="mt-4">
            <ProgressBar value={(week / PLAN_TOTAL_WEEKS) * 100} tone="accent" />
          </View>
        </LinearGradient>
      </Appear>

      {/* ------------------------------------------------------------ hôm nay */}
      <Appear index={1}>
        <SectionHeader
          className="mt-6"
          title="Hôm nay"
          subtitle="Ba khối theo đúng khung giờ năm học — bấm vào là vào thẳng màn làm được việc ấy."
          icon="clock"
        />
      </Appear>

      <View className="mt-3">
        <Grid columns={3} tabletColumns={2} mobileColumns={1}>
          {slots.map((slot, index) => (
            <Appear key={slot.id} index={index + 2} style={{ height: '100%' }}>
              <SlotCard slot={slot} />
            </Appear>
          ))}
        </Grid>
      </View>

      {/* ---------------------------------------------------------- tuần này */}
      {plan ? (
        <Appear index={5}>
          <Card className="mt-6">
            <SectionHeader
              title={`Cả tuần ${week}`}
              subtitle={`Từ vựng: ${plan.vocab}`}
              icon="calendar"
            />
            <View className="mt-3 gap-2">
              <WeekRow when="Sáng · 90 phút" block={plan.morning} />
              <WeekRow when="Tối T2 · T4 · T6 · CN" block={plan.eveningA} />
              <WeekRow when="Tối T3 · T5 · T7" block={plan.eveningB} />
            </View>
          </Card>
        </Appear>
      ) : null}

      {/* ------------------------------------------------------- cửa kiểm tra */}
      {checkpoint ? (
        <Appear index={6}>
          <Card className="mt-4">
            <SectionHeader
              title={`Cửa ${checkpoint.no} — tuần ${checkpoint.week}`}
              subtitle={
                checkpoint.week === week
                  ? 'Đúng tuần này. Đo xong mới đi tiếp.'
                  : `Còn ${checkpoint.week - week} tuần nữa phải đo.`
              }
              icon="target"
              iconTone="warning"
            />
            <View className="mt-3 gap-2">
              {checkpoint.targets.map((target) => (
                <View
                  key={target.skill}
                  className="flex-row flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-surfaceAlt px-3 py-2.5"
                >
                  <Text className="font-sans text-body text-ink">{target.skill}</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="font-heavy text-body" style={{ color: color.primary }}>
                      {target.target}
                    </Text>
                    {target.note ? (
                      <Text className="font-sans text-label text-subtle">{target.note}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
            <View className="mt-3 flex-row items-start gap-2 rounded-card bg-warning-soft p-3">
              <Icon name="info" size={16} color={color.warning} />
              <Text className="flex-1 font-sans text-label text-ink">{checkpoint.ifMissed}</Text>
            </View>
          </Card>
        </Appear>
      ) : null}

      {/* ------------------------------------------------------------ sáu chặng */}
      <Appear index={7}>
        <SectionHeader
          className="mt-6"
          title="Sáu chặng"
          subtitle="Bấm vào một chặng để xem từng tuần bên trong."
          icon="list"
        />
      </Appear>

      <View className="mt-3 gap-3">
        {PLAN_STAGES.map((item) => (
          <StageCard
            key={item.id}
            stage={item}
            currentWeek={week}
            open={openStage === item.id}
            onToggle={() => setOpenStage(openStage === item.id ? null : item.id)}
          />
        ))}
      </View>

      <View className="h-6" />
    </Screen>
  );
}

function SlotCard({ slot }: { slot: PlanSlot }) {
  return (
    <Card className="h-full">
      <Text className="font-strong text-label uppercase text-subtle">{slot.when}</Text>
      <Text className="mt-1.5 font-heavy text-cardTitle text-ink">{slot.title}</Text>
      {slot.detail ? (
        <Text className="mt-1 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
          {slot.detail}
        </Text>
      ) : null}
      <View className="flex-1" />
      {slot.href ? (
        <Button
          className="mt-4 self-start"
          label="Vào học"
          variant="brand"
          size="sm"
          iconRight="arrow-right"
          onPress={() => router.push(slot.href as never)}
        />
      ) : (
        <View className="mt-4 flex-row items-center gap-2">
          <Icon name="book" size={15} color={color.subtle} />
          <Text className="font-mid text-label text-subtle">Học trong sách, app chưa có phần này</Text>
        </View>
      )}
    </Card>
  );
}

function WeekRow({ when, block }: { when: string; block: PlanWeek['morning'] }) {
  const href = routeFor(block);
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surfaceAlt px-3 py-2.5">
      <View className="min-w-0 flex-1" style={{ minWidth: 180 }}>
        <Text className="font-mid text-label text-muted">{when}</Text>
        <Text className="mt-0.5 font-strong text-body text-ink">{block ? block.label : 'Nghỉ'}</Text>
        {block?.detail ? (
          <Text className="mt-0.5 font-sans text-label text-muted">{block.detail}</Text>
        ) : null}
      </View>
      {href ? (
        <Button label="Mở" variant="outline" size="sm" onPress={() => router.push(href as never)} />
      ) : null}
    </View>
  );
}

function StageCard({
  stage,
  currentWeek,
  open,
  onToggle,
}: {
  stage: PlanStage;
  currentWeek: number;
  open: boolean;
  onToggle: () => void;
}) {
  const current = currentWeek >= stage.fromWeek && currentWeek <= stage.toWeek;
  const weeks = PLAN_WEEKS.filter((w) => w.week >= stage.fromWeek && w.week <= stage.toWeek);

  return (
    <Card className={current ? 'border-2 border-primary-300' : ''}>
      <Pressable accessibilityRole="button" aria-expanded={open} onPress={onToggle}>
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <View className="min-w-0 flex-1" style={{ minWidth: 200 }}>
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="font-heavy text-cardTitle text-ink">
                Chặng {stage.id} · {stage.name}
              </Text>
              {current ? <Badge label="Đang ở đây" tone="success" shape="tag" /> : null}
            </View>
            <Text className="mt-0.5 font-mid text-label text-muted">
              Tuần {stage.fromWeek}–{stage.toWeek} · {stage.books}
            </Text>
          </View>
          <Icon name={open ? 'chevron-down' : 'chevron-right'} size={18} color={color.subtle} />
        </View>
      </Pressable>

      {open ? (
        <Appear>
        <View className="mt-3">
          <Text className="font-sans text-body text-muted" style={{ lineHeight: 22 }}>
            {stage.summary}
          </Text>

          <View className="mt-3 gap-1.5">
            {stage.slots.map((slot) => (
              <View key={slot.when} className="flex-row flex-wrap items-baseline gap-2">
                <Text className="font-strong text-label text-ink">{slot.when}</Text>
                <Text className="flex-1 font-sans text-label text-muted" style={{ minWidth: 200 }}>
                  {slot.what}
                </Text>
              </View>
            ))}
          </View>

          <View className="mt-4 gap-1.5">
            {weeks.map((item) => (
              <View
                key={item.week}
                className={`flex-row flex-wrap gap-2 rounded-card px-3 py-2 ${
                  item.week === currentWeek ? 'bg-primary-50' : 'bg-surfaceAlt'
                }`}
              >
                <Text className="font-heavy text-label" style={{ color: color.primary, width: 56 }}>
                  Tuần {item.week}
                </Text>
                <Text className="flex-1 font-sans text-label text-ink" style={{ minWidth: 180 }}>
                  {item.morning ? `${item.morning.label} — ${item.morning.detail}` : 'Nghỉ'}
                </Text>
                {item.milestone ? (
                  <Badge
                    label={item.milestone.label}
                    tone={item.milestone.kind === 'gate' ? 'warning' : 'neutral'}
                    shape="tag"
                  />
                ) : null}
              </View>
            ))}
          </View>
        </View>
        </Appear>
      ) : null}
    </Card>
  );
}
