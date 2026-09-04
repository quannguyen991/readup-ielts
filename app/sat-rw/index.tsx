import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Badge, Icon } from '@/components/ui';
import {
  SAT_RW_DOMAINS,
  SAT_RW_SKILL_LABEL,
  questionsForUnit,
  satRwStats,
  unitsByDomain,
  type SatRwUnit,
} from '@/data/sat-rw-repository';
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

      {SAT_RW_DOMAINS.map((domain) => {
        const units = unitsByDomain(domain.key);
        const count = stats.byDomain[domain.key] ?? 0;
        if (units.length === 0) return null;

        return (
          <View key={domain.key} className="mt-6">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="font-heavy text-sectionTitle text-ink">{domain.key}</Text>
              <Badge label={`${domain.percent} đề thật`} tone="primary" />
              <Text className="font-sans text-label text-muted">
                {domain.labelVi} · {count} câu trong kho
              </Text>
            </View>

            <View className="mt-3">
              <Grid columns={2} tabletColumns={2} mobileColumns={1} gap={12}>
                {units.map((unit) => (
                  <UnitCard key={unit.unit} unit={unit} />
                ))}
              </Grid>
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

function UnitCard({ unit }: { unit: SatRwUnit }) {
  const skills = useMemo(() => {
    const seen = new Set(questionsForUnit(unit.unit).map((q) => q.skill));
    return [...seen];
  }, [unit.unit]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/sat-rw/${unit.unit}` as never)}
      className="h-full rounded-card border border-border bg-surface p-4"
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
    >
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-panel bg-primary-50">
          <Text className="font-heavy text-body text-primary-700">{unit.unit}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-strong text-cardTitle text-ink">{unit.title}</Text>
          <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
            {skills.map((skill) => (
              <Text
                key={skill}
                className="font-semi uppercase tracking-wide text-subtle"
                style={{ fontSize: 9 }}
              >
                {SAT_RW_SKILL_LABEL[skill] ?? skill}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {unit.ruleVi ? (
        <Text className="mt-3 font-sans text-label text-muted" numberOfLines={3}>
          {unit.ruleVi}
        </Text>
      ) : null}

      <View className="mt-3 flex-row items-center justify-between border-t border-border pt-2.5">
        <Text className="font-mid text-label text-muted">{unit.count} câu</Text>
        <View className="flex-row items-center gap-1.5">
          <Text className="font-strong text-label text-primary-700">Luyện unit này</Text>
          <Icon name="arrow-right" size={15} color={color.primary} strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
}

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
