import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { CatSticker } from '@/components/mascot/CatSticker';
import { CUTE, CUTE_FONT } from '@/components/cute-home/palette';
import { Icon } from '@/components/ui/Icon';
import { GLASS } from '@/components/layout/phone-theme';

/**
 * TRANG CHỦ GIỚI THIỆU TRÊN ĐIỆN THOẠI (dưới 640px) — cùng ngôn ngữ với trang Hôm
 * nay: nền kính pastel do AppShell vẽ, mèo làm nhân vật, thẻ kính, nút tròn. Không
 * còn khối hero to và dải số liệu quảng cáo như bản máy tính.
 *
 * Mọi số liệu nhận từ chỗ gọi (đếm từ dữ liệu thật); file này chỉ bày ra.
 */

type Props = {
  /** Người đã học rồi: hiện thẻ "Tiếp tục học" lên đầu. */
  returning: boolean;
  readable: string;
  mathSets: string;
  mathQuestions: string;
  writing: string;
  L: (vi: string, en: string) => string;
  onContinue: () => void;
  onStart: () => void;
  onIelts: () => void;
  onSat: () => void;
  onMathRoadmap: () => void;
};

const ACCENT = CUTE.strawberry;

/** Viên số liệu ngang: con số đậm, nhãn nhạt, nền kính. */
function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'baseline', gap: 5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 }, GLASS] as never}>
      <Text style={{ fontFamily: CUTE_FONT.black, fontSize: 15, color: CUTE.ink }}>{value}</Text>
      <Text style={{ fontFamily: CUTE_FONT.semi, fontSize: 12, color: CUTE.inkSoft }}>{label}</Text>
    </View>
  );
}

/** Thẻ khu học (IELTS / SAT): biểu tượng, tên, một dòng mô tả, số liệu. */
function AreaTile({ title, line, count, unit, icon, tint, onPress }: { title: string; line: string; count: string; unit: string; icon: 'book' | 'grid'; tint: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${line}`}
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, borderRadius: 26, padding: 16, minHeight: 176, backgroundColor: tint, borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)', justifyContent: 'space-between', boxShadow: '0 10px 24px rgba(120,80,130,0.12)', transform: [{ scale: pressed ? 0.97 : 1 }] } as never)}
    >
      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} color={CUTE.ink} strokeWidth={2} />
      </View>
      <View>
        <Text style={{ fontFamily: CUTE_FONT.heavy, fontSize: 18, lineHeight: 24, color: CUTE.ink }}>{title}</Text>
        <Text numberOfLines={2} style={{ fontFamily: CUTE_FONT.semi, fontSize: 12, lineHeight: 17, color: CUTE.inkSoft, marginTop: 2 }}>{line}</Text>
        <Text style={{ fontFamily: CUTE_FONT.bold, fontSize: 13, color: ACCENT, marginTop: 8 }}>{`${count} ${unit}`}</Text>
      </View>
    </Pressable>
  );
}

export function PhoneIntro(p: Props) {
  const { L } = p;
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 128 }} showsVerticalScrollIndicator={false}>
        {/* Lời chào và mèo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CatSticker pose="wave" size={64} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: CUTE_FONT.semi, fontSize: 14, lineHeight: 20, color: CUTE.inkSoft }}>
              {L('Chào bạn!', 'Hi there!')}
            </Text>
            <Text style={{ fontFamily: CUTE_FONT.black, fontSize: 28, lineHeight: 34, color: CUTE.ink }}>Band 9</Text>
          </View>
        </View>

        {/* Người đã học: về đúng chỗ đang dở */}
        {p.returning ? (
          <Pressable
            accessibilityRole="button"
            onPress={p.onContinue}
            style={({ pressed }) => ({ marginTop: 18, borderRadius: 26, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, transform: [{ scale: pressed ? 0.985 : 1 }] } as never)}
          >
            <View style={[{ flex: 1, minWidth: 0, borderRadius: 26, padding: 16, gap: 4 }, GLASS] as never}>
              <Text style={{ fontFamily: CUTE_FONT.heavy, fontSize: 17, lineHeight: 23, color: CUTE.ink }}>{L('Bạn đang học dở', 'Pick up where you left off')}</Text>
              <Text style={{ fontFamily: CUTE_FONT.semi, fontSize: 13, lineHeight: 19, color: CUTE.inkSoft }}>{L('Tiến độ vẫn nguyên.', 'Your progress is safe.')}</Text>
            </View>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px rgba(242,124,155,0.35)' } as never}>
              <Icon name="arrow-right" size={22} color="#FFFFFF" strokeWidth={2.4} />
            </View>
          </Pressable>
        ) : null}

        {/* Giới thiệu ngắn */}
        <View style={[{ marginTop: 18, borderRadius: 30, padding: 20 }, GLASS] as never}>
          <Text style={{ fontFamily: CUTE_FONT.bold, fontSize: 12, letterSpacing: 0.6, color: ACCENT }}>IELTS · SAT</Text>
          <Text style={{ fontFamily: CUTE_FONT.black, fontSize: 25, lineHeight: 31, color: CUTE.ink, marginTop: 8 }}>
            {L('Luyện thi bằng đề thật', 'Practise with real tests')}
          </Text>
          <Text style={{ fontFamily: CUTE_FONT.heavy, fontSize: 16, lineHeight: 22, color: ACCENT, marginTop: 6 }}>
            {L('sai chỗ nào biết chỗ đó', 'see exactly where you slip')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={p.onStart}
            style={({ pressed }) => ({ marginTop: 18, alignItems: 'center', borderRadius: 999, backgroundColor: ACCENT, paddingVertical: 14, boxShadow: '0 8px 20px rgba(242,124,155,0.35)', transform: [{ scale: pressed ? 0.98 : 1 }] } as never)}
          >
            <Text style={{ fontFamily: CUTE_FONT.heavy, fontSize: 16, lineHeight: 22, color: '#FFFFFF' }}>{L('Bắt đầu học', 'Start learning')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={p.onMathRoadmap} style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ fontFamily: CUTE_FONT.bold, fontSize: 14, color: CUTE.inkSoft }}>{L('Xem lộ trình SAT Math →', 'See the SAT Math roadmap →')}</Text>
          </Pressable>
        </View>

        {/* Hai khu học chính */}
        <Text style={{ fontFamily: CUTE_FONT.heavy, fontSize: 18, lineHeight: 24, color: CUTE.ink, marginTop: 24, marginBottom: 12 }}>{L('Chọn khu học', 'Choose a track')}</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <AreaTile title="IELTS" line={L('Reading, Writing, Listening và Speaking', 'Reading, Writing, Listening and Speaking')} count={p.readable} unit={L('bài đọc', 'readings')} icon="book" tint="#D5ECFF" onPress={p.onIelts} />
          <AreaTile title="SAT" line={L('Toán và Verbal, chấm bằng code', 'Math and Verbal, marked by code')} count={p.mathQuestions} unit={L('câu toán', 'math questions')} icon="grid" tint="#FFDCE6" onPress={p.onSat} />
        </View>

        {/* Số liệu: một hàng cuộn ngang, như dải thông tin của app */}
        <Text style={{ fontFamily: CUTE_FONT.heavy, fontSize: 18, lineHeight: 24, color: CUTE.ink, marginTop: 24, marginBottom: 12 }}>{L('Trong app có', 'Inside the app')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 18 }}>
          <StatChip value={p.readable} label={L('bài đọc', 'readings')} />
          <StatChip value={p.mathSets} label={L('bộ đề Math', 'Math sets')} />
          <StatChip value={p.mathQuestions} label={L('câu toán', 'math questions')} />
          <StatChip value={p.writing} label={L('đề Writing', 'Writing prompts')} />
        </ScrollView>
      </ScrollView>
    </View>
  );
}
