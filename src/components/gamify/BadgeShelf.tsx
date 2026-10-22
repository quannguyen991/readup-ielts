import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Confetti } from '@/components/motion/Confetti';
import { useL } from '@/i18n/useL';
import { useStreak } from '@/store/useStudyStore';
import { useSpeakingStore } from '@/store/useSpeakingStore';
import type { IconName } from '@/components/ui';

import { HexBadge, type BadgeTone } from './HexBadge';

/**
 * Bảng huy hiệu: mở khóa theo dữ liệu thật — chuỗi ngày học (kỷ lục) và số lần luyện nói.
 * Khi có huy hiệu mới mở, pháo giấy chạy một lần rồi nhớ là đã báo (localStorage trên web).
 */

type Rule = { id: string; kind: 'streak' | 'speak'; target: number; icon: IconName; tone: BadgeTone };

const RULES: Rule[] = [
  { id: 'streak-3', kind: 'streak', target: 3, icon: 'flame', tone: 'coral' },
  { id: 'streak-7', kind: 'streak', target: 7, icon: 'flame', tone: 'amber' },
  { id: 'streak-14', kind: 'streak', target: 14, icon: 'trophy', tone: 'violet' },
  { id: 'streak-30', kind: 'streak', target: 30, icon: 'star-fill', tone: 'sky' },
  { id: 'streak-60', kind: 'streak', target: 60, icon: 'sparkle', tone: 'mint' },
  { id: 'streak-100', kind: 'streak', target: 100, icon: 'sparkle', tone: 'pink' },
  { id: 'speak-1', kind: 'speak', target: 1, icon: 'mic', tone: 'sky' },
  { id: 'speak-5', kind: 'speak', target: 5, icon: 'mic', tone: 'pink' },
  { id: 'speak-20', kind: 'speak', target: 20, icon: 'chat', tone: 'violet' },
];

const SEEN_KEY = 'band9-badges-seen';
let seenMem: Set<string> | null = null;

function loadSeen(): Set<string> {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function saveSeen(ids: string[]) {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {
    /* chế độ riêng tư: lần sau có thể báo lại, không sao */
  }
}

export function BadgeShelf() {
  const { L } = useL();
  const streak = useStreak();
  const attempts = useSpeakingStore((s) => s.attempts.length);

  const rows = useMemo(
    () =>
      RULES.map((r) => {
        const value = r.kind === 'streak' ? streak.longest : attempts;
        return { ...r, value, unlocked: value >= r.target };
      }),
    [streak.longest, attempts],
  );
  const unlockedKey = rows
    .filter((r) => r.unlocked)
    .map((r) => r.id)
    .join('|');
  const unlockedCount = rows.filter((r) => r.unlocked).length;

  // Huy hiệu vừa mở và chưa báo bao giờ: pháo giấy một lần.
  const [fresh, setFresh] = useState<string>('');
  useEffect(() => {
    if (!seenMem) seenMem = loadSeen();
    const ids = unlockedKey ? unlockedKey.split('|') : [];
    const news = ids.filter((id) => !seenMem!.has(id));
    if (news.length === 0) return;
    news.forEach((id) => seenMem!.add(id));
    saveSeen([...seenMem]);
    setFresh(news.join('-'));
    const timer = setTimeout(() => setFresh(''), 2600);
    return () => clearTimeout(timer);
  }, [unlockedKey]);

  const label = (r: Rule) =>
    r.kind === 'streak'
      ? L(`${r.target} ngày liên tiếp`, `${r.target}-day streak`)
      : L(`${r.target} lần luyện nói`, `${r.target} speaking sessions`);

  return (
    <View style={{ marginTop: 16, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEE9FF', padding: 18, overflow: 'hidden' }}>
      {fresh ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Confetti seed={fresh} pieces={70} />
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#2B2350' }}>{L('Huy hiệu', 'Badges')}</Text>
        <Text style={{ fontSize: 13, color: '#7A72A0', fontWeight: '600' }}>
          {L(`${unlockedCount}/${rows.length} đã mở`, `${unlockedCount}/${rows.length} unlocked`)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16, marginTop: 14 }}>
        {rows.map((r) => (
          <View key={r.id} style={{ width: '31%', alignItems: 'center', gap: 6 }}>
            <HexBadge icon={r.icon} tone={r.tone} locked={!r.unlocked} size={70} />
            <Text numberOfLines={2} style={{ textAlign: 'center', fontSize: 12, lineHeight: 16, fontWeight: '600', color: r.unlocked ? '#2B2350' : '#7A72A0' }}>
              {label(r)}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: r.unlocked ? '#23875E' : '#A59CC4' }}>
              {r.unlocked ? L('Đã mở', 'Unlocked') : `${Math.min(r.value, r.target)}/${r.target}`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
