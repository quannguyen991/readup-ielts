import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { NeonBackdrop, NeonIcon, NeonPill, NeonTitle } from '@/components/neon/Neon';
import type { NeonIconId, NeonTitleId } from '@/components/neon/neon-art';
import type { NeonScene } from '@/components/neon/Neon';
import { useL } from '@/i18n/useL';

/**
 * Khung "lộ trình mỗi ngày" kiểu màn hình hệ điều hành retro (theo ảnh mẫu Portfolio): chữ tiêu đề pixel 3D phát sáng
 * làm nhân vật chính, nền xanh tím có lưới và sao, ít chữ. Chỉ là giao diện: danh sách bài do nơi gọi đưa vào
 * (lộ trình cá nhân, kế hoạch HSA…), khung này không tự bịa bài.
 */
export type StageTask = {
  id: string;
  tag: string;
  tagColor: string;
  title: string;
  why?: string;
  minutes: number;
  /** Khung giờ, ví dụ "19:30–20:05". */
  range?: string;
  href: string;
  done: boolean;
  /** Bấm nút tích; bỏ trống nếu bài này không đánh dấu tay được. */
  onToggle?: () => void;
};

export type StageChip = { label: string; icon?: 'clock' | 'calendar' | 'flame' | 'crown'; onPress?: () => void };

const CHIP_ICON: Record<NonNullable<StageChip['icon']>, NeonIconId> = { clock: 'clock', calendar: 'star5', flame: 'flame', crown: 'crown' };

type Props = {
  wide: boolean;
  /** Chữ đọc cho trình đọc màn hình (không hiện trên màn hình). */
  dateLabel: string;
  headline: string;
  chips: StageChip[];
  tasks: StageTask[];
  /** Ảnh chữ tiêu đề; mặc định "Hôm nay". */
  art?: NeonTitleId;
  /** Hiện thay cho thân khi chưa có bài nào. */
  empty?: React.ReactNode;
  footer?: React.ReactNode;
};

const SCENE: Record<NeonTitleId, NeonScene> = { 'hom-nay': 'today', 'dua-top': 'rank', 'lo-trinh': 'path', 'tien-do': 'progress' };
const INK = '#2B1D00';
const GOLD = '#FFD84A';

export function DailyPlanStage({ wide, dateLabel, headline, chips, tasks, art = 'hom-nay', empty, footer }: Props) {
  const { L } = useL();
  const [active, setActive] = useState(0);
  const firstOpen = tasks.findIndex((t) => !t.done);

  // Mở sẵn bài chưa xong đầu tiên khi danh sách đổi (ví dụ vừa lập xong kế hoạch).
  const signature = tasks.map((t) => t.id).join('|');
  useEffect(() => {
    setActive(Math.max(0, firstOpen));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const shown = Math.min(active, Math.max(0, tasks.length - 1));
  const current = tasks[shown];
  const pills = chips.filter((c) => c.icon || c.onPress).slice(0, 3);

  return (
    <View accessibilityLabel={`${dateLabel}. ${headline}`} style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(160,150,255,0.35)' }}>
      <NeonBackdrop scene={SCENE[art]} />
      <View style={{ padding: wide ? 28 : 16, paddingTop: wide ? 24 : 16, gap: wide ? 22 : 16, alignItems: 'stretch' }}>
        {/* ------------------------------------------------------ dòng số liệu ngắn */}
        {pills.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: wide ? 'flex-start' : 'center' }}>
            {pills.map((c) => (
              <NeonPill key={c.label} icon={c.icon ? CHIP_ICON[c.icon] : undefined} label={c.label} onPress={c.onPress} />
            ))}
          </View>
        ) : null}

        {/* ------------------------------------------------------ chữ lớn */}
        <NeonTitle id={art} label={headline} maxWidth={wide ? 560 : 400} />

        {/* ------------------------------------------------------ bài hôm nay */}
        {current ? (
          <View style={{ alignSelf: 'center', width: '100%', maxWidth: 640, gap: 12 }}>
            {tasks.length > 1 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {tasks.map((t, i) => {
                  const on = i === shown;
                  return (
                    <Pressable
                      key={t.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${i + 1}. ${t.title}${t.done ? ` (${L('đã xong', 'done')})` : ''}`}
                      onPress={() => setActive(i)}
                      style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? GOLD : 'rgba(10,8,70,0.5)', borderWidth: 2, borderColor: on ? '#FFF1A8' : 'rgba(255,255,255,0.22)', ...(on ? ({ boxShadow: '0 4px 0 #B88A00' } as object) : {}) }}
                    >
                      {t.done ? (
                        <NeonIcon name="check" height={22} />
                      ) : (
                        <Text className="font-nun-heavy" style={{ fontSize: 17, color: on ? INK : '#FFFFFF' }}>
                          {String(i + 1).padStart(2, '0')}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <View style={{ backgroundColor: 'rgba(10,8,70,0.58)', borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.22)', padding: wide ? 20 : 14, gap: 10, ...({ boxShadow: '0 6px 0 rgba(8,6,50,0.55)' } as object) }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                <View style={{ backgroundColor: current.tagColor, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text className="font-nun-heavy" style={{ fontSize: 12, color: '#FFFFFF' }}>
                    {current.tag}
                  </Text>
                </View>
                <Text className="font-nun-heavy" style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  {current.range ? `${current.range} · ` : ''}
                  {current.minutes} {L('phút', 'min')}
                </Text>
              </View>
              <Text className="font-nun-heavy" style={{ fontSize: wide ? 26 : 21, lineHeight: wide ? 32 : 27, color: '#FFFFFF' }}>
                {current.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${L('Bắt đầu', 'Start')}: ${current.title}`}
                  onPress={() => router.push(current.href as never)}
                  style={({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 56, paddingLeft: 22, paddingRight: 8, borderRadius: 28, backgroundColor: hovered ? '#FFE680' : GOLD, borderWidth: 2, borderColor: '#FFF1A8', ...({ boxShadow: pressed ? '0 1px 0 #B88A00' : '0 5px 0 #B88A00' } as object), transform: [{ translateY: pressed ? 4 : 0 }] })}
                >
                  <Text className="font-nun-heavy" style={{ fontSize: 18, color: INK }}>
                    {L('Bắt đầu', 'Start')}
                  </Text>
                  <NeonIcon name="next" height={40} />
                </Pressable>
                {current.onToggle ? (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: current.done }}
                    accessibilityLabel={L('Đánh dấu đã xong', 'Mark as done')}
                    onPress={current.onToggle}
                    style={({ hovered }: { hovered?: boolean }) => ({ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: current.done ? '#7CFF9B' : 'rgba(255,255,255,0.45)', backgroundColor: current.done ? 'rgba(60,200,110,0.25)' : hovered ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)' })}
                  >
                    <NeonIcon name="check" height={26} style={{ opacity: current.done ? 1 : 0.35 }} />
                  </Pressable>
                ) : current.done ? (
                  <View accessibilityLabel={L('Hôm nay đã làm', 'Done today')} style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
                    <NeonIcon name="check" height={28} />
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        ) : (
          <View style={{ alignSelf: 'center', width: '100%', maxWidth: 640, minHeight: 120, justifyContent: 'center', backgroundColor: 'rgba(10,8,70,0.58)', borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.22)', padding: 18 }}>
            {empty}
          </View>
        )}

        {footer ? <View style={{ alignSelf: 'center', width: '100%', maxWidth: 640 }}>{footer}</View> : null}
      </View>
    </View>
  );
}
