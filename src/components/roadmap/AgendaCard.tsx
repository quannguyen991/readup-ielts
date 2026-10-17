import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { SKILL_LABEL, WEEKDAY_LABEL } from '@/services/plan/custom';
import type { AgendaDay } from '@/services/roadmap/map';
import { rmColors } from './theme';

/**
 * Lịch học mỗi ngày: các khối của hôm nay (tick để đánh dấu đã làm, bấm để vào bài), và tóm tắt
 * bảy ngày tới để người học thấy trước khối lượng. Số liệu đều lấy từ lộ trình đã dựng.
 */
export function AgendaCard({ days, onToggle }: { days: AgendaDay[]; onToggle: (blockId: string) => void }) {
  const c = rmColors();
  const today = days.find((d) => d.isToday);
  const later = days.filter((d) => !d.isToday);
  const todayMinutes = today?.blocks.reduce((sum, b) => sum + b.minutes, 0) ?? 0;
  const todayDone = today?.blocks.filter((b) => b.done).length ?? 0;

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 24, padding: 18, gap: 14, boxShadow: '0 10px 24px rgba(120,80,20,0.12)' } as never}>
      <View style={{ gap: 4 }}>
        <Text style={{ color: c.ink, fontSize: 18, fontWeight: '800' }}>Lịch hôm nay</Text>
        <Text style={{ color: c.muted, fontSize: 13 }}>
          {today && today.blocks.length > 0
            ? `${todayDone}/${today.blocks.length} khối · ${todayMinutes} phút`
            : 'Hôm nay không có khối nào trong lộ trình'}
        </Text>
      </View>

      {today?.blocks.map((b) => (
        <View
          key={b.id}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: b.done ? c.goldSoft : c.ground }}
        >
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: b.done }}
            accessibilityLabel={`Đánh dấu ${b.title}`}
            onPress={() => onToggle(b.id)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: c.goldDeep,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: b.done ? c.gold : c.card,
            }}
          >
            {b.done ? <Icon name="check" size={16} color="#FFFFFF" strokeWidth={2.6} /> : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Mở ${b.title}`}
            onPress={() => router.push(b.href as never)}
            style={{ flex: 1, minWidth: 0, gap: 2 }}
          >
            <Text numberOfLines={1} style={{ color: c.ink, fontSize: 15, fontWeight: '800', textDecorationLine: b.done ? 'line-through' : 'none' }}>
              {b.title}
            </Text>
            <Text numberOfLines={1} style={{ color: c.muted, fontSize: 12 }}>
              {b.skill === 'check' ? 'Cửa kiểm tra' : SKILL_LABEL[b.skill]} · {b.minutes} phút
            </Text>
          </Pressable>
        </View>
      ))}

      <View style={{ gap: 8, paddingTop: 4 }}>
        <Text style={{ color: c.body, fontSize: 13, fontWeight: '800' }}>7 ngày tới</Text>
        {later.length === 0 ? <Text style={{ color: c.muted, fontSize: 13 }}>Chưa có ngày học nào trong khoảng này.</Text> : null}
        {later.map((d) => {
          const total = d.blocks.reduce((sum, b) => sum + b.minutes, 0);
          const done = d.blocks.filter((b) => b.done).length;
          return (
            <View key={d.iso} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 44, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: c.goldSoft }}>
                <Text style={{ color: c.goldDeep, fontSize: 12, fontWeight: '800' }}>{WEEKDAY_LABEL[d.weekday]}</Text>
              </View>
              <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: c.groundDeep, overflow: 'hidden' }}>
                <View style={{ width: `${d.blocks.length ? Math.round((done / d.blocks.length) * 100) : 0}%`, height: 8, backgroundColor: c.gold }} />
              </View>
              <Text style={{ color: c.body, fontSize: 12, fontWeight: '700', minWidth: 74, textAlign: 'right' }}>
                {d.blocks.length === 0 ? 'Nghỉ' : `${d.blocks.length} khối · ${total}p`}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
