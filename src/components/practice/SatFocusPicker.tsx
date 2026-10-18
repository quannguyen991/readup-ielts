import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Icon, type IconName } from '@/components/ui/Icon';
import { StickerCard } from '@/components/ui/StickerCard';
import { useL } from '@/i18n/useL';
import { NAV_GROUPS, navLabel } from '@/navigation/nav-items';
import { useSatFocusStore } from '@/store/useSatFocusStore';

/**
 * Mỗi tính năng SAT một cặp màu gradient nổi bật, cùng họ với thẻ trang chủ Band 9.
 */
const SAT_ITEM_COLORS: Record<string, readonly [string, string]> = {
  'sat-practice-tests': ['#10B981', '#059669'], // Emerald / Mint (Luyện 50 đề)
  math: ['#3B82F6', '#1D4ED8'],                 // Azure / Cobalt (Toán)
  'sat-rw': ['#8B5CF6', '#6D28D9'],             // Violet / Purple (Verbal)
  'sat-full-test': ['#F59E0B', '#D97706'],      // Amber / Gold (Thi thử 2 Module)
  'sat-home': ['#EC4899', '#DB2777'],           // Rose / Pink (Tổng quan & Lộ trình)
};

const SAT_ITEM_DESCS: Record<string, { vi: string; en: string }> = {
  'sat-practice-tests': {
    vi: '50 đề thi chuẩn Bluebook & Thi thật 2024–2025',
    en: '50 authentic Bluebook & 2024–2025 real forms',
  },
  math: {
    vi: '27 chuyên đề Toán · 4 cấp độ · Máy tính Desmos',
    en: '27 Math topics · 4 levels · Desmos calculator',
  },
  'sat-rw': {
    vi: 'Reading & Writing · Đọc hiểu & Quy tắc ngữ pháp',
    en: 'Reading & Writing · Comprehension & grammar conventions',
  },
  'sat-full-test': {
    vi: 'Thi thử 2 Module thích ứng bấm giờ chuẩn Bluebook',
    en: 'Adaptive 2-module timed test simulation',
  },
  'sat-home': {
    vi: 'Lộ trình 4 bước ôn luyện từ 1000 đến 1500+',
    en: '4-step prep roadmap from 1000 to 1500+',
  },
};

/**
 * Khung bo tròn đầu trang chủ SAT y hệt như IELTS:
 * Người học bấm thẻ để chọn phần muốn học với SAT. Thẻ đang chọn sáng và có dấu tick.
 * Thanh bên chỉ hiện các mục đã chọn.
 */
export function SatFocusPicker() {
  const { L, locale } = useL();
  const features = useSatFocusStore((s) => s.features);
  const setFeatures = useSatFocusStore((s) => s.setFeatures);
  const [open, setOpen] = useState(features === null);

  const items = useMemo(
    () => NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === 'sat')?.children ?? [],
    [],
  );
  const allKeys = useMemo(() => items.map((i) => i.key), [items]);
  const selected = useMemo(() => new Set(features ?? allKeys), [features, allKeys]);
  const count = allKeys.filter((k) => selected.has(k)).length;

  const save = (next: Set<string>) => setFeatures(allKeys.filter((k) => next.has(k)));

  const toggleOne = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) {
      // Không cho phép tắt hết tất cả (ít nhất giữ lại 1 mục)
      if (next.size > 1) next.delete(key);
    } else {
      next.add(key);
    }
    save(next);
  };

  return (
    <View className="gap-5">
      <LightHero
        badge="SAT · CHỌN PHẦN HỌC"
        art="home"
        line1={L('Bạn muốn học gì với SAT?', 'What do you want to study for SAT?')}
        line2={L('bấm thẻ để chọn phần cần học', 'tap a card to pick what you need')}
        subtitle={L('Thanh bên chỉ hiện những phần bạn chọn.', 'The sidebar only shows the parts you pick.')}
        footer={<HeroStat value={`${count}/${allKeys.length}`} label={L('đang hiện', 'showing')} />}
      >
        <Pressable
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          className="self-start rounded-pill border border-border bg-surface px-5 py-3"
        >
          <Text className="font-strong text-body text-ink">
            {open ? L('Thu gọn', 'Collapse') : L('Chọn lại', 'Change')}
          </Text>
        </Pressable>
      </LightHero>

      {open ? (
        <View className="gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="font-heavy text-cardTitle text-ink">
              {L('Các mục ôn luyện SAT', 'SAT Practice Sections')}{' '}
              <Text className="font-mid text-label text-muted">
                {count}/{allKeys.length}
              </Text>
            </Text>
            <Pressable
              onPress={() => setFeatures(allKeys)}
              accessibilityRole="button"
            >
              <Text className="font-strong text-label text-primary">
                {count === allKeys.length ? L('Đã chọn tất cả', 'All selected') : L('Chọn tất cả', 'Select all')}
              </Text>
            </Pressable>
          </View>

          <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
            {items.map((item) => {
              const isOn = selected.has(item.key);
              const colors = SAT_ITEM_COLORS[item.key] ?? ['#3B82F6', '#1D4ED8'];
              const desc = SAT_ITEM_DESCS[item.key];

              return (
                <Pressable
                  key={item.key}
                  onPress={() => toggleOne(item.key)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isOn }}
                  accessibilityLabel={navLabel(item, locale)}
                  style={{ opacity: isOn ? 1 : 0.42 }}
                >
                  <StickerCard colors={colors} style={{ minHeight: 140 }}>
                    <View className="flex-row items-start justify-between">
                      <View
                        className="h-11 w-11 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
                      >
                        <Icon name={item.icon as IconName} size={20} color={colors[1]} />
                      </View>
                      <View
                        className="h-7 w-7 items-center justify-center rounded-full"
                        style={{ backgroundColor: isOn ? '#FFFFFF' : 'rgba(255,255,255,0.35)' }}
                      >
                        {isOn ? <Icon name="check" size={15} color={colors[1]} strokeWidth={2.4} /> : null}
                      </View>
                    </View>

                    <Text className="mt-4 font-heavy text-cardTitle" style={{ color: '#FFFFFF' }}>
                      {navLabel(item, locale)}
                    </Text>

                    {desc ? (
                      <Text
                        className="mt-1 font-sans text-label"
                        style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 18 }}
                        numberOfLines={2}
                      >
                        {desc[locale]}
                      </Text>
                    ) : null}

                    <View className="mt-3 flex-row items-center justify-between">
                      <View
                        className="rounded-full px-3 py-1"
                        style={{ backgroundColor: 'rgba(15,29,51,0.28)' }}
                      >
                        <Text className="font-strong text-label" style={{ color: '#FFFFFF' }}>
                          {isOn ? L('ĐANG HIỆN', 'SHOWING') : L('ĐANG ẨN', 'HIDDEN')}
                        </Text>
                      </View>

                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(item.href as never);
                        }}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.92)',
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 999,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Text className="font-strong text-label" style={{ color: colors[1], fontSize: 12 }}>
                          {L('Vào ngay', 'Open')}
                        </Text>
                        <Icon name="arrow-right" size={12} color={colors[1]} strokeWidth={2.4} />
                      </Pressable>
                    </View>
                  </StickerCard>
                </Pressable>
              );
            })}
          </Grid>
        </View>
      ) : null}
    </View>
  );
}
