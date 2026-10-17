import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Grid } from '@/components/layout/Grid';
import { HeroStat, LightHero } from '@/components/layout/LightHero';
import { Icon } from '@/components/ui/Icon';
import { StickerCard } from '@/components/ui/StickerCard';
import { useL } from '@/i18n/useL';
import { IELTS_SKILL_OF, IELTS_SKILL_ORDER, type IeltsSkill } from '@/navigation/ielts-focus';
import { NAV_GROUPS, navLabel } from '@/navigation/nav-items';
import { useIeltsFocusStore } from '@/store/useIeltsFocusStore';

const SKILL_NAME: Record<IeltsSkill, { vi: string; en: string }> = {
  reading: { vi: 'Đọc', en: 'Reading' },
  listening: { vi: 'Nghe', en: 'Listening' },
  writing: { vi: 'Viết', en: 'Writing' },
  speaking: { vi: 'Nói', en: 'Speaking' },
  other: { vi: 'Khác', en: 'Other' },
};

/** Mỗi kỹ năng một dải màu, cùng họ với thẻ trang chủ Band 9. */
const SKILL_COLORS: Record<IeltsSkill, readonly [string, string]> = {
  reading: ['#7FA3F6', '#4A7FE8'],
  listening: ['#4FC3DC', '#1F9BB8'],
  writing: ['#F87171', '#DC2626'],
  speaking: ['#A78BFA', '#7C3AED'],
  other: ['#FBBF24', '#D97706'],
};

/**
 * Bước "học gì với IELTS": người học bấm thẻ để chọn phần muốn học. Thẻ đang chọn
 * sáng và có dấu tick; thẻ bỏ chọn mờ đi. Thanh bên chỉ hiện các mục đã chọn.
 */
export function IeltsFocusPicker() {
  const { L, locale } = useL();
  const features = useIeltsFocusStore((s) => s.features);
  const setFeatures = useIeltsFocusStore((s) => s.setFeatures);
  const [open, setOpen] = useState(features === null);

  const items = useMemo(
    () => NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === 'ielts')?.children ?? [],
    [],
  );
  const allKeys = useMemo(() => items.map((i) => i.key), [items]);
  const selected = useMemo(() => new Set(features ?? allKeys), [features, allKeys]);
  const count = allKeys.filter((k) => selected.has(k)).length;

  const save = (next: Set<string>) => setFeatures(allKeys.filter((k) => next.has(k)));

  const toggleOne = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    save(next);
  };

  const toggleSkill = (skill: IeltsSkill) => {
    const keys = allKeys.filter((k) => IELTS_SKILL_OF[k] === skill);
    const allOn = keys.every((k) => selected.has(k));
    const next = new Set(selected);
    for (const k of keys) {
      if (allOn) next.delete(k);
      else next.add(k);
    }
    save(next);
  };

  return (
    <View className="gap-5">
      <LightHero
        badge="IELTS · CHỌN PHẦN HỌC"
        art="home"
        line1={L('Bạn muốn học gì với IELTS?', 'What do you want to study for IELTS?')}
        line2={L('bấm thẻ để chọn phần cần học', 'tap a card to pick what you need')}
        subtitle={L('Thanh bên chỉ hiện những phần bạn chọn.', 'The sidebar only shows the parts you pick.')}
        footer={<HeroStat value={`${count}/${allKeys.length}`} label={L('đang hiện', 'showing')} />}
      >
        <Pressable onPress={() => setOpen((v) => !v)} accessibilityRole="button" className="self-start rounded-pill border border-border bg-surface px-5 py-3">
          <Text className="font-strong text-body text-ink">{open ? L('Thu gọn', 'Collapse') : L('Chọn lại', 'Change')}</Text>
        </Pressable>
      </LightHero>

      {open
        ? IELTS_SKILL_ORDER.map((skill) => {
            const keys = allKeys.filter((k) => IELTS_SKILL_OF[k] === skill);
            if (keys.length === 0) return null;
            const on = keys.filter((k) => selected.has(k)).length;
            const all = on === keys.length;
            return (
              <View key={skill} className="gap-3">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="font-heavy text-cardTitle text-ink">
                    {SKILL_NAME[skill][locale]} <Text className="font-mid text-label text-muted">{on}/{keys.length}</Text>
                  </Text>
                  <Pressable onPress={() => toggleSkill(skill)} accessibilityRole="checkbox" accessibilityState={{ checked: all }}>
                    <Text className="font-strong text-label text-primary">
                      {all ? L('Bỏ chọn nhóm', 'Clear group') : L('Chọn cả nhóm', 'Select group')}
                    </Text>
                  </Pressable>
                </View>

                <Grid columns={3} tabletColumns={2} mobileColumns={1} gap={14}>
                  {keys.map((k) => {
                    const isOn = selected.has(k);
                    const item = items.find((i) => i.key === k);
                    if (!item) return null;
                    return (
                      <Pressable
                        key={k}
                        onPress={() => toggleOne(k)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isOn }}
                        accessibilityLabel={navLabel(item, locale)}
                        style={{ opacity: isOn ? 1 : 0.42 }}
                      >
                        <StickerCard colors={SKILL_COLORS[skill]} style={{ minHeight: 140 }}>
                          <View className="flex-row items-start justify-between">
                            <View
                              className="h-11 w-11 items-center justify-center rounded-2xl"
                              style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
                            >
                              <Icon name={item.icon} size={20} color={SKILL_COLORS[skill][1]} />
                            </View>
                            <View
                              className="h-7 w-7 items-center justify-center rounded-full"
                              style={{ backgroundColor: isOn ? '#FFFFFF' : 'rgba(255,255,255,0.35)' }}
                            >
                              {isOn ? <Icon name="check" size={15} color={SKILL_COLORS[skill][1]} strokeWidth={2.4} /> : null}
                            </View>
                          </View>
                          <Text className="mt-4 font-heavy text-cardTitle" style={{ color: '#FFFFFF' }}>
                            {navLabel(item, locale)}
                          </Text>
                          <View
                            className="mt-3 self-start rounded-full px-3 py-1"
                            style={{ backgroundColor: 'rgba(15,29,51,0.28)' }}
                          >
                            <Text className="font-strong text-label" style={{ color: '#FFFFFF' }}>
                              {isOn ? L('ĐANG HIỆN', 'SHOWING') : L('ĐANG ẨN', 'HIDDEN')}
                            </Text>
                          </View>
                        </StickerCard>
                      </Pressable>
                    );
                  })}
                </Grid>
              </View>
            );
          })
        : null}

      {open ? (
        <Pressable onPress={() => setFeatures(allKeys)} accessibilityRole="button" className="self-start">
          <Text className="font-strong text-label text-primary">{L('Chọn hết', 'Select all')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
