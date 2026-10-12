import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { NavSheet } from '@/components/layout/TopBar';
import { CatPose, CatSticker } from '@/components/mascot/CatSticker';
import { CUTE_FONT } from '@/components/cute-home/palette';
import { Icon, type IconName } from '@/components/ui/Icon';
import { GLASS, GOLD, GOLD_BUTTON } from '@/components/layout/phone-theme';

/**
 * TRANG CHỦ TRÊN ĐIỆN THOẠI (dưới 640px), theo bản thiết kế vàng kem: chào hỏi và ảnh
 * đại diện (bấm mở danh sách mục), chuông và tìm kiếm, khối "Band 9", thẻ hero có mèo
 * sticker, dải chuỗi ngày / mục tiêu / phút học, rồi lưới bốn kỹ năng. Máy tính và
 * máy tính bảng vẫn dùng bản lưới ở `app/cute-home.tsx`.
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

/** Bốn kỹ năng trên lưới; `min` là độ dài buổi luyện gợi ý (ước lượng cố định, không phải số liệu của người học). */
const SKILLS: { key: string; icon: 'book' | 'volume' | 'pencil' | 'mic'; title: string; vi: string; en: string; min: number; href: string; cat?: { pose: CatPose; size: number; top: number; right: number } }[] = [
  { key: 'reading', icon: 'book', title: 'Reading', vi: 'Đọc hiểu với bài thật.', en: 'Build comprehension with real passages.', min: 20, href: '/practice', cat: { pose: 'read', size: 66, top: 8, right: 8 } },
  { key: 'listening', icon: 'volume', title: 'Listening', vi: 'Luyện tai với giọng người thật.', en: 'Train your ear for real English.', min: 15, href: '/listening', cat: { pose: 'headphones', size: 70, top: 8, right: 8 } },
  { key: 'writing', icon: 'pencil', title: 'Writing', vi: 'Nhận góp ý chi tiết theo tiêu chí.', en: 'Get detailed feedback by criteria.', min: 25, href: '/write', cat: { pose: 'write', size: 66, top: 8, right: 8 } },
  { key: 'speaking', icon: 'mic', title: 'Speaking', vi: 'Nói to, tự tin hơn mỗi ngày.', en: 'Practice aloud with confidence.', min: 10, href: '/speaking', cat: { pose: 'peace', size: 66, top: 8, right: 8 } },
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

export function PhoneHome(p: PhoneHomeProps) {
  const { L, en } = p;
  const [menuOpen, setMenuOpen] = useState(false);
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
          {/* Chưa có mục thông báo nên chuông mở trang Tiến độ, không gắn chấm báo giả. */}
          <RoundButton icon="bell" label={L('Xem tiến độ', 'View progress')} onPress={() => router.push('/progress' as never)} />
          <RoundButton icon="search" label={L('Tìm bài, từ, đề', 'Search lessons, words, tests')} onPress={p.onSearch} />
        </View>

        {/* Khối thương hiệu */}
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ fontFamily: CUTE_FONT.black, fontSize: 40, lineHeight: 46, color: GOLD.deep, letterSpacing: -0.5 }}>Band 9</Text>
          <Text style={{ fontFamily: CUTE_FONT.semi, fontSize: 11, lineHeight: 15, letterSpacing: 2.2, color: GOLD.muted, marginTop: 2 }}>
            {L('HỌC SÁNG HƠN MỖI NGÀY', 'A BRIGHTER WAY TO LEARN')}
          </Text>
        </View>

        {/* Thẻ hero: lời mời học tiếp, mèo đeo kính thay số 9, và hai mèo ló lên mép trên thẻ */}
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
              style={({ pressed }) => ({ marginTop: 16, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 18, ...GOLD_BUTTON, transform: [{ scale: pressed ? 0.97 : 1 }] } as never)}
            >
              <Text style={{ fontFamily: CUTE_FONT.heavy, fontSize: 14, color: GOLD.ink }}>{L('Đọc tiếp', 'Continue reading')}</Text>
              <Icon name="chevron-right" size={16} color={GOLD.ink} strokeWidth={2.4} />
            </Pressable>
          </View>
          {/* Mèo đeo kính đen là hình chính, thay số 9 */}
          <CatSticker pose="sunglasses" size={150} style={{ position: 'absolute', right: 0, top: 40 }} />
          {/* Hai mèo bám trên mép trên thẻ: bên trái ngồi, bên phải ló đầu */}
          <CatSticker pose="hangingPaws" size={68} style={{ position: 'absolute', left: 2, top: -64 }} />
          <CatSticker pose="peeking" size={66} style={{ position: 'absolute', right: 8, top: -58 }} />
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

        {/* Lưới bốn kỹ năng */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
            <CatSticker pose="think" size={40} />
            <Text style={{ fontFamily: CUTE_FONT.heavy, fontSize: 18, lineHeight: 24, color: GOLD.ink, flexShrink: 1 }}>{L('Gợi ý cho bước tiếp theo', 'Made for your next step')}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/practice' as never)}>
            <Text style={{ fontFamily: CUTE_FONT.semi, fontSize: 13, color: GOLD.deep }}>{L('Xem tất cả ›', 'See all ›')}</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
          {SKILLS.map((s) => (
            <Pressable
              key={s.key}
              accessibilityRole="button"
              accessibilityLabel={`${s.title}. ${L(s.vi, s.en)}`}
              onPress={() => router.push(s.href as never)}
              style={({ pressed }) => ({ width: '48.5%', minHeight: 172, borderRadius: 26, padding: 14, justifyContent: 'space-between', transform: [{ scale: pressed ? 0.97 : 1 }] } as never)}
            >
              <View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: 26 }, GLASS] as never} />
              {s.cat ? <CatSticker pose={s.cat.pose} size={s.cat.size} style={{ position: 'absolute', top: s.cat.top, right: s.cat.right }} /> : null}
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: GOLD.tint, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={20} color={GOLD.deep} strokeWidth={2} />
              </View>
              <View>
                <Text style={{ fontFamily: CUTE_FONT.heavy, fontSize: 17, lineHeight: 22, color: GOLD.ink }}>{s.title}</Text>
                <Text numberOfLines={2} style={{ fontFamily: CUTE_FONT.semi, fontSize: 12, lineHeight: 17, color: GOLD.body, marginTop: 3 }}>{L(s.vi, s.en)}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Icon name="clock" size={12} color={GOLD.deep} strokeWidth={2} />
                  <Text style={{ fontFamily: CUTE_FONT.bold, fontSize: 11, color: GOLD.ink }}>{L(`khoảng ${s.min} phút`, `about ${s.min} min`)}</Text>
                </View>
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="chevron-right" size={14} color={GOLD.ink} strokeWidth={2.2} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <NavSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
