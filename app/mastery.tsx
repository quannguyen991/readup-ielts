import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Card, Icon } from '@/components/ui';
import { explain } from '@/services/mastery/explain';
import { DOMAIN_LABEL, type Domain, type SkillRecord, type SkillStatus } from '@/services/mastery/types';
import { LOCALE_LABEL, type Locale } from '@/i18n';
import { useLocaleStore, useT } from '@/i18n/useT';
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

const STATUS_META: Record<SkillStatus, { tone: string; icon: 'check' | 'info' | 'clock' }> = {
  confirmed: { tone: color.success, icon: 'check' },
  probing: { tone: color.warning, icon: 'clock' },
  'needs-probe': { tone: color.danger, icon: 'info' },
  unobserved: { tone: color.subtle, icon: 'info' },
};

const STATUS_LABEL_KEY = {
  confirmed: 'status.confirmed',
  probing: 'status.probing',
  'needs-probe': 'status.needsProbe',
  unobserved: 'status.unobserved',
} as const;

const ORDER: SkillStatus[] = ['needs-probe', 'probing', 'confirmed', 'unobserved'];

export default function MasteryScreen() {
  const ledger = useMasteryStore((s) => s.ledger);
  const { t } = useT();

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
          {t('mastery.eyebrow')}
        </Text>
      </View>

      <Text className="mt-3 font-heavy text-pageTitle text-ink">{t('mastery.title')}</Text>
      <Text className="mt-1.5 max-w-[680px] font-sans text-bodyLg text-muted">
        {t('mastery.intro')}
      </Text>

      <LanguageToggle />

      <Card className="mt-4">
        <Text className="font-strong text-body text-ink">{t('mastery.whyStrictTitle')}</Text>
        <Text className="mt-1.5 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
          {t('mastery.whyStrictBody')}
        </Text>
      </Card>

      {records.length === 0 ? (
        <Card className="mt-5">
          <Text className="font-strong text-body text-ink">{t('mastery.emptyTitle')}</Text>
          <Text className="mt-1.5 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
            {t('mastery.emptyBody')}
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
  const { t, locale } = useT();
  const meta = STATUS_META[rec.status];
  const e = useMemo(() => explain(rec, locale), [rec, locale]);

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
            {t(STATUS_LABEL_KEY[rec.status])}
          </Text>
          <Text className="mt-0.5 font-sans text-label text-subtle">
            {t('mastery.observations', { n: rec.observations })}
            {rec.transfers > 0 ? ` · ${t('mastery.transfers', { n: rec.transfers })}` : ''}
          </Text>
        </View>
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} color={color.subtle} strokeWidth={2} />
      </Pressable>

      {open ? (
        <View className="border-t border-border px-3.5 py-3">
          <Text className="font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 9 }}>
            {t('mastery.whyThink')}
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
            <Text className="font-strong text-label text-primary-900">{t('mastery.nextStep')}</Text>
            <Text className="mt-0.5 font-sans text-label text-primary-800" style={{ lineHeight: 19 }}>
              {e.nextVi}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Nút đổi ngôn ngữ.
 *
 * Đặt ngay trên màn này chứ không giấu trong Cài đặt: đây là màn giải thích cơ
 * chế, và người cần bản tiếng Anh chính là người đang muốn hiểu cơ chế — bắt họ
 * đi tìm trong Cài đặt là đặt rào ngay trước thứ họ tới để xem.
 */
function LanguageToggle() {
  const { locale } = useT();
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <View className="mt-4 flex-row flex-wrap items-center gap-1.5">
      {(['vi', 'en'] as Locale[]).map((code) => (
        <Pressable
          key={code}
          accessibilityRole="button"
          accessibilityState={{ selected: locale === code }}
          onPress={() => setLocale(code)}
          className={[
            'rounded-pill border px-3 py-1.5',
            locale === code ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface',
          ].join(' ')}
        >
          <Text
            className={['font-semi text-label', locale === code ? 'text-white' : 'text-muted'].join(' ')}
          >
            {LOCALE_LABEL[code]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
