import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
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
import { satRwStats } from '@/data/sat-rw-repository';
import { color } from '@/theme/tokens';

/**
 * Hub SAT Reading & Writing.
 *
 * Xếp theo BỐN MẢNG của đề thật chứ không phải một danh sách 16 unit phẳng:
 * người luyện SAT tra tài liệu theo tên mảng, và tỷ trọng của mảng là thứ quyết
 * định nên dồn sức vào đâu. Danh sách phẳng giấu mất cả hai thông tin đó.
 *
 * Tỷ trọng ghi trên mỗi mảng là tỷ trọng CỦA ĐỀ THẬT, không phải tỷ lệ câu
 * trong kho này — hai con số khác nhau và nói hai chuyện khác nhau, nên số câu
 * của kho ghi riêng bên cạnh.
 */
export default function SatRwHubScreen() {
  const stats = useMemo(() => satRwStats(), []);
  const mixStats = useMemo(() => mixedSetStats(), []);

  return (
    <Screen>
      <View className="self-start rounded-pill border border-border bg-surface px-3 py-1.5">
        <Text className="font-semi uppercase tracking-wide text-muted" style={{ fontSize: 10 }}>
          Digital SAT · Reading & Writing
        </Text>
      </View>

      <Text className="mt-3 font-heavy text-pageTitle text-ink">SAT Verbal</Text>
      <Text className="mt-1.5 max-w-[640px] font-sans text-bodyLg text-muted">
        {stats.questions} câu phủ đủ bốn mảng của đề Digital SAT, xếp thành {stats.units} unit theo
        từng luật một. Mỗi câu có lời giải tiếng Việt nói rõ vì sao ba phương án kia sai.
      </Text>

      <View className="mt-5">
        <Grid columns={4} tabletColumns={2} mobileColumns={2} gap={12}>
          <StatTile icon="clipboard" label="Câu hỏi" value={String(stats.questions)} />
          <StatTile icon="list" label="Unit" value={String(stats.units)} />
          <StatTile icon="grid" label="Mảng đề" value={String(stats.domains)} />
          <StatTile icon="target" label="Kỹ năng" value={String(stats.skills)} />
        </Grid>
      </View>

      {/*
        Đề trộn đặt TRƯỚC danh sách unit.

        Unit là chỗ học từng luật một, và nó phải có. Nhưng làm hết một unit thì
        tới câu thứ năm là đoán được đáp án mà không cần đọc — vì đã biết trước
        câu này hỏi luật gì. Đề trộn mới là thứ giống lúc thi, nên nó là lối vào
        mặc định; ai muốn học lại một luật cụ thể thì cuộn xuống.
      */}
      <View className="mt-6">
        <View className="flex-row flex-wrap items-end justify-between gap-2">
          <View className="min-w-0 flex-1">
            <Text className="font-strong text-cardTitle text-ink">Đề trộn</Text>
            <Text className="mt-1 max-w-[620px] font-sans text-body text-muted">
              {mixStats.sets} đề, mỗi đề {QUESTIONS_PER_SET} câu lấy từ cả bốn mảng và xếp xen kẽ —
              bạn phải tự nhận ra câu đang hỏi luật gì, giống lúc thi thật.
            </Text>
          </View>
        </View>

        <View className="mt-3">
          <Grid columns={5} tabletColumns={4} mobileColumns={3} gap={10}>
            {SAT_RW_MIXED_SETS.map((set) => (
              <Pressable
                key={set.id}
                accessibilityRole="link"
                onPress={() => router.push(`/sat-rw/mix/${set.id}` as never)}
                className="items-center rounded-panel border border-border bg-surface px-2 py-3"
                style={({ pressed }) => (pressed ? { opacity: 0.9 } : undefined)}
              >
                <Text className="font-heavy text-cardTitle text-ink">{set.order}</Text>
                <Text className="mt-0.5 font-mid text-label text-muted">
                  {set.questions.length} câu
                </Text>
              </Pressable>
            ))}
          </Grid>
        </View>
      </View>

      {/*
        BỐN CHẶNG THEO THỨ TỰ NÊN HỌC, không phải bốn domain xếp cạnh nhau.

        Bản trước liệt kê bốn domain, mỗi domain một lưới unit — đúng về phân loại
        nhưng không trả lời câu hỏi người học thực sự hỏi khi mở trang: "bắt đầu từ
        đâu". Mười sáu ô ngang hàng nhau thì ai cũng bấm vào ô đầu tiên, mà ô đầu tiên
        tuỳ thứ tự domain chứ không tuỳ độ khó.
      */}
      {SAT_RW_STAGES.map((stage, stageIndex) => (
        <View key={stage.id} className="mt-8">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-heavy text-sectionTitle text-ink">{stage.title}</Text>
            <Badge label={`${stage.units.length} bài`} tone="primary" />
          </View>
          <Text
            className="mt-1 max-w-[760px] font-sans text-body text-muted"
            style={{ lineHeight: 22 }}
          >
            {stage.blurb}
          </Text>

          <View className="mt-3 gap-3">
            {stage.units.map((unit) => (
              <CurriculumUnitCard key={unit.number} unit={unit} stageIndex={stageIndex} />
            ))}
          </View>
        </View>
      ))}
    </Screen>
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


function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-card border border-border bg-surface px-4 py-3.5">
      <View className="h-10 w-10 items-center justify-center rounded-panel bg-primary-50">
        <Icon name={icon} size={18} color={color.primary} strokeWidth={1.9} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 9 }}>
          {label}
        </Text>
        <Text className="font-heavy text-sectionTitle text-ink">{value}</Text>
      </View>
    </View>
  );
}
