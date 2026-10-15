import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { NavSheet } from '@/components/layout/TopBar';
import { CatSticker } from '@/components/mascot/CatSticker';
import { CUTE_FONT } from '@/components/cute-home/palette';
import { Icon, type IconName } from '@/components/ui/Icon';
import { GLASS, GOLD, GOLD_BUTTON } from '@/components/layout/phone-theme';
import { useHydrated } from '@/components/layout/useHydrated';
import { useRewardStore } from '@/store/useRewardStore';

/**
 * TRANG CHỦ TRÊN ĐIỆN THOẠI (dưới 640px), theo bản thiết kế vàng kem: chào hỏi và ảnh
 * đại diện (bấm mở danh sách mục), chuông và tìm kiếm, khối "Band 9", thẻ hero, dải
 * chuỗi ngày / mục tiêu / phút học, rồi khối chọn công cụ và phần học.
 *
 * Chủ đề Chiikawa: thay mèo bằng hình Chiikawa, đổi màu nhấn sang hồng, bỏ mèo bám.
 * Máy tính và máy tính bảng vẫn dùng bản lưới ở `app/cute-home.tsx`.
 *
 * Mọi con số nhận từ chỗ gọi, đếm từ dữ liệu thật. Mục tiêu band chỉ hiện khi người học
 * đã đặt; chưa đặt thì mời đặt, không in số mặc định.
 */

export type PhoneHomeProps = {
  greeting: string;
  displayName: string;
  /** Phút học hôm nay, đếm từ dữ liệu thật. */
  minutes: number;
  streak: number;
  /** Mục tiêu band: Lộ trình trước, rồi hồ sơ. null hoặc undefined = chưa đặt. */
  targetBand: number | null | undefined;
  /** Bài đọc đang học dở; null = chưa có bài nào để tiếp. */
  recommended: { id: string } | null | undefined;
  en: boolean;
  L: (vi: string, en: string) => string;
  onSearch: () => void;
};

/** Ảnh Chiikawa đang có trong repo (cùng hình với nút trợ lý khi chọn chủ đề Chiikawa). */
const CHIIKAWA = require('../../../assets/illustrations/chiikawa/wave.png');

/** Màu nhấn khi chọn Chiikawa: hồng thay cho vàng. */
const PINK = { deep: '#C64E79', tint: '#FCE4EC', button: '#D65E86', ring: '#F3C7D5' };

/** Các công cụ và phần học hiện trên trang chủ điện thoại; mỗi ô mở đúng một màn. */
const TOOLS: { key: string; icon: IconName; title: string; vi: string; en: string; href: string }[] = [
  { key: 'reading', icon: 'book', title: 'Reading', vi: 'Đọc hiểu với bài thật.', en: 'Real passages.', href: '/practice' },
  { key: 'listening', icon: 'volume', title: 'Listening', vi: 'Luyện tai với giọng người thật.', en: 'Train your ear.', href: '/listening' },
  { key: 'writing', icon: 'pencil', title: 'Writing', vi: 'Góp ý theo tiêu chí IELTS.', en: 'IELTS feedback.', href: '/write' },
  { key: 'speaking', icon: 'mic', title: 'Speaking', vi: 'Nói to, tự tin hơn mỗi ngày.', en: 'Speak with confidence.', href: '/speaking' },
  { key: 'math', icon: 'grid', title: 'SAT Math', vi: 'Chấm bằng code, sai đâu biết đó.', en: 'Checked by code.', href: '/math' },
  { key: 'vocab', icon: 'bookmark', title: 'Từ vựng', vi: 'Ôn theo lịch, nhớ lâu hơn.', en: 'Spaced review.', href: '/vocabulary/topics' },
];

/** Nút tròn kính ở đầu trang. */
function RoundButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ width: 48, height: 48, transform: [{ scale: pressed ? 0.94 : 1 }] } as never)}
    >
      <View style={[{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, GLASS] as never}>
        <Icon name={icon} size={20} color={GOLD.ink} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

/** Một cột của dải số liệu: biểu tượng, số lớn, nhãn nhỏ. */
function StatColumn({ icon, value, label, onPress }: { icon: IconName; value: string; label: string; onPress?: () => void }) {
  const body = (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: GOLD.tint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={GOLD.deep} strokeWidth={2} />
      </View>
      <Text style={{ fontFamily: CUTE_FONT.black, fontSize: 19, lineHeight: 24, color: GOLD.ink, marginTop: 2 }}>{value}</Text>
      <Text numberOfLines={1} style={{ fontFamily: CUTE_FONT.semi, fontSize: 11, lineHeight: 15, color: GOLD.muted }}>{label}</Text>
    </View>
  );
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={{ flex: 1 }}>{body}</Pressable> : <View style={{ flex: 1 }}>{body}</View>;
}

/** Một ô công cụ: biểu tượng, tên, một dòng mô tả. */
function ToolTile({ tool, chiikawa, L, en }: { tool: (typeof TOOLS)[number]; chiikawa: boolean; L: (vi: string, en: string) => string; en: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${tool.title}. ${L(tool.vi, tool.en)}`}
      onPress={() => router.push(tool.href as never)}
      style={({ pressed }) => ({
        width: '48.5%',
        minHeight: 132,
        borderRadius: 26,
        padding: 14,
        justifyContent: 'space-between',
        borderWidth: chiikawa ? 1.5 : 0,
        borderColor: chiikawa ? PINK.ring : 'transparent',
        transform: [{ scale: pressed ? 0.97 : 1 }],
      } as never)}
    >
      <View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: 26 }, GLASS] as never} />
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: chiikawa ? PINK.tint : GOLD.tint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={tool.icon} size={20} color={chiikawa ? PINK.deep : GOLD.deep} strokeWidth={2} />
      </View>
      <View>
        <Text style={{ fontFamily: CUTE_FONT.heavy, fontSize: 17, lineHeight: 22, color: chiikawa ? PINK.deep : GOLD.ink }}>{tool.title}</Text>
        <Text numberOfLines={2} style={{ fontFamily: CUTE_FONT.semi, fontSize: 12, lineHeight: 17, color: GOLD.body, marginTop: 3 }}>{L(tool.vi, tool.en)}</Text>
      </View>
      <View style={{ alignSelf: 'flex-end', width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevron-right" size={14} color={chiikawa ? PINK.deep : GOLD.ink} strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}

export function PhoneHome(p: PhoneHomeProps) {
  const { L, en } = p;
  const [menuOpen, setMenuOpen] = useState(false);
  // Chờ hydrate để lượt đầu khớp HTML máy chủ (xem CatSticker).
  const hydrated = useHydrated();
  const chiikawaTheme = useRewardStore((s) => s.theme === 'theme-chiikawa');
  const chiikawa = hydrated && chiikawaTheme;
  const fmt = (n: number) => n.toLocaleString(en ? 'en-US' : 'vi-VN');
  const initial = (p.displayName.trim()[0] ?? 'B').toUpperCase();
  const hasTarget = p.targetBand != null && p.targetBand > 0;
  const heroRoute = p.recommended ? `/read/${p.recommended.id}` : '/practice';

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 128 }} showsVerticalScrollIndicator={false}>
        {/* Đầu trang: ảnh đại diện (bấm mở danh sách mục), lời chào, chuông, tìm kiếm */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={L('Mở danh sách mục', 'Open the menu')} onPress={() => setMenuOpen(true)} style={{ width: 50, height: 50 }}>
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: GOLD.avatar, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(150,110,30,0.18)' } as never}>
              <Text style={{ fontFamily: CUTE_FONT.heavy, fontSize: 20, color: GOLD.deep }}>{initial}</Text>
            </View>
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontFamily: CUTE_FONT.semi, fontSize: 13, lineHeight: 18, color: GOLD.muted }}>{p.greeting},</Text>
            <Text numberOfLines={1} style={{ fontFamily: CUTE_FONT.heavy, fontSize: 18, lineHeight: 24, color: GOLD.ink }}>{p.displayName}</Text>
          </View>
          {chiikawa ? <Image source={CHIIKAWA} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 44, height: 44 }} /> : null}
          {/* Chưa có mục thông báo nên chuông mở trang Tiến độ, không gắn chấm báo giả. */}
          <RoundButton icon="bell" label={L('Xem tiến độ', 'View progress')} onPress={() => router.push('/progress' as never)} />
          <RoundButton icon="search" label={L('Tìm bài, từ, đề', 'Search lessons, words, tests')} onPress={p.onSearch} />
        </View>

        {/* Khối thương hiệu */}
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ fontFamily: CUTE_FONT.black, fontSize: 40, lineHeight: 46, color: chiikawa ? PINK.deep : GOLD.deep, letterSpacing: -0.5 }}>Band 9</Text>
          <Text style={{ fontFamily: CUTE_FONT.semi, fontSize: 11, lineHeight: 15, letterSpacing: 2.2, color: GOLD.muted, marginTop: 2 }}>
            {L('HỌC SÁNG HƠN MỖI NGÀY', 'A BRIGHTER WAY TO LEARN')}
          </Text>
        </View>

        {/* Thẻ hero: lời mời học tiếp, và hình chính ở góc phải (mèo đeo kính, hoặc Chiikawa khi chọn chủ đề đó) */}
        <View style={[{ marginTop: 18, borderRadius: 32, padding: 20, minHeight: 236 }, GLASS] as never}>
          <View style={{ width: '66%' }}>
            <Text style={{ fontFamily: CUTE_FONT.black, fontSize: 22, lineHeight: 28, color: GOLD.ink }}>
              {L('Thêm một bước\ngần hơn tới mục tiêu', 'One step\ncloser to your goal')}
            </Text>
            <Text style={{ fontFamily: CUTE_FONT.semi, fontSize: 13, lineHeight: 19, color: GOLD.body, marginTop: 8 }}>
              {L('Xây kỹ năng mỗi ngày với lộ trình dành cho bạn.', 'Build your English skills day by day with a plan made for you.')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(heroRoute as never)}
              style={({ pressed }) => ({ marginTop: 16, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 18, ...(chiikawa ? { backgroundColor: PINK.button, boxShadow: '0 6px 16px rgba(198,90,120,0.3)' } : GOLD_BUTTON), transform: [{ scale: pressed ? 0.97 : 1 }] } as never)}
            >
              <Text style={{ fontFamily: CUTE_FONT.heavy, fontSize: 14, color: chiikawa ? '#FFFFFF' : GOLD.ink }}>{L('Đọc tiếp', 'Continue reading')}</Text>
              <Icon name="chevron-right" size={16} color={chiikawa ? '#FFFFFF' : GOLD.ink} strokeWidth={2.4} />
            </Pressable>
          </View>
          {chiikawa ? (
            <Image source={CHIIKAWA} resizeMode="contain" accessibilityIgnoresInvertColors style={{ position: 'absolute', right: 0, top: 40, width: 150, height: 150 }} />
          ) : (
            <CatSticker pose="sunglasses" size={150} style={{ position: 'absolute', right: 0, top: 40 }} />
          )}
        </View>

        {/* Dải số liệu: chuỗi ngày, mục tiêu band, phút hôm nay */}
        <View style={[{ marginTop: 14, borderRadius: 26, paddingVertical: 14, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' }, GLASS] as never}>
          <StatColumn icon="flame" value={fmt(p.streak)} label={L('ngày liên tiếp', 'day streak')} />
          <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(156,133,82,0.2)' }} />
          <StatColumn
            icon="target"
            value={hasTarget ? (p.targetBand as number).toFixed(1) : '—'}
            label={hasTarget ? L('mục tiêu band', 'target band') : L('đặt mục tiêu', 'set a target')}
            onPress={() => router.push('/plan' as never)}
          />
          <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(156,133,82,0.2)' }} />
          <StatColumn icon="clock" value={fmt(p.minutes)} label={L('phút hôm nay', 'min today')} />
        </View>

        {/* Công cụ và phần học: chọn một ô để vào đúng màn */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 16 }}>
          <Text style={{ fontFamily: CUTE_FONT.heavy, fontSize: 18, lineHeight: 24, color: GOLD.ink, flexShrink: 1 }}>{L('Công cụ và phần học', 'Tools and study sections')}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/practice' as never)}>
            <Text style={{ fontFamily: CUTE_FONT.semi, fontSize: 13, color: chiikawa ? PINK.deep : GOLD.deep }}>{L('Xem tất cả ›', 'See all ›')}</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
          {TOOLS.map((tool) => (
            <ToolTile key={tool.key} tool={tool} chiikawa={chiikawa} L={L} en={en} />
          ))}
        </View>
      </ScrollView>

      <NavSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
