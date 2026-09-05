import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Card, Icon } from '@/components/ui';
import { explain } from '@/services/mastery/explain';
import { DOMAIN_LABEL, type Domain, type SkillRecord, type SkillStatus } from '@/services/mastery/types';
import { useMasteryStore } from '@/store/useMasteryStore';
import { color } from '@/theme/tokens';

/**
 * Sổ bằng chứng: app nghĩ bạn đã làm được gì, và DỰA VÀO ĐÂU.
 *
 * VÌ SAO MÀN NÀY TỒN TẠI. Mọi app học đều có một trang "tiến độ" đầy phần trăm.
 * Phần trăm không trả lời được câu hỏi duy nhất đáng hỏi: dựa vào đâu mà nói tôi
 * đã hiểu? Ở đây mỗi kỹ năng mở ra được thành một chuỗi lập luận — đã quan sát
 * gì, suy ra gì, và cần gì nữa để được công nhận.
 *
 * BỐN TRẠNG THÁI, KHÔNG PHẢI MỘT THANG ĐIỂM. Thang điểm mời người ta tối ưu con
 * số; bốn trạng thái buộc phải trả lời "đã đủ căn cứ chưa". Và "chưa quan sát
 * được" là một trạng thái RIÊNG, không gộp vào "chưa đạt": không đo được khác
 * với đo rồi thấy chưa được, mà gộp hai thứ đó lại là cách nhanh nhất để một
 * bảng tiến độ nói dối.
 */

const STATUS_META: Record<SkillStatus, { label: string; tone: string; icon: 'check' | 'info' | 'clock' }> = {
  confirmed: { label: 'Đã làm được trên bài khác', tone: color.success, icon: 'check' },
  probing: { label: 'Chưa đủ căn cứ', tone: color.warning, icon: 'clock' },
  'needs-probe': { label: 'Có chỗ cần làm rõ', tone: color.danger, icon: 'info' },
  unobserved: { label: 'Chưa quan sát được', tone: color.subtle, icon: 'info' },
};

const ORDER: SkillStatus[] = ['needs-probe', 'probing', 'confirmed', 'unobserved'];

export default function MasteryScreen() {
  const ledger = useMasteryStore((s) => s.ledger);

  const records = useMemo(
    () =>
      Object.values(ledger).sort(
        (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || b.observations - a.observations,
      ),
    [ledger],
  );

  const byDomain = useMemo(() => {
    const out = new Map<Domain, SkillRecord[]>();
    for (const r of records) {
      const list = out.get(r.skill.domain) ?? [];
      list.push(r);
      out.set(r.skill.domain, list);
    }
    return out;
  }, [records]);

  return (
    <Screen>
      <View className="self-start rounded-pill border border-border bg-surface px-3 py-1.5">
        <Text className="font-semi uppercase tracking-wide text-muted" style={{ fontSize: 10 }}>
          Evidence ledger
        </Text>
      </View>

      <Text className="mt-3 font-heavy text-pageTitle text-ink">Sổ bằng chứng</Text>
      <Text className="mt-1.5 max-w-[680px] font-sans text-bodyLg text-muted">
        App không chấm bạn bằng phần trăm. Nó ghi lại từng lượt quan sát được — bạn trả lời đúng hay
        sai, và bạn dựa vào chỗ nào — rồi chỉ công nhận một kỹ năng khi bạn làm được nó trên{' '}
        <Text className="font-strong text-ink">một bài khác</Text>.
      </Text>

      <Card className="mt-4">
        <Text className="font-strong text-body text-ink">Vì sao lại khắt khe như vậy</Text>
        <Text className="mt-1.5 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
          Làm đúng một câu có thể là đã hiểu, mà cũng có thể là nhớ đáp án hoặc đoán trúng. Chỉ khi
          gặp một bài chưa từng thấy mà vẫn làm được thì mới tách được hai khả năng đó ra. Vì thế
          công nhận ở đây không phải huy chương: gặp lại kỹ năng ấy mà trượt thì nó bị gỡ.
        </Text>
      </Card>

      {records.length === 0 ? (
        <Card className="mt-5">
          <Text className="font-strong text-body text-ink">Sổ còn trống</Text>
          <Text className="mt-1.5 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
            Làm một bài đọc hoặc một đề toán, và nhớ đánh dấu chỗ bạn dựa vào để trả lời. Không có
            dấu đó thì app chỉ biết bạn đúng hay sai, chứ không đối chiếu được gì — và nó sẽ ghi là
            “chưa quan sát được” chứ không đoán thay bạn.
          </Text>
        </Card>
      ) : (
        [...byDomain.entries()].map(([domain, list]) => (
          <View key={domain} className="mt-6">
            <Text className="font-strong text-cardTitle text-ink">{DOMAIN_LABEL[domain]}</Text>
            <View className="mt-3">
              <Grid columns={2} tabletColumns={1} mobileColumns={1} gap={12}>
                {list.map((r) => (
                  <SkillCard key={`${r.skill.domain}:${r.skill.key}`} rec={r} />
                ))}
              </Grid>
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}

function SkillCard({ rec }: { rec: SkillRecord }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[rec.status];
  const e = useMemo(() => explain(rec), [rec]);

  return (
    <View className="h-full overflow-hidden rounded-card border border-border bg-surface">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-start gap-3 p-3.5"
      >
        <View className="pt-0.5">
          <Icon name={meta.icon} size={17} color={meta.tone} strokeWidth={2.2} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-strong text-body text-ink">{rec.skill.key}</Text>
          <Text className="mt-0.5 font-sans text-label" style={{ color: meta.tone }}>
            {meta.label}
          </Text>
          <Text className="mt-0.5 font-sans text-label text-subtle">
            {rec.observations} lượt quan sát
            {rec.transfers > 0 ? ` · ${rec.transfers} lần làm được trên bài khác` : ''}
          </Text>
        </View>
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} color={color.subtle} strokeWidth={2} />
      </Pressable>

      {open ? (
        <View className="border-t border-border px-3.5 py-3">
          <Text className="font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 9 }}>
            Vì sao app nghĩ như vậy
          </Text>

          {e.steps.map((step) => (
            <View key={step.label} className="mt-2.5">
              <Text className="font-strong text-label text-ink">{step.label}</Text>
              <Text className="mt-0.5 font-sans text-label text-muted" style={{ lineHeight: 19 }}>
                {step.detail}
              </Text>
            </View>
          ))}

          <View className="mt-3 rounded-panel bg-primary-50 p-3">
            <Text className="font-strong text-label text-primary-900">Bước tiếp theo</Text>
            <Text className="mt-0.5 font-sans text-label text-primary-800" style={{ lineHeight: 19 }}>
              {e.nextVi}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
