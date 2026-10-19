import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { HubScreen } from '@/components/hub/HubScreen';
import { GLASS_CARD, COSMIC } from '@/components/hub/theme';
import { Icon } from '@/components/ui/Icon';
import { CuteBook, CuteCalendar, CuteGlobe } from '@/components/illust/Cute';
import { CuteBulb, CuteChat, CuteFlame, CuteHeadphones, CuteMagnifier, CuteMic, CuteNotebook, CuteRocket, CuteStar } from '@/components/illust/CuteMore';
import { dayKeyOf, weekStrip } from '@/services/hub/daily';
import { useHubStore } from '@/store/useHubStore';
import { useStreak } from '@/store/useStudyStore';

const WEEKDAYS = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];

/** Chữ Nunito (cùng họ với trang cute-home). Hub nạp Nunito qua app/hub/_layout.tsx. */
const INK = '#2B1D3A';
const INK_SOFT = '#6E5D78';

/** Bốn thẻ công cụ AI — nền pastel, minh họa vẽ bằng SVG của app. */
const AI_TOOLS: {
  title: string;
  desc: string;
  art: (size: number) => React.ReactNode;
  route: string;
  from: string;
  to: string;
  tag?: string;
}[] = [
  { title: 'Phân tích giọng nói', desc: 'Chấm phát âm, ngữ điệu, lưu loát và độ rõ ràng', art: (s) => <CuteMic size={s} />, route: '/hub/analyze', from: '#CFE3FF', to: '#A9CCFF', tag: 'MỚI' },
  { title: 'Điều chỉnh giọng nói', desc: 'Nhận phản hồi và sửa trọng âm, ngữ điệu', art: (s) => <CuteHeadphones size={s} />, route: '/hub/pitch', from: '#FFF0BF', to: '#FFE08A' },
  { title: 'Video ngắn', desc: 'Xem video ngắn và nói lại cụm từ', art: (s) => <CuteRocket size={s} />, route: '/hub/short', from: '#FFD6E3', to: '#FFB8CE', tag: 'BETA' },
  { title: 'Nói đuổi', desc: 'Nói đuổi theo giọng bản ngữ, phản hồi ngay', art: (s) => <CuteChat size={s} />, route: '/hub/shadow', from: '#E3D7FF', to: '#C9B5FA', tag: 'BETA' },
  { title: 'Tình huống nói', desc: 'Nhập vai, gọi điện, hội thoại thật', art: (s) => <CuteChat size={s} />, route: '/hub/scenarios', from: '#FFE4D8', to: '#FFC7B0' },
  { title: 'Chủ đề', desc: 'Nói theo chủ đề 1–2 phút, có gợi ý ý', art: (s) => <CuteGlobe size={s} />, route: '/hub/topics', from: '#DDF5E6', to: '#B5EBCB' },
  { title: 'Gia sư', desc: 'Trò chuyện và sửa lỗi cùng AI', art: (s) => <CuteBulb size={s} />, route: '/hub/tutor', from: '#FFF3CC', to: '#FFE49A' },
  { title: 'Trợ lý họp', desc: 'Nhận phản hồi sau các cuộc họp', art: (s) => <CuteCalendar size={s} />, route: '/hub/meeting', from: '#F3E9FF', to: '#DCC8FA' },
];

/** Chế độ luyện nói và các khu còn lại của Hub (trước đây nằm ở thanh tab dưới). */
const MODES: { title: string; desc: string; art: (size: number) => React.ReactNode; route: string; bg: string }[] = [
  { title: 'Học', desc: 'Bài học theo từng kỹ năng', art: (s) => <CuteBook size={s} />, route: '/hub/learn', bg: '#DFEEFF' },
  { title: 'Khám phá', desc: 'Tìm nội dung và bài luyện mới', art: (s) => <CuteMagnifier size={s} />, route: '/hub/explore', bg: '#EEE6FF' },
  { title: 'Từ điển', desc: 'Tra từ, nghe phát âm', art: (s) => <CuteNotebook size={s} />, route: '/hub/dictionary', bg: '#E2F7F8' },
];

export default function HubToday() {
  const { width } = useWindowDimensions();
  const wide = width >= 720;
  const today = dayKeyOf(new Date());
  const doneByDay = useHubStore((s) => s.doneByDay);
  const gems = useHubStore((s) => s.gems);
  const doneToday = doneByDay[today] ?? [];
  // Một chuỗi duy nhất cho cả app: ngày có việc làm ở đâu cũng tính (xem `isActiveDay`).
  const streak = useStreak().current;
  const [info, setInfo] = useState(false);

  // 7 ngày trong tuần, lấy từ lịch sử làm nhiệm vụ thật
  const strip = useMemo(() => weekStrip(doneByDay, today), [doneByDay, today]);
  const totalDone = useMemo(() => Object.values(doneByDay).reduce((n, list) => n + list.length, 0), [doneByDay]);

  const quests = [
    { id: 'quest-phoneme', art: (s: number) => <CuteMic size={s} />, title: 'Luyện tập các âm /p/ /t/ /k/', route: '/hub/phoneme/p', done: doneToday.includes('quest-phoneme') },
    { id: 'quest-grammar', art: (s: number) => <CuteBook size={s} />, title: 'Luyện ngữ pháp', route: '/hub/tutor/grammar', done: doneToday.includes('quest-grammar') },
    { id: 'quest-roleplay', art: (s: number) => <CuteChat size={s} />, title: 'Hoàn thành một tình huống nói', route: '/hub/scenarios', done: doneToday.includes('quest-roleplay') },
  ];
  const questDone = quests.filter((q) => q.done).length;

  const stats = [
    { art: <CuteFlame size={34} />, value: String(streak), label: 'Ngày liên tiếp', bg: '#FFE9DC' },
    { art: <CuteNotebook size={34} />, value: String(totalDone), label: 'Nhiệm vụ đã làm', bg: '#E4EEFF' },
    { art: <CuteCalendar size={34} />, value: `${questDone}/${quests.length}`, label: 'Hôm nay', bg: '#FFF4C7' },
    { art: <CuteStar size={34} />, value: String(gems), label: 'Đá quý', bg: '#F0E8FF' },
  ];

  return (
    <HubScreen title="Hôm nay" subtitle="Luyện một chút mỗi ngày, chuỗi sẽ dài ra.">
      {/* Hero — tiêu đề lớn, linh vật, hàng chỉ số */}
      <LinearGradient
        colors={['#FFF8EC', '#FFE8C2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 28, padding: wide ? 28 : 20, overflow: 'hidden', gap: 6 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: '#C2410C', fontSize: 12, fontWeight: '800', letterSpacing: 1.6 }}>IELTS · SPEAKING</Text>
            <Text style={{ color: INK, fontSize: wide ? 42 : 29, fontWeight: '900', lineHeight: wide ? 48 : 35, letterSpacing: -0.4 }}>
              Luyện nói tự tin,
            </Text>
            <Text style={{ color: '#E0862B', fontSize: wide ? 42 : 29, fontWeight: '900', lineHeight: wide ? 48 : 35, letterSpacing: -0.4 }}>
              mỗi ngày một chút
            </Text>
            {wide ? (
              <Text style={{ color: INK_SOFT, fontSize: 15, fontWeight: '600', marginTop: 6 }}>Thực hành với AI, nhận phản hồi chi tiết và cải thiện từng ngày.</Text>
            ) : null}
          </View>
          <Image
            source={{ uri: '/mascot/lion/lion-wave.webp' }}
            resizeMode="contain"
            style={{ width: wide ? 170 : 104, height: wide ? 170 : 104 }}
            accessibilityLabel="Linh vật sư tử"
          />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
          {stats.map((st) => (
            <View
              key={st.label}
              style={{
                flexGrow: 1,
                flexBasis: wide ? '23%' : '46%',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 10,
                borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.94)',
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: st.bg, alignItems: 'center', justifyContent: 'center' }}>
                {st.art}
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={{ color: INK, fontSize: 19, fontWeight: '900' }}>{st.value}</Text>
                <Text style={{ color: INK_SOFT, fontSize: 12, fontWeight: '700' }}>{st.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Chuỗi 7 ngày */}
      <View style={[GLASS_CARD, { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center' }]}>
        {strip.map((d) => {
          const dateObj = new Date(`${d.day}T12:00:00`);
          const label = WEEKDAYS[dateObj.getDay()] ?? '';
          const lit = d.done;
          return (
            <View key={d.day} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: lit ? '#FFE9DC' : '#F6F1F8',
                  borderWidth: 1.5,
                  borderColor: lit ? '#F4A261' : '#E9DFEF',
                }}
              >
                <View style={{ opacity: lit ? 1 : 0.35 }}>
                  <CuteFlame size={22} />
                </View>
              </View>
              <Text style={{ color: d.isToday ? '#C2410C' : INK_SOFT, fontSize: 11, fontWeight: d.isToday || lit ? '900' : '700' }}>{label}</Text>
            </View>
          );
        })}
      </View>

      {/* Công cụ AI của bạn */}
      <View style={[GLASS_CARD, { padding: 16, gap: 14, borderRadius: 24 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          <Text style={{ color: INK, fontSize: 20, fontWeight: '900' }}>Luyện nói với AI</Text>
          <Text style={{ color: INK_SOFT, fontSize: 12, fontWeight: '600' }}>Tám công cụ, bấm thẻ để vào luyện ngay.</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {AI_TOOLS.map((tool) => (
            <Pressable
              key={tool.title}
              accessibilityRole="button"
              accessibilityLabel={tool.title}
              onPress={() => router.push(tool.route as never)}
              style={{ flexBasis: wide ? '23.5%' : '48%', flexGrow: 1, borderRadius: 22, overflow: 'hidden' }}
            >
              <LinearGradient colors={[tool.from, tool.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 14, gap: 6, minHeight: 190 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {tool.tag ? (
                    <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.92)' }}>
                      <Text style={{ color: INK, fontSize: 10, fontWeight: '900' }}>{tool.tag}</Text>
                    </View>
                  ) : (
                    <View />
                  )}
                  {tool.art(wide ? 72 : 60)}
                </View>
                <Text style={{ color: INK, fontSize: 15, fontWeight: '900', marginTop: 'auto' }}>{tool.title}</Text>
                <Text style={{ color: INK, opacity: 0.75, fontSize: 12, fontWeight: '600', lineHeight: 17 }}>{tool.desc}</Text>
                <View style={{ alignSelf: 'flex-end', width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                  <Icon name="arrow-right" size={14} color={INK} />
                </View>
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Chế độ luyện nói */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={{ color: INK, fontSize: 20, fontWeight: '900' }}>Khám phá thêm</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/hub/progress' as never)}>
            <Text style={{ color: '#C2410C', fontSize: 13, fontWeight: '800' }}>Tiến độ ›</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
          {MODES.map((m) => (
            <Pressable
              key={m.title}
              accessibilityRole="button"
              accessibilityLabel={m.title}
              onPress={() => router.push(m.route as never)}
              style={{ width: 172, borderRadius: 22, backgroundColor: m.bg, padding: 14, gap: 6 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {m.art(48)}
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="arrow-right" size={12} color={INK} />
                </View>
              </View>
              <Text style={{ color: INK, fontSize: 15, fontWeight: '900' }}>{m.title}</Text>
              <Text style={{ color: INK_SOFT, fontSize: 12, fontWeight: '600', lineHeight: 16 }}>{m.desc}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Nhiệm vụ hôm nay */}
      <View style={[GLASS_CARD, { padding: 16, gap: 12, borderRadius: 22 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          <Text style={{ color: INK, fontSize: 18, fontWeight: '900' }}>Nhiệm vụ hôm nay</Text>
          <Text style={{ color: INK_SOFT, fontSize: 12, fontWeight: '700' }}>
            {questDone}/{quests.length} hoàn thành · chuỗi {streak} ngày
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          {quests.map((quest) => (
            <Pressable
              key={quest.id}
              accessibilityRole="button"
              accessibilityLabel={quest.title}
              onPress={() => router.push(quest.route as never)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 10,
                paddingRight: 14,
                borderRadius: 18,
                backgroundColor: quest.done ? '#DDF7E8' : '#FBF7FC',
                borderWidth: 1,
                borderColor: quest.done ? '#9AE6B4' : '#EEE4F2',
              }}
            >
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                {quest.art(34)}
              </View>
              <Text numberOfLines={1} style={{ flex: 1, color: quest.done ? '#166534' : INK, fontSize: 14, fontWeight: '800' }}>
                {quest.title}
              </Text>
              <Text style={{ color: quest.done ? '#166534' : '#C2410C', fontSize: 12, fontWeight: '900' }}>{quest.done ? '1/1 ✓' : '0/1'}</Text>
              <Icon name="chevron-right" size={14} color={INK_SOFT} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Hành trình */}
      <View style={[GLASS_CARD, { padding: 16, gap: 12, borderRadius: 22 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: INK, fontSize: 18, fontWeight: '900' }}>Hành trình của bạn</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chi tiết lộ trình CEFR B2 sang C1"
            onPress={() => setInfo(true)}
            style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#FFF1DC', borderWidth: 1, borderColor: '#F7CF8F' }}
          >
            <Text style={{ color: '#C2410C', fontSize: 12, fontWeight: '900' }}>B2 → C1 ⓘ</Text>
          </Pressable>
        </View>

        <View style={{ height: 28, borderRadius: 14, backgroundColor: '#F4EEF8', overflow: 'hidden', justifyContent: 'center' }}>
          <LinearGradient
            colors={['#FFB84D', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: '41%', height: '100%', position: 'absolute', left: 0, top: 0 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>Tiến độ CEFR B2</Text>
            <Text style={{ color: INK, fontSize: 12, fontWeight: '900' }}>41%</Text>
          </View>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Xem tiến độ chi tiết" onPress={() => router.push('/hub/progress' as never)} style={{ alignSelf: 'flex-start' }}>
          <Text style={{ color: '#C2410C', fontSize: 13, fontWeight: '900' }}>Xem tiến độ chi tiết ›</Text>
        </Pressable>
      </View>

      {/* Modal giải thích lên cấp */}
      <Modal visible={info} transparent animationType="fade" onRequestClose={() => setInfo(false)}>
        <Pressable onPress={() => setInfo(false)} style={{ flex: 1, backgroundColor: 'rgba(43, 29, 58, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={[GLASS_CARD, { padding: 22, gap: 14, maxWidth: 440, borderRadius: 22 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: INK, fontSize: 18, fontWeight: '900', flex: 1, paddingRight: 8 }}>Hành trình CEFR B2 → C1 & IELTS 6.5 → 8.0</Text>
              <Pressable onPress={() => setInfo(false)}>
                <Icon name="close" size={18} color={INK_SOFT} />
              </Pressable>
            </View>

            <Text style={{ color: INK_SOFT, fontSize: 14, lineHeight: 22, fontWeight: '600' }}>Để thăng cấp từ B2 lên C1 (tương đương Band 7.5 – 8.0+), người học cần:</Text>

            <View style={{ gap: 8 }}>
              <Text style={{ color: INK, fontSize: 13, lineHeight: 20, fontWeight: '600' }}>
                • <Text style={{ fontWeight: '900', color: '#C2410C' }}>Phát âm chuẩn xác 44 âm IPA</Text>: điểm âm vị trung bình ≥ 85%, làm chủ phụ âm cuối và trọng âm câu.
              </Text>
              <Text style={{ color: INK, fontSize: 13, lineHeight: 20, fontWeight: '600' }}>
                • <Text style={{ fontWeight: '900', color: '#7C3AED' }}>Lưu loát & tốc độ</Text>: giữ 130–160 từ/phút, tỷ lệ từ đệm (um, uh) dưới 3%.
              </Text>
              <Text style={{ color: INK, fontSize: 13, lineHeight: 20, fontWeight: '600' }}>
                • <Text style={{ fontWeight: '900', color: '#16A34A' }}>Ngữ pháp C1 & đa dạng từ</Text>: dùng linh hoạt mệnh đề phân từ, đảo ngữ và collocation học thuật.
              </Text>
            </View>

            <Pressable onPress={() => setInfo(false)} style={{ height: 46, borderRadius: 16, backgroundColor: INK, alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Đã hiểu</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </HubScreen>
  );
}
